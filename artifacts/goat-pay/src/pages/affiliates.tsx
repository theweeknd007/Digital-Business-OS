import { useListAffiliates, useGetAffiliateStats } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { Users, TrendingUp, DollarSign, Star } from "lucide-react";

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  active:   { bg: "rgba(0,230,118,0.1)", text: "#00e676", border: "rgba(0,230,118,0.3)", label: "Ativo" },
  inactive: { bg: "rgba(255,255,255,0.05)", text: "rgba(255,255,255,0.4)", border: "rgba(255,255,255,0.1)", label: "Inativo" },
  pending:  { bg: "rgba(255,183,0,0.1)", text: "#ffb700", border: "rgba(255,183,0,0.3)", label: "Pendente" },
};

export default function Affiliates() {
  const { data: affiliates, isLoading: affLoading } = useListAffiliates();
  const { data: stats, isLoading: statsLoading } = useGetAffiliateStats();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Afiliados</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Programa de afiliados e comissões.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsLoading ? Array.from({ length: 4 }).map((_, i) =>
          <Skeleton key={i} className="h-24 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
        ) : stats ? (
          <>
            {[
              { icon: Users, label: "Total de Afiliados", value: stats.totalAffiliates.toString(), color: "rgba(255,255,255,0.5)" },
              { icon: Star, label: "Afiliados Ativos", value: stats.activeAffiliates.toString(), color: "#00e676" },
              { icon: DollarSign, label: "Comissão Paga", value: formatCurrency(stats.totalCommissionPaid), color: "rgba(255,255,255,0.5)" },
              { icon: TrendingUp, label: "Top Afiliado", value: stats.topAffiliateName, color: "#00e676", sub: formatCurrency(stats.topAffiliateRevenue) },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="glow-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" style={{ color: item.color }} />
                    <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>{item.label}</span>
                  </div>
                  <div className="text-xl font-extrabold text-white truncate number-display">{item.value}</div>
                  {item.sub && <div className="text-xs mt-0.5 font-semibold" style={{ color: "#00e676" }}>{item.sub}</div>}
                </div>
              );
            })}
          </>
        ) : null}
      </div>

      <div className="glow-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,230,118,0.1)", background: "rgba(0,230,118,0.03)" }}>
              {["Afiliado", "Comissão", "Vendas", "Total", "Pendente", "Status"].map((h, i) => (
                <th key={i} className={`px-5 py-3 text-xs font-bold uppercase tracking-wider ${i > 0 ? "text-right" : "text-left"} ${[1,2].includes(i) ? "hidden md:table-cell" : ""} ${i === 4 ? "hidden lg:table-cell" : ""}`}
                  style={{ color: "rgba(255,255,255,0.35)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {affLoading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td colSpan={6} className="px-5 py-4"><Skeleton className="h-5 w-full rounded" style={{ background: "rgba(255,255,255,0.04)" }} /></td>
              </tr>
            )) : affiliates && affiliates.length > 0 ? affiliates.map((a) => {
              const st = STATUS_STYLES[a.status] ?? STATUS_STYLES.pending;
              return (
                <tr key={a.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,230,118,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-white">{a.name}</div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{a.email}</div>
                  </td>
                  <td className="px-5 py-4 text-right hidden md:table-cell">
                    <span className="font-bold text-sm" style={{ color: "#00e676" }}>{a.commissionRate}%</span>
                  </td>
                  <td className="px-5 py-4 text-right hidden md:table-cell" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {a.totalSales.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-5 py-4 text-right font-bold number-display" style={{ color: "#00e676" }}>
                    {formatCurrency(a.totalCommission)}
                  </td>
                  <td className="px-5 py-4 text-right hidden lg:table-cell font-semibold number-display" style={{ color: "#ffb700" }}>
                    {formatCurrency(a.pendingCommission ?? 0)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>{st.label}</span>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={6} className="px-5 py-20 text-center">
                <Users className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(0,230,118,0.2)" }} />
                <p style={{ color: "rgba(255,255,255,0.3)" }}>Nenhum afiliado cadastrado.</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
