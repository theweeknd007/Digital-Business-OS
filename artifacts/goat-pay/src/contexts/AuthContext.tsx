import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "creator" | "admin";
  avatarUrl: string | null;
  active: boolean;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Token storage ─────────────────────────────────────────────────────────
// Primary: in-memory (most secure — not accessible to XSS on other tabs).
// Backup: sessionStorage (survives page refresh within same tab).
// The server also sets an HttpOnly cookie, but it may be blocked in Replit's
// iframe preview. The Bearer token is the reliable fallback.

const TOKEN_KEY = "gp_sess";

function saveToken(token: string) {
  try { sessionStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
}

function loadToken(): string | null {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function removeToken() {
  try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

// ── API fetch helper ──────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function apiFetch(path: string, options?: RequestInit, token?: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> ?? {}),
  };

  // Always send Bearer token when available — works even if cookie is blocked
  const bearer = token ?? loadToken();
  if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

  return fetch(`${BASE}/api${path}`, {
    ...options,
    credentials: "include",
    headers,
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error ?? "Erro desconhecido");
    return data as Record<string, unknown>;
  });
}

// ── Provider ──────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null });
  const tokenRef = useRef<string | null>(loadToken());

  const fetchMe = useCallback(async () => {
    try {
      const data = await apiFetch("/auth/me", undefined, tokenRef.current);
      setState({ user: data.user as AuthUser, loading: false, error: null });
    } catch {
      removeToken();
      tokenRef.current = null;
      setState({ user: null, loading: false, error: null });
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const token = data.token as string;
      tokenRef.current = token;
      saveToken(token);
      setState({ user: data.user as AuthUser, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao fazer login";
      setState((s) => ({ ...s, loading: false, error: msg }));
      throw err;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      const token = data.token as string;
      tokenRef.current = token;
      saveToken(token);
      setState({ user: data.user as AuthUser, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao criar conta";
      setState((s) => ({ ...s, loading: false, error: msg }));
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await apiFetch("/auth/logout", { method: "POST" }, tokenRef.current).catch(() => {});
    removeToken();
    tokenRef.current = null;
    setState({ user: null, loading: false, error: null });
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      clearError,
      isAdmin: state.user?.role === "admin",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
