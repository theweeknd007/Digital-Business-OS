import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export type NotifType = "sale" | "customer" | "affiliate" | "payment" | "withdrawal" | "error" | "system" | "update";

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  amount?: number;
}

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: [], unreadCount: 0,
  markRead: () => {}, markAllRead: () => {}, dismiss: () => {}, addNotification: () => {},
});

const SAMPLE_EVENTS: Omit<Notification, "id" | "timestamp" | "read">[] = [
  { type: "sale", title: "Nova Venda!", message: "Mentoria Elite 1:1 — R$ 9.994,00", amount: 9994 },
  { type: "customer", title: "Novo Cliente", message: "João Silva acabou de se cadastrar" },
  { type: "affiliate", title: "Novo Afiliado", message: "Maria Souza entrou como afiliada" },
  { type: "payment", title: "Pagamento Confirmado", message: "PIX de R$ 497,00 aprovado", amount: 497 },
  { type: "withdrawal", title: "Saque Aprovado", message: "R$ 5.000,00 processado com sucesso", amount: 5000 },
  { type: "sale", title: "Nova Venda!", message: "Método GOAT: Tráfego Pago — R$ 2.991,00", amount: 2991 },
  { type: "system", title: "Sistema Atualizado", message: "GOAT-PAY v2.1 disponível" },
  { type: "sale", title: "Nova Venda!", message: "Pack de Templates Premium — R$ 394,00", amount: 394 },
];

let notifCounter = 0;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "init-1", type: "sale", title: "Nova Venda!", message: "Comunidade GOAT Nation — R$ 594,00",
      timestamp: new Date(Date.now() - 2 * 60000), read: false, amount: 594,
    },
    {
      id: "init-2", type: "payment", title: "Pagamento Confirmado", message: "PIX de R$ 997,00 aprovado",
      timestamp: new Date(Date.now() - 8 * 60000), read: false, amount: 997,
    },
    {
      id: "init-3", type: "system", title: "Backup Concluído", message: "Backup automático realizado com sucesso",
      timestamp: new Date(Date.now() - 30 * 60000), read: true,
    },
  ]);

  const addNotification = useCallback((n: Omit<Notification, "id" | "timestamp" | "read">) => {
    notifCounter++;
    const notif: Notification = {
      ...n,
      id: `notif-${Date.now()}-${notifCounter}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [notif, ...prev].slice(0, 50));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Simulate real-time notifications
  useEffect(() => {
    let idx = 0;
    const intervals = [12000, 18000, 25000, 35000, 45000];
    const timers: ReturnType<typeof setTimeout>[] = [];

    const scheduleNext = (delay: number) => {
      const t = setTimeout(() => {
        const event = SAMPLE_EVENTS[idx % SAMPLE_EVENTS.length];
        addNotification(event);
        idx++;
        scheduleNext(intervals[idx % intervals.length]);
      }, delay);
      timers.push(t);
    };

    scheduleNext(12000);
    return () => timers.forEach(clearTimeout);
  }, [addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, dismiss, addNotification }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);

export const NOTIF_ICONS: Record<NotifType, string> = {
  sale: "💰", customer: "👤", affiliate: "🤝", payment: "✅",
  withdrawal: "💸", error: "⚠️", system: "🔧", update: "🚀",
};

export const NOTIF_COLORS: Record<NotifType, string> = {
  sale: "#00e676", customer: "#40c4ff", affiliate: "#ffd740",
  payment: "#00e676", withdrawal: "#69f0ae", error: "#ff5252",
  system: "#b39ddb", update: "#4dd0e1",
};
