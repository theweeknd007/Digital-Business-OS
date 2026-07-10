import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// ── JWT Secret ─────────────────────────────────────────────────────────────
// In production, SESSION_SECRET MUST be set. Fallback only allowed in dev.
const JWT_SECRET = (() => {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET environment variable is required in production");
    }
    return "goatpay-dev-secret-DO-NOT-USE-IN-PRODUCTION";
  }
  if (s.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters long");
  }
  return s;
})();

const COOKIE_NAME = "gp_token";
const TOKEN_EXPIRY = "7d";

export interface AuthPayload {
  userId: number;
  email: string;
  role: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    // Always secure — Replit dev environment is HTTPS, and production must be too
    secure: true,
    sameSite: "none",   // Required for cross-origin iframe contexts (Replit preview)
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Prefer cookie; fall back to Authorization: Bearer <token>
  const token = req.cookies?.[COOKIE_NAME] ?? extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Token inválido ou expirado" });
    return;
  }
  req.user = payload;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Acesso restrito a administradores" });
      return;
    }
    next();
  });
}

function extractBearerToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export { COOKIE_NAME };
