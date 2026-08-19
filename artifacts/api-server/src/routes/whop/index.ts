import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { getWhopClient } from "../../lib/whopClient";

const router: IRouter = Router();

router.post("/whop/checkout", async (req, res): Promise<void> => {
  const parsed = z.object({ productId: z.coerce.number().int().positive() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Produto inválido" }); return; }
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, parsed.data.productId));
  if (!product || product.status !== "active") {
    res.status(404).json({ error: "Este produto ainda não está disponível para venda" });
    return;
  }
  try {
    const whop = await getWhopClient();
    let remoteProductId = product.whopProductId;
    if (!remoteProductId) {
      const remoteProduct = await whop.products.create({
        title: product.name.slice(0, 80),
        description: product.description ?? undefined,
      });
      remoteProductId = remoteProduct.id;
      await db.update(productsTable).set({ whopProductId: remoteProductId }).where(eq(productsTable.id, product.id));
    }
    const checkout = await whop.checkoutConfigurations.create({
      plan: {
        product_id: remoteProductId,
        initial_price: Number(product.price),
        currency: "brl",
        plan_type: "one_time",
        description: product.name,
      },
      redirect_url: `${req.protocol}://${req.get("host")}/checkout/success?productId=${product.id}`,
      metadata: { productId: String(product.id), creatorId: String(product.ownerId ?? "") },
    });
    if (!checkout.purchase_url) throw new Error("Whop não retornou um link de checkout");
    res.json({ purchaseUrl: checkout.purchase_url, checkoutId: checkout.id });
  } catch (error) {
    req.log.error({ err: error }, "Whop checkout creation failed");
    res.status(502).json({ error: "Não foi possível criar o checkout seguro agora" });
  }
});

export default router;