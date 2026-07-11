import type { ReactNode } from "react";
import { NavLink } from "react-router";
import {
  Search, Bell, Settings, CreditCard, Home, FileText,
  SendHorizontal, LogOut, Activity, Users,
} from "lucide-react";
import { Logo } from "../shared/Logo";

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const NAV_ITEMS = [
  { to: "/dashboard", end: true, icon: <Home size={15} />, label: "Dashboard" },
  { to: "/dashboard/accounts", icon: <CreditCard size={15} />, label: "Accounts" },
  { to: "/dashboard/transactions", icon: <Activity size={15} />, label: "Transactions" },
  { to: "/dashboard/beneficiaries", icon: <SendHorizontal size={15} />, label: "Beneficiaries" },
  { to: "/dashboard/statements", icon: <FileText size={15} />, label: "Statements" },
  { to: "/dashboard/profile", icon: <Users size={15} />, label: "Profile" },
];

export interface DashboardShellProps {
  /** Full display name of the signed-in customer. Defaults to the design demo persona. */
  userName?: string;
  /** Account tier/type shown under the name in the sidebar. */
  accountLabel?: string;
  /** Called when the user clicks logout in the sidebar. */
  onLogout?: () => void;
  children: ReactNode;
}

/** Shared sidebar + top bar shell for every /dashboard/* page and the /ds demo preview. */
export function DashboardShell({
  userName = "James Chen",
  accountLabel = "Personal · Premium",
  onLogout,
  children,
}: DashboardShellProps) {
  const linkClasses = (isActive: boolean) =>
    `w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-all ${
      isActive
        ? "bg-[rgba(255,255,255,0.09)] text-white"
        : "text-[rgba(255,255,255,0.45)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[rgba(255,255,255,0.75)]"
    }`;

  return (
    <div className="flex h-[820px] bg-[#F4F7FB] overflow-hidden rounded-[12px] border border-[rgba(11,50,112,0.10)] shadow-[0_12px_40px_rgba(11,50,112,0.12)]">
      {/* Sidebar */}
      <aside className="w-[216px] bg-[#081E42] flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-[rgba(255,255,255,0.06)]">
          <Logo variant="dark" heightClass="h-6" />
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="px-4 py-2 mb-1">
            <span className="text-[9px] font-semibold tracking-[0.20em] uppercase text-[rgba(255,255,255,0.25)]">Main Menu</span>
          </div>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => linkClasses(isActive)}>
              {({ isActive }) => (
                <>
                  <span className={isActive ? "text-[#4AA2D8]" : ""}>{item.icon}</span>
                  {item.label}
                  {isActive && <div className="ml-auto w-1 h-4 rounded-full bg-[#4AA2D8]" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#1764C0] flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
              {initialsFor(userName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-white truncate">{userName}</div>
              <div className="text-[10px] text-[rgba(255,255,255,0.35)] truncate">{accountLabel}</div>
            </div>
            <button
              type="button"
              aria-label="Log out"
              onClick={onLogout}
              className="text-[rgba(255,255,255,0.25)] flex-shrink-0 cursor-pointer hover:text-[rgba(255,255,255,0.7)] transition-colors"
            >
              <LogOut size={13} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-[rgba(255,255,255,0.06)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0E7C4D]" />
            <span className="text-[10px] text-[rgba(255,255,255,0.35)]">Session active</span>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-[rgba(11,50,112,0.07)] flex items-center justify-between px-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-[13px] text-[#8A9BBE]" style={{ fontFamily: "'DM Mono', monospace" }}>
              {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-3 text-[#8A9BBE]" />
              <input type="text" placeholder="Search…" className="h-8 w-44 pl-8 pr-3 rounded-[6px] bg-[#EEF2F9] text-[12px] text-[#0D1829] placeholder-[#8A9BBE] focus:outline-none focus:ring-2 focus:ring-[#1764C0]/20 transition-all" />
            </div>
            <NavLink to="/dashboard/notifications" className="relative w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-[#EEF2F9] transition-colors">
              <Bell size={15} className="text-[#5E6E8E]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#C52B2B] rounded-full" />
            </NavLink>
            <NavLink to="/dashboard/profile" className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-[#EEF2F9] transition-colors">
              <Settings size={15} className="text-[#5E6E8E]" />
            </NavLink>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  );
}
