import { useState } from "react";
import { Settings as SettingsIcon, User, Bell, Shield, Plug, Globe, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

type TabId = "profile" | "notifications" | "security" | "integrations";

const TABS: { id: TabId; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "security", label: "Segurança", icon: Shield },
  { id: "integrations", label: "Integrações", icon: Plug },
];

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const neon = isDark ? "#00e676" : "#00a84f";
  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const borderColor = isDark ? "rgba(0,230,118,0.15)" : "rgba(0,0,0,0.08)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  const [tab, setTab] = useState<TabId>("profile");

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all";
  const inputSty = { background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary };

  const labelCls = "text-xs font-semibold uppercase tracking-wider block mb-1.5";
  const labelSty = { color: textMuted };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: textPrimary }}>Configurações</h1>
        <p className="text-sm mt-0.5" style={{ color: textMuted }}>Gerencie sua conta e preferências.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar tabs */}
        <div className="lg:w-52 shrink-0">
          <div className="gp-card p-2 flex flex-row lg:flex-col gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-all ${tab === id ? "sidebar-item-active" : "sidebar-item"}`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline lg:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 gp-card p-6 space-y-5">
          {tab === "profile" && (
            <>
              <h2 className="font-bold" style={{ color: textPrimary }}>Informações do Perfil</h2>
              <div className="flex items-center gap-4 pb-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `${neon}15`, border: `2px solid ${neon}40` }}>
                  <img src="/goat-logo.png" alt="avatar" className="w-12 h-12 object-contain" />
                </div>
                <div>
                  <div className="font-bold" style={{ color: textPrimary }}>SKILL</div>
                  <div className="text-sm" style={{ color: textMuted }}>skill@goatpay.com</div>
                  <button className="mt-1 text-xs font-semibold" style={{ color: neon }}>Alterar foto</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Nome completo", placeholder: "SKILL", type: "text" },
                  { label: "E-mail", placeholder: "skill@goatpay.com", type: "email" },
                  { label: "Telefone", placeholder: "+55 (11) 99999-9999", type: "tel" },
                  { label: "CPF / CNPJ", placeholder: "000.000.000-00", type: "text" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className={labelCls} style={labelSty}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} defaultValue={f.placeholder} className={inputCls} style={inputSty} />
                  </div>
                ))}
              </div>

              {/* Theme preference */}
              <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: 16 }}>
                <h3 className="font-semibold text-sm mb-3" style={{ color: textPrimary }}>Tema da Interface</h3>
                <div className="flex gap-3">
                  {[
                    { value: "dark", label: "Dark", icon: Moon },
                    { value: "light", label: "Light", icon: Sun },
                  ].map(({ value, label, icon: Icon }) => (
                    <button key={value} onClick={toggleTheme}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={theme === value
                        ? { background: `${neon}20`, color: neon, border: `1.5px solid ${neon}50` }
                        : { background: inputBg, color: textMuted, border: `1px solid ${inputBorder}` }}>
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button className="gp-btn px-6 py-2.5 rounded-xl text-sm font-bold">Salvar alterações</button>
            </>
          )}

          {tab === "notifications" && (
            <>
              <h2 className="font-bold mb-4" style={{ color: textPrimary }}>Preferências de Notificações</h2>
              <div className="space-y-4">
                {[
                  { label: "Nova venda", desc: "Quando uma nova venda é aprovada" },
                  { label: "Reembolso", desc: "Quando um cliente solicita reembolso" },
                  { label: "Novo afiliado", desc: "Quando alguém se cadastra como afiliado" },
                  { label: "Saque aprovado", desc: "Confirmação de saque processado" },
                  { label: "Falha de pagamento", desc: "Quando um pagamento é recusado" },
                ].map((n, i) => (
                  <div key={n.label} className="flex items-center justify-between py-3" style={{ borderBottom: i < 4 ? `1px solid ${borderColor}` : undefined }}>
                    <div>
                      <div className="text-sm font-medium" style={{ color: textPrimary }}>{n.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: textMuted }}>{n.desc}</div>
                    </div>
                    <button
                      className="relative w-11 h-6 rounded-full transition-all duration-200"
                      style={{ background: i % 2 === 0 ? neon : inputBg }}
                      onClick={() => {}}>
                      <span className="absolute top-0.5 transition-all duration-200 w-5 h-5 rounded-full bg-white shadow"
                        style={{ left: i % 2 === 0 ? "calc(100% - 22px)" : "2px" }} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "security" && (
            <>
              <h2 className="font-bold mb-4" style={{ color: textPrimary }}>Segurança</h2>
              <div className="space-y-5">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Alterar Senha</h3>
                  {["Senha atual", "Nova senha", "Confirmar nova senha"].map((l) => (
                    <div key={l}>
                      <label className={labelCls} style={labelSty}>{l}</label>
                      <input type="password" className={inputCls} style={inputSty} placeholder="••••••••" />
                    </div>
                  ))}
                  <button className="gp-btn px-5 py-2.5 rounded-xl text-sm font-bold">Atualizar senha</button>
                </div>

                <div className="pt-4" style={{ borderTop: `1px solid ${borderColor}` }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Autenticação em 2 Etapas</h3>
                      <p className="text-xs mt-0.5" style={{ color: textMuted }}>Proteja sua conta com verificação adicional</p>
                    </div>
                    <button className="px-4 py-2 rounded-xl text-xs font-bold"
                      style={{ background: `${neon}15`, color: neon, border: `1px solid ${neon}30` }}>
                      Ativar 2FA
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "integrations" && (
            <>
              <h2 className="font-bold mb-4" style={{ color: textPrimary }}>Integrações</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "Stripe", desc: "Cartão de crédito internacional", connected: false },
                  { name: "PIX", desc: "Pagamentos instantâneos Brasil", connected: true },
                  { name: "M-Pesa", desc: "Pagamentos Moçambique / África", connected: false },
                  { name: "e-Mola", desc: "Carteira digital Moçambique", connected: false },
                  { name: "PayPal", desc: "Pagamentos globais", connected: false },
                  { name: "WhatsApp", desc: "Notificações via WhatsApp", connected: false },
                ].map((intg) => (
                  <div key={intg.name} className="p-4 rounded-xl flex items-center justify-between gap-3"
                    style={{ background: inputBg, border: `1px solid ${intg.connected ? `${neon}30` : inputBorder}` }}>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: textPrimary }}>{intg.name}</div>
                      <div className="text-xs" style={{ color: textMuted }}>{intg.desc}</div>
                    </div>
                    <button
                      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={intg.connected
                        ? { background: `${neon}15`, color: neon, border: `1px solid ${neon}30` }
                        : { background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: textMuted, border: `1px solid ${inputBorder}` }}>
                      {intg.connected ? "Conectado ✓" : "Conectar"}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
