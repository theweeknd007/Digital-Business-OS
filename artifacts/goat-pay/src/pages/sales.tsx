import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListSales,
  useRefundSale,
  getListSalesQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { ShoppingCart, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_STYLES: Record<string, { cls: string; label: string }> = {
  completed: { cls: "bg-primary/10 text-primary border border-primary/20", label: "Aprovado" },
  pending: { cls: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20", label: "Pendente" },
  refunded: { cls: "bg-muted text-muted-foreground border border-border", label: "Reembolsado" },
  chargeback: { cls: "bg-destructive/10 text-destructive border border-destructive/20", label: "Chargeback" },
};

const METHOD_LABELS: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão",
  boleto: "Boleto",
  international: "Internacional",
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
    refundSale.mutate(
      { id },
      { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListSalesQueryKey() }); toast({ title: "Reembolso solicitado" }); } }
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vendas</h1>
        <p className="text-muted-foreground text-sm mt-1">Histórico completo de transações.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === f.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Produto</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Pagamento</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Data</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="px-5 py-4" colSpan={7}><Skeleton className="h-5 w-full" /></td>
                </tr>
              ))
            ) : sales && sales.length > 0 ? (
              sales.map((s) => {
                const st = STATUS_STYLES[s.status] ?? STATUS_STYLES.pending;
                return (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-foreground">{s.customerName}</div>
                      <div className="text-xs text-muted-foreground">{s.customerEmail}</div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground hidden md:table-cell truncate max-w-xs">{s.productName}</td>
                    <td className="px-5 py-4 text-right font-bold text-primary">{formatCurrency(s.amount)}</td>
                    <td className="px-5 py-4 text-center hidden lg:table-cell">
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">{METHOD_LABELS[s.paymentMethod] ?? s.paymentMethod}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-5 py-4 text-right text-muted-foreground text-xs hidden lg:table-cell">{formatDate(s.createdAt)}</td>
                    <td className="px-5 py-4">
                      {s.status === "completed" && (
                        <button onClick={() => handleRefund(s.id)} title="Reembolsar" className="p-1.5 rounded-md text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma venda encontrada.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
