import { useNotifications, NOTIF_ICONS, NOTIF_COLORS, NotifType } from "@/contexts/NotificationsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Bell, CheckCheck, Trash2, Filter } from "lucide-react";
import { useState } from "react";

const TYPE_LABELS: Record<NotifType, string> = {
  sale: "Vendas", customer: "Clientes", affiliate: "Afiliados",
  payment: "Pagamentos", withdrawal: "Saques", error: "Erros",
  system: "Sistema", update: "Atualizações",
};

const FILTER_OPTIONS = [
  { value: "" as NotifType | "", label: "Todas" },
  { value: "sale" as NotifType, label: "Vendas" },
  { value: "payment" as NotifType, label: "Pagamentos" },
  { value: "customer" as NotifType, label: "Clientes" },
  { value: "affiliate" as NotifType, label: "Afiliados" },
  { value: "withdrawal" as NotifType, label: "Saques" },
  { value: "system" as NotifType, label: "Sistema" },
  { value: "error" as NotifType, label: "Erros" },
];

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

export default function NotificationsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const neon = isDark ? "#00e676" : "#00a84f";
  const textPrimary = isDark ? "#fff" : "#111";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const borderColor = isDark ? "rgba(0,230,118,0.15)" : "rgba(0,0,0,0.08)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications();
  const [filter, setFilter] = useState<NotifType | "">("");

  const filtered = filter ? notifications.filter((n) => n.type === filter) : notifications;

  // Stats by type
  const byType = notifications.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2" style={{ color: textPrimary }}>
            Notificações
            {unreadCount > 0 && (
              <span className="text-sm px-2.5 py-0.5 rounded-full font-bold"
                style={{ background: `${neon}20`, color: neon }}>
                {unreadCount} novas
              </span>
            )}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: textMuted }}>
            Central de alertas em tempo real
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold self-start sm:self-auto transition-all"
            style={{ background: `${neon}15`, color: neon, border: `1px solid ${neon}30` }}>
            <CheckCheck className="w-4 h-4" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Type stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {FILTER_OPTIONS.slice(1).map(({ value, label }) => {
          const count = byType[value] ?? 0;
          const color = NOTIF_COLORS[value as NotifType];
          return (
            <button key={value} onClick={() => setFilter(filter === value ? "" : value as NotifType)}
              className="gp-card p-3 text-center transition-all"
              style={filter === value
                ? { border: `1px solid ${color}60`, background: `${color}12` }
                : {}}>
              <div className="text-lg">{NOTIF_ICONS[value as NotifType]}</div>
              <div className="text-xs font-medium mt-1" style={{ color: textMuted }}>{label}</div>
              {count > 0 && <div className="text-sm font-extrabold" style={{ color }}>{count}</div>}
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button key={value} onClick={() => setFilter(value)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={filter === value
              ? { background: `${neon}20`, color: neon, border: `1px solid ${neon}50` }
              : { background: inputBg, color: textMuted, border: `1px solid ${inputBorder}` }}>
            {label}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="gp-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: `${neon}30` }} />
            <p style={{ color: textMuted }}>Nenhuma notificação.</p>
          </div>
        ) : (
          <div>
            {filtered.map((n, i) => {
              const color = NOTIF_COLORS[n.type];
              return (
                <div key={n.id}
                  className="flex items-start gap-4 px-5 py-4 cursor-pointer transition-all"
                  style={{
                    borderBottom: i < filtered.length - 1 ? `1px solid ${borderColor}` : undefined,
                    background: !n.read ? (isDark ? `${color}06` : `${color}04`) : "transparent",
                  }}
                  onClick={() => markRead(n.id)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = !n.read ? (isDark ? `${color}06` : `${color}04`) : "transparent")}>

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                    style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                    {NOTIF_ICONS[n.type]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold flex items-center gap-2" style={{ color: textPrimary }}>
                          {n.title}
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 inline-block"
                              style={{ background: color }} />
                          )}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: textMuted }}>{n.message}</div>
                        {n.amount !== undefined && (
                          <div className="text-sm font-extrabold mt-1 number-display" style={{ color }}>
                            {n.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs" style={{ color: textMuted }}>{timeAgo(n.timestamp)}</span>
                        <button onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                          className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          style={{ color: textMuted }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f44336"; (e.currentTarget as HTMLElement).style.background = "rgba(244,67,54,0.1)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = textMuted; (e.currentTarget as HTMLElement).style.background = ""; }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Type badge */}
                    <div className="mt-1.5">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                        style={{ background: `${color}15`, color }}>
                        {TYPE_LABELS[n.type]}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
