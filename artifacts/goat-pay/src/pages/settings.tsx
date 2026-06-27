import { Settings as SettingsIcon, User, Bell, Shield, Webhook } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracoes</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie sua conta e preferencias.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: User, title: "Perfil", desc: "Nome, e-mail, foto de perfil e dados pessoais." },
          { icon: Shield, title: "Seguranca", desc: "Senha, autenticacao em dois fatores e sessoes." },
          { icon: Bell, title: "Notificacoes", desc: "Configure alertas por e-mail e push." },
          { icon: Webhook, title: "Integracoes", desc: "APIs, webhooks e conexoes externas." },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              className="bg-card border border-border rounded-xl p-5 flex items-start gap-4 hover:border-primary/30 transition-colors text-left w-full"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">{item.title}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{item.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Profile Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Perfil do Operador</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-secondary border border-border flex items-center justify-center text-xl font-bold">
            OP
          </div>
          <div>
            <div className="font-semibold text-foreground">Operador Principal</div>
            <div className="text-sm text-muted-foreground">admin@goatpay.com</div>
            <div className="text-xs text-primary mt-1">Elite Member</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</label>
            <input defaultValue="Operador Principal" className="mt-1.5 w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">E-mail</label>
            <input defaultValue="admin@goatpay.com" className="mt-1.5 w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
            Salvar Alteracoes
          </button>
        </div>
      </div>
    </div>
  );
}
