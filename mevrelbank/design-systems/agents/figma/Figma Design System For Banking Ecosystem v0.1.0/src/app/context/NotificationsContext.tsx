import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { bankingApi, type Notification } from "../website/shared/bankingApi";

// Polling interval for picking up notifications created elsewhere (e.g. a
// payment landing while this tab is open). Marking as read is reflected
// instantly via local state — this interval is only for *new* notifications.
const POLL_MS = 20_000;

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { authedFetch, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchInFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (fetchInFlight.current) return;
    fetchInFlight.current = true;
    try {
      const r = await bankingApi.getNotifications(authedFetch);
      setNotifications(r.notifications);
    } catch {
      // Keep whatever we already have; the next poll/mount will retry.
    } finally {
      fetchInFlight.current = false;
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated, refresh]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
    try {
      await bankingApi.markNotificationRead(authedFetch, id);
    } catch {
      // Revert the optimistic update so the badge/list reflect reality if the request failed.
      setNotifications((prev) => prev.map((x) => (x.id === id ? { ...x, read: false } : x)));
      throw new Error("Couldn't mark that notification as read. Please try again.");
    }
  }, [authedFetch]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, loading, markAsRead, refresh }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationsProvider");
  return ctx;
}
