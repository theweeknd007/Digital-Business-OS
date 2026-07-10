import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import {
  Plus, Search, Filter, LayoutGrid, List,
  Star, MoreVertical, ShoppingCart, Link2,
  Copy, Archive, Pencil, Trash2, Package,
  QrCode, ExternalLink, X, Check, Tag,
  DollarSign, FileText, Video, Image as ImageIcon,
  TrendingUp, TrendingDown, Layers, RefreshCw,
  Smartphone, Box, ChevronDown,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

const TYPE_LABELS: Record<string, string> = {
  digital: "Digital", physical: "Físico", subscription: "Assinatura",
  course: "Curso", mentoring: "Mentoria", event: "Evento", community: "Comunidade",
};
const TYPE_COLORS: Record<string, string> = {
  digital: "#40c4ff", physical: "#ffd740", subscription: "#e040fb",
  course: "#69f0ae", mentoring: "#ffab40", event: "#ff6e40", community: "#40c4ff",
};

type FormData = {
  name: string; description: string; type: string;
  price: number; status: string;
};

type ContextMenuAction = { label: string; icon: React.ReactNode; color?: string; onClick: () => void };

/* ─── Context Menu ─── */
function ContextMenu({ actions, isDark, neon }: {
  actions: ContextMenuAction[]; isDark: boolean; neon: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
        style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
          (e.currentTarget as HTMLElement).style.color = isDark ? "#fff" : "#111";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "";
          (e.currentTarget as HTMLElement).style.color = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)";
        }}>
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-9 z-50 w-52 rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: isDark ? "hsl(135,25%,6%)" : "#fff",
            border: `1px solid ${isDark ? "rgba(0,230,118,0.2)" : "rgba(0,0,0,0.1)"}`,
            boxShadow: isDark ? "0 20px 60px rgba(0,0,0,0.7)" : "0 20px 60px rgba(0,0,0,0.15)",
          }}>
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); a.onClick(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-all"
              style={{
                color: a.color ?? (isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.7)"),
                borderBottom: i < actions.length - 1
                  ? `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` : "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
              <span style={{ color: a.color ?? neon }}>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Links & QR Modal ─── */
function LinksModal({ product, open, onClose, isDark, neon }: {
  product: { id: number; name: string } | null;
  open: boolean; onClose: () => void; isDark: boolean; neon: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
  const borderColor = isDark ? "rgba(0,230,118,0.15)" : "rgba(0,0,0,0.08)";

  if (!product) return null;

  const base = "https://pay.goat.com.br";
  const links = [
    { label: "Link de Checkout", icon: <ShoppingCart className="w-4 h-4" />, url: `${base}/checkout/${product.id}` },
    { label: "Página de Vendas", icon: <ExternalLink className="w-4 h-4" />, url: `${base}/vendas/${product.id}` },
    { label: "Link Curto", icon: <Link2 className="w-4 h-4" />, url: `${base}/p/${product.id}` },
  ];

  const copy = (url: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        style={{
          background: isDark ? "hsl(135,25%,5%)" : "#fff",
          border: `1px solid ${borderColor}`,
          color: textPrimary, maxWidth: 480,
        }}>
        <DialogHeader>
          <DialogTitle style={{ color: textPrimary }} className="flex items-center gap-2">
            <Link2 className="w-5 h-5" style={{ color: neon }} />
            Links & QR Code
          </DialogTitle>
          <p className="text-sm mt-0.5" style={{ color: textMuted }}>{product.name}</p>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {links.map((l) => (
            <div key={l.label}>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: textMuted }}>
                {l.label}
              </label>
              <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
                style={{ background: inputBg, border: `1px solid ${borderColor}` }}>
                <span style={{ color: neon }}>{l.icon}</span>
                <span className="flex-1 text-xs font-mono truncate" style={{ color: textMuted }}>{l.url}</span>
                <button
                  onClick={() => copy(l.url)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: copied === l.url ? `${neon}20` : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                    color: copied === l.url ? neon : textMuted,
                  }}>
                  {copied === l.url ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied === l.url ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          ))}

          {/* QR Code placeholder */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: textMuted }}>
              QR Code — Checkout
            </label>
            <div className="rounded-2xl p-6 flex flex-col items-center gap-3"
              style={{ background: inputBg, border: `1px solid ${borderColor}` }}>
              <div className="w-40 h-40 rounded-xl flex items-center justify-center relative overflow-hidden"
                style={{ background: isDark ? "rgba(0,230,118,0.05)" : "rgba(0,168,79,0.05)", border: `1px solid ${neon}30` }}>
                {/* QR Code visual placeholder */}
                <div className="grid grid-cols-7 gap-0.5 p-2">
                  {Array.from({ length: 49 }).map((_, i) => {
                    const isCorner = [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48].includes(i)
                      || [0,6,42,48].includes(i);
                    const filled = Math.random() > 0.45 || isCorner;
                    return (
                      <div key={i} className="w-3.5 h-3.5 rounded-sm"
                        style={{ background: filled ? (isDark ? neon : neon) : "transparent", opacity: filled ? (isCorner ? 1 : 0.7) : 0 }} />
                    );
                  })}
                </div>
                <QrCode className="w-16 h-16 absolute opacity-10" style={{ color: neon }} />
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  style={{ background: `${neon}15`, color: neon, border: `1px solid ${neon}30` }}>
                  <QrCode className="w-3.5 h-3.5" /> Baixar QR
                </button>
                <button className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                    color: textMuted, border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }}>
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </button>
              </div>
              <p className="text-xs text-center" style={{ color: textMuted }}>
                ID do produto: <strong style={{ color: neon }}>#{product.id.toString().padStart(7, "0")}</strong>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Product form modal ─── */
function ProductModal({ open, onClose, editId, defaultValues, onSubmit, loading, isDark, neon }: {
  open: boolean; onClose: () => void; editId: number | null;
  defaultValues: FormData; onSubmit: (d: FormData) => void;
  loading: boolean; isDark: boolean; neon: string;
}) {
  const form = useForm<FormData>({ defaultValues });
  useEffect(() => { if (open) form.reset(defaultValues); }, [open, JSON.stringify(defaultValues)]);

  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)";
  const borderColor = isDark ? "rgba(0,230,118,0.15)" : "rgba(0,0,0,0.08)";
  const s = { background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary, borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", transition: "border 0.2s", width: "100%" };
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => (e.target.style.border = `1px solid ${neon}60`);
  const blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => (e.target.style.border = `1px solid ${inputBorder}`);
  const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: textMuted, marginBottom: 6, textTransform: "uppercase" };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ background: isDark ? "hsl(135,25%,5%)" : "#fff", border: `1px solid ${borderColor}`, color: textPrimary, maxWidth: 540, maxHeight: "90vh", overflowY: "auto" }}>
        <DialogHeader>
          <DialogTitle style={{ color: textPrimary }} className="flex items-center gap-2">
            <Package className="w-5 h-5" style={{ color: neon }} />
            {editId !== null ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Name */}
          <div>
            <label style={lbl}>Nome do produto *</label>
            <input {...form.register("name", { required: true })} style={s} placeholder="Ex: Mentoria Elite 1:1" onFocus={focus} onBlur={blur} />
          </div>

          {/* Description */}
          <div>
            <label style={lbl}>Descrição</label>
            <textarea {...form.register("description")} rows={3} style={{ ...s, resize: "none" } as React.CSSProperties}
              placeholder="Descreva seu produto..." onFocus={focus} onBlur={blur} />
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={lbl}>Tipo</label>
              <select {...form.register("type")} style={s} onFocus={focus} onBlur={blur}>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select {...form.register("status")} style={s} onFocus={focus} onBlur={blur}>
                <option value="active">Ativo</option>
                <option value="draft">Rascunho</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>

          {/* Price */}
          <div>
            <label style={lbl}>Preço (R$) *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: neon }}>R$</span>
              <input type="number" step="0.01" min="0" {...form.register("price", { required: true })}
                style={{ ...s, paddingLeft: 36 }} placeholder="0,00" onFocus={focus} onBlur={blur} />
            </div>
          </div>

          {/* Extra fields info */}
          <div className="rounded-xl p-4 space-y-2" style={{ background: isDark ? "rgba(0,230,118,0.04)" : "rgba(0,168,79,0.04)", border: `1px solid ${neon}20` }}>
            <p className="text-xs font-bold" style={{ color: neon }}>Recursos adicionais após criar</p>
            <div className="grid grid-cols-2 gap-1.5 text-xs" style={{ color: textMuted }}>
              {[
                [<ImageIcon className="w-3 h-3" />, "Imagens & Capa"],
                [<Video className="w-3 h-3" />, "Vídeos"],
                [<FileText className="w-3 h-3" />, "Arquivos digitais"],
                [<Tag className="w-3 h-3" />, "Categorias & Tags"],
                [<TrendingUp className="w-3 h-3" />, "Upsell / Downsell"],
                [<Layers className="w-3 h-3" />, "Order Bump"],
                [<RefreshCw className="w-3 h-3" />, "Assinatura recorrente"],
                [<QrCode className="w-3 h-3" />, "QR Code & Links"],
              ].map(([icon, label], i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span style={{ color: neon }}>{icon as React.ReactNode}</span>
                  {label as string}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ border: `1px solid ${inputBorder}`, color: textMuted, background: inputBg }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${neon}, color-mix(in srgb, ${neon} 75%, black))`,
                color: "#000", boxShadow: `0 0 20px ${neon}40`, opacity: loading ? 0.7 : 1,
              }}>
              {loading ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : null}
              {editId !== null ? "Salvar Alterações" : "Criar Produto"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── MAIN PAGE ─── */
export default function Products() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const neon = isDark ? "#00e676" : "#00a84f";
  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
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
  const [editDefaults, setEditDefaults] = useState<FormData>({ name: "", description: "", type: "digital", price: 0, status: "active" });
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filterOpen, setFilterOpen] = useState(false);
  const [linksModal, setLinksModal] = useState<{ id: number; name: string } | null>(null);
  const [starred, setStarred] = useState<Set<number>>(new Set());

  function openCreate() {
    setEditId(null);
    setEditDefaults({ name: "", description: "", type: "digital", price: 0, status: "active" });
    setOpen(true);
  }

  function openEdit(p: NonNullable<typeof products>[0]) {
    setEditId(p.id);
    setEditDefaults({ name: p.name, description: p.description ?? "", type: p.type, price: p.price, status: p.status });
    setOpen(true);
  }

  function onSubmit(data: FormData) {
    const inv = () => queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
    const opts = {
      onSuccess: () => { inv(); setOpen(false); toast({ title: editId !== null ? "✅ Produto atualizado" : "✅ Produto criado com sucesso!" }); },
    };
    if (editId !== null) updateProduct.mutate({ id: editId, data: { ...data, price: Number(data.price) } }, opts);
    else createProduct.mutate({ data: { ...data, price: Number(data.price) } }, opts);
  }

  function handleDelete(id: number, name: string) {
    if (!confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    deleteProduct.mutate({ id }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); toast({ title: "Produto excluído." }); },
    });
  }

  function handleDuplicate(p: NonNullable<typeof products>[0]) {
    createProduct.mutate({
      data: { name: `${p.name} (cópia)`, description: p.description ?? "", type: p.type, price: p.price, status: "draft" },
    }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); toast({ title: "Produto duplicado." }); },
    });
  }

  const filtered = (products ?? []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const cardBg = isDark ? "rgba(5,20,10,0.8)" : "#fff";

  /* ─── Product Card ─── */
  const ProductCard = ({ p }: { p: NonNullable<typeof products>[0] }) => {
    const st = STATUS_STYLES[p.status] ?? STATUS_STYLES.inactive;
    const typeColor = TYPE_COLORS[p.type] ?? neon;
    const isStarred = starred.has(p.id);

    const menuActions: ContextMenuAction[] = [
      { label: "Customizar Checkout", icon: <ShoppingCart className="w-4 h-4" />, onClick: () => toast({ title: "Abrindo editor de checkout..." }) },
      { label: "Links & QR Code", icon: <Link2 className="w-4 h-4" />, onClick: () => setLinksModal({ id: p.id, name: p.name }) },
      { label: "Duplicar produto", icon: <Copy className="w-4 h-4" />, onClick: () => handleDuplicate(p) },
      { label: "Arquivar", icon: <Archive className="w-4 h-4" />, onClick: () => toast({ title: "Produto arquivado." }) },
      { label: "Editar produto", icon: <Pencil className="w-4 h-4" />, onClick: () => openEdit(p) },
      { label: "Excluir produto", icon: <Trash2 className="w-4 h-4" />, color: "#f44336", onClick: () => handleDelete(p.id, p.name) },
    ];

    if (viewMode === "list") {
      return (
        <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group"
          style={{
            background: cardBg,
            border: `1px solid ${borderColor}`,
            marginBottom: 8,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${neon}35`)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = borderColor)}>

          {/* Thumbnail */}
          <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden"
            style={{ background: `${typeColor}12`, border: `1px solid ${typeColor}30` }}>
            <Package className="w-6 h-6" style={{ color: typeColor }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm truncate" style={{ color: textPrimary }}>{p.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setStarred((s) => { const n = new Set(s); isStarred ? n.delete(p.id) : n.add(p.id); return n; }); }}
                className="shrink-0">
                <Star className="w-3.5 h-3.5" fill={isStarred ? "#ffd740" : "none"} style={{ color: isStarred ? "#ffd740" : textMuted }} />
              </button>
              <span className="font-extrabold text-sm number-display" style={{ color: neon }}>
                {formatCurrency(p.price)}
              </span>
            </div>
            {p.description && (
              <p className="text-xs mt-0.5 truncate max-w-md" style={{ color: textMuted }}>{p.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                {st.label}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: `${typeColor}12`, color: typeColor, border: `1px solid ${typeColor}30` }}>
                {TYPE_LABELS[p.type] ?? p.type}
              </span>
              <span className="text-xs font-mono" style={{ color: `${textMuted}` }}>
                ID: {p.id.toString().padStart(7, "0")}
              </span>
            </div>
          </div>

          {/* Stats (desktop) */}
          <div className="hidden lg:flex items-center gap-6 shrink-0">
            <div className="text-right">
              <div className="text-xs" style={{ color: textMuted }}>Vendas</div>
              <div className="font-bold number-display" style={{ color: textPrimary }}>{p.sales.toLocaleString("pt-BR")}</div>
            </div>
            <div className="text-right">
              <div className="text-xs" style={{ color: textMuted }}>Receita</div>
              <div className="font-bold number-display" style={{ color: neon }}>{formatCurrency(p.revenue)}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setLinksModal({ id: p.id, name: p.name })}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{ background: `${neon}12`, color: neon, border: `1px solid ${neon}30` }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${neon}20`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = `${neon}12`)}>
              <Link2 className="w-3.5 h-3.5" /> Links
            </button>
            <ContextMenu actions={menuActions} isDark={isDark} neon={neon} />
          </div>
        </div>
      );
    }

    // Grid view
    return (
      <div className="rounded-2xl overflow-hidden transition-all group cursor-pointer"
        style={{ background: cardBg, border: `1px solid ${borderColor}` }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${neon}35`)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = borderColor)}>
        {/* Cover */}
        <div className="h-36 flex items-center justify-center relative"
          style={{ background: `linear-gradient(135deg, ${typeColor}18, ${typeColor}06)` }}>
          <Package className="w-12 h-12" style={{ color: typeColor, opacity: 0.5 }} />
          <div className="absolute top-2.5 left-2.5">
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
              {st.label}
            </span>
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setStarred((s) => { const n = new Set(s); isStarred ? n.delete(p.id) : n.add(p.id); return n; }); }}>
              <Star className="w-4 h-4" fill={isStarred ? "#ffd740" : "none"} style={{ color: isStarred ? "#ffd740" : "rgba(255,255,255,0.4)" }} />
            </button>
            <ContextMenu actions={menuActions} isDark={isDark} neon={neon} />
          </div>
        </div>
        <div className="p-4 space-y-2">
          <div className="font-bold text-sm truncate" style={{ color: textPrimary }}>{p.name}</div>
          <div className="font-extrabold number-display" style={{ color: neon }}>{formatCurrency(p.price)}</div>
          {p.description && (
            <p className="text-xs line-clamp-2" style={{ color: textMuted }}>{p.description}</p>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-mono" style={{ color: textMuted }}>ID: {p.id.toString().padStart(7, "0")}</span>
            <button
              onClick={() => setLinksModal({ id: p.id, name: p.name })}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{ background: `${neon}12`, color: neon }}>
              <Link2 className="w-3 h-3" /> Links
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2.5" style={{ color: textPrimary }}>
            Meus Produtos
            {!isLoading && products && (
              <span className="text-sm px-2.5 py-0.5 rounded-full font-bold"
                style={{ background: `${neon}15`, color: neon }}>
                {products.length}
              </span>
            )}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: textMuted }}>
            Gerencie produtos, links e checkouts
          </p>
        </div>
        {/* Desktop create button */}
        <button onClick={openCreate}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{
            background: `linear-gradient(135deg, ${neon}, color-mix(in srgb, ${neon} 75%, black))`,
            color: "#000", boxShadow: `0 0 16px ${neon}40`,
          }}>
          <Plus className="w-4 h-4" /> Novo Produto
        </button>
      </div>

      {/* Search + filter + view toggle */}
      <div className="flex items-center gap-2.5">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textMuted }} />
          <input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
            onFocus={(e) => (e.target.style.border = `1px solid ${neon}60`)}
            onBlur={(e) => (e.target.style.border = `1px solid ${inputBorder}`)} />
        </div>
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="w-11 h-11 flex items-center justify-center rounded-xl transition-all shrink-0"
          style={{
            background: filterOpen ? `${neon}15` : inputBg,
            border: `1px solid ${filterOpen ? neon + "50" : inputBorder}`,
            color: filterOpen ? neon : textMuted,
          }}>
          <Filter className="w-4 h-4" />
        </button>
        {/* View toggle */}
        <div className="flex rounded-xl overflow-hidden shrink-0"
          style={{ border: `1px solid ${inputBorder}`, background: inputBg }}>
          {([["grid", <LayoutGrid className="w-4 h-4" />], ["list", <List className="w-4 h-4" />]] as const).map(([mode, icon]) => (
            <button key={mode}
              onClick={() => setViewMode(mode)}
              className="w-10 h-10 flex items-center justify-center transition-all"
              style={{
                background: viewMode === mode ? `${neon}20` : "transparent",
                color: viewMode === mode ? neon : textMuted,
              }}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        viewMode === "list" ? (
          <div>
            {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )
      ) : (
        <div className="rounded-2xl py-24 text-center"
          style={{ border: `1px dashed ${isDark ? "rgba(0,230,118,0.2)" : "rgba(0,0,0,0.1)"}`, background: isDark ? "rgba(0,230,118,0.02)" : "rgba(0,168,79,0.02)" }}>
          <Package className="w-14 h-14 mx-auto mb-4" style={{ color: `${neon}30` }} />
          <h3 className="font-bold mb-1" style={{ color: textPrimary }}>
            {search ? "Nenhum produto encontrado" : "Ainda sem produtos"}
          </h3>
          <p className="text-sm mb-4" style={{ color: textMuted }}>
            {search ? `Sem resultados para "${search}"` : "Crie seu primeiro produto e comece a vender"}
          </p>
          {!search && (
            <button onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: `${neon}15`, color: neon, border: `1px solid ${neon}30` }}>
              <Plus className="w-4 h-4" /> Criar primeiro produto
            </button>
          )}
        </div>
      )}

      {/* FAB (mobile) */}
      <button onClick={openCreate}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl sm:hidden z-40 transition-all active:scale-95"
        style={{
          background: `linear-gradient(135deg, ${neon}, color-mix(in srgb, ${neon} 75%, black))`,
          color: "#000", boxShadow: `0 0 24px ${neon}60, 0 8px 32px rgba(0,0,0,0.4)`,
        }}>
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      {/* Modals */}
      <ProductModal
        open={open} onClose={() => setOpen(false)}
        editId={editId} defaultValues={editDefaults}
        onSubmit={onSubmit}
        loading={createProduct.isPending || updateProduct.isPending}
        isDark={isDark} neon={neon} />

      <LinksModal
        product={linksModal} open={!!linksModal}
        onClose={() => setLinksModal(null)}
        isDark={isDark} neon={neon} />
    </div>
  );
}
