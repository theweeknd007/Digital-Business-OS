import { Router, type IRouter } from "express";
import { db, withdrawalsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  ListWithdrawalsResponse,
  RequestWithdrawalResponse,
  ApproveWithdrawalResponse,
  RequestWithdrawalBody,
  ApproveWithdrawalParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapWithdrawal(w: typeof withdrawalsTable.$inferSelect) {
  return {
    id: w.id,
    amount: parseFloat(w.amount),
    status: w.status,
    pixKey: w.pixKey,
    notes: w.notes ?? undefined,
    createdAt: w.createdAt instanceof Date ? w.createdAt.toISOString() : String(w.createdAt),
    updatedAt: w.updatedAt instanceof Date ? w.updatedAt.toISOString() : String(w.updatedAt),
  };
}

router.get("/withdrawals", async (_req, res): Promise<void> => {
  const withdrawals = await db.select().from(withdrawalsTable).orderBy(desc(withdrawalsTable.createdAt));
  res.json(ListWithdrawalsResponse.parse(withdrawals.map(mapWithdrawal)));
});

router.post("/withdrawals", async (req, res): Promise<void> => {
  const parsed = RequestWithdrawalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [withdrawal] = await db
    .insert(withdrawalsTable)
    .values({ amount: String(parsed.data.amount), pixKey: parsed.data.pixKey, notes: parsed.data.notes, status: "pending" })
    .returning();
  res.status(201).json(RequestWithdrawalResponse.parse(mapWithdrawal(withdrawal)));
});

router.post("/withdrawals/:id/approve", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const params = ApproveWithdrawalParams.safeParse({ id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [withdrawal] = await db
    .update(withdrawalsTable)
    .set({ status: "approved" })
    .where(eq(withdrawalsTable.id, params.data.id))
    .returning();
  if (!withdrawal) {
    res.status(404).json({ error: "Withdrawal not found" });
    return;
  }
  res.json(ApproveWithdrawalResponse.parse(mapWithdrawal(withdrawal)));
});

export default router;
