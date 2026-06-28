import { useQueryClient } from "@tanstack/react-query";
import { useListWithdrawals, useApproveWithdrawal, getListWithdrawalsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { CheckCircle, ArrowDownToLine, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

export default function Withdrawals() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const neon = isDark ? "#00e676" : "#00a84f";
  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const borderColor = isDark ? "rgba(0,230,118,0.15)" : "rgba(0,0,0,0.08)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
    pending:   { bg: "rgba(255,183,0,0.1)", text: "#ffb700", border: "rgba(255,183,0,0.3)", label: "Pendente" },
    approved:  { bg: `${neon}15`, text: neon, border: `${neon}40`, label: "Aprovado" },
    rejected:  { bg: "rgba(244,67,54,0.1)", text: "#f44336", border: "rgba(244,67,54,0.3)", label: "Rejeitado" },
    completed: { bg: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", text: textMuted, border: inputBorder, label: "Concluído" },
  };

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: withdrawals, isLoading } = useListWithdrawals();
  const approve = useApproveWithdrawal();

  function handleApprove(id: number) {
    approve.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
        toast({ title: "Saque aprovado com sucesso" });
      },
    });
  }

  const totalPending = (withdrawals ?? []).filter(w => w.status === "pending").reduce((s, w) => s + w.amount, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: textPrimary }}>Saques</h1>
        <p className="text-sm mt-0.5" style={{ color: textMuted }}>Histórico e gestão de solicitações de saque.</p>
      </div>

      {/* Summary */}
      {(withdrawals ?? []).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total de Saques", value: (withdrawals ?? []).length.toString(), icon: ArrowDownToLine },
            { label: "Aguardando Aprovação", value: (withdrawals ?? []).filter(w => w.status === "pending").length.toString(), icon: Clock },
            { label: "Valor Pendente", value: formatCurrency(totalPending), icon: ArrowDownToLine },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="gp-card p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${neon}12`, border: `1px solid ${neon}30` }}>
                <Icon className="w-5 h-5" style={{ color: neon }} />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: textMuted }}>{label}</div>
                <div className="text-xl font-extrabold number-display mt-0.5" style={{ color: textPrimary }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="gp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[540px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}`, background: isDark ? "rgba(0,230,118,0.02)" : "rgba(0,0,0,0.02)" }}>
                {["ID", "Valor", "Data", "Banco", "Status", "Ação"].map((h, i) => (
                  <th key={i} className={`px-5 py-3 text-xs font-bold uppercase tracking-wider text-left
                    ${i === 1 ? "text-right" : ""}
                    ${i === 3 ? "hidden md:table-cell" : ""}`}
                    style={{ color: textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${borderColor}` }}>
                  <td colSpan={6} className="px-5 py-4">
                    <Skeleton className="h-6 w-full rounded" style={{ background: inputBg }} />
                  </td>
                </tr>
              )) : (withdrawals ?? []).length > 0 ? (withdrawals ?? []).map((w) => {
                const st = STATUS_STYLES[w.status] ?? STATUS_STYLES.pending;
                return (
                  <tr key={w.id} className="transition-colors" style={{ borderBottom: `1px solid ${borderColor}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(0,230,118,0.02)" : "rgba(0,0,0,0.015)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono px-2 py-1 rounded-lg" style={{ background: inputBg, color: textMuted }}>#{w.id}</span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold number-display" style={{ color: neon }}>{formatCurrency(w.amount)}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: textMuted }}>{formatDate(w.createdAt)}</td>
                    <td className="px-5 py-4 hidden md:table-cell text-sm" style={{ color: textMuted }}>
                      {(w as any).bankInfo ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>{st.label}</span>
                    </td>
                    <td className="px-5 py-4">
                      {w.status === "pending" && (
                        <button onClick={() => handleApprove(w.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          style={{ background: `${neon}15`, color: neon, border: `1px solid ${neon}30` }}>
                          <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} className="px-5 py-20 text-center">
                  <ArrowDownToLine className="w-12 h-12 mx-auto mb-3" style={{ color: `${neon}30` }} />
                  <p style={{ color: textMuted }}>Nenhum saque solicitado ainda.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
