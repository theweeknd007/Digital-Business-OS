import {
  useListAffiliates,
  useGetAffiliateStats,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { Users, TrendingUp, DollarSign, Star } from "lucide-react";

const STATUS_STYLES: Record<string, { cls: string; label: string }> = {
  active:  { cls: "bg-primary/10 text-primary border border-primary/20", label: "Ativo" },
  inactive:{ cls: "bg-muted text-muted-foreground border border-border", label: "Inativo" },
  pending: { cls: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20", label: "Pendente" },
};

export default function Affiliates() {
  const { data: affiliates, isLoading: affLoading } = useListAffiliates();
  const { data: stats, isLoading: statsLoading } = useGetAffiliateStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Afiliados</h1>
        <p className="text-muted-foreground text-sm mt-1">Programa de afiliados e comissoes.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : stats ? (
          <>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalAffiliates}</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Ativos</span>
              </div>
              <div className="text-2xl font-bold text-primary">{stats.activeAffiliates}</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Comissao Paga</span>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalCommissionPaid)}</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Top Afiliado</span>
              </div>
              <div className="text-sm font-bold truncate">{stats.topAffiliateName}</div>
              <div className="text-xs text-primary">{formatCurrency(stats.topAffiliateRevenue)}</div>
            </div>
          </>
        ) : null}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Afiliado</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Comissao</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Vendas</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comissao Total</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Pendente</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {affLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="px-5 py-4" colSpan={6}><Skeleton className="h-5 w-full" /></td>
                </tr>
              ))
            ) : affiliates && affiliates.length > 0 ? (
              affiliates.map((a) => {
                const st = STATUS_STYLES[a.status] ?? STATUS_STYLES.pending;
                return (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-foreground">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.email}</div>
                    </td>
                    <td className="px-5 py-4 text-right hidden md:table-cell">
                      <span className="text-primary font-semibold">{a.commissionRate}%</span>
                    </td>
                    <td className="px-5 py-4 text-right text-muted-foreground hidden lg:table-cell">{a.totalSales.toLocaleString("pt-BR")}</td>
                    <td className="px-5 py-4 text-right font-bold text-primary">{formatCurrency(a.totalCommission)}</td>
                    <td className="px-5 py-4 text-right text-yellow-400 hidden lg:table-cell">{formatCurrency(a.pendingCommission ?? 0)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p>Nenhum afiliado cadastrado.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
