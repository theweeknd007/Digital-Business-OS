import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Package, ShoppingCart, Users, CreditCard,
  BarChart2, Wallet, FileText, Settings, Plug, HelpCircle,
  Bell, ChevronDown, Menu, X, Sun, Moon, Search, Plus,
  Globe, BookOpen, Brain, ChevronRight, Shield, Star,
  RefreshCw, DollarSign, LogOut, User, Bookmark,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

type NavGroup = {
  label: string;
  items: { href: string; label: string; icon: React.FC<{ className?: string }> }[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/products", label: "Produtos", icon: Package },
      { href: "/sales", label: "Pedidos", icon: ShoppingCart },
      { href: "/sales", label: "Clientes", icon: Users },
      { href: "/products", label: "Assinaturas", icon: Bookmark },
      { href: "/products", label: "Área de Membros", icon: BookOpen },
    ],
  },
  {
    label: "Crescimento",
    items: [
      { href: "/affiliates", label: "Afiliados", icon: Star },
      { href: "/sales", label: "Marketing", icon: BarChart2 },
      { href: "/settings", label: "Analytics", icon: BarChart2 },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { href: "/wallet", label: "Carteira", icon: Wallet },
      { href: "/withdrawals", label: "Saques", icon: DollarSign },
      { href: "/wallet", label: "Extrato", icon: FileText },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/settings", label: "Integrações", icon: Plug },
      { href: "/settings", label: "IA GOAT", icon: Brain },
      { href: "/settings", label: "Suporte", icon: HelpCircle },
      { href: "/settings", label: "Configurações", icon: Settings },
      { href: "/settings", label: "Administrador", icon: Shield },
    ],
  },
];

