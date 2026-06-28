import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetWalletSummary, useListTransactions, useRequestWithdrawal,
  getListWithdrawalsQueryKey, getGetWalletSummaryQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon, Plus, Clock, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

const TX_TYPE_LABELS: Record<string, string> = {
  sale: "Venda", refund: "Reembolso", withdrawal: "Saque", fee: "Taxa", bonus: "Bônus",
};

export default function WalletPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const neon = isDark ? "#00e676" : "#00a84f";
  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const borderColor = isDark ? "rgba(0,230,118,0.15)" : "rgba(0,0,0,0.08)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const surface = isDark ? "hsl(135,20%,5%)" : "#fff";

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: wallet, isLoading: walletLoading } = useGetWalletSummary();
  const { data: txs, isLoading: txLoading } = useListTransactions();
  const requestWithdrawal = useRequestWithdrawal();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");

  function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    requestWithdrawal.mutate({ data: { amount: val, pixKey: "pix@goatpay.com" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetWalletSummaryQueryKey() });
        toast({ title: "Solicitação de saque enviada" });
        setOpen(false); setAmount("");
      },
    });
  }

  const walletCards = wallet ? [
    { label: "Saldo Disponível", value: formatCurrency(wallet.available), icon: WalletIcon, accent: true },
    { label: "A Receber", value: formatCurrency(wallet.pending), icon: Clock, accent: false },
    { label: "Total a Receber", value: formatCurrency(wallet.total), icon: Layers, accent: false },
  ] : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: textPrimary }}>Carteira</h1>
          <p className="text-sm mt-0.5" style={{ color: textMuted }}>Saldo, extratos e movimentações financeiras.</p>
        </div>
        <button onClick={() => setOpen(true)}
          className="gp-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Solicitar Saque
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {walletLoading ? Array.from({ length: 3 }).map((_, i) =>
          <Skeleton key={i} className="h-28 rounded-xl" style={{ background: inputBg }} />
        ) : walletCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="gp-card p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: textMuted }}>{card.label}</span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: card.accent ? `${neon}15` : inputBg, border: `1px solid ${card.accent ? `${neon}30` : borderColor}` }}>
                  <Icon className="w-4 h-4" style={{ color: card.accent ? neon : textMuted }} />
                </div>
              </div>
              <span className="text-2xl font-extrabold number-display" style={{ color: textPrimary }}>{card.value}</span>
              {card.accent && (
                <button onClick={() => setOpen(true)}
                  className="text-xs font-semibold self-start" style={{ color: neon }}>
                  Sacar agora →
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Transactions */}
      <div className="gp-card overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <h2 className="font-bold text-sm" style={{ color: textPrimary }}>Extrato de Movimentações</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[540px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}`, background: isDark ? "rgba(0,230,118,0.02)" : "rgba(0,0,0,0.02)" }}>
                {["Tipo", "Descrição", "Data", "Valor"].map((h, i) => (
                  <th key={i}
                    className={`px-5 py-3 text-xs font-bold uppercase tracking-wider text-left ${i === 3 ? "text-right" : ""} ${i === 1 ? "hidden md:table-cell" : ""}`}
                    style={{ color: textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${borderColor}` }}>
                  <td colSpan={4} className="px-5 py-4">
                    <Skeleton className="h-6 w-full rounded" style={{ background: inputBg }} />
                  </td>
                </tr>
              )) : (txs ?? []).length > 0 ? (txs ?? []).map((tx) => {
                const isCredit = tx.type === "sale" || tx.type === "bonus";
                return (
                  <tr key={tx.id} className="transition-colors" style={{ borderBottom: `1px solid ${borderColor}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(0,230,118,0.02)" : "rgba(0,0,0,0.015)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: isCredit ? `${neon}12` : "rgba(244,67,54,0.1)" }}>
                          {isCredit
                            ? <ArrowDownLeft className="w-4 h-4" style={{ color: neon }} />
                            : <ArrowUpRight className="w-4 h-4" style={{ color: "#f44336" }} />}
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full"
                          style={{ background: inputBg, color: textMuted }}>
                          {TX_TYPE_LABELS[tx.type] ?? tx.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-sm" style={{ color: textMuted }}>
                      {tx.description}
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: textMuted }}>{formatDate(tx.createdAt)}</td>
                    <td className="px-5 py-4 text-right font-bold number-display"
                      style={{ color: isCredit ? neon : "#f44336" }}>
                      {isCredit ? "+" : "−"}{formatCurrency(Math.abs(tx.amount))}
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={4} className="px-5 py-20 text-center">
                  <WalletIcon className="w-12 h-12 mx-auto mb-3" style={{ color: `${neon}30` }} />
                  <p style={{ color: textMuted }}>Nenhuma movimentação ainda.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawal Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ background: surface, border: `1px solid ${borderColor}`, maxWidth: 400 }}>
          <DialogHeader>
            <DialogTitle style={{ color: textPrimary }}>Solicitar Saque</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleWithdraw} className="space-y-4 mt-3">
            {wallet && (
              <div className="p-4 rounded-xl text-sm" style={{ background: `${neon}10`, border: `1px solid ${neon}30` }}>
                <span style={{ color: textMuted }}>Disponível: </span>
                <span className="font-bold number-display" style={{ color: neon }}>{formatCurrency(wallet.available)}</span>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: textMuted }}>
                Valor do saque (R$)
              </label>
              <input
                type="number" step="0.01" min="1" max={wallet?.available}
                value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: `1px solid ${inputBorder}`, color: textMuted, background: inputBg }}>
                Cancelar
              </button>
              <button type="submit" disabled={requestWithdrawal.isPending}
                className="flex-1 gp-btn py-2.5 rounded-xl text-sm font-bold disabled:opacity-50">
                Confirmar Saque
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
