import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDashboardSummary,
  useGetRevenueChart,
  useGetTrafficSources,
  useGetTopProducts,
  useGetWalletSummary,
} from "@workspace/api-client-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

function GrowthBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${positive ? "text-primary" : "text-destructive"}`}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? "+" : ""}{value.toFixed(1)}% vs mês anterior
    </span>
  );
}

function KpiCard({ label, value, growth, prefix = "" }: { label: string; value: string; growth: number; prefix?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-2 hover:border-primary/30 transition-colors">
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
      <span className="text-2xl font-bold text-foreground tracking-tight">{prefix}{value}</span>
      <GrowthBadge value={growth} />
    </div>
  );
}

const NEON_COLORS = ["#00e676", "#00b248", "#69f0ae", "#00c853", "#b9f6ca"];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: summary, isLoading: sumLoading } = useGetDashboardSummary();
  const { data: chart, isLoading: chartLoading } = useGetRevenueChart();
  const { data: traffic, isLoading: trafficLoading } = useGetTrafficSources();
  const { data: topProducts, isLoading: topLoading } = useGetTopProducts();
  const { data: wallet, isLoading: walletLoading } = useGetWalletSummary();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Olá, Operador!</h1>
          <p className="text-muted-foreground text-sm mt-1">Bem-vindo ao painel de controle GOAT-PAY.</p>
        </div>
        <div className="text-xs text-muted-foreground hidden sm:block">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Última atualização agora há pouco
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {sumLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : summary ? (
          <>
            <KpiCard label="Receita Total" value={formatCurrency(summary.totalRevenue)} growth={summary.revenueGrowth} />
            <KpiCard label="Vendas" value={summary.totalSales.toLocaleString("pt-BR")} growth={summary.salesGrowth} />
            <KpiCard label="Ticket Médio" value={formatCurrency(summary.avgTicket)} growth={summary.ticketGrowth} />
            <KpiCard label="Conversão" value={`${summary.conversionRate.toFixed(2)}%`} growth={summary.conversionGrowth} />
            <KpiCard label="Reembolsos" value={formatCurrency(summary.refunds)} growth={summary.refundGrowth} />
          </>
        ) : null}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Receita nos últimos 30 dias</h2>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">Últimos 30 dias</span>
          </div>
          {chartLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : chart && chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chart} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e676" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} width={48} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid #222", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [formatCurrency(v), "Receita"]}
                  labelStyle={{ color: "#888" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#00e676" strokeWidth={2} fill="url(#revenueGradient)" dot={false} activeDot={{ r: 4, fill: "#00e676" }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
          )}
        </div>

        {/* Traffic Sources */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-sm mb-4">Fontes de Tráfego</h2>
          {trafficLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : traffic && traffic.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <PieChart width={140} height={140}>
                <Pie data={traffic} dataKey="percentage" cx={65} cy={65} innerRadius={42} outerRadius={65} paddingAngle={3} strokeWidth={0}>
                  {traffic.map((_, i) => (
                    <Cell key={i} fill={NEON_COLORS[i % NEON_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
              <div className="w-full space-y-2">
                {traffic.map((s, i) => (
                  <div key={s.source} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: NEON_COLORS[i % NEON_COLORS.length] }} />
                      <span className="text-muted-foreground">{s.source}</span>
                    </div>
                    <span className="font-medium text-foreground">{s.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
          )}
        </div>
      </div>

      {/* Bottom Row: Top Products + Wallet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Products */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-sm mb-4">Top Produtos</h2>
          {topLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
          ) : topProducts && topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p) => {
                const maxRev = topProducts[0]?.revenue ?? 1;
                const pct = Math.max(5, (p.revenue / maxRev) * 100);
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4">{p.rank}</span>
                    <span className="text-sm text-foreground flex-1 truncate">{p.name}</span>
                    <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-primary w-28 text-right">{formatCurrency(p.revenue)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm text-center py-8">Nenhum produto ainda</div>
          )}
        </div>

        {/* Wallet Summary */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-sm">Carteira</h2>
          {walletLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : wallet ? (
            <>
              <div className="space-y-3 flex-1">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Saldo Disponível</div>
                  <div className="text-lg font-bold text-primary">{formatCurrency(wallet.available)}</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">A Receber</div>
                  <div className="text-lg font-bold text-foreground">{formatCurrency(wallet.pending)}</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Total a Receber</div>
                  <div className="text-lg font-bold text-foreground">{formatCurrency(wallet.total)}</div>
                </div>
              </div>
              <button
                onClick={() => setLocation("/withdrawals")}
                className="w-full bg-primary text-primary-foreground font-semibold rounded-lg py-2.5 text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Sacar Agora <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
