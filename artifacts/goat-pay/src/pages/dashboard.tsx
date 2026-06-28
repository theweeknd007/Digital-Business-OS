import { useLocation } from "wouter";
import {
  useGetDashboardSummary,
  useGetRevenueChart,
  useGetTrafficSources,
  useGetTopProducts,
  useGetWalletSummary,
} from "@workspace/api-client-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { useTheme } from "@/contexts/ThemeContext";
import {
  TrendingUp, TrendingDown, Wallet, Clock, Layers,
  Monitor, Smartphone, Tablet, ArrowRight, Package,
  ShoppingCart, Percent, RotateCcw,
} from "lucide-react";

const TRAFFIC_COLORS_DARK = ["#00e676", "#00c853", "#69f0ae", "#1b5e20", "#555"];
const TRAFFIC_COLORS_LIGHT = ["#00a84f", "#00c853", "#4caf50", "#2e7d32", "#aaa"];
const DEVICE_DATA = [
  { name: "Desktop", value: 58.3, icon: Monitor },
  { name: "Mobile", value: 36.7, icon: Smartphone },
  { name: "Tablet", value: 5.0, icon: Tablet },
];
const LOCATION_DATA = [
  { country: "Brasil", pct: 82.6 },
  { country: "Portugal", pct: 6.1 },
  { country: "Estados Unidos", pct: 3.2 },
  { country: "Espanha", pct: 2.7 },
  { country: "Outros", pct: 5.4 },
];

