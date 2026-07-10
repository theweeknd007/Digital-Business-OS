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
import { useNotifications, NOTIF_ICONS, NOTIF_COLORS } from "@/contexts/NotificationsContext";
import { useAuth } from "@/contexts/AuthContext";

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
      { href: "/dashboard", label: "Analytics", icon: BarChart2 },
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
      { href: "/notifications", label: "Notificações", icon: Bell },
      { href: "/settings", label: "Configurações", icon: Settings },
    ],
  },
];

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  return `${Math.floor(diff / 3600)}h`;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const { user, logout, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isDark = theme === "dark";
  const sidebarBg = isDark
    ? "linear-gradient(180deg, hsl(135,25%,4%) 0%, hsl(135,22%,3%) 100%)"
    : "linear-gradient(180deg, #ffffff 0%, #f8faf9 100%)";
  const borderColor = isDark ? "rgba(0,230,118,0.12)" : "rgba(0,0,0,0.08)";
  const topbarBg = isDark ? "rgba(5,15,8,0.9)" : "rgba(255,255,255,0.95)";
  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const surfaceColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const neon = isDark ? "#00e676" : "#00a84f";

  // Top 4 recent notifications for the dropdown
  const recentNotifs = notifications.slice(0, 4);

  function handleNotifClick(id: string) {
    markRead(id);
  }

  function goToNotifications() {
    setNotifOpen(false);
    setLocation("/notifications");
  }

  return (
    <div className="min-h-screen flex" style={{ background: isDark ? "hsl(135,20%,2%)" : "#f0f4f2" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Click-outside overlay for dropdowns */}
      {(notifOpen || profileOpen) && (
        <div className="fixed inset-0 z-30" onClick={() => { setNotifOpen(false); setProfileOpen(false); }} />
      )}

      {/* ═══ SIDEBAR ═══ */}
      <aside
        className={`shrink-0 flex flex-col z-50 transition-transform duration-300
          fixed lg:sticky top-0 h-screen w-[240px]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ background: sidebarBg, borderRight: `1px solid ${borderColor}` }}>

        {/* Glow strip */}
        {isDark && (
          <div className="absolute top-0 left-0 h-full w-px pointer-events-none">
            <div style={{
              position: "absolute", top: "10%", left: 0, width: 1, height: "80%",
              background: "linear-gradient(180deg, transparent, #00e676, transparent)", opacity: 0.35,
            }} />
          </div>
        )}

        {/* Mobile close */}
        <button className="absolute top-3 right-3 lg:hidden p-1.5 rounded-lg"
          style={{ background: surfaceColor }} onClick={() => setMobileOpen(false)}>
          <X className="w-4 h-4" style={{ color: textMuted }} />
        </button>

        {/* Logo */}
        <div className="flex flex-col items-center py-6 px-4 gap-1.5" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <img src="/goat-logo.png" alt="GOAT-PAY" className="w-14 h-14 object-contain logo-glow" />
          <span className="text-lg font-black tracking-[0.2em] glow-text">GOAT-PAY</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-3 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: textMuted }}>
                  {group.label}
                </span>
              </div>
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const exactActive = location === href && label !== "Clientes" && label !== "Assinaturas" &&
                    label !== "Área de Membros" && label !== "Marketing" && label !== "Analytics" &&
                    label !== "Extrato" && label !== "IA GOAT" && label !== "Integrações" &&
                    label !== "Suporte" && label !== "Administrador";
                  return (
                    <Link key={label} href={href}>
                      <div
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium transition-all ${exactActive ? "sidebar-item-active" : "sidebar-item"}`}>
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="flex-1">{label}</span>
                        {label === "Notificações" && unreadCount > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center"
                            style={{ background: neon, color: "#000", fontSize: 10 }}>
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                        {exactActive && <ChevronRight className="w-3 h-3 opacity-60" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Admin link (admin users only) */}
        {isAdmin && (
          <Link href="/admin">
            <div onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 mx-2 mb-2 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-bold transition-all ${location === "/admin" ? "sidebar-item-active" : "sidebar-item"}`}
              style={{ border: `1px solid ${location === "/admin" ? neon + "40" : "transparent"}` }}>
              <Shield className="w-4 h-4 shrink-0" />
              <span className="flex-1">Painel Admin</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black"
                style={{ background: "#6366f120", color: "#6366f1" }}>ADM</span>
            </div>
          </Link>
        )}

        {/* User bottom */}
        <div className="p-3 shrink-0" style={{ borderTop: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-black"
              style={{ background: isDark ? "rgba(0,230,118,0.12)" : "rgba(0,180,80,0.08)", border: `1.5px solid ${neon}33`, color: neon }}>
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate" style={{ color: textPrimary }}>{user?.name ?? "..."}</div>
              <div className="text-[10px] truncate" style={{ color: neon }}>
                {user?.role === "admin" ? "Administrador" : "Elite Member"}
              </div>
            </div>
            <button onClick={async () => { await logout(); setLocation("/login"); }}
              className="p-1.5 rounded-lg transition-all"
              style={{ background: surfaceColor }}
              title="Sair">
              <LogOut className="w-3.5 h-3.5" style={{ color: textMuted }} />
            </button>
          </div>
        </div>
      </aside>

      {/* ═══ MAIN AREA ═══ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* ═══ TOPBAR ═══ */}
        <header className="h-14 shrink-0 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20"
          style={{ background: topbarBg, borderBottom: `1px solid ${borderColor}`, backdropFilter: "blur(16px)" }}>

          {/* Left */}
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg" onClick={() => setMobileOpen(true)}
              style={{ background: surfaceColor }}>
              <Menu className="w-4 h-4" style={{ color: textPrimary }} />
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer"
              style={{ background: surfaceColor, border: `1px solid ${borderColor}`, minWidth: 220 }}>
              <Search className="w-3.5 h-3.5" style={{ color: textMuted }} />
              <span className="text-sm" style={{ color: textMuted }}>Pesquisar...</span>
              <span className="ml-auto text-xs px-1.5 py-0.5 rounded"
                style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: textMuted }}>⌘K</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">
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

            {/* ─── Notifications ─── */}
            <div className="relative">
              <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                style={{
                  background: notifOpen ? `${neon}15` : surfaceColor,
                  border: `1px solid ${notifOpen ? neon + "50" : borderColor}`,
                }}>
                <Bell className="w-4 h-4" style={{ color: notifOpen ? neon : textMuted }} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                    style={{ background: neon, color: "#000", boxShadow: `0 0 8px ${neon}` }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-10 w-80 rounded-2xl overflow-hidden z-50 shadow-2xl"
                  style={{
                    background: isDark ? "hsl(135,20%,5%)" : "#fff",
                    border: `1px solid ${borderColor}`,
                    boxShadow: isDark ? "0 24px 60px rgba(0,0,0,0.7)" : "0 24px 60px rgba(0,0,0,0.15)",
                  }}>
                  {/* Header */}
                  <div className="px-4 py-3 flex items-center justify-between"
                    style={{ borderBottom: `1px solid ${borderColor}` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: textPrimary }}>Notificações</span>
                      {unreadCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background: `${neon}20`, color: neon }}>
                          {unreadCount} novas
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead}
                        className="text-xs font-semibold transition-all"
                        style={{ color: textMuted }}
                        onMouseEnter={(e) => ((e.target as HTMLElement).style.color = neon)}
                        onMouseLeave={(e) => ((e.target as HTMLElement).style.color = textMuted)}>
                        Marcar lidas
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-72 overflow-y-auto">
                    {recentNotifs.length === 0 ? (
                      <div className="py-8 text-center text-sm" style={{ color: textMuted }}>
                        Sem notificações
                      </div>
                    ) : recentNotifs.map((n) => {
                      const color = NOTIF_COLORS[n.type];
                      return (
                        <div key={n.id}
                          onClick={() => handleNotifClick(n.id)}
                          className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-all"
                          style={{
                            borderBottom: `1px solid ${borderColor}`,
                            background: !n.read ? (isDark ? `${color}06` : `${color}04`) : "transparent",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = !n.read ? (isDark ? `${color}06` : `${color}04`) : "transparent")}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm"
                            style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                            {NOTIF_ICONS[n.type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold truncate" style={{ color: textPrimary }}>{n.title}</span>
                              {!n.read && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />}
                            </div>
                            <div className="text-xs truncate mt-0.5" style={{ color: textMuted }}>{n.message}</div>
                            {n.amount !== undefined && (
                              <div className="text-xs font-bold mt-0.5 number-display" style={{ color }}>
                                {n.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] shrink-0 mt-0.5" style={{ color: textMuted }}>
                            {timeAgo(n.timestamp)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="p-3 text-center" style={{ borderTop: `1px solid ${borderColor}` }}>
                    <button onClick={goToNotifications}
                      className="text-xs font-bold transition-all"
                      style={{ color: neon }}>
                      Ver todas as notificações →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ─── Profile ─── */}
            <div className="relative">
              <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all"
                style={{
                  background: profileOpen ? `${neon}10` : surfaceColor,
                  border: `1px solid ${profileOpen ? neon + "40" : borderColor}`,
                }}>
                <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                  style={{ background: isDark ? "rgba(0,230,118,0.15)" : "rgba(0,180,80,0.1)" }}>
                  <img src="/goat-logo.png" alt="user" className="w-5 h-5 object-contain" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold leading-tight" style={{ color: textPrimary }}>{user?.name?.split(" ")[0] ?? "..."}</div>
                  <div className="text-[10px] leading-tight" style={{ color: neon }}>
                    {user?.role === "admin" ? "Admin" : "Elite"}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 hidden sm:block" style={{ color: textMuted }} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-10 w-56 rounded-2xl overflow-hidden z-50 shadow-2xl"
                  style={{
                    background: isDark ? "hsl(135,20%,5%)" : "#fff",
                    border: `1px solid ${borderColor}`,
                    boxShadow: isDark ? "0 24px 60px rgba(0,0,0,0.7)" : "0 24px 60px rgba(0,0,0,0.15)",
                  }}>
                  <div className="p-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black"
                        style={{ background: isDark ? "rgba(0,230,118,0.12)" : "rgba(0,180,80,0.08)", border: `1.5px solid ${neon}33`, color: neon }}>
                        {user?.name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                      <div>
                        <div className="text-sm font-bold" style={{ color: textPrimary }}>{user?.name ?? "..."}</div>
                        <div className="text-xs" style={{ color: textMuted }}>{user?.email ?? ""}</div>
                      </div>
                    </div>
                    <div className="text-[10px] px-2 py-0.5 rounded-full inline-block font-bold"
                      style={{
                        background: user?.role === "admin" ? "#6366f120" : `${neon}20`,
                        color: user?.role === "admin" ? "#6366f1" : neon,
                      }}>
                      {user?.role === "admin" ? "Administrador" : "Elite Member"}
                    </div>
                  </div>
                  {[
                    { icon: User, label: "Meu perfil", href: "/settings" },
                    { icon: Bell, label: "Notificações", href: "/notifications" },
                    { icon: Settings, label: "Configurações", href: "/settings" },
                    { icon: Shield, label: "Segurança", href: "/settings" },
                  ].map(({ icon: Icon, label, href }) => (
                    <Link key={label} href={href}>
                      <div className="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-all"
                        style={{ color: textMuted, borderBottom: `1px solid ${borderColor}` }}
                        onClick={() => setProfileOpen(false)}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"; (e.currentTarget as HTMLElement).style.color = textPrimary; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = textMuted; }}>
                        <Icon className="w-4 h-4" />
                        {label}
                        {label === "Notificações" && unreadCount > 0 && (
                          <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: `${neon}20`, color: neon }}>
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-all"
                    style={{ color: "#f44336" }}
                    onClick={async () => { setProfileOpen(false); await logout(); setLocation("/login"); }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(244,67,54,0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <LogOut className="w-4 h-4" />
                    Sair da conta
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ═══ PAGE CONTENT ═══ */}
        <main className="flex-1 relative overflow-y-auto">
          {/* Watermark */}
          <img src="/goat-logo.png" alt="" aria-hidden="true" className="page-watermark object-contain select-none pointer-events-none"
            style={{ position: "fixed", bottom: "-8%", right: "-6%", width: 340, height: 340, zIndex: 0, opacity: 0.025 }} />

          {/* Grid bg */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `linear-gradient(${isDark ? "rgba(0,230,118,0.022)" : "rgba(0,150,60,0.03)"} 1px, transparent 1px),
              linear-gradient(90deg, ${isDark ? "rgba(0,230,118,0.022)" : "rgba(0,150,60,0.03)"} 1px, transparent 1px)`,
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
