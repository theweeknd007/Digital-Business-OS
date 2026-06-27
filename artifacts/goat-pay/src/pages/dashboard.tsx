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
import {
  TrendingUp, TrendingDown, Wallet, Clock, Layers,
  Monitor, Smartphone, Tablet, ArrowRight,
} from "lucide-react";

const TRAFFIC_COLORS = ["#00e676", "#00c853", "#69f0ae", "#1b5e20", "#777"];

const DEVICE_DATA = [
  { name: "Desktop", value: 58.3, icon: Monitor },
  { name: "Mobile", value: 36.7, icon: Smartphone },
  { name: "Tablet", value: 5.0, icon: Tablet },
];
const DEVICE_COLORS = ["#00e676", "#00b248", "#004d1a"];

const LOCATION_DATA = [
  { country: "Brasil", pct: 82.6, color: "#00e676" },
  { country: "Portugal", pct: 6.1, color: "#00c853" },
  { country: "Estados Unidos", pct: 3.2, color: "#69f0ae" },
  { country: "Espanha", pct: 2.7, color: "#1b5e20" },
  { country: "Outros", pct: 5.4, color: "#555" },
];

function GrowthBadge({ value }: { value: number }) {
  const pos = value >= 0;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold mt-1"
      style={{ color: pos ? "#00e676" : "#f44336" }}>
      {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {pos ? "+" : ""}{value.toFixed(1)}%
      <span className="hidden sm:inline" style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>vs mês anterior</span>
    </span>
  );
}

