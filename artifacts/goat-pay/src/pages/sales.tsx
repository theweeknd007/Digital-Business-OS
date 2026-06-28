import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListSales, useRefundSale, getListSalesQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { ShoppingCart, RotateCcw, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

const METHOD_LABELS: Record<string, string> = {
  pix: "PIX", credit_card: "Cartão", boleto: "Boleto", international: "Internacional",
};

const FILTERS = [
  { value: "", label: "Todas" },
  { value: "completed", label: "Aprovadas" },
  { value: "pending", label: "Pendentes" },
  { value: "refunded", label: "Reembolsadas" },
  { value: "chargeback", label: "Chargeback" },
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

  function handleRefund(id: number) {
    if (!confirm("Confirmar reembolso desta venda?")) return;
    refundSale.mutate({ id }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListSalesQueryKey() }); toast({ title: "Reembolso processado" }); },
    });
  }

  const filtered = (sales ?? [])
    .filter((s) => !filter || s.status === filter)
    .filter((s) => !search || s.customerName.toLowerCase().includes(search.toLowerCase()) || s.productName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: textPrimary }}>Pedidos</h1>
        <p className="text-sm mt-0.5" style={{ color: textMuted }}>Histórico completo de vendas e transações.</p>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textMuted }} />
          <input
            placeholder="Buscar cliente ou produto..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
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

      {/* Table */}
      <div className="gp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}`, background: isDark ? "rgba(0,230,118,0.02)" : "rgba(0,0,0,0.02)" }}>
                {["Comprador", "Produto", "Valor", "Método", "Data", "Status", ""].map((h, i) => (
                  <th key={i} className={`px-5 py-3 text-left text-xs font-bold uppercase tracking-wider
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
                    <Skeleton className="h-6 w-full rounded" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
                  </td>
                </tr>
              )) : filtered.length > 0 ? filtered.map((s) => {
                const st = STATUS_STYLES[s.status] ?? STATUS_STYLES.pending;
                return (
                  <tr key={s.id} className="transition-colors" style={{ borderBottom: `1px solid ${borderColor}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(0,230,118,0.02)" : "rgba(0,0,0,0.015)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                    <td className="px-5 py-4">
                      <div className="font-medium text-sm" style={{ color: textPrimary }}>{s.customerName}</div>
                      <div className="text-xs" style={{ color: textMuted }}>{s.customerEmail}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm truncate max-w-[180px]" style={{ color: textPrimary }}>{s.productName}</div>
                    </td>
                    <td className="px-5 py-4 text-right font-bold number-display" style={{ color: neon }}>{formatCurrency(s.amount)}</td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: textMuted }}>
                        {METHOD_LABELS[s.paymentMethod] ?? s.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm hidden lg:table-cell" style={{ color: textMuted }}>{formatDate(s.createdAt)}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>{st.label}</span>
                    </td>
                    <td className="px-5 py-4">
                      {s.status === "completed" && (
                        <button onClick={() => handleRefund(s.id)}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ color: textMuted }}
                          title="Reembolsar"
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ffb700"; (e.currentTarget as HTMLElement).style.background = "rgba(255,183,0,0.1)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = textMuted; (e.currentTarget as HTMLElement).style.background = ""; }}>
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} className="px-5 py-20 text-center">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3" style={{ color: `${neon}30` }} />
                  <p style={{ color: textMuted }}>Nenhuma venda encontrada.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
