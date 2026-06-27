import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetWalletSummary,
  useListTransactions,
  useRequestWithdrawal,
  getListWithdrawalsQueryKey,
  getGetWalletSummaryQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

const TX_STYLES: Record<string, { icon: typeof ArrowUpRight; cls: string }> = {
  credit:     { icon: ArrowDownLeft, cls: "text-primary" },
  debit:      { icon: ArrowUpRight,  cls: "text-destructive" },
  withdrawal: { icon: ArrowUpRight,  cls: "text-yellow-400" },
  refund:     { icon: ArrowUpRight,  cls: "text-destructive" },
  commission: { icon: ArrowDownLeft, cls: "text-primary" },
};

type WithdrawForm = { amount: number; pixKey: string; notes: string };

export default function WalletPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: wallet, isLoading: walletLoading } = useGetWalletSummary();
  const { data: transactions, isLoading: txLoading } = useListTransactions();
  const requestWithdrawal = useRequestWithdrawal();
  const [open, setOpen] = useState(false);

  const form = useForm<WithdrawForm>({ defaultValues: { amount: 0, pixKey: "", notes: "" } });

  function onSubmit(data: WithdrawForm) {
    requestWithdrawal.mutate(
      { data: { amount: Number(data.amount), pixKey: data.pixKey, notes: data.notes } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetWalletSummaryQueryKey() });
          setOpen(false);
          form.reset();
          toast({ title: "Saque solicitado com sucesso!" });
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Carteira</h1>
          <p className="text-muted-foreground text-sm mt-1">Saldo e extrato financeiro.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Solicitar Saque
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {walletLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : wallet ? (
          <>
            <div className="bg-card border border-primary/30 rounded-xl p-5">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Saldo Disponível</div>
              <div className="text-3xl font-bold text-primary">{formatCurrency(wallet.available)}</div>
              <div className="text-xs text-muted-foreground mt-1">Disponível para saque imediato</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">A Receber</div>
              <div className="text-3xl font-bold text-foreground">{formatCurrency(wallet.pending)}</div>
              <div className="text-xs text-muted-foreground mt-1">Em processamento</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Total a Receber</div>
              <div className="text-3xl font-bold text-foreground">{formatCurrency(wallet.total)}</div>
              <div className="text-xs text-muted-foreground mt-1">Soma de todos os saldos</div>
            </div>
          </>
        ) : null}
      </div>

      {/* Transactions */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">Extrato Detalhado</h2>
        </div>
        <div className="divide-y divide-border/50">
          {txLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-5 py-4"><Skeleton className="h-5 w-full" /></div>
            ))
          ) : transactions && transactions.length > 0 ? (
            transactions.map((tx) => {
              const style = TX_STYLES[tx.type] ?? TX_STYLES.credit;
              const Icon = style.icon;
              const isCredit = tx.type === "credit" || tx.type === "commission";
              return (
                <div key={tx.id} className="px-5 py-4 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${isCredit ? "border-primary/30 bg-primary/10" : "border-destructive/30 bg-destructive/10"}`}>
                    <Icon className={`w-4 h-4 ${style.cls}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm">{tx.description}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-bold text-sm ${style.cls}`}>
                      {isCredit ? "+" : "-"}{formatCurrency(Math.abs(tx.amount))}
                    </div>
                    {tx.balance !== undefined && tx.balance !== null && (
                      <div className="text-xs text-muted-foreground">Saldo: {formatCurrency(tx.balance)}</div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-5 py-16 text-center text-muted-foreground">
              <WalletIcon className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>Nenhuma transação ainda.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Saque</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor (R$) *</label>
              <input type="number" step="0.01" min="1" {...form.register("amount", { required: true, min: 1 })} className="mt-1.5 w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" placeholder="0,00" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chave PIX *</label>
              <input {...form.register("pixKey", { required: true })} className="mt-1.5 w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" placeholder="CPF, e-mail, celular ou chave aleatória" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Observações</label>
              <textarea {...form.register("notes")} rows={2} className="mt-1.5 w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none" placeholder="Opcional..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 border border-border rounded-lg py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={requestWithdrawal.isPending} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                Solicitar Saque
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
