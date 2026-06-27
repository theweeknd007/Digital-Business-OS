import { Router, type IRouter } from "express";
import { db, transactionsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { ListTransactionsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/wallet/transactions", async (_req, res): Promise<void> => {
  const transactions = await db.select().from(transactionsTable).orderBy(desc(transactionsTable.createdAt)).limit(100);
  res.json(ListTransactionsResponse.parse(transactions.map((t) => ({
    id: t.id,
    type: t.type,
    description: t.description,
    amount: parseFloat(t.amount),
    balance: t.balance != null ? parseFloat(t.balance) : 0,
    saleId: t.saleId ?? undefined,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
  }))));
});

export default router;
