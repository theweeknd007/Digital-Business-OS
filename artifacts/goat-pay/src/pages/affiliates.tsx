import { useState } from "react";
import { useListAffiliates, useGetAffiliateStats } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import {
  Users, TrendingUp, DollarSign, Star, Link2, Copy, Check,
  Mail, Plus, Settings, ChevronDown, Search, BarChart2,
  UserPlus, Share2, ExternalLink, X,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

/* ─── Invite Modal ─── */
function InviteModal({ open, onClose, isDark, neon }: {
  open: boolean; onClose: () => void; isDark: boolean; neon: string;
}) {
  const [email, setEmail] = useState("");
  const [commission, setCommission] = useState(30);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const borderColor = isDark ? "rgba(0,230,118,0.15)" : "rgba(0,0,0,0.08)";

  const inviteLink = "https://pay.goat.com.br/afiliado/convite/abc123xyz";

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInvite = () => {
    if (!email.trim()) return;
    setSent(true);
    toast({ title: "✅ Convite enviado!", description: `Afiliado convidado para ${email}` });
    setTimeout(() => { setSent(false); setEmail(""); onClose(); }, 1500);
  };

  const s: React.CSSProperties = {
    background: inputBg, border: `1px solid ${inputBorder}`,
    color: textPrimary, borderRadius: 10, padding: "10px 14px",
    fontSize: 14, outline: "none", width: "100%",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{
        background: isDark ? "hsl(135,25%,5%)" : "#fff",
        border: `1px solid ${borderColor}`,
        color: textPrimary, maxWidth: 480,
      }}>
        <DialogHeader>
          <DialogTitle style={{ color: textPrimary }} className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" style={{ color: neon }} />
            Convidar Afiliado
          </DialogTitle>
          <p className="text-sm mt-0.5" style={{ color: textMuted }}>
            Compartilhe seu link ou convide por e-mail
          </p>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Invite Link */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: textMuted }}>
              Link de Convite
            </label>
            <div className="rounded-xl px-3.5 py-3 flex items-center gap-2"
              style={{ background: inputBg, border: `1px solid ${borderColor}` }}>
              <Share2 className="w-4 h-4 shrink-0" style={{ color: neon }} />
              <span className="flex-1 text-xs font-mono truncate" style={{ color: textMuted }}>{inviteLink}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all"
                style={{
                  background: copied ? `${neon}20` : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  color: copied ? neon : textMuted,
                }}>
                {copied ? <><Check className="w-3 h-3" />Copiado!</> : <><Copy className="w-3 h-3" />Copiar</>}
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <button className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{ background: "rgba(25,118,210,0.15)", color: "#1976d2", border: "1px solid rgba(25,118,210,0.3)" }}>
                <ExternalLink className="w-3 h-3" />WhatsApp
              </button>
              <button className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{ background: "rgba(25,118,210,0.1)", color: "#1976d2", border: "1px solid rgba(25,118,210,0.2)" }}>
                <Share2 className="w-3 h-3" />Telegram
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: inputBorder }} />
            <span className="text-xs" style={{ color: textMuted }}>ou convide por e-mail</span>
            <div className="flex-1 h-px" style={{ background: inputBorder }} />
          </div>

          {/* Email invite */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: textMuted }}>
              E-mail do Afiliado
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textMuted }} />
              <input
                type="email"
                placeholder="afiliado@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ ...s, paddingLeft: 40 }}
                onFocus={(e) => (e.target.style.border = `1px solid ${neon}60`)}
                onBlur={(e) => (e.target.style.border = `1px solid ${inputBorder}`)} />
            </div>
          </div>

          {/* Commission rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: textMuted }}>
                Taxa de Comissão
              </label>
              <span className="text-sm font-extrabold number-display" style={{ color: neon }}>{commission}%</span>
            </div>
            <input
              type="range" min={5} max={80} step={5}
              value={commission}
              onChange={(e) => setCommission(Number(e.target.value))}
              className="w-full accent-current"
              style={{ accentColor: neon }} />
            <div className="flex justify-between text-[10px] mt-1" style={{ color: textMuted }}>
              <span>5%</span><span>30%</span><span>50%</span><span>80%</span>
            </div>
            <p className="text-xs mt-2" style={{ color: textMuted }}>
              O afiliado receberá <strong style={{ color: neon }}>{commission}%</strong> de comissão por cada venda gerada
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ border: `1px solid ${inputBorder}`, color: textMuted, background: inputBg }}>
              Cancelar
            </button>
            <button onClick={handleInvite} disabled={!email.trim() || sent}
              className="flex-1 py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all"
              style={{
                background: sent ? `${neon}25` : `linear-gradient(135deg, ${neon}, color-mix(in srgb, ${neon} 75%, black))`,
                color: sent ? neon : "#000",
                boxShadow: sent ? "none" : `0 0 20px ${neon}35`,
                opacity: !email.trim() ? 0.5 : 1,
              }}>
              {sent ? <><Check className="w-4 h-4" />Enviado!</> : <><Mail className="w-4 h-4" />Enviar Convite</>}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Program Settings Modal ─── */
function ProgramSettingsModal({ open, onClose, isDark, neon }: {
  open: boolean; onClose: () => void; isDark: boolean; neon: string;
}) {
  const [globalCommission, setGlobalCommission] = useState(30);
  const [autoApprove, setAutoApprove] = useState(false);
  const [cookieDays, setCookieDays] = useState(30);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const borderColor = isDark ? "rgba(0,230,118,0.15)" : "rgba(0,0,0,0.08)";

  function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
      <button onClick={onChange}
        className="w-10 h-6 rounded-full relative shrink-0"
        style={{ background: checked ? neon : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }}>
        <span className="absolute top-0.5 transition-all w-5 h-5 rounded-full bg-white shadow"
          style={{ left: checked ? "calc(100% - 22px)" : "2px" }} />
      </button>
    );
  }

  const save = () => {
    setSaved(true);
    toast({ title: "✅ Configurações salvas!" });
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{
        background: isDark ? "hsl(135,25%,5%)" : "#fff",
        border: `1px solid ${borderColor}`,
        color: textPrimary, maxWidth: 460,
      }}>
        <DialogHeader>
          <DialogTitle style={{ color: textPrimary }} className="flex items-center gap-2">
            <Settings className="w-5 h-5" style={{ color: neon }} />
            Configurações do Programa
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: textMuted }}>
                Comissão Padrão
              </label>
              <span className="text-sm font-extrabold number-display" style={{ color: neon }}>{globalCommission}%</span>
            </div>
            <input type="range" min={5} max={80} step={5} value={globalCommission}
              onChange={(e) => setGlobalCommission(Number(e.target.value))}
              className="w-full" style={{ accentColor: neon }} />
          </div>

          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: inputBg, border: `1px solid ${inputBorder}` }}>
            <div>
              <div className="text-sm font-medium" style={{ color: textPrimary }}>Aprovar afiliados automaticamente</div>
              <div className="text-xs mt-0.5" style={{ color: textMuted }}>Novos afiliados são aprovados sem revisão</div>
            </div>
            <Toggle checked={autoApprove} onChange={() => setAutoApprove((v) => !v)} />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: textMuted }}>
              Duração do Cookie (dias)
            </label>
            <div className="flex gap-2">
              {[7, 15, 30, 60, 90].map((d) => (
                <button key={d} onClick={() => setCookieDays(d)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: cookieDays === d ? `${neon}18` : inputBg,
                    color: cookieDays === d ? neon : textMuted,
                    border: `1.5px solid ${cookieDays === d ? neon + "60" : inputBorder}`,
                  }}>
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ border: `1px solid ${inputBorder}`, color: textMuted, background: inputBg }}>
              Cancelar
            </button>
            <button onClick={save}
              className="flex-1 py-3 rounded-xl text-sm font-extrabold"
              style={{
                background: `linear-gradient(135deg, ${neon}, color-mix(in srgb, ${neon} 75%, black))`,
                color: "#000", boxShadow: `0 0 20px ${neon}35`,
              }}>
              Salvar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── MAIN ─── */
