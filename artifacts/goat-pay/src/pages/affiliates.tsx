import { useListAffiliates, useGetAffiliateStats } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { Users, TrendingUp, DollarSign, Star } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function Affiliates() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const neon = isDark ? "#00e676" : "#00a84f";
  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const borderColor = isDark ? "rgba(0,230,118,0.15)" : "rgba(0,0,0,0.08)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
    active:   { bg: `${neon}15`, text: neon, border: `${neon}40`, label: "Ativo" },
    inactive: { bg: inputBg, text: textMuted, border: inputBorder, label: "Inativo" },
    pending:  { bg: "rgba(255,183,0,0.1)", text: "#ffb700", border: "rgba(255,183,0,0.3)", label: "Pendente" },
  };

  const { data: affiliates, isLoading } = useListAffiliates();
  const { data: stats, isLoading: statsLoading } = useGetAffiliateStats();

  const statsCards = stats ? [
    { label: "Total de Afiliados", value: stats.totalAffiliates.toString(), icon: Users },
    { label: "Afiliados Ativos", value: stats.activeAffiliates.toString(), icon: TrendingUp },
    { label: "Total Comissões", value: formatCurrency(stats.totalCommissionPaid), icon: DollarSign },
    { label: "Vendas Geradas", value: stats.totalSalesGenerated.toLocaleString("pt-BR"), icon: Star },
  ] : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: textPrimary }}>Afiliados</h1>
        <p className="text-sm mt-0.5" style={{ color: textMuted }}>Gerencie seus afiliados e comissões.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? Array.from({ length: 4 }).map((_, i) =>
          <Skeleton key={i} className="h-24 rounded-xl" style={{ background: inputBg }} />
        ) : statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="gp-card p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: textMuted }}>{card.label}</span>
                <Icon className="w-4 h-4" style={{ color: neon }} />
              </div>
              <span className="text-xl font-extrabold number-display" style={{ color: textPrimary }}>{card.value}</span>
            </div>
          );
        })}
      </div>

      {/* Affiliates table */}
      <div className="gp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}`, background: isDark ? "rgba(0,230,118,0.02)" : "rgba(0,0,0,0.02)" }}>
                {["Afiliado", "Comissão %", "Vendas", "Total", "Status"].map((h, i) => (
                  <th key={i} className={`px-5 py-3 text-xs font-bold uppercase tracking-wider text-left
                    ${i === 2 || i === 3 ? "hidden md:table-cell text-right" : ""}
                    ${i === 1 ? "hidden sm:table-cell" : ""}`}
                    style={{ color: textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${borderColor}` }}>
                  <td colSpan={5} className="px-5 py-4">
                    <Skeleton className="h-6 w-full rounded" style={{ background: inputBg }} />
                  </td>
                </tr>
              )) : (affiliates ?? []).length > 0 ? (affiliates ?? []).map((a) => {
                const st = STATUS_STYLES[a.status] ?? STATUS_STYLES.inactive;
                return (
                  <tr key={a.id} className="transition-colors" style={{ borderBottom: `1px solid ${borderColor}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(0,230,118,0.02)" : "rgba(0,0,0,0.015)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                          style={{ background: `${neon}15`, color: neon }}>
                          {a.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm" style={{ color: textPrimary }}>{a.name}</div>
                          <div className="text-xs" style={{ color: textMuted }}>{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-xs font-mono px-2 py-1 rounded-lg" style={{ background: inputBg, color: textMuted }}>{a.commissionRate}%</span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold hidden md:table-cell number-display" style={{ color: textPrimary }}>
                      {a.totalSales.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-5 py-4 text-right font-bold hidden md:table-cell number-display" style={{ color: neon }}>
                      {formatCurrency(a.totalCommission)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>{st.label}</span>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={5} className="px-5 py-20 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3" style={{ color: `${neon}30` }} />
                  <p style={{ color: textMuted }}>Nenhum afiliado cadastrado ainda.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
