import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

const TYPE_LABELS: Record<string, string> = {
  digital: "Digital", physical: "Físico", subscription: "Assinatura",
  course: "Curso", mentoring: "Mentoria", event: "Evento", community: "Comunidade",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  active:   { bg: "rgba(0,230,118,0.1)",  text: "#00e676", border: "rgba(0,230,118,0.3)",  label: "Ativo" },
  inactive: { bg: "rgba(255,255,255,0.05)", text: "rgba(255,255,255,0.4)", border: "rgba(255,255,255,0.1)", label: "Inativo" },
  draft:    { bg: "rgba(255,183,0,0.1)",   text: "#ffb700", border: "rgba(255,183,0,0.3)", label: "Rascunho" },
};

type FormData = { name: string; description: string; type: string; price: number; status: string };

function InputField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
        style={{ color: "rgba(255,255,255,0.4)" }}>{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition-colors"
  + " bg-transparent border focus:border-[#00e676]";
const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "white" };

export default function Products() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: products, isLoading } = useListProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const form = useForm<FormData>({ defaultValues: { name: "", description: "", type: "digital", price: 0, status: "active" } });

  function openCreate() { setEditId(null); form.reset({ name: "", description: "", type: "digital", price: 0, status: "active" }); setOpen(true); }
  function openEdit(p: NonNullable<typeof products>[0]) { setEditId(p.id); form.reset({ name: p.name, description: p.description ?? "", type: p.type, price: p.price, status: p.status }); setOpen(true); }
  function onSubmit(data: FormData) {
    const inv = () => queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
    const opts = { onSuccess: () => { inv(); setOpen(false); toast({ title: editId !== null ? "Produto atualizado" : "Produto criado" }); } };
    if (editId !== null) updateProduct.mutate({ id: editId, data: { ...data, price: Number(data.price) } }, opts);
    else createProduct.mutate({ data: { ...data, price: Number(data.price) } }, opts);
  }
  function handleDelete(id: number) {
    if (!confirm("Excluir este produto?")) return;
    deleteProduct.mutate({ id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); toast({ title: "Produto excluído" }); } });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Produtos</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Gerencie todos os seus produtos e ofertas.</p>
        </div>
        <button onClick={openCreate} className="glow-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black">
          <Plus className="w-4 h-4" /> Novo Produto
        </button>
      </div>

      <div className="glow-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,230,118,0.1)", background: "rgba(0,230,118,0.03)" }}>
              {["Produto", "Tipo", "Preço", "Vendas", "Receita", "Status", ""].map((h, i) => (
                <th key={i} className={`px-5 py-3 text-left text-xs font-bold uppercase tracking-wider ${i >= 3 && i <= 4 ? "hidden lg:table-cell text-right" : i === 2 ? "text-right" : ""} ${i === 1 ? "hidden md:table-cell" : ""}`}
                  style={{ color: "rgba(255,255,255,0.35)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td colSpan={7} className="px-5 py-4"><Skeleton className="h-6 w-full rounded" style={{ background: "rgba(255,255,255,0.04)" }} /></td>
              </tr>
            )) : products && products.length > 0 ? products.map((p) => {
              const st = STATUS_STYLES[p.status] ?? STATUS_STYLES.inactive;
              return (
                <tr key={p.id} className="transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,230,118,0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)" }}>
                        <Package className="w-4 h-4" style={{ color: "#00e676" }} />
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm">{p.name}</div>
                        {p.description && <div className="text-xs truncate max-w-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{p.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                      {TYPE_LABELS[p.type] ?? p.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-white number-display">{formatCurrency(p.price)}</td>
                  <td className="px-5 py-4 text-right hidden lg:table-cell" style={{ color: "rgba(255,255,255,0.5)" }}>{p.sales.toLocaleString("pt-BR")}</td>
                  <td className="px-5 py-4 text-right font-bold hidden lg:table-cell number-display" style={{ color: "#00e676" }}>{formatCurrency(p.revenue)}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>{st.label}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg transition-all"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "white"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; (e.currentTarget as HTMLElement).style.background = ""; }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg transition-all"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f44336"; (e.currentTarget as HTMLElement).style.background = "rgba(244,67,54,0.1)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; (e.currentTarget as HTMLElement).style.background = ""; }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={7} className="px-5 py-20 text-center">
                <Package className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(0,230,118,0.2)" }} />
                <p style={{ color: "rgba(255,255,255,0.3)" }}>Nenhum produto cadastrado ainda.</p>
                <button onClick={openCreate} className="mt-3 text-sm font-semibold" style={{ color: "#00e676" }}>Criar primeiro produto</button>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ background: "hsl(135,20%,6%)", border: "1px solid rgba(0,230,118,0.2)", color: "white" }} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{editId !== null ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <InputField label="Nome *">
              <input {...form.register("name", { required: true })} className={inputCls} style={inputStyle} placeholder="Ex: Método Escalapay" />
            </InputField>
            <InputField label="Descrição">
              <textarea {...form.register("description")} rows={2} className={inputCls + " resize-none"} style={inputStyle} placeholder="Descreva seu produto..." />
            </InputField>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Tipo">
                <select {...form.register("type")} className={inputCls} style={inputStyle}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </InputField>
              <InputField label="Status">
                <select {...form.register("status")} className={inputCls} style={inputStyle}>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="draft">Rascunho</option>
                </select>
              </InputField>
            </div>
            <InputField label="Preço (R$) *">
              <input type="number" step="0.01" min="0" {...form.register("price", { required: true })} className={inputCls} style={inputStyle} placeholder="0,00" />
            </InputField>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>Cancelar</button>
              <button type="submit" disabled={createProduct.isPending || updateProduct.isPending}
                className="flex-1 glow-btn py-2.5 rounded-xl text-sm font-bold text-black disabled:opacity-50">
                {editId !== null ? "Salvar" : "Criar Produto"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
