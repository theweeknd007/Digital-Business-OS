import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  getListProductsQueryKey, useCreateWhopCheckout,
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
  Settings2, Palette, Shield, Globe, MousePointerClick,
  LayoutTemplate, Maximize2, AlignLeft,
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
  coverUrl?: string; fileUrl?: string; fileName?: string;
  fileContentType?: string; fileSize?: number;
  currency?: string; deliveryType?: "internal" | "external";
  externalDeliveryUrl?: string; externalAccessUrl?: string;
  materials?: Array<{ id?: number; objectPath?: string; name: string; contentType: string; fileSize: number; externalUrl?: string }>;
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function uploadProductAsset(file: File) {
  const token = sessionStorage.getItem("gp_sess");
  const response = await fetch(`${BASE}/api/storage/uploads/request-url`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "application/octet-stream" }),
  });
  const payload = await response.json() as { uploadURL?: string; objectPath?: string; error?: string };
  if (!response.ok || !payload.uploadURL || !payload.objectPath) throw new Error(payload.error ?? "Não foi possível preparar o upload");
  const upload = await fetch(payload.uploadURL, { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
  if (!upload.ok) throw new Error("O upload não foi concluído");
  return { objectPath: payload.objectPath, file };
}

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

/* ─── Links & Pixel Modal ─── */
function LinksModal({ product, open, onClose, isDark, neon }: {
  product: { id: number; name: string } | null;
  open: boolean; onClose: () => void; isDark: boolean; neon: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [pixels, setPixels] = useState({ meta: "", google: "", tiktok: "" });
  const [pixelSaved, setPixelSaved] = useState(false);
  const createCheckout = useCreateWhopCheckout();
  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
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

  const savePixels = () => {
    setPixelSaved(true);
    setTimeout(() => setPixelSaved(false), 2500);
  };

  const inputStyle: React.CSSProperties = {
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    color: textPrimary,
    borderRadius: 10,
    padding: "9px 12px",
    fontSize: 13,
    outline: "none",
    width: "100%",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        style={{
          background: isDark ? "hsl(135,25%,5%)" : "#fff",
          border: `1px solid ${borderColor}`,
          color: textPrimary, maxWidth: 520,
          maxHeight: "90vh", overflowY: "auto",
        }}>
        <DialogHeader>
          <DialogTitle style={{ color: textPrimary }} className="flex items-center gap-2">
            <Link2 className="w-5 h-5" style={{ color: neon }} />
            Links & Pixel
          </DialogTitle>
          <p className="text-sm mt-0.5" style={{ color: textMuted }}>{product.name}</p>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Links */}
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
              {l.label === "Link de Checkout" && (
                <button
                  onClick={() => createCheckout.mutate({ data: { productId: product.id } }, {
                    onSuccess: (data) => window.open(data.purchaseUrl, "_blank", "noopener,noreferrer"),
                  })}
                  disabled={createCheckout.isPending}
                  className="mt-2 w-full py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: `${neon}15`, color: neon, border: `1px solid ${neon}35` }}>
                  {createCheckout.isPending ? "A preparar checkout seguro..." : "Abrir checkout real do Whop"}
                </button>
              )}
            </div>
          ))}

          {/* QR Code */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: textMuted }}>
              QR Code — Checkout
            </label>
            <div className="rounded-2xl p-4 flex items-center gap-4"
              style={{ background: inputBg, border: `1px solid ${borderColor}` }}>
              <div className="w-28 h-28 rounded-xl flex items-center justify-center relative overflow-hidden shrink-0"
                style={{ background: isDark ? "rgba(0,230,118,0.05)" : "rgba(0,168,79,0.05)", border: `1px solid ${neon}30` }}>
                <div className="grid grid-cols-7 gap-0.5 p-1.5">
                  {Array.from({ length: 49 }).map((_, i) => {
                    const corner = [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48].includes(i);
                    const filled = Math.random() > 0.45 || corner;
                    return <div key={i} className="w-3 h-3 rounded-sm"
                      style={{ background: filled ? neon : "transparent", opacity: filled ? (corner ? 1 : 0.7) : 0 }} />;
                  })}
                </div>
                <QrCode className="w-12 h-12 absolute opacity-10" style={{ color: neon }} />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <p className="text-xs" style={{ color: textMuted }}>
                  ID: <strong style={{ color: neon }}>#{product.id.toString().padStart(7, "0")}</strong>
                </p>
                <button className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 w-fit"
                  style={{ background: `${neon}15`, color: neon, border: `1px solid ${neon}30` }}>
                  <QrCode className="w-3 h-3" /> Baixar QR
                </button>
                <button className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 w-fit"
                  style={{ background: inputBg, color: textMuted, border: `1px solid ${inputBorder}` }}>
                  <Copy className="w-3 h-3" /> Copiar PNG
                </button>
              </div>
            </div>
          </div>

          {/* ─── Pixel Tracking ─── */}
          <div className="rounded-2xl p-4 space-y-4"
            style={{ background: isDark ? "rgba(64,196,255,0.04)" : "rgba(0,100,200,0.03)", border: `1px solid ${isDark ? "rgba(64,196,255,0.2)" : "rgba(0,100,200,0.12)"}` }}>
            <div className="flex items-center gap-2">
              <MousePointerClick className="w-4 h-4" style={{ color: "#40c4ff" }} />
              <span className="text-sm font-bold" style={{ color: textPrimary }}>Rastreamento & Pixels</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold ml-auto"
                style={{ background: "rgba(64,196,255,0.15)", color: "#40c4ff" }}>PRO</span>
            </div>

            {[
              { key: "meta" as const, label: "Meta Pixel ID (Facebook/Instagram)", placeholder: "Ex: 1234567890123456", icon: "📘" },
              { key: "google" as const, label: "Google Analytics (GA4)", placeholder: "Ex: G-XXXXXXXXXX", icon: "📊" },
              { key: "tiktok" as const, label: "TikTok Pixel ID", placeholder: "Ex: C3A4B5D6E7F8G9H0", icon: "🎵" },
            ].map((field) => (
              <div key={field.key}>
                <label className="flex items-center gap-1.5 text-xs font-semibold mb-1.5" style={{ color: textMuted }}>
                  <span>{field.icon}</span> {field.label}
                </label>
                <input
                  type="text"
                  placeholder={field.placeholder}
                  value={pixels[field.key]}
                  onChange={(e) => setPixels((p) => ({ ...p, [field.key]: e.target.value }))}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.border = "1px solid rgba(64,196,255,0.5)")}
                  onBlur={(e) => (e.target.style.border = `1px solid ${inputBorder}`)} />
              </div>
            ))}

            <button
              onClick={savePixels}
              className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
              style={{
                background: pixelSaved ? `${neon}20` : "rgba(64,196,255,0.12)",
                color: pixelSaved ? neon : "#40c4ff",
                border: `1px solid ${pixelSaved ? neon + "40" : "rgba(64,196,255,0.3)"}`,
              }}>
              {pixelSaved ? <><Check className="w-4 h-4" /> Pixels salvos!</> : <><Globe className="w-4 h-4" /> Salvar Pixels</>}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Checkout Customizer Modal ─── */
