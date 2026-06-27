import { useQueryClient } from "@tanstack/react-query";
import {
  useListWithdrawals,
  useApproveWithdrawal,
  getListWithdrawalsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { CheckCircle, ArrowDownToLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_STYLES: Record<string, { cls: string; label: string }> = {
  pending:  { cls: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20", label: "Pendente" },
  approved: { cls: "bg-primary/10 text-primary border border-primary/20", label: "Aprovado" },
  paid:     { cls: "bg-primary/20 text-primary border border-primary/30", label: "Pago" },
  rejected: { cls: "bg-destructive/10 text-destructive border border-destructive/20", label: "Rejeitado" },
};

export default function Withdrawals() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: withdrawals, isLoading } = useListWithdrawals();
  const approveWithdrawal = useApproveWithdrawal();

  function handleApprove(id: number) {
    if (!confirm("Aprovar este saque?")) return;
    approveWithdrawal.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
          toast({ title: "Saque aprovado!" });
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saques</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerenciamento de solicitações de saque.</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Chave PIX</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Data</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="px-5 py-4" colSpan={6}><Skeleton className="h-5 w-full" /></td>
                </tr>
              ))
            ) : withdrawals && withdrawals.length > 0 ? (
              withdrawals.map((w) => {
                const st = STATUS_STYLES[w.status] ?? STATUS_STYLES.pending;
                return (
                  <tr key={w.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-4 text-muted-foreground font-mono text-xs">#{w.id.toString().padStart(6, "0")}</td>
                    <td className="px-5 py-4 text-right font-bold text-primary">{formatCurrency(w.amount)}</td>
                    <td className="px-5 py-4 text-muted-foreground font-mono text-xs hidden md:table-cell truncate max-w-xs">{w.pixKey}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-5 py-4 text-right text-muted-foreground text-xs hidden lg:table-cell">{formatDate(w.createdAt)}</td>
                    <td className="px-5 py-4">
                      {w.status === "pending" && (
                        <button
                          onClick={() => handleApprove(w.id)}
                          disabled={approveWithdrawal.isPending}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Aprovar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-muted-foreground">
                  <ArrowDownToLine className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma solicitação de saque.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
