import { Settings as SettingsIcon, User, Bell, Shield, Plug } from "lucide-react";

const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "white" };
const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition-colors";

export default function Settings() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Configurações</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Gerencie sua conta e preferências.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: User, title: "Perfil", desc: "Nome, e-mail, foto de perfil e dados pessoais." },
          { icon: Shield, title: "Segurança", desc: "Senha, autenticação em dois fatores e sessões." },
          { icon: Bell, title: "Notificações", desc: "Configure alertas por e-mail e push." },
          { icon: Plug, title: "Integrações", desc: "APIs, webhooks e conexões externas." },
        ].map(({ icon: Icon, title, desc }) => (
          <button key={title} className="glow-card rounded-xl p-5 flex items-start gap-4 text-left w-full transition-all">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)" }}>
              <Icon className="w-5 h-5" style={{ color: "#00e676" }} />
            </div>
            <div>
              <div className="font-semibold text-white">{title}</div>
              <div className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="glow-card rounded-xl p-6">
        <h2 className="font-bold text-white mb-5">Perfil do Operador</h2>
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden"
            style={{ background: "rgba(0,230,118,0.08)", border: "2px solid rgba(0,230,118,0.3)", boxShadow: "0 0 20px rgba(0,230,118,0.15)" }}>
            <img src="/goat-logo.png" alt="avatar" className="w-12 h-12 object-contain logo-glow" />
          </div>
          <div>
            <div className="font-bold text-white text-lg">Operador Principal</div>
            <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>admin@goatpay.com</div>
            <span className="text-xs font-bold px-2 py-0.5 rounded mt-1 inline-block"
              style={{ background: "rgba(0,230,118,0.12)", color: "#00e676", border: "1px solid rgba(0,230,118,0.2)" }}>
              Elite Member
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[["Nome", "Operador Principal"], ["E-mail", "admin@goatpay.com"]].map(([label, val]) => (
            <div key={label}>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
                style={{ color: "rgba(255,255,255,0.4)" }}>{label}</label>
              <input defaultValue={val} className={inputCls} style={inputStyle} />
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <button className="glow-btn px-5 py-2.5 rounded-xl text-sm font-bold text-black">
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
