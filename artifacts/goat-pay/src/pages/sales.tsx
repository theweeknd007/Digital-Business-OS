import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListSales, useRefundSale, getListSalesQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  ShoppingCart, RotateCcw, Search, Download,
  TrendingUp, DollarSign, CheckCircle2, AlertCircle,
  Calendar, ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

const METHOD_LABELS: Record<string, string> = {
  pix: "PIX", credit_card: "Cartão", boleto: "Boleto", international: "Internacional",
};

const STATUS_FILTER = [
  { value: "", label: "Todas" },
  { value: "completed", label: "Aprovadas" },
  { value: "pending", label: "Pendentes" },
  { value: "refunded", label: "Reembolsadas" },
  { value: "chargeback", label: "Chargeback" },
];

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "Todo período" },
  { value: "today", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
];

export default function Sales() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const neon = isDark ? "#00e676" : "#00a84f";
  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const borderColor = isDark ? "rgba(0,230,118,0.15)" : "rgba(0,0,0,0.08)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
    completed:  { bg: `${neon}15`, text: neon, border: `${neon}40`, label: "Aprovado" },
    pending:    { bg: "rgba(255,183,0,0.1)", text: "#ffb700", border: "rgba(255,183,0,0.3)", label: "Pendente" },
    refunded:   { bg: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", text: textMuted, border: inputBorder, label: "Reembolsado" },
    chargeback: { bg: "rgba(244,67,54,0.1)", text: "#f44336", border: "rgba(244,67,54,0.3)", label: "Chargeback" },
  };

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: sales, isLoading } = useListSales();
  const refundSale = useRefundSale();
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [dateMenuOpen, setDateMenuOpen] = useState(false);

  function handleRefund(id: number) {
    if (!confirm("Confirmar reembolso desta venda?")) return;
    refundSale.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSalesQueryKey() });
        toast({ title: "Reembolso processado" });
      },
    });
  }

  function exportCSV() {
    if (!filtered || filtered.length === 0) return;
    const header = ["ID","Comprador","E-mail","Produto","Valor","Método","Status","Data"];
    const rows = filtered.map((s) => [
      s.id, `"${s.customerName}"`, s.customerEmail,
      `"${s.productName}"`, s.amount.toFixed(2),
      METHOD_LABELS[s.paymentMethod] ?? s.paymentMethod,
      s.status, formatDate(s.createdAt),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `vendas_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: "✅ CSV exportado com sucesso!" });
  }

  function isInRange(dateStr: string) {
    if (dateRange === "all") return true;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 86400000;
    if (dateRange === "today") return diff < 1;
    if (dateRange === "7d") return diff < 7;
    if (dateRange === "30d") return diff < 30;
    if (dateRange === "90d") return diff < 90;
    return true;
  }

  const filtered = useMemo(() => (sales ?? [])
    .filter((s) => !filter || s.status === filter)
    .filter((s) => !search || s.customerName.toLowerCase().includes(search.toLowerCase()) || s.productName.toLowerCase().includes(search.toLowerCase()))
    .filter((s) => isInRange(s.createdAt)),
    [sales, filter, search, dateRange]
  );

  // Totals
  const totals = useMemo(() => {
    const all = filtered;
    return {
      revenue: all.filter((s) => s.status === "completed").reduce((t, s) => t + s.amount, 0),
      count: all.filter((s) => s.status === "completed").length,
      pending: all.filter((s) => s.status === "pending").reduce((t, s) => t + s.amount, 0),
      refunded: all.filter((s) => s.status === "refunded").reduce((t, s) => t + s.amount, 0),
    };
  }, [filtered]);

  const activeDateLabel = DATE_RANGE_OPTIONS.find((d) => d.value === dateRange)?.label ?? "Todo período";

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: textPrimary }}>Pedidos</h1>
          <p className="text-sm mt-0.5" style={{ color: textMuted }}>Histórico completo de vendas e transações</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0"
          style={{ background: inputBg, color: textMuted, border: `1px solid ${inputBorder}` }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = neon;
            (e.currentTarget as HTMLElement).style.borderColor = neon + "50";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = textMuted;
            (e.currentTarget as HTMLElement).style.borderColor = inputBorder;
          }}>
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* ─── Totals Bar ─── */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Receita Aprovada", value: formatCurrency(totals.revenue), icon: TrendingUp, color: neon },
            { label: "Vendas Aprovadas", value: totals.count.toLocaleString("pt-BR"), icon: CheckCircle2, color: "#69f0ae" },
            { label: "A Confirmar", value: formatCurrency(totals.pending), icon: DollarSign, color: "#ffab40" },
            { label: "Reembolsado", value: formatCurrency(totals.refunded), icon: AlertCircle, color: "#f44336" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="gp-card p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${item.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: textMuted }}>
                    {item.label}
                  </div>
                  <div className="text-sm font-extrabold number-display" style={{ color: item.color }}>
                    {item.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Filters ─── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textMuted }} />
          <input
            placeholder="Buscar cliente ou produto..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} />
        </div>

        {/* Date range picker */}
        <div className="relative">
          <button
            onClick={() => setDateMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: dateRange !== "all" ? `${neon}15` : inputBg,
              color: dateRange !== "all" ? neon : textMuted,
              border: `1px solid ${dateRange !== "all" ? neon + "50" : inputBorder}`,
            }}>
            <Calendar className="w-3.5 h-3.5" />
            {activeDateLabel}
            <ChevronDown className="w-3 h-3" />
          </button>
          {dateMenuOpen && (
            <div
              className="absolute right-0 top-11 z-50 rounded-xl overflow-hidden shadow-xl w-48"
              style={{
                background: isDark ? "hsl(135,25%,6%)" : "#fff",
                border: `1px solid ${borderColor}`,
                boxShadow: isDark ? "0 20px 60px rgba(0,0,0,0.7)" : "0 10px 40px rgba(0,0,0,0.12)",
              }}>
              {DATE_RANGE_OPTIONS.map((opt, i) => (
                <button
                  key={opt.value}
                  onClick={() => { setDateRange(opt.value); setDateMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-sm transition-all"
                  style={{
                    color: dateRange === opt.value ? neon : textMuted,
                    background: dateRange === opt.value ? `${neon}10` : "transparent",
                    borderBottom: i < DATE_RANGE_OPTIONS.length - 1 ? `1px solid ${borderColor}` : "none",
                    fontWeight: dateRange === opt.value ? 700 : 400,
                  }}
                  onMouseEnter={(e) => { if (dateRange !== opt.value) (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"; }}
                  onMouseLeave={(e) => { if (dateRange !== opt.value) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status filters */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTER.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={filter === f.value
                ? { background: `${neon}20`, color: neon, border: `1px solid ${neon}50` }
                : { background: inputBg, color: textMuted, border: `1px solid ${inputBorder}` }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="gp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}`, background: isDark ? "rgba(0,230,118,0.02)" : "rgba(0,0,0,0.02)" }}>
                {["Comprador", "Produto", "Valor", "Método", "Data", "Status", ""].map((h, i) => (
                  <th key={i}
                    className={`px-5 py-3 text-left text-xs font-bold uppercase tracking-wider
                      ${i === 3 ? "hidden md:table-cell" : ""}
                      ${i === 4 ? "hidden lg:table-cell" : ""}
                      ${i === 2 ? "text-right" : ""}`}
                    style={{ color: textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${borderColor}` }}>
                  <td colSpan={7} className="px-5 py-4">
                    <Skeleton className="h-6 w-full rounded"
                      style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
                  </td>
                </tr>
              )) : filtered.length > 0 ? filtered.map((s) => {
                const st = STATUS_STYLES[s.status] ?? STATUS_STYLES.pending;
                return (
                  <tr key={s.id} className="transition-colors"
                    style={{ borderBottom: `1px solid ${borderColor}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(0,230,118,0.02)" : "rgba(0,0,0,0.015)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black"
                          style={{ background: `${neon}15`, color: neon, border: `1px solid ${neon}25` }}>
                          {s.customerName?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <div className="font-medium text-sm" style={{ color: textPrimary }}>{s.customerName}</div>
                          <div className="text-xs" style={{ color: textMuted }}>{s.customerEmail}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-sm truncate max-w-[180px]" style={{ color: textPrimary }}>{s.productName}</div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="font-bold number-display" style={{ color: s.status === "refunded" ? textMuted : neon }}>
                        {formatCurrency(s.amount)}
                      </span>
                    </td>

                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: textMuted }}>
                        {METHOD_LABELS[s.paymentMethod] ?? s.paymentMethod}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm hidden lg:table-cell" style={{ color: textMuted }}>
                      {formatDate(s.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                        {st.label}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {s.status === "completed" && (
                        <button onClick={() => handleRefund(s.id)}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ color: textMuted }}
                          title="Reembolsar"
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.color = "#ffb700";
                            (e.currentTarget as HTMLElement).style.background = "rgba(255,183,0,0.1)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.color = textMuted;
                            (e.currentTarget as HTMLElement).style.background = "";
                          }}>
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-5 py-20 text-center">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3" style={{ color: `${neon}30` }} />
                    <p className="font-medium mb-1" style={{ color: textPrimary }}>Nenhuma venda encontrada</p>
                    <p className="text-sm" style={{ color: textMuted }}>Tente outros filtros ou períodos</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with count */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 flex items-center justify-between text-xs"
            style={{ borderTop: `1px solid ${borderColor}` }}>
            <span style={{ color: textMuted }}>
              {filtered.length} {filtered.length === 1 ? "pedido" : "pedidos"} encontrado{filtered.length !== 1 ? "s" : ""}
            </span>
            <span style={{ color: neon, fontWeight: 700 }}>
              Total: {formatCurrency(totals.revenue)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
