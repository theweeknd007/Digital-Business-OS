import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Users, Shield, Package, ShoppingCart, DollarSign,
  CheckCircle, XCircle, AlertTriangle, RefreshCw,
  UserCog, TrendingUp, BarChart2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function adminFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Erro");
  return data;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  avatarUrl: string | null;
  createdAt: string;
}

interface AdminStats {
  totalUsers: number; activeUsers: number; adminUsers: number;
  totalProducts: number; activeProducts: number;
  totalSales: number; completedSales: number;
  totalRevenue: number; pendingWithdrawals: number; totalWithdrawals: number;
}

interface AdminWithdrawal {
  id: number; amount: number; status: string;
  pixKey: string; notes: string | null; createdAt: string;
}

interface AdminProduct {
  id: number; ownerId?: number; name: string; type: string; price: number;
  status: string; coverUrl?: string; fileName?: string; createdAt: string;
}

type Tab = "stats" | "users" | "products" | "withdrawals";

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isDark = theme === "dark";
  const neon = isDark ? "#00e676" : "#00a84f";
  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const borderColor = isDark ? "rgba(0,230,118,0.15)" : "rgba(0,0,0,0.08)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

  const [tab, setTab] = useState<Tab>("stats");

  const statsQ = useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => adminFetch("/admin/stats"),
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  const usersQ = useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: () => adminFetch("/admin/users"),
    enabled: isAdmin && tab === "users",
  });

  const withdrawalsQ = useQuery<AdminWithdrawal[]>({
    queryKey: ["admin", "withdrawals"],
    queryFn: () => adminFetch("/admin/withdrawals"),
    enabled: isAdmin && tab === "withdrawals",
    refetchInterval: 15000,
  });

  const productsQ = useQuery<AdminProduct[]>({
    queryKey: ["admin", "products"],
    queryFn: () => adminFetch("/admin/products"),
    enabled: isAdmin && tab === "products",
    refetchInterval: 15000,
  });

  const toggleUser = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      adminFetch(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ active }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); toast({ title: "Usuário atualizado" }); },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const promoteUser = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      adminFetch(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); toast({ title: "Permissão alterada" }); },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const approveW = useMutation({
    mutationFn: (id: number) => adminFetch(`/admin/withdrawals/${id}/approve`, { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "withdrawals"] }); toast({ title: "Saque aprovado" }); },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const rejectW = useMutation({
    mutationFn: (id: number) => adminFetch(`/admin/withdrawals/${id}/reject`, { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "withdrawals"] }); toast({ title: "Saque rejeitado" }); },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const reviewProduct = useMutation({
    mutationFn: ({ id, decision }: { id: number; decision: "approve" | "reject" }) =>
      adminFetch(`/admin/products/${id}/review`, { method: "POST", body: JSON.stringify({ decision }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "products"] }); toast({ title: "Produto revisado" }); },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Shield className="w-16 h-16 mb-4" style={{ color: "#f44336" }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: textPrimary }}>Acesso Restrito</h2>
        <p style={{ color: textMuted }}>Apenas administradores podem acessar este painel.</p>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: React.FC<any> }[] = [
    { id: "stats", label: "Visão Geral", icon: BarChart2 },
    { id: "users", label: "Usuários", icon: Users },
    { id: "products", label: "Produtos", icon: Package },
    { id: "withdrawals", label: "Saques", icon: DollarSign },
  ];

  const STAT_CARDS = statsQ.data ? [
    { label: "Total de Usuários", value: statsQ.data.totalUsers, sub: `${statsQ.data.activeUsers} ativos`, icon: Users, color: neon },
    { label: "Admins", value: statsQ.data.adminUsers, sub: "com acesso total", icon: Shield, color: "#6366f1" },
    { label: "Produtos", value: statsQ.data.totalProducts, sub: `${statsQ.data.activeProducts} ativos`, icon: Package, color: "#3b82f6" },
    { label: "Vendas Completadas", value: statsQ.data.completedSales, sub: `de ${statsQ.data.totalSales} total`, icon: ShoppingCart, color: "#f59e0b" },
    { label: "Receita Total", value: formatCurrency(statsQ.data.totalRevenue), sub: "todas as vendas", icon: TrendingUp, color: neon, large: true },
    { label: "Saques Pendentes", value: formatCurrency(statsQ.data.pendingWithdrawals), sub: `${statsQ.data.totalWithdrawals} solicitações`, icon: DollarSign, color: "#f44336", large: true },
  ] : [];

  const WITHDRAWAL_STATUS: Record<string, { label: string; bg: string; text: string; border: string }> = {
    pending:  { label: "Pendente",  bg: "rgba(255,183,0,0.1)", text: "#ffb700", border: "rgba(255,183,0,0.3)" },
    approved: { label: "Aprovado",  bg: `${neon}15`, text: neon, border: `${neon}40` },
    rejected: { label: "Rejeitado", bg: "rgba(244,67,54,0.1)", text: "#f44336", border: "rgba(244,67,54,0.3)" },
    paid:     { label: "Pago",      bg: inputBg, text: textMuted, border: borderColor },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5" style={{ color: neon }} />
            <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: `${neon}15`, color: neon }}>ADMINISTRADOR</span>
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: textPrimary }}>Painel Admin</h1>
          <p className="text-sm mt-0.5" style={{ color: textMuted }}>
            Logado como <span style={{ color: neon }}>{user?.name}</span>
          </p>
        </div>
        <button onClick={() => { statsQ.refetch(); usersQ.refetch(); withdrawalsQ.refetch(); }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: inputBg, border: `1px solid ${borderColor}`, color: textMuted }}>
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: inputBg }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: tab === id ? (isDark ? "rgba(0,230,118,0.12)" : "#fff") : "transparent",
              color: tab === id ? neon : textMuted,
              border: tab === id ? `1px solid ${neon}30` : "1px solid transparent",
              boxShadow: tab === id ? `0 2px 8px ${neon}10` : "none",
            }}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ─── STATS TAB ─── */}
      {tab === "stats" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {statsQ.isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" style={{ background: inputBg }} />
                ))
              : STAT_CARDS.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className="gp-card p-5 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: textMuted }}>{card.label}</span>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: `${card.color}15` }}>
                          <Icon className="w-4 h-4" style={{ color: card.color }} />
                        </div>
                      </div>
                      <span className={`font-extrabold number-display leading-tight ${card.large ? "text-xl" : "text-2xl"}`}
                        style={{ color: textPrimary }}>
                        {typeof card.value === "number" && !card.large ? card.value : card.value}
                      </span>
                      <span className="text-xs" style={{ color: textMuted }}>{card.sub}</span>
                    </div>
                  );
                })}
          </div>

          {statsQ.data && (
            <div className="gp-card p-5">
              <h3 className="text-sm font-bold mb-4" style={{ color: textPrimary }}>Saúde da Plataforma</h3>
              <div className="space-y-3">
                {[
                  { label: "Taxa de Conversão", value: statsQ.data.totalSales > 0 ? (statsQ.data.completedSales / statsQ.data.totalSales * 100).toFixed(1) + "%" : "—", ok: true },
                  { label: "Usuários Ativos", value: statsQ.data.totalUsers > 0 ? (statsQ.data.activeUsers / statsQ.data.totalUsers * 100).toFixed(1) + "%" : "—", ok: statsQ.data.activeUsers === statsQ.data.totalUsers },
                  { label: "Produtos Ativos", value: statsQ.data.totalProducts > 0 ? (statsQ.data.activeProducts / statsQ.data.totalProducts * 100).toFixed(1) + "%" : "—", ok: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2"
                    style={{ borderBottom: `1px solid ${borderColor}` }}>
                    <span className="text-sm" style={{ color: textMuted }}>{item.label}</span>
                    <div className="flex items-center gap-2">
                      {item.ok
                        ? <CheckCircle className="w-4 h-4" style={{ color: neon }} />
                        : <AlertTriangle className="w-4 h-4" style={{ color: "#f59e0b" }} />}
                      <span className="text-sm font-bold" style={{ color: textPrimary }}>{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── USERS TAB ─── */}
      {tab === "users" && (
        <div className="gp-card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${borderColor}` }}>
            <h2 className="font-bold text-sm" style={{ color: textPrimary }}>
              Usuários ({usersQ.data?.length ?? "..."})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr style={{ background: inputBg }}>
                  {["Usuário", "Email", "Perfil", "Desde", "Status", "Ações"].map((h, i) => (
                    <th key={i} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: textMuted, borderBottom: `1px solid ${borderColor}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usersQ.isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${borderColor}` }}>
                        <td colSpan={6} className="px-5 py-4">
                          <Skeleton className="h-5 w-full rounded" style={{ background: inputBg }} />
                        </td>
                      </tr>
                    ))
                  : (usersQ.data ?? []).map((u) => (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${borderColor}` }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(0,230,118,0.02)" : "rgba(0,0,0,0.015)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                              style={{ background: u.role === "admin" ? "#6366f120" : `${neon}15`, color: u.role === "admin" ? "#6366f1" : neon }}>
                              {u.name[0]?.toUpperCase()}
                            </div>
                            <span className="font-semibold" style={{ color: textPrimary }}>{u.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4" style={{ color: textMuted }}>{u.email}</td>
                        <td className="px-5 py-4">
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                            style={{
                              background: u.role === "admin" ? "#6366f120" : `${neon}15`,
                              color: u.role === "admin" ? "#6366f1" : neon,
                              border: `1px solid ${u.role === "admin" ? "#6366f140" : neon + "40"}`,
                            }}>
                            {u.role === "admin" ? "Admin" : "Creator"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs" style={{ color: textMuted }}>{formatDate(u.createdAt)}</td>
                        <td className="px-5 py-4">
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                            style={{
                              background: u.active ? `${neon}12` : "rgba(244,67,54,0.1)",
                              color: u.active ? neon : "#f44336",
                              border: `1px solid ${u.active ? neon + "30" : "rgba(244,67,54,0.3)"}`,
                            }}>
                            {u.active ? "Ativo" : "Suspenso"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {u.id !== user?.id && (
                              <>
                                <button
                                  onClick={() => toggleUser.mutate({ id: u.id, active: !u.active })}
                                  disabled={toggleUser.isPending}
                                  className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all"
                                  style={{
                                    background: u.active ? "rgba(244,67,54,0.1)" : `${neon}10`,
                                    color: u.active ? "#f44336" : neon,
                                    border: `1px solid ${u.active ? "rgba(244,67,54,0.2)" : neon + "30"}`,
                                  }}>
                                  {u.active ? "Suspender" : "Ativar"}
                                </button>
                                <button
                                  onClick={() => promoteUser.mutate({ id: u.id, role: u.role === "admin" ? "creator" : "admin" })}
                                  disabled={promoteUser.isPending}
                                  className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all"
                                  style={{ background: "#6366f115", color: "#6366f1", border: "1px solid #6366f130" }}>
                                  <UserCog className="w-3.5 h-3.5 inline mr-1" />
                                  {u.role === "admin" ? "→ Creator" : "→ Admin"}
                                </button>
                              </>
                            )}
                            {u.id === user?.id && (
                              <span className="text-xs italic" style={{ color: textMuted }}>Você</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── WITHDRAWALS TAB ─── */}
      {tab === "products" && (
        <div className="gp-card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${borderColor}` }}>
            <div>
              <h2 className="font-bold text-sm" style={{ color: textPrimary }}>Moderação de Produtos</h2>
              <p className="text-xs mt-1" style={{ color: textMuted }}>Nenhum produto pode vender antes da aprovação.</p>
            </div>
            <span className="text-xs font-bold" style={{ color: "#ffb700" }}>
              {productsQ.data?.filter((p) => p.status === "pending_approval").length ?? "..."} pendentes
            </span>
          </div>
          <div className="divide-y" style={{ borderColor }}>
            {(productsQ.data ?? []).map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                {p.coverUrl ? <img src={`${BASE}/api/storage${p.coverUrl}`} alt="" className="h-14 w-20 rounded-xl object-cover" /> : <div className="h-14 w-20 rounded-xl" style={{ background: inputBg }} />}
                <div className="min-w-[180px] flex-1">
                  <div className="font-bold text-sm" style={{ color: textPrimary }}>{p.name}</div>
                  <div className="text-xs mt-1" style={{ color: textMuted }}>Criador #{p.ownerId ?? "—"} · {formatCurrency(p.price)} · {p.fileName ?? "sem ficheiro"}</div>
                </div>
                <span className="text-xs font-bold rounded-full px-2.5 py-1" style={{
                  background: p.status === "pending_approval" ? "rgba(255,183,0,.12)" : `${neon}15`,
                  color: p.status === "pending_approval" ? "#ffb700" : neon,
                }}>{p.status === "pending_approval" ? "Aguardando" : p.status}</span>
                {p.status === "pending_approval" && (
                  <div className="flex gap-2">
                    <button onClick={() => reviewProduct.mutate({ id: p.id, decision: "approve" })} className="rounded-lg px-3 py-2 text-xs font-bold" style={{ background: `${neon}15`, color: neon }}>Aprovar</button>
                    <button onClick={() => reviewProduct.mutate({ id: p.id, decision: "reject" })} className="rounded-lg px-3 py-2 text-xs font-bold" style={{ background: "rgba(244,67,54,.1)", color: "#f44336" }}>Rejeitar</button>
                  </div>
                )}
              </div>
            ))}
            {!productsQ.isLoading && !(productsQ.data ?? []).length && <div className="px-5 py-12 text-center text-sm" style={{ color: textMuted }}>Nenhum produto para revisar.</div>}
          </div>
        </div>
      )}

      {/* ─── WITHDRAWALS TAB ─── */}
      {tab === "withdrawals" && (
        <div className="space-y-4">
          {withdrawalsQ.data && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total", value: withdrawalsQ.data.length, color: textMuted },
                { label: "Pendentes", value: withdrawalsQ.data.filter((w) => w.status === "pending").length, color: "#ffb700" },
                { label: "Valor Pendente", value: formatCurrency(withdrawalsQ.data.filter((w) => w.status === "pending").reduce((s, w) => s + w.amount, 0)), color: "#f44336" },
              ].map((item) => (
                <div key={item.label} className="gp-card p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: textMuted }}>{item.label}</div>
                  <div className="text-xl font-extrabold number-display" style={{ color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          )}

          <div className="gp-card overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
              <h2 className="font-bold text-sm" style={{ color: textPrimary }}>Solicitações de Saque</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr style={{ background: inputBg }}>
                    {["ID", "Valor", "Chave PIX", "Data", "Status", "Ações"].map((h, i) => (
                      <th key={i} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider"
                        style={{ color: textMuted, borderBottom: `1px solid ${borderColor}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {withdrawalsQ.isLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${borderColor}` }}>
                          <td colSpan={6} className="px-5 py-4">
                            <Skeleton className="h-5 w-full rounded" style={{ background: inputBg }} />
                          </td>
                        </tr>
                      ))
                    : (withdrawalsQ.data ?? []).map((w) => {
                        const st = WITHDRAWAL_STATUS[w.status] ?? WITHDRAWAL_STATUS.pending;
                        return (
                          <tr key={w.id} style={{ borderBottom: `1px solid ${borderColor}` }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(0,230,118,0.02)" : "rgba(0,0,0,0.015)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                            <td className="px-5 py-4">
                              <span className="font-mono text-xs px-2 py-1 rounded-lg" style={{ background: inputBg, color: textMuted }}>#{w.id}</span>
                            </td>
                            <td className="px-5 py-4 font-bold number-display" style={{ color: neon }}>{formatCurrency(w.amount)}</td>
                            <td className="px-5 py-4 font-mono text-xs" style={{ color: textMuted }}>{w.pixKey}</td>
                            <td className="px-5 py-4 text-xs" style={{ color: textMuted }}>{formatDate(w.createdAt)}</td>
                            <td className="px-5 py-4">
                              <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                                style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                                {st.label}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {w.status === "pending" && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => approveW.mutate(w.id)}
                                    disabled={approveW.isPending}
                                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all"
                                    style={{ background: `${neon}15`, color: neon, border: `1px solid ${neon}30` }}>
                                    <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                                  </button>
                                  <button
                                    onClick={() => rejectW.mutate(w.id)}
                                    disabled={rejectW.isPending}
                                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all"
                                    style={{ background: "rgba(244,67,54,0.1)", color: "#f44336", border: "1px solid rgba(244,67,54,0.3)" }}>
                                    <XCircle className="w-3.5 h-3.5" /> Rejeitar
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