export default function Affiliates() {
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
    inactive: { bg: inputBg, text: textMuted, border: inputBorder, label: "Inativo" },
    pending:  { bg: "rgba(255,183,0,0.1)", text: "#ffb700", border: "rgba(255,183,0,0.3)", label: "Pendente" },
  };

  const { data: affiliates, isLoading } = useListAffiliates();
  const { data: stats, isLoading: statsLoading } = useGetAffiliateStats();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  const filtered = (affiliates ?? [])
    .filter((a) => !filter || a.status === filter)
    .filter((a) => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: textPrimary }}>Afiliados</h1>
          <p className="text-sm mt-0.5" style={{ color: textMuted }}>
            Gerencie seu programa de afiliados e comissões
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textMuted }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = neon; (e.currentTarget as HTMLElement).style.borderColor = neon + "50"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = textMuted; (e.currentTarget as HTMLElement).style.borderColor = inputBorder; }}>
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{
              background: `linear-gradient(135deg, ${neon}, color-mix(in srgb, ${neon} 75%, black))`,
              color: "#000", boxShadow: `0 0 16px ${neon}40`,
            }}>
            <UserPlus className="w-4 h-4" /> Convidar Afiliado
          </button>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? Array.from({ length: 4 }).map((_, i) =>
          <Skeleton key={i} className="h-24 rounded-xl" style={{ background: inputBg }} />
        ) : stats ? ([
          { label: "Total de Afiliados", value: stats.totalAffiliates.toString(), icon: Users, color: neon },
          { label: "Afiliados Ativos", value: stats.activeAffiliates.toString(), icon: TrendingUp, color: "#69f0ae" },
          { label: "Comissões Pagas", value: formatCurrency(stats.totalCommissionPaid), icon: DollarSign, color: "#ffab40" },
          { label: "Vendas Geradas", value: stats.totalSalesGenerated.toLocaleString("pt-BR"), icon: BarChart2, color: "#e040fb" },
        ] as const).map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="gp-card p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: textMuted }}>{card.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${card.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
              </div>
              <span className="text-xl font-extrabold number-display" style={{ color: textPrimary }}>{card.value}</span>
            </div>
          );
        }) : null}
      </div>

      {/* ─── Invite Banner ─── */}
      {(affiliates ?? []).length === 0 && !isLoading && (
        <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5"
          style={{
            background: isDark ? "rgba(0,230,118,0.04)" : "rgba(0,168,79,0.04)",
            border: `1px dashed ${neon}40`,
          }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `${neon}15`, border: `1px solid ${neon}30` }}>
            <Users className="w-8 h-8" style={{ color: neon }} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-bold text-base" style={{ color: textPrimary }}>Lance seu programa de afiliados</h3>
            <p className="text-sm mt-1" style={{ color: textMuted }}>
              Cresça seu negócio com afiliados que promovem seus produtos. Defina comissões e comece a receber vendas automáticas.
            </p>
          </div>
          <button onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shrink-0"
            style={{ background: `${neon}15`, color: neon, border: `1px solid ${neon}35` }}>
            <UserPlus className="w-4 h-4" /> Convidar Afiliado
          </button>
        </div>
      )}

      {/* ─── Filters + Search ─── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textMuted }} />
          <input
            placeholder="Buscar afiliado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} />
        </div>
        <div className="flex gap-2">
          {[
            { value: "", label: "Todos" },
            { value: "active", label: "Ativos" },
            { value: "pending", label: "Pendentes" },
            { value: "inactive", label: "Inativos" },
          ].map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={filter === f.value
                ? { background: `${neon}20`, color: neon, border: `1px solid ${neon}50` }
                : { background: inputBg, color: textMuted, border: `1px solid ${inputBorder}` }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="gp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}`, background: isDark ? "rgba(0,230,118,0.02)" : "rgba(0,0,0,0.02)" }}>
                {["Afiliado", "Comissão", "Vendas", "Ganhos", "Status", ""].map((h, i) => (
                  <th key={i}
                    className={`px-5 py-3 text-xs font-bold uppercase tracking-wider text-left
                      ${i === 2 || i === 3 ? "hidden md:table-cell" : ""}
                      ${i === 1 ? "hidden sm:table-cell" : ""}
                      ${i === 2 || i === 3 ? "text-right" : ""}`}
                    style={{ color: textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${borderColor}` }}>
                  <td colSpan={6} className="px-5 py-4">
                    <Skeleton className="h-6 w-full rounded" style={{ background: inputBg }} />
                  </td>
                </tr>
              )) : filtered.length > 0 ? filtered.map((a) => {
                const st = STATUS_STYLES[a.status] ?? STATUS_STYLES.inactive;
                return (
                  <tr key={a.id} className="transition-colors"
                    style={{ borderBottom: `1px solid ${borderColor}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(0,230,118,0.02)" : "rgba(0,0,0,0.015)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black text-sm"
                          style={{ background: `${neon}15`, color: neon, border: `1px solid ${neon}25` }}>
                          {a.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm" style={{ color: textPrimary }}>{a.name}</div>
                          <div className="text-xs" style={{ color: textMuted }}>{a.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold number-display" style={{ color: neon }}>
                          {a.commissionRate}%
                        </span>
                        <span className="text-xs" style={{ color: textMuted }}>comissão</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right font-bold hidden md:table-cell number-display" style={{ color: textPrimary }}>
                      {a.totalSales.toLocaleString("pt-BR")}
                    </td>

                    <td className="px-5 py-4 text-right font-bold hidden md:table-cell number-display" style={{ color: neon }}>
                      {formatCurrency(a.totalCommission)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                        {st.label}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        className="p-2 rounded-lg transition-all"
                        style={{ color: textMuted }}
                        title="Copiar link de afiliado"
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = neon; (e.currentTarget as HTMLElement).style.background = `${neon}12`; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = textMuted; (e.currentTarget as HTMLElement).style.background = ""; }}>
                        <Link2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-5 py-20 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3" style={{ color: `${neon}30` }} />
                    <p className="font-medium mb-2" style={{ color: textPrimary }}>
                      {search || filter ? "Nenhum afiliado encontrado" : "Sem afiliados ainda"}
                    </p>
                    <p className="text-sm mb-4" style={{ color: textMuted }}>
                      {search || filter ? "Tente outros filtros" : "Convide seus primeiros afiliados para aumentar suas vendas"}
                    </p>
                    {!search && !filter && (
                      <button onClick={() => setInviteOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
                        style={{ background: `${neon}15`, color: neon, border: `1px solid ${neon}30` }}>
                        <UserPlus className="w-4 h-4" /> Convidar Afiliado
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} isDark={isDark} neon={neon} />
      <ProgramSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} isDark={isDark} neon={neon} />
    </div>
  );
}
