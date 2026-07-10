import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod/v4";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from "../../lib/auth";

const router: IRouter = Router();

const LoginBody = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

const RegisterBody = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
});

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

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, parsed.data.email));
  if (!user) {
    res.status(401).json({ error: "Email ou senha incorretos" });
    return;
  }
  if (!user.active) {
    res.status(403).json({ error: "Conta desativada. Entre em contato com o suporte." });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Email ou senha incorretos" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
  setAuthCookie(res, token);
  res.json({ user: safeUser(user), token });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, parsed.data.email));
  if (existing) {
    res.status(409).json({ error: "Este email já está cadastrado" });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const [user] = await db
    .insert(usersTable)
    .values({ name: parsed.data.name, email: parsed.data.email, passwordHash, role: "creator" })
    .returning();

  const token = signToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
  setAuthCookie(res, token);
  res.status(201).json({ user: safeUser(user), token });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(401).json({ error: "Usuário não encontrado" });
    return;
  }
  res.json({ user: safeUser(user) });
});

router.post("/auth/logout", (_req, res): void => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

export default router;
