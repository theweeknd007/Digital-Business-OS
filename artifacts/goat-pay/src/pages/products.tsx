import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

type ProductType = "digital" | "physical" | "subscription" | "course" | "mentoring" | "event" | "community";
type ProductStatus = "active" | "inactive" | "draft";

const TYPE_LABELS: Record<string, string> = {
  digital: "Digital",
  physical: "Físico",
  subscription: "Assinatura",
  course: "Curso",
  mentoring: "Mentoria",
  event: "Evento",
  community: "Comunidade",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-primary/10 text-primary border border-primary/20",
  inactive: "bg-muted text-muted-foreground border border-border",
  draft: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
};

type FormData = {
  name: string;
  description: string;
  type: ProductType;
  price: number;
  status: ProductStatus;
};

export default function Products() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: products, isLoading } = useListProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const form = useForm<FormData>({
    defaultValues: { name: "", description: "", type: "digital", price: 0, status: "active" },
  });

  function openCreate() {
    setEditId(null);
    form.reset({ name: "", description: "", type: "digital", price: 0, status: "active" });
    setOpen(true);
  }

  function openEdit(p: NonNullable<typeof products>[0]) {
    setEditId(p.id);
    form.reset({ name: p.name, description: p.description ?? "", type: p.type as ProductType, price: p.price, status: p.status as ProductStatus });
    setOpen(true);
  }

  function onSubmit(data: FormData) {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
    if (editId !== null) {
      updateProduct.mutate(
        { id: editId, data: { ...data, price: Number(data.price) } },
        { onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Produto atualizado" }); } }
      );
    } else {
      createProduct.mutate(
        { data: { ...data, price: Number(data.price) } },
        { onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Produto criado" }); } }
      );
    }
  }

  function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    deleteProduct.mutate(
      { id },
      { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); toast({ title: "Produto excluído" }); } }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie todos os seus produtos e ofertas.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produto</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Tipo</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preço</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Vendas</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Receita</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="px-5 py-4" colSpan={7}><Skeleton className="h-6 w-full" /></td>
                </tr>
              ))
            ) : products && products.length > 0 ? (
              products.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Package className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{p.name}</div>
                        {p.description && <div className="text-xs text-muted-foreground truncate max-w-xs">{p.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">{TYPE_LABELS[p.type] ?? p.type}</span>
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-foreground">{formatCurrency(p.price)}</td>
                  <td className="px-5 py-4 text-right text-muted-foreground hidden lg:table-cell">{p.sales.toLocaleString("pt-BR")}</td>
                  <td className="px-5 py-4 text-right font-semibold text-primary hidden lg:table-cell">{formatCurrency(p.revenue)}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[p.status] ?? ""}`}>
                      {p.status === "active" ? "Ativo" : p.status === "inactive" ? "Inativo" : "Rascunho"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p>Nenhum produto cadastrado ainda.</p>
                  <button onClick={openCreate} className="mt-3 text-primary text-sm hover:underline">Criar primeiro produto</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>{editId !== null ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome *</label>
              <input {...form.register("name", { required: true })} className="mt-1.5 w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" placeholder="Ex: Método Escalapay" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</label>
              <textarea {...form.register("description")} rows={2} className="mt-1.5 w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none" placeholder="Descreva seu produto..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</label>
                <select {...form.register("type")} className="mt-1.5 w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors">
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                <select {...form.register("status")} className="mt-1.5 w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors">
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="draft">Rascunho</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preço (R$) *</label>
              <input type="number" step="0.01" min="0" {...form.register("price", { required: true, min: 0 })} className="mt-1.5 w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" placeholder="0,00" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 border border-border rounded-lg py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={createProduct.isPending || updateProduct.isPending} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                {editId !== null ? "Salvar" : "Criar Produto"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