function StatCard({
  label, value, growth, icon: Icon, neon, isDark
}: {
  label: string; value: string; growth: number;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  neon: string; isDark: boolean;
}) {
  const pos = growth >= 0;
  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  return (
    <div className="gp-card p-4 flex flex-col gap-2 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: textMuted }}>{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${neon}15` }}>
          <Icon className="w-4 h-4" style={{ color: neon }} />
        </div>
      </div>
      <span className="text-xl font-extrabold number-display leading-tight" style={{ color: textPrimary }}>{value}</span>
      <div className="flex items-center gap-1 text-xs font-semibold">
        {pos ? <TrendingUp className="w-3 h-3" style={{ color: "#00c853" }} /> : <TrendingDown className="w-3 h-3" style={{ color: "#f44336" }} />}
        <span style={{ color: pos ? "#00c853" : "#f44336" }}>{pos ? "+" : ""}{growth.toFixed(1)}%</span>
        <span style={{ color: textMuted, fontWeight: 400 }}>vs mês anterior</span>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, isDark }: any) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: isDark ? "hsl(135,20%,7%)" : "#fff",
        border: `1px solid ${isDark ? "rgba(0,230,118,0.25)" : "rgba(0,0,0,0.1)"}`,
        borderRadius: 8, padding: "8px 12px", fontSize: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}>
        <div style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", marginBottom: 2 }}>{label}</div>
        <div style={{ color: isDark ? "#00e676" : "#00a84f", fontWeight: 700 }}>{formatCurrency(payload[0].value)}</div>
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const neon = isDark ? "#00e676" : "#00a84f";
  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const surface = isDark ? "hsl(135,20%,5%)" : "#fff";
  const borderColor = isDark ? "rgba(0,230,118,0.15)" : "rgba(0,0,0,0.08)";
  const TRAFFIC_COLORS = isDark ? TRAFFIC_COLORS_DARK : TRAFFIC_COLORS_LIGHT;

  const { data: summary, isLoading: sumLoading } = useGetDashboardSummary();
  const { data: chart, isLoading: chartLoading } = useGetRevenueChart();
  const { data: traffic, isLoading: trafficLoading } = useGetTrafficSources();
  const { data: topProds, isLoading: topLoading } = useGetTopProducts();
  const { data: wallet, isLoading: walletLoading } = useGetWalletSummary();

  const totalSales = summary?.totalSales ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: textPrimary }}>Olá, SKILL!</h1>
          <p className="text-sm mt-0.5" style={{ color: textMuted }}>Bem-vindo ao seu painel de controle.</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs shrink-0" style={{ color: textMuted }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: neon }} />
          Última atualização: <span style={{ color: textPrimary }}>Agora há pouco</span>
        </div>
      </div>

      {/* KPI Cards — 2 cols mobile, 5 cols desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {sumLoading ? Array.from({ length: 5 }).map((_, i) =>
          <Skeleton key={i} className="h-28 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
        ) : summary ? (
          <>
            <StatCard label="Receita Total" value={formatCurrency(summary.totalRevenue)} growth={summary.revenueGrowth} icon={DollarSignIcon} neon={neon} isDark={isDark} />
            <StatCard label="Vendas" value={summary.totalSales.toLocaleString("pt-BR")} growth={summary.salesGrowth} icon={ShoppingCart} neon={neon} isDark={isDark} />
            <StatCard label="Ticket Médio" value={formatCurrency(summary.avgTicket)} growth={summary.ticketGrowth} icon={Package} neon={neon} isDark={isDark} />
            <StatCard label="Conversão" value={`${summary.conversionRate.toFixed(2)}%`} growth={summary.conversionGrowth} icon={Percent} neon={neon} isDark={isDark} />
            <StatCard label="Reembolsos" value={formatCurrency(summary.refunds)} growth={summary.refundGrowth} icon={RotateCcw} neon={neon} isDark={isDark} />
          </>
        ) : null}
      </div>

      {/* Revenue chart + Traffic */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="xl:col-span-2 gp-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-sm" style={{ color: textPrimary }}>Receita nos últimos 30 dias</h2>
            <span className="text-xs px-3 py-1 rounded-lg font-medium"
              style={{ background: `${neon}15`, color: neon, border: `1px solid ${neon}30` }}>
              Últimos 30 dias ▾
            </span>
          </div>
          {chartLoading ? (
            <Skeleton className="h-56 w-full rounded-lg" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
          ) : chart && chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chart} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={neon} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={neon} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: textMuted }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => {
                    const d = new Date(v + "T00:00:00");
                    return `${String(d.getDate()).padStart(2, "0")} ${["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][d.getMonth()]}`;
                  }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: textMuted }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `R$${(v/1000).toFixed(0)}K` : `R$${v}`} width={52} />
                <Tooltip content={<ChartTooltip isDark={isDark} />} />
                <Area type="monotone" dataKey="revenue" stroke={neon} strokeWidth={2.5} fill="url(#revGrad)"
                  dot={false} activeDot={{ r: 5, fill: neon, stroke: "#fff", strokeWidth: 2 }}
                  style={{ filter: isDark ? "drop-shadow(0 0 6px rgba(0,230,118,0.5))" : undefined }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-sm" style={{ color: textMuted }}>Sem dados ainda</div>
          )}
        </div>

        {/* Traffic donut */}
        <div className="gp-card p-5 flex flex-col">
          <h2 className="font-bold text-sm mb-4" style={{ color: textPrimary }}>Fontes de Tráfego</h2>
          {trafficLoading ? (
            <Skeleton className="flex-1 rounded-lg" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
          ) : traffic && traffic.length > 0 ? (
            <div className="flex flex-col items-center gap-5 flex-1">
              <div className="relative" style={{ width: 160, height: 160 }}>
                <svg width={160} height={160} viewBox="0 0 160 160">
                  {(() => {
                    const cx = 80, cy = 80, rOut = 72, rIn = 50;
                    let angle = -Math.PI / 2;
                    const total = traffic.reduce((s, t) => s + t.percentage, 0);
                    return traffic.map((seg, i) => {
                      const sweep = (seg.percentage / total) * 2 * Math.PI;
                      const end = angle + sweep;
                      const x1o = cx + rOut * Math.cos(angle), y1o = cy + rOut * Math.sin(angle);
                      const x2o = cx + rOut * Math.cos(end), y2o = cy + rOut * Math.sin(end);
                      const x1i = cx + rIn * Math.cos(end), y1i = cy + rIn * Math.sin(end);
                      const x2i = cx + rIn * Math.cos(angle), y2i = cy + rIn * Math.sin(angle);
                      const la = sweep > Math.PI ? 1 : 0;
                      const d = `M${x1o} ${y1o} A${rOut} ${rOut} 0 ${la} 1 ${x2o} ${y2o} L${x1i} ${y1i} A${rIn} ${rIn} 0 ${la} 0 ${x2i} ${y2i}Z`;
                      const color = TRAFFIC_COLORS[i % TRAFFIC_COLORS.length];
                      const el = <path key={i} d={d} fill={color}
                        style={{ filter: i === 0 && isDark ? `drop-shadow(0 0 8px ${color})` : undefined }} />;
                      angle = end + 0.025;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold number-display" style={{ color: textPrimary }}>{totalSales.toLocaleString("pt-BR")}</span>
                  <span className="text-xs" style={{ color: textMuted }}>Vendas</span>
                </div>
              </div>
              <div className="w-full space-y-2">
                {traffic.map((s, i) => (
                  <div key={s.source} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TRAFFIC_COLORS[i % TRAFFIC_COLORS.length] }} />
                      <span style={{ color: textMuted }}>{s.source}</span>
                    </div>
                    <span className="font-bold" style={{ color: textPrimary }}>{s.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom row: Location + Devices + Top Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Location */}
        <div className="gp-card p-5">
          <h2 className="font-bold text-sm mb-4" style={{ color: textPrimary }}>Vendas por Localização</h2>
          <div className="rounded-xl mb-4 flex items-center justify-center overflow-hidden"
            style={{ background: isDark ? "rgba(0,230,118,0.03)" : "rgba(0,150,60,0.04)", border: `1px solid ${borderColor}`, height: 96 }}>
            <svg viewBox="0 0 400 200" className="w-full h-full" style={{ fill: "none" }}>
              <ellipse cx="100" cy="95" rx="55" ry="40" fill={isDark ? "rgba(0,230,118,0.12)" : "rgba(0,180,80,0.1)"} stroke={neon} strokeWidth="0.8" strokeOpacity="0.4" />
              <ellipse cx="205" cy="80" rx="45" ry="35" fill={isDark ? "rgba(0,230,118,0.06)" : "rgba(0,180,80,0.06)"} stroke={neon} strokeWidth="0.8" strokeOpacity="0.2" />
              <ellipse cx="285" cy="75" rx="30" ry="28" fill={isDark ? "rgba(0,230,118,0.05)" : "rgba(0,180,80,0.05)"} stroke={neon} strokeWidth="0.8" strokeOpacity="0.15" />
              <ellipse cx="340" cy="90" rx="40" ry="30" fill={isDark ? "rgba(0,230,118,0.04)" : "rgba(0,180,80,0.04)"} stroke={neon} strokeWidth="0.8" strokeOpacity="0.1" />
              <circle cx="110" cy="110" r="5" fill={neon} style={{ filter: isDark ? "drop-shadow(0 0 8px #00e676)" : undefined }} />
            </svg>
          </div>
          <div className="space-y-2">
            {LOCATION_DATA.map((l, i) => (
              <div key={l.country} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TRAFFIC_COLORS[i % TRAFFIC_COLORS.length] }} />
                  <span style={{ color: textMuted }}>{l.country}</span>
                </div>
                <span className="font-bold" style={{ color: textPrimary }}>{l.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Devices */}
        <div className="gp-card p-5 flex flex-col">
          <h2 className="font-bold text-sm mb-4" style={{ color: textPrimary }}>Dispositivos</h2>
          <div className="flex flex-col items-center gap-4 flex-1">
            <div className="relative" style={{ width: 140, height: 140 }}>
              <svg width={140} height={140} viewBox="0 0 140 140">
                {(() => {
                  const cx = 70, cy = 70, rOut = 62, rIn = 42;
                  const colors = isDark ? ["#00e676","#00b248","#004d1a"] : ["#00a84f","#4caf50","#81c784"];
                  let angle = -Math.PI / 2;
                  const total = DEVICE_DATA.reduce((s, d) => s + d.value, 0);
                  return DEVICE_DATA.map((seg, i) => {
                    const sweep = (seg.value / total) * 2 * Math.PI;
                    const end = angle + sweep;
                    const x1o = cx + rOut * Math.cos(angle), y1o = cy + rOut * Math.sin(angle);
                    const x2o = cx + rOut * Math.cos(end), y2o = cy + rOut * Math.sin(end);
                    const x1i = cx + rIn * Math.cos(end), y1i = cy + rIn * Math.sin(end);
                    const x2i = cx + rIn * Math.cos(angle), y2i = cy + rIn * Math.sin(angle);
                    const la = sweep > Math.PI ? 1 : 0;
                    const d = `M${x1o} ${y1o} A${rOut} ${rOut} 0 ${la} 1 ${x2o} ${y2o} L${x1i} ${y1i} A${rIn} ${rIn} 0 ${la} 0 ${x2i} ${y2i}Z`;
                    const el = <path key={i} d={d} fill={colors[i]}
                      style={{ filter: i === 0 && isDark ? `drop-shadow(0 0 6px ${colors[i]})` : undefined }} />;
                    angle = end + 0.025;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Monitor className="w-5 h-5" style={{ color: neon }} />
              </div>
            </div>
            <div className="w-full space-y-2.5">
              {DEVICE_DATA.map((d, i) => {
                const Icon = d.icon;
                const colors = isDark ? ["#00e676","#00b248","#004d1a"] : ["#00a84f","#4caf50","#81c784"];
                return (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <Icon className="w-4 h-4 shrink-0" style={{ color: colors[i] }} />
                    <span className="flex-1" style={{ color: textMuted }}>{d.name}</span>
                    <span className="font-bold" style={{ color: textPrimary }}>{d.value}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="gp-card p-5">
          <h2 className="font-bold text-sm mb-4" style={{ color: textPrimary }}>Top Produtos</h2>
          {topLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) =>
              <Skeleton key={i} className="h-8 rounded" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
            )}</div>
          ) : topProds && topProds.length > 0 ? (
            <div className="space-y-3">
              {topProds.map((p) => {
                const maxRev = topProds[0]?.revenue ?? 1;
                const pct = Math.max(6, (p.revenue / maxRev) * 100);
                return (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="text-xs font-black w-4 shrink-0 number-display" style={{ color: neon }}>{p.rank}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate mb-1" style={{ color: textPrimary }}>{p.name}</div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${neon}, color-mix(in srgb, ${neon} 70%, black))` }} />
                      </div>
                    </div>
                    <span className="text-xs font-bold shrink-0 number-display" style={{ color: neon, minWidth: 72, textAlign: "right" }}>
                      {formatCurrency(p.revenue)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-center py-8" style={{ color: textMuted }}>Nenhum produto ainda</div>
          )}
        </div>
      </div>

      {/* Wallet summary bar */}
      <div className="gp-card p-4 flex flex-col lg:flex-row items-start lg:items-center gap-4">
        {walletLoading ? (
          <Skeleton className="h-12 w-full rounded-lg" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
        ) : wallet ? (
          <>
            {[
              { label: "Saldo Disponível", value: formatCurrency(wallet.available), icon: Wallet, highlight: true },
              { label: "A Receber", value: formatCurrency(wallet.pending), icon: Clock, highlight: false },
              { label: "Total a Receber", value: formatCurrency(wallet.total), icon: Layers, highlight: false },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 flex-1 w-full lg:w-auto">
                  {i > 0 && <div className="hidden lg:block w-px h-10 shrink-0" style={{ background: borderColor }} />}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: item.highlight ? `${neon}15` : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                        border: `1px solid ${item.highlight ? `${neon}30` : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                      }}>
                      <Icon className="w-5 h-5" style={{ color: item.highlight ? neon : textMuted }} />
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: textMuted }}>{item.label}</div>
                      <div className="text-base font-extrabold number-display" style={{ color: textPrimary }}>{item.value}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 ml-1" style={{ color: item.highlight ? neon + "80" : textMuted + "60" }} />
                  </div>
                </div>
              );
            })}
            <button
              className="gp-btn w-full lg:w-auto px-7 py-3 rounded-xl text-sm flex items-center justify-center gap-2 shrink-0"
              onClick={() => setLocation("/withdrawals")}
            >
              <Wallet className="w-4 h-4" />
              Sacar Agora
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function DollarSignIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <DollarSign className={className} style={style} />;
}

function DollarSign({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