function KpiCard({ label, value, growth }: { label: string; value: string; growth: number }) {
  return (
    <div className="glow-card rounded-xl p-4 flex flex-col gap-1 transition-all duration-200">
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
      <span className="text-xl font-extrabold text-white number-display leading-tight mt-1">{value}</span>
      <GrowthBadge value={growth} />
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "hsl(135,20%,7%)", border: "1px solid rgba(0,230,118,0.3)", borderRadius: 8,
        padding: "8px 12px", fontSize: 12,
      }}>
        <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>{label}</div>
        <div style={{ color: "#00e676", fontWeight: 700 }}>{formatCurrency(payload[0].value)}</div>
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: summary, isLoading: sumLoading } = useGetDashboardSummary();
  const { data: chart, isLoading: chartLoading } = useGetRevenueChart();
  const { data: traffic, isLoading: trafficLoading } = useGetTrafficSources();
  const { data: topProds, isLoading: topLoading } = useGetTopProducts();
  const { data: wallet, isLoading: walletLoading } = useGetWalletSummary();

  const totalSalesForDonut = summary?.totalSales ?? 0;

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Olá, SKILL!</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Bem-vindo ao seu painel de controle.</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          <span className="w-2 h-2 rounded-full inline-block animate-pulse" style={{ background: "#00e676", boxShadow: "0 0 6px #00e676" }} />
          Última atualização: <span className="text-white">Agora há pouco</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {sumLoading ? Array.from({ length: 5 }).map((_, i) =>
          <Skeleton key={i} className="h-24 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
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

      {/* Revenue + Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glow-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm text-white">Receita nos últimos 30 dias</h2>
            <span className="text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ background: "rgba(0,230,118,0.08)", color: "#00e676", border: "1px solid rgba(0,230,118,0.2)" }}>
              Últimos 30 dias
            </span>
          </div>
          {chartLoading ? (
            <Skeleton className="h-52 w-full rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }} />
          ) : chart && chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chart} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e676" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00e676" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => {
                    const d = new Date(v + "T00:00:00");
                    return `${String(d.getDate()).padStart(2, "0")} ${["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][d.getMonth()]}`;
                  }}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}K` : `R$${v}`}
                  width={52}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone" dataKey="revenue"
                  stroke="#00e676" strokeWidth={3}
                  fill="url(#revGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#00e676", stroke: "#fff", strokeWidth: 2, filter: "drop-shadow(0 0 8px #00e676)" }}
                  style={{ filter: "drop-shadow(0 0 6px rgba(0,230,118,0.6))" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Sem dados ainda</div>
          )}
        </div>

        {/* Traffic Sources */}
        <div className="glow-card rounded-xl p-5 flex flex-col">
          <h2 className="font-bold text-sm text-white mb-4">Fontes de Tráfego</h2>
          {trafficLoading ? (
            <Skeleton className="flex-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }} />
          ) : traffic && traffic.length > 0 ? (
            <div className="flex flex-col items-center gap-4 flex-1">
              <div className="relative shrink-0" style={{ width: 168, height: 168 }}>
                <svg width={168} height={168} viewBox="0 0 168 168">
                  {(() => {
                    const cx = 84, cy = 84, r_out = 76, r_in = 52;
                    let startAngle = -Math.PI / 2;
                    const total = traffic.reduce((s, t) => s + t.percentage, 0);
                    return traffic.map((seg, i) => {
                      const angle = (seg.percentage / total) * 2 * Math.PI;
                      const endAngle = startAngle + angle;
                      const x1o = cx + r_out * Math.cos(startAngle);
                      const y1o = cy + r_out * Math.sin(startAngle);
                      const x2o = cx + r_out * Math.cos(endAngle);
                      const y2o = cy + r_out * Math.sin(endAngle);
                      const x1i = cx + r_in * Math.cos(endAngle);
                      const y1i = cy + r_in * Math.sin(endAngle);
                      const x2i = cx + r_in * Math.cos(startAngle);
                      const y2i = cy + r_in * Math.sin(startAngle);
                      const largeArc = angle > Math.PI ? 1 : 0;
                      const d = [
                        `M ${x1o} ${y1o}`,
                        `A ${r_out} ${r_out} 0 ${largeArc} 1 ${x2o} ${y2o}`,
                        `L ${x1i} ${y1i}`,
                        `A ${r_in} ${r_in} 0 ${largeArc} 0 ${x2i} ${y2i}`,
                        "Z",
                      ].join(" ");
                      const color = TRAFFIC_COLORS[i % TRAFFIC_COLORS.length];
                      const el = (
                        <path key={i} d={d} fill={color}
                          style={{ filter: i === 0 ? `drop-shadow(0 0 8px ${color})` : undefined }}
                        />
                      );
                      startAngle = endAngle + 0.03;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-white number-display leading-tight">{totalSalesForDonut.toLocaleString("pt-BR")}</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Vendas</span>
                </div>
              </div>
              <div className="w-full space-y-2">
                {traffic.map((s, i) => (
                  <div key={s.source} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: TRAFFIC_COLORS[i % TRAFFIC_COLORS.length], boxShadow: `0 0 4px ${TRAFFIC_COLORS[i % TRAFFIC_COLORS.length]}` }} />
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>{s.source}</span>
                    </div>
                    <span className="font-bold text-white">{s.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Sem dados</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Location */}
        <div className="glow-card rounded-xl p-5">
          <h2 className="font-bold text-sm text-white mb-4">Vendas por Localização</h2>
          <div className="rounded-lg mb-4 overflow-hidden flex items-center justify-center"
            style={{ background: "rgba(0,230,118,0.04)", border: "1px solid rgba(0,230,118,0.08)", height: 100 }}>
            <svg viewBox="0 0 400 200" className="w-full h-full opacity-60" style={{ fill: "none" }}>
              <ellipse cx="100" cy="95" rx="55" ry="40" fill="rgba(0,230,118,0.15)" stroke="rgba(0,230,118,0.4)" strokeWidth="1" />
              <ellipse cx="205" cy="80" rx="45" ry="35" fill="rgba(0,230,118,0.08)" stroke="rgba(0,230,118,0.2)" strokeWidth="1" />
              <ellipse cx="285" cy="75" rx="30" ry="28" fill="rgba(0,230,118,0.08)" stroke="rgba(0,230,118,0.2)" strokeWidth="1" />
              <ellipse cx="340" cy="90" rx="40" ry="30" fill="rgba(0,230,118,0.06)" stroke="rgba(0,230,118,0.15)" strokeWidth="1" />
              <ellipse cx="310" cy="140" rx="20" ry="15" fill="rgba(0,230,118,0.06)" stroke="rgba(0,230,118,0.15)" strokeWidth="1" />
              <circle cx="115" cy="115" r="6" fill="#00e676" style={{ filter: "drop-shadow(0 0 8px #00e676)" }} />
            </svg>
          </div>
          <div className="space-y-2">
            {LOCATION_DATA.map((l) => (
              <div key={l.country} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: l.color, boxShadow: `0 0 4px ${l.color}` }} />
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>{l.country}</span>
                </div>
                <span className="font-bold text-white">{l.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Devices */}
        <div className="glow-card rounded-xl p-5 flex flex-col">
          <h2 className="font-bold text-sm text-white mb-4">Dispositivos</h2>
          <div className="flex flex-col items-center gap-4 flex-1">
            <div className="relative shrink-0" style={{ width: 148, height: 148 }}>
              <svg width={148} height={148} viewBox="0 0 148 148">
                {(() => {
                  const cx = 74, cy = 74, r_out = 65, r_in = 45;
                  let startAngle = -Math.PI / 2;
                  const total = DEVICE_DATA.reduce((s, d) => s + d.value, 0);
                  return DEVICE_DATA.map((seg, i) => {
                    const angle = (seg.value / total) * 2 * Math.PI;
                    const endAngle = startAngle + angle;
                    const x1o = cx + r_out * Math.cos(startAngle);
                    const y1o = cy + r_out * Math.sin(startAngle);
                    const x2o = cx + r_out * Math.cos(endAngle);
                    const y2o = cy + r_out * Math.sin(endAngle);
                    const x1i = cx + r_in * Math.cos(endAngle);
                    const y1i = cy + r_in * Math.sin(endAngle);
                    const x2i = cx + r_in * Math.cos(startAngle);
                    const y2i = cy + r_in * Math.sin(startAngle);
                    const largeArc = angle > Math.PI ? 1 : 0;
                    const d = [
                      `M ${x1o} ${y1o}`,
                      `A ${r_out} ${r_out} 0 ${largeArc} 1 ${x2o} ${y2o}`,
                      `L ${x1i} ${y1i}`,
                      `A ${r_in} ${r_in} 0 ${largeArc} 0 ${x2i} ${y2i}`,
                      "Z",
                    ].join(" ");
                    const color = DEVICE_COLORS[i];
                    const el = (
                      <path key={i} d={d} fill={color}
                        style={{ filter: i === 0 ? `drop-shadow(0 0 8px ${color})` : undefined }}
                      />
                    );
                    startAngle = endAngle + 0.03;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <Monitor className="w-6 h-6" style={{ color: "#00e676", filter: "drop-shadow(0 0 8px #00e676)" }} />
              </div>
            </div>
            <div className="w-full space-y-2.5">
              {DEVICE_DATA.map((d, i) => {
                const Icon = d.icon;
                return (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <Icon className="w-4 h-4 shrink-0" style={{ color: DEVICE_COLORS[i] }} />
                    <span className="flex-1" style={{ color: "rgba(255,255,255,0.6)" }}>{d.name}</span>
                    <span className="font-bold text-white">{d.value}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="glow-card rounded-xl p-5">
          <h2 className="font-bold text-sm text-white mb-4">Top Produtos</h2>
          {topLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) =>
              <Skeleton key={i} className="h-7 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            )}</div>
          ) : topProds && topProds.length > 0 ? (
            <div className="space-y-3">
              {topProds.map((p) => {
                const maxRev = topProds[0]?.revenue ?? 1;
                const pct = Math.max(8, (p.revenue / maxRev) * 100);
                return (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="text-xs font-black w-4 shrink-0" style={{ color: "#00e676" }}>{p.rank}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white truncate mb-1">{p.name}</div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #00e676, #00c853)", boxShadow: "0 0 6px rgba(0,230,118,0.4)" }} />
                      </div>
                    </div>
                    <span className="text-xs font-bold shrink-0 number-display" style={{ color: "#00e676", minWidth: 76, textAlign: "right" }}>
                      {formatCurrency(p.revenue)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.3)" }}>Nenhum produto ainda</div>
          )}
        </div>
      </div>

      {/* GOAT-PAY Banner */}
      <div className="rounded-xl overflow-hidden flex items-center justify-between px-6 py-4"
        style={{
          background: "linear-gradient(135deg, rgba(0,40,20,0.9) 0%, rgba(0,15,8,0.95) 100%)",
          border: "1px solid rgba(0,230,118,0.25)",
          boxShadow: "0 0 40px rgba(0,230,118,0.08) inset",
        }}>
        <div className="flex items-center gap-4">
          <img src="/goat-logo.png" alt="GOAT" className="w-12 h-12 object-contain logo-glow" />
          <div>
            <div className="text-lg font-black glow-text tracking-widest">GOAT-PAY</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Powered by SKILL / ESCALAPAY / HOTMART</div>
          </div>
        </div>
        <button className="glow-btn px-5 py-2 rounded-lg text-sm font-bold text-black" onClick={() => setLocation("/products")}>
          Saiba mais
        </button>
      </div>

      {/* Wallet Bar */}
      <div className="rounded-xl px-6 py-4 flex items-center gap-4"
        style={{ background: "hsl(135,20%,5%)", border: "1px solid rgba(0,230,118,0.15)" }}>
        {walletLoading ? (
          <div className="flex-1"><Skeleton className="h-10 w-full rounded" style={{ background: "rgba(255,255,255,0.04)" }} /></div>
        ) : wallet ? (
          <>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 pulse-green"
                style={{ background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.2)" }}>
                <Wallet className="w-5 h-5" style={{ color: "#00e676" }} />
              </div>
              <div>
                <div className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>Saldo Disponível</div>
                <div className="text-base font-extrabold text-white number-display">{formatCurrency(wallet.available)}</div>
              </div>
              <ArrowRight className="w-4 h-4 ml-1" style={{ color: "rgba(0,230,118,0.4)" }} />
            </div>
            <div className="w-px h-10 shrink-0" style={{ background: "rgba(0,230,118,0.1)" }} />
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Clock className="w-5 h-5" style={{ color: "rgba(255,255,255,0.5)" }} />
              </div>
              <div>
                <div className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>A Receber</div>
                <div className="text-base font-extrabold text-white number-display">{formatCurrency(wallet.pending)}</div>
              </div>
              <ArrowRight className="w-4 h-4 ml-1" style={{ color: "rgba(255,255,255,0.15)" }} />
            </div>
            <div className="w-px h-10 shrink-0" style={{ background: "rgba(0,230,118,0.1)" }} />
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Layers className="w-5 h-5" style={{ color: "rgba(255,255,255,0.5)" }} />
              </div>
              <div>
                <div className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>Total a Receber</div>
                <div className="text-base font-extrabold text-white number-display">{formatCurrency(wallet.total)}</div>
              </div>
              <ArrowRight className="w-4 h-4 ml-1" style={{ color: "rgba(255,255,255,0.15)" }} />
            </div>
            <button className="glow-btn px-7 py-3 rounded-xl text-sm font-extrabold text-black shrink-0 flex items-center gap-2"
              onClick={() => setLocation("/withdrawals")}>
              <Wallet className="w-4 h-4" />
              Sacar Agora
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
