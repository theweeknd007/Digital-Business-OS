import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  BarChart2,
  RotateCcw,
  Users,
  FileText,
  Settings,
  Plug,
  HelpCircle,
  Bell,
  ChevronDown,
  ArrowRight,
  Wallet,
  Menu,
  X,
  Bookmark,
  TrendingUp,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Produtos", icon: Package },
  { href: "/sales", label: "Vendas", icon: ShoppingCart },
  { href: "/products", label: "Assinaturas", icon: Bookmark },
  { href: "/sales", label: "Relatórios", icon: BarChart2 },
  { href: "/sales", label: "Reembolsos", icon: RotateCcw },
  { href: "/affiliates", label: "Afiliados", icon: Users },
  { href: "/wallet", label: "Extrato", icon: FileText },
  { href: "/settings", label: "Configurações", icon: Settings },
  { href: "/settings", label: "Integrações", icon: Plug },
  { href: "/settings", label: "Suporte", icon: HelpCircle },
];

const GlowStrip = () => (
  <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
    <div style={{
      position: "absolute",
      top: 40, left: -2, width: 8, height: "85%",
      background: "linear-gradient(180deg, transparent 0%, #00e676 15%, #00e676 85%, transparent 100%)",
      opacity: 0.45,
      filter: "blur(4px)",
    }} />
    <div style={{
      position: "absolute",
      top: 40, left: 0, width: 2, height: "85%",
      background: "linear-gradient(180deg, transparent 0%, #00e676 15%, #00e676 85%, transparent 100%)",
      opacity: 0.7,
      filter: "blur(1px)",
    }} />
  </div>
);

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex dark" style={{ background: "hsl(135,20%,2%)" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`relative shrink-0 flex flex-col z-50 transition-transform duration-300 fixed lg:static h-full
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          w-[220px] lg:w-[220px]`}
        style={{
          background: "linear-gradient(180deg, hsl(135,25%,4%) 0%, hsl(135,22%,3%) 100%)",
          borderRight: "1px solid rgba(0,230,118,0.1)",
        }}
      >
        <GlowStrip />
        {/* Logo */}
        <div className="flex flex-col items-center py-8 px-4 gap-3" style={{ borderBottom: "1px solid rgba(0,230,118,0.08)" }}>
          <img
            src="/goat-logo.png"
            alt="GOAT-PAY"
            className="w-20 h-20 object-contain logo-glow"
          />
          <span className="text-2xl font-black tracking-widest glow-text" style={{ letterSpacing: "0.15em" }}>
            GOAT-PAY
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href !== "/" && location.startsWith(href));
            return (
              <Link key={label} href={href}>
                <div
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-r-lg cursor-pointer ${
                    active ? "sidebar-item-active" : "sidebar-item"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" style={{ color: active ? "#00e676" : "inherit" }} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4" style={{ borderTop: "1px solid rgba(0,230,118,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden flex items-center justify-center"
              style={{ background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)", boxShadow: "0 0 10px rgba(0,230,118,0.2)" }}>
              <img src="/goat-logo.png" alt="user" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">SKILL</div>
              <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>ESCALAPAY · HOTMART</div>
              <div className="text-xs font-bold mt-0.5 px-1.5 py-0.5 rounded inline-block"
                style={{ background: "rgba(0,230,118,0.12)", color: "#00e676", fontSize: "9px", letterSpacing: "0.05em" }}>
                Elite Member
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 shrink-0 flex items-center justify-between px-6"
          style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(0,230,118,0.08)", backdropFilter: "blur(8px)" }}>
          {/* Mobile hamburger */}
          <button className="lg:hidden p-2 rounded-lg" style={{ border: "1px solid rgba(0,230,118,0.2)" }} onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" style={{ color: "#00e676" }} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <Link href="/wallet">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all"
                style={{ background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)", color: "#00e676" }}>
                <FileText className="w-3.5 h-3.5" />
                Ver Extrato
              </div>
            </Link>
            <button className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Bell className="w-4 h-4" style={{ color: "rgba(255,255,255,0.6)" }} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "#00e676", boxShadow: "0 0 6px #00e676" }} />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)" }}>
                <img src="/goat-logo.png" alt="user" className="w-5 h-5 object-contain" />
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-white leading-tight">SKILL</div>
                <div className="text-xs leading-tight" style={{ color: "#00e676", fontSize: "10px" }}>Elite</div>
              </div>
              <ChevronDown className="w-3 h-3 hidden sm:block" style={{ color: "rgba(255,255,255,0.4)" }} />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto grid-bg">
          <div className="max-w-[1400px] mx-auto p-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
