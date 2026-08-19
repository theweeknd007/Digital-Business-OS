import { Router, type IRouter } from "express";
import { db, productsTable, productMaterialsTable, storedAssetsTable } from "@workspace/db";
import { and, eq, or, inArray } from "drizzle-orm";
import {
  ListProductsResponse,
  GetProductResponse,
  CreateProductResponse,
  UpdateProductResponse,
  CreateProductBody,
  UpdateProductBody,
  GetProductParams,
  UpdateProductParams,
  DeleteProductParams,
  ListProductsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapProduct(p: typeof productsTable.$inferSelect, materials: Array<typeof productMaterialsTable.$inferSelect> = []) {
  return {
    id: p.id,
    ownerId: p.ownerId ?? undefined,
    name: p.name,
    description: p.description ?? undefined,
    type: p.type,
    price: parseFloat(p.price),
    currency: p.currency,
    status: p.status,
    sales: p.sales,
    revenue: parseFloat(p.revenue),
    imageUrl: p.imageUrl ?? undefined,
    coverUrl: p.coverUrl ?? undefined,
    fileUrl: p.fileUrl ?? undefined,
    fileName: p.fileName ?? undefined,
    fileContentType: p.fileContentType ?? undefined,
    fileSize: p.fileSize ?? undefined,
    approvalNotes: p.approvalNotes ?? undefined,
    approvedAt: p.approvedAt instanceof Date ? p.approvedAt.toISOString() : p.approvedAt ? String(p.approvedAt) : undefined,
    approvedBy: p.approvedBy ?? undefined,
    whopProductId: p.whopProductId ?? undefined,
    whopPlanId: p.whopPlanId ?? undefined,
    deliveryType: p.deliveryType,
    externalDeliveryUrl: p.externalDeliveryUrl ?? undefined,
    externalAccessUrl: p.externalAccessUrl ?? undefined,
    materials: materials.map((m) => ({ id: m.id, objectPath: m.objectPath ?? undefined, name: m.name, contentType: m.contentType, fileSize: m.fileSize, externalUrl: m.externalUrl ?? undefined })),
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const query = ListProductsQueryParams.safeParse(req.query);
  let products = req.user?.role === "admin"
    ? await db.select().from(productsTable)
    : await db.select().from(productsTable).where(eq(productsTable.ownerId, req.user!.userId));

  if (query.success) {
    if (query.data.type) products = products.filter((p) => p.type === query.data.type);
    if (query.data.status) products = products.filter((p) => p.status === query.data.status);
  }

  const materialRows = products.length ? await db.select().from(productMaterialsTable).where(inArray(productMaterialsTable.productId, products.map((p) => p.id))) : [];
  res.json(ListProductsResponse.parse(products.map((p) => mapProduct(p, materialRows.filter((m) => m.productId === p.id)))));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, description, type, price, imageUrl, coverUrl, fileUrl, fileName, fileContentType, fileSize, currency, deliveryType, externalDeliveryUrl, externalAccessUrl, materials = [] } = parsed.data;
  const selectedCurrency = currency ?? "MZN";
  if (selectedCurrency === "MZN" && price < 50) { res.status(400).json({ error: "O preço mínimo é 50 MT" }); return; }
  if (!coverUrl || !fileUrl || !fileName) { res.status(400).json({ error: "Capa e ficheiro do produto são obrigatórios" }); return; }
  if (materials.length > 6) { res.status(400).json({ error: "Máximo de 6 materiais" }); return; }
  const assetPaths = [coverUrl, fileUrl, ...materials.map((m) => m.objectPath).filter((v): v is string => Boolean(v))];
  const ownedAssets = assetPaths.length ? await db.select().from(storedAssetsTable).where(and(eq(storedAssetsTable.ownerId, req.user!.userId), inArray(storedAssetsTable.objectPath, assetPaths))) : [];
  if (ownedAssets.length !== assetPaths.length) { res.status(400).json({ error: "Um ou mais ficheiros não pertencem à sua conta" }); return; }
  const coverAsset = ownedAssets.find((a) => a.objectPath === coverUrl);
  const fileAsset = ownedAssets.find((a) => a.objectPath === fileUrl);
  if (!coverAsset || !["image/png", "image/jpeg", "image/webp"].includes(coverAsset.contentType) || coverAsset.fileSize > 10 * 1024 * 1024) {
    res.status(400).json({ error: "A capa deve ser PNG, JPG ou WEBP com no máximo 10 MB" }); return;
  }
  if ((type ?? "digital") === "ebook" && (!fileAsset || fileAsset.contentType !== "application/pdf")) {
    res.status(400).json({ error: "O conteúdo do E-book deve ser um PDF" }); return;
  }
  const [product] = await db
    .insert(productsTable)
    .values({ ownerId: req.user!.userId, name, description, type: type ?? "digital", price: String(price), currency: selectedCurrency, status: "active", imageUrl, coverUrl, fileUrl, fileName, fileContentType, fileSize, deliveryType: deliveryType ?? "internal", externalDeliveryUrl, externalAccessUrl })
    .returning();
  await db.insert(productMaterialsTable).values(materials.map((m) => ({ productId: product.id, objectPath: m.objectPath, name: m.name, contentType: m.contentType, fileSize: m.fileSize, externalUrl: m.externalUrl })));
  res.status(201).json(CreateProductResponse.parse(mapProduct(product, await db.select().from(productMaterialsTable).where(eq(productMaterialsTable.productId, product.id)))));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [product] = await db.select().from(productsTable).where(req.user?.role === "admin" ? eq(productsTable.id, params.data.id) : and(eq(productsTable.id, params.data.id), eq(productsTable.ownerId, req.user!.userId)));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(GetProductResponse.parse(mapProduct(product, await db.select().from(productMaterialsTable).where(eq(productMaterialsTable.productId, product.id)))));
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, description, type, price, status, imageUrl, coverUrl, fileUrl, fileName, fileContentType, fileSize, currency, deliveryType, externalDeliveryUrl, externalAccessUrl, materials } = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (type !== undefined) updateData.type = type;
  if (price !== undefined) updateData.price = String(price);
  if (status !== undefined && req.user?.role === "admin") updateData.status = status;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (coverUrl !== undefined) updateData.coverUrl = coverUrl;
  if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
  if (fileName !== undefined) updateData.fileName = fileName;
  if (fileContentType !== undefined) updateData.fileContentType = fileContentType;
  if (fileSize !== undefined) updateData.fileSize = fileSize;
  if (currency !== undefined) updateData.currency = currency;
  if (deliveryType !== undefined) updateData.deliveryType = deliveryType;
  if (externalDeliveryUrl !== undefined) updateData.externalDeliveryUrl = externalDeliveryUrl;
  if (externalAccessUrl !== undefined) updateData.externalAccessUrl = externalAccessUrl;
  if (price !== undefined && (currency ?? "MZN") === "MZN" && price < 50) { res.status(400).json({ error: "O preço mínimo é 50 MT" }); return; }
  if (materials && materials.length > 6) { res.status(400).json({ error: "Máximo de 6 materiais" }); return; }

  const [product] = await db.update(productsTable).set(updateData)
    .where(req.user?.role === "admin" ? eq(productsTable.id, params.data.id) : and(eq(productsTable.id, params.data.id), eq(productsTable.ownerId, req.user!.userId)))
    .returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  if (materials) {
    await db.delete(productMaterialsTable).where(eq(productMaterialsTable.productId, product.id));
    await db.insert(productMaterialsTable).values(materials.map((m) => ({ productId: product.id, objectPath: m.objectPath, name: m.name, contentType: m.contentType, fileSize: m.fileSize, externalUrl: m.externalUrl })));
  }
  res.json(UpdateProductResponse.parse(mapProduct(product, await db.select().from(productMaterialsTable).where(eq(productMaterialsTable.productId, product.id)))));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [product] = await db.delete(productsTable).where(req.user?.role === "admin" ? eq(productsTable.id, params.data.id) : and(eq(productsTable.id, params.data.id), eq(productsTable.ownerId, req.user!.userId))).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  await db.delete(productMaterialsTable).where(eq(productMaterialsTable.productId, params.data.id));
  res.sendStatus(204);
});

