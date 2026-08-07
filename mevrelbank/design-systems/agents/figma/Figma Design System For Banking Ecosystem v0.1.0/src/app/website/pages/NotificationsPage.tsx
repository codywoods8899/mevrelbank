import { useState } from "react";
import { useNavigate } from "react-router";
import { ShieldAlert, ArrowLeftRight, Info, ExternalLink } from "lucide-react";
import { PageMeta } from "../components/PageMeta";
import { useNotifications } from "../../context/NotificationsContext";
import { formatRelativeTime, type Notification } from "../shared/bankingApi";
import { resolveNotificationPath } from "../services/notificationActionResolver";

function formatFullTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const ICONS: Record<string, JSX.Element> = {
  security: <ShieldAlert size={14} className="text-[#B46A0A]" />,
  payment: <ArrowLeftRight size={14} className="text-[#1764C0]" />,
  info: <Info size={14} className="text-[#5E6E8E]" />,
};

export default function NotificationsPage() {
  // Shared with the sidebar/top-bar bell badges, so marking one as read here
  // updates the unread count everywhere instantly — no reload needed.
  const { notifications, unreadCount, loading, markAsRead } = useNotifications();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleOpen(n: Notification) {
    // Always mark as read on click, regardless of destination.
    if (!n.read) {
      try {
        await markAsRead(n.id);
      } catch {
        setError("Couldn't mark that notification as read. Please try again.");
        return;
      }
    }

    // Navigate to the entity this notification references.
    // resolveNotificationPath uses only (entityType, entityId) from the backend
    // — it never matches text. Returns null for general/welcome notifications.
    const path = resolveNotificationPath(n);
    if (path) navigate(path);
  }

  return (
    <>
      <PageMeta title="Notifications — MevrelBank" description="Security alerts and account updates from MevrelBank." />
      <div className="mb-5">
        <h1 className="text-[20px] font-bold text-[#0D1829] mb-0.5" style={{ fontFamily: "Figtree, sans-serif" }}>Notifications</h1>
        <div className="text-[12px] text-[#8A9BBE]">{loading ? "Loading…" : `${unreadCount} unread`}</div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-[8px] bg-[#FBE9E7] text-[#9A2C1D] text-[12px] font-medium">{error}</div>
      )}

      <div className="bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] overflow-hidden">
        {notifications.map((n, i) => {
          const destination = resolveNotificationPath(n);
          return (
            <button
              key={n.id}
              onClick={() => handleOpen(n)}
              title={formatFullTimestamp(n.time)}
              className={`group w-full flex items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#EEF3FB] ${i < notifications.length - 1 ? "border-b border-[rgba(11,50,112,0.04)]" : ""} ${n.read ? "" : "bg-[#F8FAFD]"}`}
            >
              <div className="w-7 h-7 rounded-full bg-[#EEF2F9] flex items-center justify-center flex-shrink-0 mt-0.5">
                {ICONS[n.kind]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-[12px] font-semibold text-[#0D1829]">{n.title}</div>
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#1764C0]" />}
                </div>
                <div className="text-[11px] text-[#5E6E8E] mt-0.5">{n.body}</div>
                <div className="flex items-center gap-1 text-[10px] text-[#1764C0] mt-1 opacity-0 -translate-y-0.5 transition-all group-hover:opacity-100 group-hover:translate-y-0">
                  {destination
                    ? <><ExternalLink size={9} /><span>View details</span></>
                    : <span>{n.read ? "Already read" : "Mark as read"}</span>
                  }
                  <span className="text-[#8A9BBE]">· {formatFullTimestamp(n.time)}</span>
                </div>
              </div>
              <div className="text-[10px] text-[#8A9BBE] whitespace-nowrap">{formatRelativeTime(n.time)}</div>
            </button>
          );
        })}
        {!loading && notifications.length === 0 && (
          <div className="px-5 py-10 text-center text-[12px] text-[#8A9BBE]">You're all caught up.</div>
        )}
      </div>
    </>
  );
}
