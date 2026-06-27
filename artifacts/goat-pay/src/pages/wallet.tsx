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
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

const TX_STYLES: Record<string, { credit: boolean; label: string }> = {
  credit:     { credit: true,  label: "Crédito" },
  commission: { credit: true,  label: "Comissão" },
  debit:      { credit: false, label: "Débito" },
  withdrawal: { credit: false, label: "Saque" },
  refund:     { credit: false, label: "Reembolso" },
};

type WithdrawForm = { amount: number; pixKey: string; notes: string };

const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "white" };
const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition-colors";

export default function WalletPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: wallet, isLoading: walletLoading } = useGetWalletSummary();
  const { data: transactions, isLoading: txLoading } = useListTransactions();
  const requestWithdrawal = useRequestWithdrawal();
  const [open, setOpen] = useState(false);
  const form = useForm<WithdrawForm>({ defaultValues: { amount: 0, pixKey: "", notes: "" } });

  function onSubmit(data: WithdrawForm) {
    requestWithdrawal.mutate({ data: { amount: Number(data.amount), pixKey: data.pixKey, notes: data.notes } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetWalletSummaryQueryKey() });
        setOpen(false); form.reset();
        toast({ title: "Saque solicitado com sucesso!" });
      },
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Carteira</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Saldo e extrato financeiro.</p>
        </div>
        <button onClick={() => setOpen(true)} className="glow-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black">
          <Plus className="w-4 h-4" /> Solicitar Saque
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {walletLoading ? Array.from({ length: 3 }).map((_, i) =>
          <Skeleton key={i} className="h-28 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
        ) : wallet ? (
          <>
            <div className="glow-card-active rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <WalletIcon className="w-4 h-4" style={{ color: "#00e676" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>Saldo Disponível</span>
              </div>
              <div className="text-3xl font-extrabold number-display" style={{ color: "#00e676", textShadow: "0 0 20px rgba(0,230,118,0.3)" }}>
                {formatCurrency(wallet.available)}
              </div>
              <div className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>Disponível para saque imediato</div>
            </div>
            <div className="glow-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>A Receber</span>
              </div>
              <div className="text-3xl font-extrabold text-white number-display">{formatCurrency(wallet.pending)}</div>
              <div className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>Em processamento</div>
            </div>
            <div className="glow-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>Total a Receber</span>
              </div>
              <div className="text-3xl font-extrabold text-white number-display">{formatCurrency(wallet.total)}</div>
              <div className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>Soma de todos os saldos</div>
            </div>
          </>
        ) : null}
      </div>

      {/* Transactions */}
      <div className="glow-card rounded-xl overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(0,230,118,0.1)" }}>
          <h2 className="font-bold text-sm text-white">Extrato Detalhado</h2>
        </div>
        <div>
          {txLoading ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <Skeleton className="h-5 w-full rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
          )) : transactions && transactions.length > 0 ? transactions.map((tx) => {
            const style = TX_STYLES[tx.type] ?? TX_STYLES.credit;
            const Icon = style.credit ? ArrowDownLeft : ArrowUpRight;
            return (
              <div key={tx.id} className="px-5 py-4 flex items-center gap-4 transition-colors"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,230,118,0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: style.credit ? "rgba(0,230,118,0.1)" : "rgba(244,67,54,0.1)",
                    border: `1px solid ${style.credit ? "rgba(0,230,118,0.25)" : "rgba(244,67,54,0.25)"}`,
                  }}>
                  <Icon className="w-4 h-4" style={{ color: style.credit ? "#00e676" : "#f44336" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm">{tx.description}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{formatDate(tx.createdAt)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-sm number-display" style={{ color: style.credit ? "#00e676" : "#f44336" }}>
                    {style.credit ? "+" : "-"}{formatCurrency(Math.abs(tx.amount))}
                  </div>
                  {tx.balance !== undefined && tx.balance !== null && (
                    <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                      Saldo: {formatCurrency(tx.balance)}
                    </div>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="px-5 py-20 text-center">
              <WalletIcon className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(0,230,118,0.2)" }} />
              <p style={{ color: "rgba(255,255,255,0.3)" }}>Nenhuma transação ainda.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ background: "hsl(135,20%,6%)", border: "1px solid rgba(0,230,118,0.2)", color: "white" }} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Solicitar Saque</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Valor (R$) *</label>
              <input type="number" step="0.01" min="1" {...form.register("amount", { required: true })} className={inputCls} style={inputStyle} placeholder="0,00" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Chave PIX *</label>
              <input {...form.register("pixKey", { required: true })} className={inputCls} style={inputStyle} placeholder="CPF, e-mail, celular ou chave aleatória" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Observações</label>
              <textarea {...form.register("notes")} rows={2} className={inputCls + " resize-none"} style={inputStyle} placeholder="Opcional..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>Cancelar</button>
              <button type="submit" disabled={requestWithdrawal.isPending} className="flex-1 glow-btn py-2.5 rounded-xl text-sm font-bold text-black disabled:opacity-50">Solicitar Saque</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