router.post("/products/:id/duplicate", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "ID inválido" }); return; }
  const [source] = await db.select().from(productsTable).where(and(eq(productsTable.id, params.data.id), eq(productsTable.ownerId, req.user!.userId)));
  if (!source) { res.status(404).json({ error: "Product not found" }); return; }
  const [copy] = await db.insert(productsTable).values({
    ownerId: req.user!.userId, name: `${source.name} (Cópia)`, description: source.description,
    type: source.type, price: source.price, currency: source.currency, status: "active",
    imageUrl: source.imageUrl, coverUrl: source.coverUrl, fileUrl: source.fileUrl, fileName: source.fileName,
    fileContentType: source.fileContentType, fileSize: source.fileSize, deliveryType: source.deliveryType,
    externalDeliveryUrl: source.externalDeliveryUrl, externalAccessUrl: source.externalAccessUrl,
  }).returning();
  const materials = await db.select().from(productMaterialsTable).where(eq(productMaterialsTable.productId, source.id));
  if (materials.length) await db.insert(productMaterialsTable).values(materials.map((m) => ({
    productId: copy.id, objectPath: m.objectPath, name: m.name, contentType: m.contentType,
    fileSize: m.fileSize, externalUrl: m.externalUrl,
  })));
  res.status(201).json(CreateProductResponse.parse(mapProduct(copy, materials.map((m) => ({ ...m, productId: copy.id })))));
});

export default router;
