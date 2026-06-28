import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { Plus, Pencil, Trash2, Package, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

const TYPE_LABELS: Record<string, string> = {
  digital: "Digital", physical: "Físico", subscription: "Assinatura",
  course: "Curso", mentoring: "Mentoria", event: "Evento", community: "Comunidade",
};

type FormData = { name: string; description: string; type: string; price: number; status: string };

export default function Products() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const neon = isDark ? "#00e676" : "#00a84f";
  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const surface = isDark ? "hsl(135,20%,5%)" : "#fff";
  const borderColor = isDark ? "rgba(0,230,118,0.15)" : "rgba(0,0,0,0.08)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
    active:   { bg: `${neon}15`, text: neon, border: `${neon}40`, label: "Ativo" },
    inactive: { bg: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", text: textMuted, border: inputBorder, label: "Inativo" },
    draft:    { bg: "rgba(255,183,0,0.1)", text: "#ffb700", border: "rgba(255,183,0,0.3)", label: "Rascunho" },
  };

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: products, isLoading } = useListProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
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

  const filtered = (products ?? []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all";
  const inputStyle = { background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary };
  const inputFocusBorder = `1px solid ${neon}60`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: textPrimary }}>Produtos</h1>
          <p className="text-sm mt-0.5" style={{ color: textMuted }}>Gerencie todos os seus produtos e ofertas.</p>
        </div>
        <button onClick={openCreate} className="gp-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Novo Produto
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textMuted }} />
        <input
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
        />
      </div>

      {/* Table */}
      <div className="gp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}`, background: isDark ? "rgba(0,230,118,0.02)" : "rgba(0,0,0,0.02)" }}>
                {["Produto", "Tipo", "Preço", "Vendas", "Receita", "Status", ""].map((h, i) => (
                  <th key={i} className={`px-5 py-3 text-left text-xs font-bold uppercase tracking-wider
                    ${i >= 3 && i <= 4 ? "hidden lg:table-cell text-right" : ""}
                    ${i === 2 ? "text-right" : ""}
                    ${i === 1 ? "hidden md:table-cell" : ""}`}
                    style={{ color: textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${borderColor}` }}>
                  <td colSpan={7} className="px-5 py-4">
                    <Skeleton className="h-6 w-full rounded" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
                  </td>
                </tr>
              )) : filtered.length > 0 ? filtered.map((p) => {
                const st = STATUS_STYLES[p.status] ?? STATUS_STYLES.inactive;
                return (
                  <tr key={p.id} className="transition-colors"
                    style={{ borderBottom: `1px solid ${borderColor}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(0,230,118,0.025)" : "rgba(0,0,0,0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${neon}12`, border: `1px solid ${neon}30` }}>
                          <Package className="w-4 h-4" style={{ color: neon }} />
                        </div>
                        <div>
                          <div className="font-semibold text-sm" style={{ color: textPrimary }}>{p.name}</div>
                          {p.description && <div className="text-xs truncate max-w-xs" style={{ color: textMuted }}>{p.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: textMuted }}>
                        {TYPE_LABELS[p.type] ?? p.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold number-display" style={{ color: textPrimary }}>{formatCurrency(p.price)}</td>
                    <td className="px-5 py-4 text-right hidden lg:table-cell" style={{ color: textMuted }}>{p.sales.toLocaleString("pt-BR")}</td>
                    <td className="px-5 py-4 text-right font-bold hidden lg:table-cell number-display" style={{ color: neon }}>{formatCurrency(p.revenue)}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>{st.label}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg transition-all"
                          style={{ color: textMuted }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = textPrimary; (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = textMuted; (e.currentTarget as HTMLElement).style.background = ""; }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg transition-all"
                          style={{ color: textMuted }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f44336"; (e.currentTarget as HTMLElement).style.background = "rgba(244,67,54,0.1)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = textMuted; (e.currentTarget as HTMLElement).style.background = ""; }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} className="px-5 py-20 text-center">
                  <Package className="w-12 h-12 mx-auto mb-3" style={{ color: `${neon}30` }} />
                  <p style={{ color: textMuted }}>
                    {search ? "Nenhum produto encontrado." : "Nenhum produto cadastrado ainda."}
                  </p>
                  {!search && (
                    <button onClick={openCreate} className="mt-3 text-sm font-semibold" style={{ color: neon }}>
                      Criar primeiro produto →
                    </button>
                  )}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ background: surface, border: `1px solid ${borderColor}`, color: textPrimary, maxWidth: 460 }}>
          <DialogHeader>
            <DialogTitle style={{ color: textPrimary }}>{editId !== null ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {[
              { label: "Nome *", field: "name" as const, placeholder: "Ex: Mentoria Elite" },
            ].map(({ label, field, placeholder }) => (
              <div key={field}>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: textMuted }}>{label}</label>
                <input {...form.register(field, { required: true })} className={inputCls} style={inputStyle} placeholder={placeholder}
                  onFocus={(e) => (e.target.style.border = inputFocusBorder)}
                  onBlur={(e) => (e.target.style.border = `1px solid ${inputBorder}`)} />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: textMuted }}>Descrição</label>
              <textarea {...form.register("description")} rows={2} className={inputCls + " resize-none"} style={inputStyle}
                placeholder="Descreva seu produto..."
                onFocus={(e) => (e.target.style.border = inputFocusBorder)}
                onBlur={(e) => (e.target.style.border = `1px solid ${inputBorder}`)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Tipo", field: "type" as const, options: Object.entries(TYPE_LABELS) },
                { label: "Status", field: "status" as const, options: [["active","Ativo"],["inactive","Inativo"],["draft","Rascunho"]] },
              ].map(({ label, field, options }) => (
                <div key={field}>
                  <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: textMuted }}>{label}</label>
                  <select {...form.register(field)} className={inputCls} style={inputStyle}>
                    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: textMuted }}>Preço (R$) *</label>
              <input type="number" step="0.01" min="0" {...form.register("price", { required: true })}
                className={inputCls} style={inputStyle} placeholder="0,00"
                onFocus={(e) => (e.target.style.border = inputFocusBorder)}
                onBlur={(e) => (e.target.style.border = `1px solid ${inputBorder}`)} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ border: `1px solid ${inputBorder}`, color: textMuted, background: inputBg }}>
                Cancelar
              </button>
              <button type="submit" disabled={createProduct.isPending || updateProduct.isPending}
                className="flex-1 gp-btn py-2.5 rounded-xl text-sm font-bold disabled:opacity-50">
                {editId !== null ? "Salvar" : "Criar Produto"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
