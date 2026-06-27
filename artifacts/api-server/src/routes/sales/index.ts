import { Router, type IRouter } from "express";
import { db, salesTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListSalesResponse,
  GetSaleResponse,
  RefundSaleResponse,
  GetSaleParams,
  RefundSaleParams,
  ListSalesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapSale(s: typeof salesTable.$inferSelect) {
  return {
    id: s.id,
    productId: s.productId,
    productName: s.productName,
    customerName: s.customerName,
    customerEmail: s.customerEmail,
    amount: parseFloat(s.amount),
    status: s.status,
    paymentMethod: s.paymentMethod,
    country: s.country ?? undefined,
    affiliateId: s.affiliateId ?? undefined,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : String(s.createdAt),
  };
}

router.get("/sales", async (req, res): Promise<void> => {
  const query = ListSalesQueryParams.safeParse(req.query);
  let sales = await db.select().from(salesTable).orderBy(salesTable.createdAt);
  sales = sales.reverse();

  if (query.success) {
    if (query.data.status) sales = sales.filter((s) => s.status === query.data.status);
    if (query.data.productId) sales = sales.filter((s) => s.productId === query.data.productId);
  }

  res.json(ListSalesResponse.parse(sales.map(mapSale)));
});

router.get("/sales/:id", async (req, res): Promise<void> => {
  const params = GetSaleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [sale] = await db.select().from(salesTable).where(eq(salesTable.id, params.data.id));
  if (!sale) {
    res.status(404).json({ error: "Sale not found" });
    return;
  }
  res.json(GetSaleResponse.parse(mapSale(sale)));
});

router.post("/sales/:id/refund", async (req, res): Promise<void> => {
  const params = RefundSaleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [sale] = await db.select().from(salesTable).where(eq(salesTable.id, params.data.id));
  if (!sale) {
    res.status(404).json({ error: "Sale not found" });
    return;
  }
  const [updated] = await db
    .update(salesTable)
    .set({ status: "refunded" })
    .where(eq(salesTable.id, params.data.id))
    .returning();

  await db.insert(transactionsTable).values({
    type: "refund",
    description: `Reembolso - ${sale.productName}`,
    amount: String(-parseFloat(sale.amount)),
    balance: "0",
    saleId: sale.id,
  });

  res.json(RefundSaleResponse.parse(mapSale(updated)));
});

export default router;
