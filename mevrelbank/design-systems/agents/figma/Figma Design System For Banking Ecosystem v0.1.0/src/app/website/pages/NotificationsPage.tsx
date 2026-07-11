import { ShieldAlert, ArrowLeftRight, Info } from "lucide-react";
import { PageMeta } from "../components/PageMeta";
import { notifications } from "../shared/mockBankingData";

const ICONS: Record<string, JSX.Element> = {
  security: <ShieldAlert size={14} className="text-[#B46A0A]" />,
  payment: <ArrowLeftRight size={14} className="text-[#1764C0]" />,
  info: <Info size={14} className="text-[#5E6E8E]" />,
};

export default function NotificationsPage() {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <PageMeta title="Notifications — MevrelBank" description="Security alerts and account updates from MevrelBank." />
      <div className="mb-5">
        <h1 className="text-[20px] font-bold text-[#0D1829] mb-0.5" style={{ fontFamily: "Figtree, sans-serif" }}>Notifications</h1>
        <div className="text-[12px] text-[#8A9BBE]">{unread} unread</div>
      </div>

      <div className="bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] overflow-hidden">
        {notifications.map((n, i) => (
          <div key={n.id} className={`flex items-start gap-3 px-5 py-3.5 ${i < notifications.length - 1 ? "border-b border-[rgba(11,50,112,0.04)]" : ""} ${n.read ? "" : "bg-[#F8FAFD]"}`}>
            <div className="w-7 h-7 rounded-full bg-[#EEF2F9] flex items-center justify-center flex-shrink-0 mt-0.5">
              {ICONS[n.kind]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-[12px] font-semibold text-[#0D1829]">{n.title}</div>
                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#1764C0]" />}
              </div>
              <div className="text-[11px] text-[#5E6E8E] mt-0.5">{n.body}</div>
            </div>
            <div className="text-[10px] text-[#8A9BBE] whitespace-nowrap">{n.time}</div>
          </div>
        ))}
      </div>
    </>
  );
}
