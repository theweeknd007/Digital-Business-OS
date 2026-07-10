import { Router, type IRouter } from "express";
import { db, usersTable, productsTable, salesTable, withdrawalsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAdmin } from "../../lib/auth";

const router: IRouter = Router();

function safeUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatarUrl: u.avatarUrl ?? null,
    active: u.active,
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
  };
}

router.get("/admin/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(users.map(safeUser));
});

router.patch("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const body = z.object({
    role: z.enum(["creator", "admin"]).optional(),
    active: z.boolean().optional(),
    name: z.string().min(2).optional(),
  }).safeParse(req.body);

  if (!body.success) { res.status(400).json({ error: body.error.issues[0]?.message ?? "Dados inválidos" }); return; }

  const [user] = await db.update(usersTable).set(body.data).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "Usuário não encontrado" }); return; }
  res.json(safeUser(user));
});

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [users, products, sales, withdrawals] = await Promise.all([
    db.select().from(usersTable),
    db.select().from(productsTable),
    db.select().from(salesTable),
    db.select().from(withdrawalsTable),
  ]);

  const totalRevenue = sales
    .filter((s) => s.status === "completed")
    .reduce((acc, s) => acc + parseFloat(s.amount), 0);

  const pendingWithdrawals = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((acc, w) => acc + parseFloat(w.amount), 0);

  res.json({
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.active).length,
    adminUsers: users.filter((u) => u.role === "admin").length,
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.status === "active").length,
    totalSales: sales.length,
    completedSales: sales.filter((s) => s.status === "completed").length,
    totalRevenue,
    pendingWithdrawals,
    totalWithdrawals: withdrawals.length,
  });
});

router.get("/admin/withdrawals", requireAdmin, async (_req, res): Promise<void> => {
  const withdrawals = await db.select().from(withdrawalsTable).orderBy(desc(withdrawalsTable.createdAt));
  res.json(withdrawals.map((w) => ({
    id: w.id,
    amount: parseFloat(w.amount),
    status: w.status,
    pixKey: w.pixKey,
    notes: w.notes ?? null,
    createdAt: w.createdAt instanceof Date ? w.createdAt.toISOString() : String(w.createdAt),
    updatedAt: w.updatedAt instanceof Date ? w.updatedAt.toISOString() : String(w.updatedAt),
  })));
});

router.post("/admin/withdrawals/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [w] = await db.update(withdrawalsTable).set({ status: "approved" }).where(eq(withdrawalsTable.id, id)).returning();
  if (!w) { res.status(404).json({ error: "Saque não encontrado" }); return; }
  res.json({ id: w.id, status: w.status });
});

router.post("/admin/withdrawals/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [w] = await db.update(withdrawalsTable).set({ status: "rejected" }).where(eq(withdrawalsTable.id, id)).returning();
  if (!w) { res.status(404).json({ error: "Saque não encontrado" }); return; }
  res.json({ id: w.id, status: w.status });
});

export default router;
