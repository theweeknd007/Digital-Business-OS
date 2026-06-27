import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListSales, useRefundSale, getListSalesQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { ShoppingCart, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  completed: { bg: "rgba(0,230,118,0.1)", text: "#00e676", border: "rgba(0,230,118,0.3)", label: "Aprovado" },
  pending:   { bg: "rgba(255,183,0,0.1)", text: "#ffb700", border: "rgba(255,183,0,0.3)", label: "Pendente" },
  refunded:  { bg: "rgba(255,255,255,0.05)", text: "rgba(255,255,255,0.4)", border: "rgba(255,255,255,0.1)", label: "Reembolsado" },
  chargeback:{ bg: "rgba(244,67,54,0.1)", text: "#f44336", border: "rgba(244,67,54,0.3)", label: "Chargeback" },
};

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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const { data: sales, isLoading } = useListSales({ status: statusFilter || undefined });
  const refundSale = useRefundSale();

  function handleRefund(id: number) {
    if (!confirm("Confirmar reembolso desta venda?")) return;
    refundSale.mutate({ id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListSalesQueryKey() }); toast({ title: "Reembolso solicitado" }); } });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Vendas</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Histórico completo de transações.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
            style={statusFilter === f.value
              ? { background: "#00e676", color: "#000", boxShadow: "0 0 12px rgba(0,230,118,0.4)" }
              : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="glow-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,230,118,0.1)", background: "rgba(0,230,118,0.03)" }}>
              {["Cliente", "Produto", "Valor", "Pagamento", "Status", "Data", ""].map((h, i) => (
                <th key={i} className={`px-5 py-3 text-xs font-bold uppercase tracking-wider ${i === 2 ? "text-right" : "text-left"} ${[3,5].includes(i) ? "hidden lg:table-cell" : ""} ${i === 1 ? "hidden md:table-cell" : ""}`}
                  style={{ color: "rgba(255,255,255,0.35)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td colSpan={7} className="px-5 py-4"><Skeleton className="h-5 w-full rounded" style={{ background: "rgba(255,255,255,0.04)" }} /></td>
              </tr>
            )) : sales && sales.length > 0 ? sales.map((s) => {
              const st = STATUS_STYLES[s.status] ?? STATUS_STYLES.pending;
              return (
                <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,230,118,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-white">{s.customerName}</div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{s.customerEmail}</div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-sm truncate max-w-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{s.productName}</td>
                  <td className="px-5 py-4 text-right font-bold number-display" style={{ color: "#00e676" }}>{formatCurrency(s.amount)}</td>
                  <td className="px-5 py-4 text-center hidden lg:table-cell">
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                      {METHOD_LABELS[s.paymentMethod] ?? s.paymentMethod}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>{st.label}</span>
                  </td>
                  <td className="px-5 py-4 text-right text-xs hidden lg:table-cell" style={{ color: "rgba(255,255,255,0.4)" }}>{formatDate(s.createdAt)}</td>
                  <td className="px-5 py-4">
                    {s.status === "completed" && (
                      <button onClick={() => handleRefund(s.id)} title="Reembolsar"
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ffb700"; (e.currentTarget as HTMLElement).style.background = "rgba(255,183,0,0.1)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)"; (e.currentTarget as HTMLElement).style.background = ""; }}>
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={7} className="px-5 py-20 text-center">
                <ShoppingCart className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(0,230,118,0.2)" }} />
                <p style={{ color: "rgba(255,255,255,0.3)" }}>Nenhuma venda encontrada.</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
