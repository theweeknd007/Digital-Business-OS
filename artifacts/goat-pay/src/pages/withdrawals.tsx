import { useQueryClient } from "@tanstack/react-query";
import { useListWithdrawals, useApproveWithdrawal, getListWithdrawalsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { CheckCircle, ArrowDownToLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  pending:  { bg: "rgba(255,183,0,0.1)", text: "#ffb700", border: "rgba(255,183,0,0.3)", label: "Pendente" },
  approved: { bg: "rgba(0,230,118,0.1)", text: "#00e676", border: "rgba(0,230,118,0.3)", label: "Aprovado" },
  paid:     { bg: "rgba(0,230,118,0.15)", text: "#00e676", border: "rgba(0,230,118,0.4)", label: "Pago" },
  rejected: { bg: "rgba(244,67,54,0.1)", text: "#f44336", border: "rgba(244,67,54,0.3)", label: "Rejeitado" },
};

export default function Withdrawals() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: withdrawals, isLoading } = useListWithdrawals();
  const approveWithdrawal = useApproveWithdrawal();

  function handleApprove(id: number) {
    if (!confirm("Aprovar este saque?")) return;
    approveWithdrawal.mutate({ id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() }); toast({ title: "Saque aprovado!" }); } });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Saques</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Gerenciamento de solicitações de saque.</p>
      </div>

      <div className="glow-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,230,118,0.1)", background: "rgba(0,230,118,0.03)" }}>
              {["ID", "Valor", "Chave PIX", "Status", "Data", ""].map((h, i) => (
                <th key={i} className={`px-5 py-3 text-xs font-bold uppercase tracking-wider ${i === 1 ? "text-right" : "text-left"} ${i === 2 ? "hidden md:table-cell" : ""} ${i === 4 ? "hidden lg:table-cell" : ""}`}
                  style={{ color: "rgba(255,255,255,0.35)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td colSpan={6} className="px-5 py-4"><Skeleton className="h-5 w-full rounded" style={{ background: "rgba(255,255,255,0.04)" }} /></td>
              </tr>
            )) : withdrawals && withdrawals.length > 0 ? withdrawals.map((w) => {
              const st = STATUS_STYLES[w.status] ?? STATUS_STYLES.pending;
              return (
                <tr key={w.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,230,118,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                  <td className="px-5 py-4 font-mono text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    #{w.id.toString().padStart(6, "0")}
                  </td>
                  <td className="px-5 py-4 text-right font-bold number-display" style={{ color: "#00e676" }}>{formatCurrency(w.amount)}</td>
                  <td className="px-5 py-4 hidden md:table-cell font-mono text-xs truncate max-w-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{w.pixKey}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>{st.label}</span>
                  </td>
                  <td className="px-5 py-4 text-right text-xs hidden lg:table-cell" style={{ color: "rgba(255,255,255,0.4)" }}>{formatDate(w.createdAt)}</td>
                  <td className="px-5 py-4">
                    {w.status === "pending" && (
                      <button onClick={() => handleApprove(w.id)} disabled={approveWithdrawal.isPending}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-50"
                        style={{ background: "rgba(0,230,118,0.1)", color: "#00e676", border: "1px solid rgba(0,230,118,0.3)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,230,118,0.2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,230,118,0.1)")}>
                        <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                      </button>
                    )}
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={6} className="px-5 py-20 text-center">
                <ArrowDownToLine className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(0,230,118,0.2)" }} />
                <p style={{ color: "rgba(255,255,255,0.3)" }}>Nenhuma solicitação de saque.</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