const CHECKOUT_LAYOUTS = [
  { id: "one-step", label: "1 Etapa", desc: "Tudo em uma página", icon: AlignLeft },
  { id: "two-step", label: "2 Etapas", desc: "Dados → Pagamento", icon: LayoutTemplate },
  { id: "popup", label: "Pop-up", desc: "Checkout flutuante", icon: Maximize2 },
] as const;

const COLOR_PRESETS = [
  "#00e676", "#40c4ff", "#e040fb", "#ffab40", "#f44336", "#fff176",
];

const GUARANTEE_OPTIONS = [
  { days: 7, label: "7 dias" },
  { days: 15, label: "15 dias" },
  { days: 30, label: "30 dias" },
  { days: null, label: "Sem garantia" },
];

function CheckoutCustomizerModal({ product, open, onClose, isDark, neon }: {
  product: { id: number; name: string } | null;
  open: boolean; onClose: () => void; isDark: boolean; neon: string;
}) {
  const [layout, setLayout] = useState<string>("one-step");
  const [color, setColor] = useState(neon);
  const [fields, setFields] = useState({ cpf: true, phone: true, address: false, terms: true });
  const [guarantee, setGuarantee] = useState<number | null>(7);
  const [orderBump, setOrderBump] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  if (!product) return null;

  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
  const borderColor = isDark ? "rgba(0,230,118,0.15)" : "rgba(0,0,0,0.08)";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  function handleSave() {
    setSaved(true);
    toast({ title: "✅ Checkout salvo!", description: `Configurações aplicadas para "${product!.name}"` });
    setTimeout(() => { setSaved(false); onClose(); }, 1500);
  }

  function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
      <button
        onClick={onChange}
        className="w-10 h-6 rounded-full transition-all relative shrink-0"
        style={{ background: checked ? neon : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }}>
        <span className="absolute top-0.5 transition-all w-5 h-5 rounded-full bg-white shadow"
          style={{ left: checked ? "calc(100% - 22px)" : "2px" }} />
      </button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        style={{
          background: isDark ? "hsl(135,25%,5%)" : "#fff",
          border: `1px solid ${borderColor}`,
          color: textPrimary, maxWidth: 560,
          maxHeight: "92vh", overflowY: "auto",
        }}>
        <DialogHeader>
          <DialogTitle style={{ color: textPrimary }} className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" style={{ color: neon }} />
            Customizar Checkout
          </DialogTitle>
          <p className="text-sm mt-0.5" style={{ color: textMuted }}>{product.name}</p>
        </DialogHeader>

        <div className="space-y-5 mt-2">

          {/* ── Layout ── */}
          <section>
            <label className="text-xs font-bold uppercase tracking-wider block mb-3" style={{ color: textMuted }}>
              Layout do Checkout
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CHECKOUT_LAYOUTS.map((opt) => {
                const Icon = opt.icon;
                const active = layout === opt.id;
                return (
                  <button key={opt.id} onClick={() => setLayout(opt.id)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all"
                    style={{
                      background: active ? `${neon}12` : inputBg,
                      border: `1.5px solid ${active ? neon + "70" : inputBorder}`,
                    }}>
                    <Icon className="w-5 h-5" style={{ color: active ? neon : textMuted }} />
                    <div className="text-xs font-bold" style={{ color: active ? neon : textPrimary }}>{opt.label}</div>
                    <div className="text-[10px] text-center" style={{ color: textMuted }}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Cor Principal ── */}
          <section>
            <label className="text-xs font-bold uppercase tracking-wider block mb-3" style={{ color: textMuted }}>
              Cor Principal
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-all relative"
                  style={{ background: c, boxShadow: color === c ? `0 0 0 3px ${isDark ? "#000" : "#fff"}, 0 0 0 5px ${c}` : "none" }}>
                  {color === c && <Check className="w-3.5 h-3.5 absolute inset-0 m-auto" style={{ color: c === "#fff176" ? "#000" : "#000" }} />}
                </button>
              ))}
              <div className="flex items-center gap-2">
                <div className="w-px h-6" style={{ background: inputBorder }} />
                <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: textMuted }}>
                  <Palette className="w-3.5 h-3.5" />
                  Personalizada
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border-none outline-none"
                    style={{ background: "transparent" }} />
                </label>
              </div>
            </div>
          </section>

          {/* ── Campos do Formulário ── */}
          <section>
            <label className="text-xs font-bold uppercase tracking-wider block mb-3" style={{ color: textMuted }}>
              Campos do Formulário
            </label>
            <div className="space-y-2">
              {([
                { key: "cpf" as const, label: "CPF / CNPJ", desc: "Obrigatório para nota fiscal" },
                { key: "phone" as const, label: "Telefone / WhatsApp", desc: "Para contato pós-venda" },
                { key: "address" as const, label: "Endereço completo", desc: "Para produtos físicos" },
                { key: "terms" as const, label: "Aceite dos Termos", desc: "Checkbox de conformidade" },
              ] as const).map((field) => (
                <div key={field.key} className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: inputBg, border: `1px solid ${inputBorder}` }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: textPrimary }}>{field.label}</div>
                    <div className="text-xs" style={{ color: textMuted }}>{field.desc}</div>
                  </div>
                  <Toggle checked={fields[field.key]} onChange={() => setFields((f) => ({ ...f, [field.key]: !f[field.key] }))} />
                </div>
              ))}
            </div>
          </section>

          {/* ── Garantia ── */}
          <section>
            <label className="text-xs font-bold uppercase tracking-wider block mb-3" style={{ color: textMuted }}>
              Selo de Garantia
            </label>
            <div className="grid grid-cols-4 gap-2">
              {GUARANTEE_OPTIONS.map((opt) => {
                const active = guarantee === opt.days;
                return (
                  <button key={String(opt.days)} onClick={() => setGuarantee(opt.days)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                    style={{
                      background: active ? `${neon}12` : inputBg,
                      border: `1.5px solid ${active ? neon + "60" : inputBorder}`,
                    }}>
                    {opt.days && <Shield className="w-4 h-4" style={{ color: active ? neon : textMuted }} />}
                    <span className="text-xs font-bold" style={{ color: active ? neon : textPrimary }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
            {guarantee && (
              <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: textMuted }}>
                <Shield className="w-3 h-3" style={{ color: neon }} />
                Selos de garantia aumentam conversão em até 18%
              </p>
            )}
          </section>

          {/* ── Order Bump ── */}
          <section className="rounded-2xl p-4"
            style={{ background: inputBg, border: `1px solid ${inputBorder}` }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold" style={{ color: textPrimary }}>Order Bump</div>
                <div className="text-xs mt-0.5" style={{ color: textMuted }}>Oferta adicional exibida antes do pagamento</div>
              </div>
              <Toggle checked={orderBump} onChange={() => setOrderBump((v) => !v)} />
            </div>
            {orderBump && (
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${inputBorder}` }}>
                <p className="text-xs" style={{ color: textMuted }}>
                  Configure um produto complementar para oferecer no checkout com desconto exclusivo.
                </p>
                <button className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: `${neon}15`, color: neon, border: `1px solid ${neon}30` }}>
                  + Selecionar produto
                </button>
              </div>
            )}
          </section>

          {/* ── Save ── */}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ border: `1px solid ${inputBorder}`, color: textMuted, background: inputBg }}>
              Cancelar
            </button>
            <button onClick={handleSave}
              className="flex-1 py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2"
              style={{
                background: saved ? `${neon}30` : `linear-gradient(135deg, ${neon}, color-mix(in srgb, ${neon} 75%, black))`,
                color: saved ? neon : "#000",
                boxShadow: saved ? "none" : `0 0 20px ${neon}40`,
              }}>
              {saved ? <><Check className="w-4 h-4" /> Salvo!</> : "Salvar Checkout"}
            </button>
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
  const [uploading, setUploading] = useState<"cover" | "file" | null>(null);
  const [step, setStep] = useState(1);
  const [materials, setMaterials] = useState<FormData["materials"]>(defaultValues.materials ?? []);
  const { toast } = useToast();
  useEffect(() => { if (open) { form.reset(defaultValues); setStep(1); setMaterials(defaultValues.materials ?? []); } }, [open, JSON.stringify(defaultValues)]);

  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)";
  const borderColor = isDark ? "rgba(0,230,118,0.15)" : "rgba(0,0,0,0.08)";
  const s = { background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary, borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", transition: "border 0.2s", width: "100%" };
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => (e.target.style.border = `1px solid ${neon}60`);
  const blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => (e.target.style.border = `1px solid ${inputBorder}`);
  const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: textMuted, marginBottom: 6, textTransform: "uppercase" };
  async function handleUpload(kind: "cover" | "file", file?: File) {
    if (!file) return;
    setUploading(kind);
    try {
      const result = await uploadProductAsset(file);
      if (kind === "cover") form.setValue("coverUrl", result.objectPath);
      else {
        form.setValue("fileUrl", result.objectPath);
        form.setValue("fileName", file.name);
        form.setValue("fileContentType", file.type || "application/octet-stream");
        form.setValue("fileSize", file.size);
      }
      toast({ title: kind === "cover" ? "Capa carregada" : "Ficheiro carregado", description: "O arquivo foi guardado com segurança." });
    } catch (error) {
      toast({ title: "Falha no upload", description: error instanceof Error ? error.message : "Tente novamente", variant: "destructive" });
    } finally {
      setUploading(null);
    }
  }
  async function addMaterial(file?: File) {
    if (!file || (materials?.length ?? 0) >= 6) return;
    setUploading("file");
    try {
      const result = await uploadProductAsset(file);
      setMaterials((current) => [...(current ?? []), { objectPath: result.objectPath, name: file.name, contentType: file.type || "application/octet-stream", fileSize: file.size }]);
      toast({ title: "Material adicionado" });
    } catch (error) {
      toast({ title: "Falha no upload", description: error instanceof Error ? error.message : "Tente novamente", variant: "destructive" });
    } finally { setUploading(null); }
  }
  function nextStep() {
    const values = form.getValues();
    if (step === 1 && (!values.name?.trim() || !values.description?.trim() || !values.coverUrl || !values.price || Number(values.price) < 50)) {
      toast({ title: "Complete as informações obrigatórias", description: "Capa, título, descrição e preço mínimo de 50 MT são obrigatórios.", variant: "destructive" }); return;
    }
    if (step === 2 && values.deliveryType !== "external" && !values.fileUrl) {
      toast({ title: "Adicione o PDF do E-book", variant: "destructive" }); return;
    }
    setStep((current) => Math.min(5, current + 1));
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ background: isDark ? "hsl(135,25%,5%)" : "#fff", border: `1px solid ${borderColor}`, color: textPrimary, maxWidth: 540, maxHeight: "90vh", overflowY: "auto" }}>
        <DialogHeader>
          <DialogTitle style={{ color: textPrimary }} className="flex items-center gap-2">
            <Package className="w-5 h-5" style={{ color: neon }} />
            {editId !== null ? "Editar Produto" : "Novo Produto"} <span className="text-xs font-normal" style={{ color: textMuted }}>· Etapa {step} de 5</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={(event) => { event.preventDefault(); if (step < 5) nextStep(); else form.handleSubmit((data) => onSubmit({ ...data, materials }))(event); }} className="space-y-4 mt-2">
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
                <option value="pending_approval">Aguardando aprovação</option>
                <option value="active">Ativo (admin)</option>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label style={lbl}>Capa do produto *</label>
              <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-3 text-center"
                style={{ background: inputBg, borderColor: `${neon}45` }}>
                {form.watch("coverUrl") ? (
                  <img src={`${BASE}/api/storage${form.watch("coverUrl")}`} alt="Capa do produto" className="h-20 w-full rounded-xl object-cover" />
                ) : <><ImageIcon className="mb-2 h-6 w-6" style={{ color: neon }} /><span className="text-xs font-semibold" style={{ color: textPrimary }}>Upload da capa</span></>}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => handleUpload("cover", e.target.files?.[0])} />
              </label>
              {uploading === "cover" && <p className="mt-1 text-[11px]" style={{ color: neon }}>A enviar capa...</p>}
            </div>
            <div>
              <label style={lbl}>Ficheiro do produto *</label>
              <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-3 text-center"
                style={{ background: inputBg, borderColor: `${neon}45` }}>
                <FileText className="mb-2 h-6 w-6" style={{ color: neon }} />
                <span className="max-w-full truncate text-xs font-semibold" style={{ color: textPrimary }}>{form.watch("fileName") ?? "Upload do ficheiro"}</span>
                <span className="mt-1 text-[10px]" style={{ color: textMuted }}>PDF, ZIP, MP4 ou outro</span>
                <input type="file" className="hidden" onChange={(e) => handleUpload("file", e.target.files?.[0])} />
              </label>
              {uploading === "file" && <p className="mt-1 text-[11px]" style={{ color: neon }}>A enviar ficheiro...</p>}
            </div>
          </div>

          {step === 2 && (
            <div className="rounded-xl p-4 space-y-3" style={{ background: inputBg, border: `1px solid ${borderColor}` }}>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-bold" style={{ color: textPrimary }}>Conteúdo e entrega</p><p className="text-xs mt-1" style={{ color: textMuted }}>Escolha como o comprador terá acesso ao produto.</p></div>
                <select {...form.register("deliveryType")} style={{ ...s, width: 150 }}><option value="internal">Entrega Interna</option><option value="external">Entrega Externa</option></select>
              </div>
              {form.watch("deliveryType") === "external" && <div className="space-y-2"><input {...form.register("externalDeliveryUrl")} style={s} placeholder="URL de entrega" /><input {...form.register("externalAccessUrl")} style={s} placeholder="Link de acesso" /></div>}
              {form.watch("fileName") && <div className="rounded-xl p-3 text-xs" style={{ background: `${neon}10`, color: textPrimary }}><FileText className="inline w-4 h-4 mr-2" style={{ color: neon }} />{form.watch("fileName")} · {((form.watch("fileSize") ?? 0) / 1024 / 1024).toFixed(2)} MB · {(form.watch("fileContentType") ?? "PDF").split("/").pop()?.toUpperCase()}</div>}
            </div>
          )}

          {step === 3 && (
            <div className="rounded-xl p-4 space-y-3" style={{ background: inputBg, border: `1px solid ${borderColor}` }}>
              <div><p className="text-sm font-bold" style={{ color: textPrimary }}>Materiais de Apoio</p><p className="text-xs mt-1" style={{ color: textMuted }}>Adicione até 6 materiais extras para entregar com o E-book.</p></div>
              {(materials ?? []).map((material, index) => <div key={`${material.objectPath}-${index}`} className="flex items-center gap-3 rounded-xl p-3" style={{ background: `${neon}08` }}><FileText className="w-5 h-5" style={{ color: neon }} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold" style={{ color: textPrimary }}>{material.name}</p><p className="text-[11px]" style={{ color: textMuted }}>{(material.fileSize / 1024 / 1024).toFixed(2)} MB · {material.contentType.split("/").pop()?.toUpperCase()}</p></div><button type="button" onClick={() => setMaterials((current) => (current ?? []).filter((_, itemIndex) => itemIndex !== index))} className="p-1.5" style={{ color: "#f44336" }}><Trash2 className="w-4 h-4" /></button></div>)}
              {(materials?.length ?? 0) < 6 && <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold" style={{ background: `${neon}15`, color: neon }}><Plus className="w-4 h-4" /> Adicionar Primeiro Material<input type="file" className="hidden" onChange={(event) => addMaterial(event.target.files?.[0])} /></label>}
            </div>
          )}

          {step === 4 && (
            <div className="rounded-xl p-4 space-y-3" style={{ background: inputBg, border: `1px solid ${borderColor}` }}>
              <p className="text-sm font-bold" style={{ color: textPrimary }}>Configurações</p>
              <label style={lbl}>Mercado / Moeda</label>
              <select {...form.register("currency")} style={s}><option value="MZN">Metical — Moçambique (MZN)</option></select>
              <p className="text-xs" style={{ color: textMuted }}>Preço mínimo para MZN: 50 MT. O produto ficará ativo após a publicação.</p>
            </div>
          )}

          {step === 5 && (
            <div className="rounded-xl p-4 space-y-2" style={{ background: inputBg, border: `1px solid ${borderColor}` }}>
              <p className="text-sm font-bold" style={{ color: textPrimary }}>Revisão</p>
              <p className="text-xs" style={{ color: textMuted }}>{form.watch("name")} · {form.watch("price")} {form.watch("currency") || "MZN"}</p>
              <p className="text-xs" style={{ color: textMuted }}>Conteúdo: {form.watch("fileName") || "não definido"} · Materiais: {materials?.length ?? 0}/6</p>
              <p className="text-xs" style={{ color: textMuted }}>Entrega: {form.watch("deliveryType") === "external" ? "Externa" : "Interna"}</p>
            </div>
          )}

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
              {step < 5 ? "Próximo" : editId !== null ? "Salvar Alterações" : "Publicar Produto"}
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
    active:   { bg: `${neon}15`, text: neon, border: `${neon}40`, label: "Aprovado / Ativo" },
    pending_approval: { bg: "rgba(255,183,0,0.1)", text: "#ffb700", border: "rgba(255,183,0,0.3)", label: "Aguardando aprovação" },
    rejected: { bg: "rgba(244,67,54,0.1)", text: "#f44336", border: "rgba(244,67,54,0.3)", label: "Rejeitado" },
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
  const [editDefaults, setEditDefaults] = useState<FormData>({ name: "", description: "", type: "digital", price: 0, status: "pending_approval" });
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filterOpen, setFilterOpen] = useState(false);
  const [linksModal, setLinksModal] = useState<{ id: number; name: string } | null>(null);
  const [checkoutModal, setCheckoutModal] = useState<{ id: number; name: string } | null>(null);
  const [starred, setStarred] = useState<Set<number>>(new Set());

  function openCreate() {
    setEditId(null);
    setEditDefaults({ name: "", description: "", type: "digital", price: 0, status: "pending_approval" });
    setOpen(true);
  }

  function openEdit(p: NonNullable<typeof products>[0]) {
    setEditId(p.id);
    setEditDefaults({ name: p.name, description: p.description ?? "", type: p.type, price: p.price, status: p.status, coverUrl: p.coverUrl, fileUrl: p.fileUrl, fileName: p.fileName, fileContentType: p.fileContentType, fileSize: p.fileSize });
    setOpen(true);
  }

  function onSubmit(data: FormData) {
    const inv = () => queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
    const opts = {
       onSuccess: () => { inv(); setOpen(false); toast({ title: editId !== null ? "Produto atualizado" : "Produto enviado para aprovação", description: editId === null ? "O admin precisa aprovar antes de vender." : undefined }); },
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
      { label: "Customizar Checkout", icon: <Settings2 className="w-4 h-4" />, onClick: () => setCheckoutModal({ id: p.id, name: p.name }) },
      { label: "Links & Pixel", icon: <Link2 className="w-4 h-4" />, onClick: () => setLinksModal({ id: p.id, name: p.name }) },
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
             {p.coverUrl ? <img src={`${BASE}/api/storage${p.coverUrl}`} alt="" className="h-full w-full object-cover" /> : <Package className="w-6 h-6" style={{ color: typeColor }} />}
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
           {p.coverUrl ? <img src={`${BASE}/api/storage${p.coverUrl}`} alt="" className="h-full w-full object-cover" /> : <Package className="w-12 h-12" style={{ color: typeColor, opacity: 0.5 }} />}
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

      <CheckoutCustomizerModal
        product={checkoutModal} open={!!checkoutModal}
        onClose={() => setCheckoutModal(null)}
        isDark={isDark} neon={neon} />
    </div>
  );
}