const NOTIFICATIONS = [
  { id: 1, text: "Nova venda: R$ 997,00", time: "2 min", type: "sale" },
  { id: 2, text: "Saque aprovado: R$ 5.000,00", time: "1h", type: "withdraw" },
  { id: 3, text: "Novo afiliado cadastrado", time: "3h", type: "affiliate" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isDark = theme === "dark";

  const sidebarBg = isDark
    ? "linear-gradient(180deg, hsl(135,25%,4%) 0%, hsl(135,22%,3%) 100%)"
    : "linear-gradient(180deg, #ffffff 0%, #f8faf9 100%)";

  const borderColor = isDark ? "rgba(0,230,118,0.12)" : "rgba(0,0,0,0.08)";
  const topbarBg = isDark ? "rgba(5,15,8,0.85)" : "rgba(255,255,255,0.92)";
  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const surfaceColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const neon = isDark ? "#00e676" : "#00a84f";

  return (
    <div className="min-h-screen flex" style={{ background: isDark ? "hsl(135,20%,2%)" : "#f0f4f2" }}>
      {/* ─── Mobile overlay ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ─── Click-outside overlay for dropdowns ─── */}
      {(notifOpen || profileOpen) && (
        <div className="fixed inset-0 z-30" onClick={() => { setNotifOpen(false); setProfileOpen(false); }} />
      )}

      {/* ─── SIDEBAR ─── */}
      <aside
        className={`shrink-0 flex flex-col z-50 transition-transform duration-300
          fixed lg:sticky top-0 h-screen
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          w-[240px]`}
        style={{ background: sidebarBg, borderRight: `1px solid ${borderColor}` }}
      >
        {/* Glow strip (dark only) */}
        {isDark && (
          <div className="absolute top-0 left-0 h-full pointer-events-none" style={{ width: 1 }}>
            <div style={{
              position: "absolute", top: "10%", left: 0, width: 1, height: "80%",
              background: "linear-gradient(180deg, transparent, #00e676, transparent)", opacity: 0.4,
            }} />
          </div>
        )}

        {/* Logo */}
        <div className="flex flex-col items-center py-7 px-4 gap-2" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <img src="/goat-logo.png" alt="GOAT-PAY" className="w-16 h-16 object-contain logo-glow" />
          <span className="text-xl font-black tracking-[0.18em] glow-text">GOAT-PAY</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-4 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: textMuted }}>
                  {group.label}
                </span>
              </div>
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = location === href || (href !== "/" && location.startsWith(href) && href !== "/sales" && href !== "/settings" && href !== "/products") || (location === href);
                  const exactActive = location === href;
                  return (
                    <Link key={label} href={href}>
                      <div
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm font-medium transition-all
                          ${exactActive ? "sidebar-item-active" : "sidebar-item"}`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{label}</span>
                        {exactActive && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User bottom */}
        <div className="p-4 shrink-0" style={{ borderTop: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0"
              style={{ background: isDark ? "rgba(0,230,118,0.12)" : "rgba(0,180,80,0.08)", border: `1.5px solid ${neon}33` }}>
              <img src="/goat-logo.png" alt="user" className="w-7 h-7 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate" style={{ color: textPrimary }}>SKILL</div>
              <div className="text-[10px] truncate" style={{ color: textMuted }}>Elite Member</div>
            </div>
            <button onClick={() => setLocation("/login")} className="p-1.5 rounded-lg transition-all"
              style={{ background: surfaceColor }}>
              <LogOut className="w-3.5 h-3.5" style={{ color: textMuted }} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MAIN AREA ─── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* ─── TOPBAR ─── */}
        <header className="h-14 shrink-0 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20"
          style={{ background: topbarBg, borderBottom: `1px solid ${borderColor}`, backdropFilter: "blur(12px)" }}>

          {/* Left: hamburger + search */}
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg" onClick={() => setMobileOpen(true)}
              style={{ background: surfaceColor }}>
              <Menu className="w-4 h-4" style={{ color: textPrimary }} />
            </button>

            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer"
              style={{ background: surfaceColor, border: `1px solid ${borderColor}`, minWidth: 220 }}
              onClick={() => setSearchOpen(true)}>
              <Search className="w-3.5 h-3.5" style={{ color: textMuted }} />
              <span className="text-sm" style={{ color: textMuted }}>Pesquisar...</span>
              <span className="ml-auto text-xs px-1.5 py-0.5 rounded" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: textMuted }}>⌘K</span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Create product */}
            <Link href="/products">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer gp-btn">
                <Plus className="w-3.5 h-3.5" />
                Criar Produto
              </div>
            </Link>

            {/* Theme toggle */}
            <button onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: surfaceColor, border: `1px solid ${borderColor}` }}>
              {isDark
                ? <Sun className="w-4 h-4" style={{ color: "#fbbf24" }} />
                : <Moon className="w-4 h-4" style={{ color: "#6366f1" }} />}
            </button>

            {/* Language */}
            <button className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center"
              style={{ background: surfaceColor, border: `1px solid ${borderColor}` }}>
              <Globe className="w-4 h-4" style={{ color: textMuted }} />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ background: surfaceColor, border: `1px solid ${borderColor}` }}>
                <Bell className="w-4 h-4" style={{ color: textMuted }} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ background: neon, boxShadow: `0 0 6px ${neon}` }} />
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-10 w-80 rounded-xl overflow-hidden z-50 shadow-2xl"
                  style={{ background: isDark ? "hsl(135,20%,5%)" : "#fff", border: `1px solid ${borderColor}` }}>
                  <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${borderColor}` }}>
                    <span className="text-sm font-bold" style={{ color: textPrimary }}>Notificações</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: `${neon}20`, color: neon }}>{NOTIFICATIONS.length} novas</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {NOTIFICATIONS.map((n) => (
                      <div key={n.id} className="px-4 py-3 hover:bg-opacity-50 transition-all cursor-pointer"
                        style={{ borderBottom: `1px solid ${borderColor}` }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <div className="text-xs font-medium" style={{ color: textPrimary }}>{n.text}</div>
                        <div className="text-xs mt-0.5" style={{ color: textMuted }}>há {n.time}</div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 text-center">
                    <button className="text-xs font-medium" style={{ color: neon }}>Ver todas</button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer"
                style={{ background: surfaceColor, border: `1px solid ${borderColor}` }}>
                <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                  style={{ background: isDark ? "rgba(0,230,118,0.15)" : "rgba(0,180,80,0.1)" }}>
                  <img src="/goat-logo.png" alt="user" className="w-5 h-5 object-contain" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold leading-tight" style={{ color: textPrimary }}>SKILL</div>
                  <div className="text-[10px] leading-tight" style={{ color: neon }}>Elite</div>
                </div>
                <ChevronDown className="w-3 h-3 hidden sm:block" style={{ color: textMuted }} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-10 w-56 rounded-xl overflow-hidden z-50 shadow-2xl"
                  style={{ background: isDark ? "hsl(135,20%,5%)" : "#fff", border: `1px solid ${borderColor}` }}>
                  <div className="p-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
                    <div className="text-sm font-bold" style={{ color: textPrimary }}>SKILL</div>
                    <div className="text-xs" style={{ color: textMuted }}>skill@goatpay.com</div>
                    <div className="mt-1 text-[10px] px-2 py-0.5 rounded-full inline-block font-bold"
                      style={{ background: `${neon}20`, color: neon }}>Elite Member</div>
                  </div>
                  {[
                    { icon: User, label: "Meu perfil", href: "/settings" },
                    { icon: Settings, label: "Configurações", href: "/settings" },
                    { icon: Shield, label: "Segurança", href: "/settings" },
                  ].map(({ icon: Icon, label, href }) => (
                    <Link key={label} href={href}>
                      <div className="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-all"
                        style={{ color: textMuted }}
                        onClick={() => setProfileOpen(false)}
                        onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <Icon className="w-4 h-4" />
                        {label}
                      </div>
                    </Link>
                  ))}
                  <div style={{ borderTop: `1px solid ${borderColor}` }}>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all"
                      style={{ color: "#f44336" }} onClick={() => setLocation("/login")}>
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ─── PAGE CONTENT ─── */}
        <main className="flex-1 relative overflow-y-auto">
          {/* Watermark */}
          <img src="/goat-logo.png" alt="" className="page-watermark object-contain select-none pointer-events-none"
            style={{ position: "fixed", bottom: "-5%", right: "-5%", width: 380, height: 380, zIndex: 0 }} />

          {/* Grid bg */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(${isDark ? "rgba(0,230,118,0.025)" : "rgba(0,150,60,0.035)"} 1px, transparent 1px),
                linear-gradient(90deg, ${isDark ? "rgba(0,230,118,0.025)" : "rgba(0,150,60,0.035)"} 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }} />

          <div className="relative z-10 max-w-[1600px] mx-auto p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
