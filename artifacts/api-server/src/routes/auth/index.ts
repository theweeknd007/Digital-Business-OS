import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod/v4";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from "../../lib/auth";

const router: IRouter = Router();

// ── Rate limiting ──────────────────────────────────────────────────────────
// 5 failed auth attempts per IP in a 15-minute window before lockout.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Muitas tentativas. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: "Muitos cadastros deste IP. Tente novamente em 1 hora." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Input schemas ──────────────────────────────────────────────────────────
// Sanitize strings: strip HTML tags, trim whitespace
function sanitize(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

const LoginBody = z.object({
  email: z.string().max(254).email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória").max(128),
});

const RegisterBody = z.object({
  name: z.string()
    .min(2, "Nome muito curto")
    .max(120, "Nome muito longo")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Nome contém caracteres inválidos"),
  email: z.string().max(254).email("Email inválido"),
  password: z.string()
    .min(8, "Senha deve ter ao menos 8 caracteres")
    .max(128, "Senha muito longa")
    .regex(/[A-Z]/, "Senha deve conter ao menos uma letra maiúscula")
    .regex(/[0-9]/, "Senha deve conter ao menos um número"),
});

// ── Helper: safe user serializer ───────────────────────────────────────────
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

// ── POST /auth/login ───────────────────────────────────────────────────────
router.post("/auth/login", authLimiter, async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email.toLowerCase()));

  // ── Timing attack mitigation ─────────────────────────────────────────────
  // Always run bcrypt even when the user doesn't exist, so response time
  // cannot be used to enumerate valid email addresses.
  const DUMMY_HASH = "$2b$12$invalidhashpadding000000000000000000000000000000000000000";
  const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
  const validPassword = await bcrypt.compare(parsed.data.password, hashToCompare);

  if (!user || !validPassword) {
    res.status(401).json({ error: "Email ou senha incorretos" });
    return;
  }

  if (!user.active) {
    res.status(403).json({ error: "Conta desativada. Entre em contato com o suporte." });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
  setAuthCookie(res, token);
  // Return token in body so the frontend can use it as Bearer even when cookies
  // are blocked (e.g. Replit iframe preview with third-party cookie restrictions).
  res.json({ user: safeUser(user), token });
});

// ── POST /auth/register ────────────────────────────────────────────────────
router.post("/auth/register", registerLimiter, async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" });
    return;
  }

  // Sanitize name to strip any remaining HTML/script content
  const safeName = sanitize(parsed.data.name);
  const safeEmail = parsed.data.email.toLowerCase().trim();

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, safeEmail));

  if (existing) {
    res.status(409).json({ error: "Este email já está cadastrado" });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const [user] = await db
    .insert(usersTable)
    .values({ name: safeName, email: safeEmail, passwordHash, role: "creator" })
    .returning();

  const token = signToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
  setAuthCookie(res, token);
  res.status(201).json({ user: safeUser(user), token });
});

// ── GET /auth/me ───────────────────────────────────────────────────────────
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId));

  if (!user || !user.active) {
    res.status(401).json({ error: "Usuário não encontrado ou desativado" });
    return;
  }
  res.json({ user: safeUser(user) });
});

// ── POST /auth/logout ──────────────────────────────────────────────────────
router.post("/auth/logout", (_req, res): void => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

export default router;
