import { useState, type ReactNode } from "react";
import { NavLink } from "react-router";
import {
  Search, Bell, Settings, CreditCard, Home, FileText,
  SendHorizontal, LogOut, Activity, Users, Menu, X,
} from "lucide-react";
import { Logo } from "../shared/Logo";
import { useNotifications } from "../../context/NotificationsContext";

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const NAV_ITEMS = [
  { to: "/dashboard",               end: true,  icon: <Home size={15} />,          label: "Dashboard" },
  { to: "/dashboard/accounts",                  icon: <CreditCard size={15} />,    label: "Accounts" },
  { to: "/dashboard/transactions",              icon: <Activity size={15} />,       label: "Transactions" },
  { to: "/dashboard/beneficiaries",             icon: <SendHorizontal size={15} />, label: "Beneficiaries" },
  { to: "/dashboard/statements",                icon: <FileText size={15} />,       label: "Statements" },
  { to: "/dashboard/profile",                   icon: <Users size={15} />,          label: "Profile" },
];

// Bottom nav shows the 5 most-used items on mobile
const BOTTOM_NAV = NAV_ITEMS.filter((n) =>
  ["/dashboard", "/dashboard/accounts", "/dashboard/transactions", "/dashboard/beneficiaries", "/dashboard/profile"].includes(n.to)
);

export interface DashboardShellProps {
  userName?: string;
  accountLabel?: string;
  onLogout?: () => void;
  children: ReactNode;
}

export function DashboardShell({
  userName = "James Chen",
  accountLabel = "Personal · Premium",
  onLogout,
  children,
}: DashboardShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const unreadBadge = unreadCount > 9 ? "9+" : String(unreadCount);

  const sidebarLinkClasses = (isActive: boolean) =>
    `w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-all ${
      isActive
        ? "bg-[rgba(255,255,255,0.09)] text-white"
        : "text-[rgba(255,255,255,0.45)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[rgba(255,255,255,0.75)]"
    }`;

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
        <Logo variant="dark" heightClass="h-8" />
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="md:hidden text-[rgba(255,255,255,0.4)] hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <div className="px-4 py-2 mb-1">
          <span className="text-[9px] font-semibold tracking-[0.20em] uppercase text-[rgba(255,255,255,0.25)]">
            Main Menu
          </span>
        </div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) => sidebarLinkClasses(isActive)}
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? "text-[#4AA2D8]" : ""}>{item.icon}</span>
                {item.label}
                {isActive && <div className="ml-auto w-1 h-4 rounded-full bg-[#4AA2D8]" />}
              </>
            )}
          </NavLink>
        ))}

        {/* Notifications link */}
        <div className="px-4 pt-4 pb-2 mt-2 border-t border-[rgba(255,255,255,0.06)]">
          <span className="text-[9px] font-semibold tracking-[0.20em] uppercase text-[rgba(255,255,255,0.25)]">
            Other
          </span>
        </div>
        <NavLink
          to="/dashboard/notifications"
          onClick={onClose}
          className={({ isActive }) => sidebarLinkClasses(isActive)}
        >
          {({ isActive }) => (
            <>
              <span className={isActive ? "text-[#4AA2D8]" : ""}><Bell size={15} /></span>
              Notifications
              {unreadCount > 0 && (
                <span
                  className={`ml-auto flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[9px] font-semibold text-white bg-[#C52B2B] ${isActive ? "" : ""}`}
                >
                  {unreadBadge}
                </span>
              )}
              {isActive && unreadCount === 0 && <div className="ml-auto w-1 h-4 rounded-full bg-[#4AA2D8]" />}
            </>
          )}
        </NavLink>
      </nav>

      {/* User footer */}
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
    </>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F4F7FB] overflow-hidden">

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside className="hidden md:flex w-[216px] bg-[#081E42] flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside
            className="relative w-[270px] max-w-[80vw] bg-[#081E42] flex flex-col h-full shadow-2xl"
            style={{ animation: "slideInLeft 0.22s ease" }}
          >
            <SidebarContent onClose={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-14 bg-white border-b border-[rgba(11,50,112,0.07)] flex items-center flex-shrink-0 px-4 md:px-5">

          {/* Mobile: hamburger | logo | bell */}
          <div className="flex md:hidden items-center justify-between w-full">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-[8px] hover:bg-[#EEF2F9] transition-colors text-[#5E6E8E]"
            >
              <Menu size={18} />
            </button>
            <Logo heightClass="h-7" />
            <div className="flex items-center gap-1">
              <NavLink
                to="/dashboard/notifications"
                className="relative w-9 h-9 flex items-center justify-center rounded-[8px] hover:bg-[#EEF2F9] transition-colors"
              >
                <Bell size={16} className="text-[#5E6E8E]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-[#C52B2B] text-white text-[9px] font-semibold leading-none">
                    {unreadBadge}
                  </span>
                )}
              </NavLink>
            </div>
          </div>

          {/* Desktop: date | search + bell + settings */}
          <div className="hidden md:flex items-center justify-between w-full">
            <div className="text-[13px] text-[#8A9BBE]" style={{ fontFamily: "'DM Mono', monospace" }}>
              {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <Search size={13} className="absolute left-3 text-[#8A9BBE]" />
                <input
                  type="text"
                  placeholder="Search…"
                  className="h-8 w-44 pl-8 pr-3 rounded-[6px] bg-[#EEF2F9] text-[12px] text-[#0D1829] placeholder-[#8A9BBE] focus:outline-none focus:ring-2 focus:ring-[#1764C0]/20 transition-all"
                />
              </div>
              <NavLink
                to="/dashboard/notifications"
                className="relative w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-[#EEF2F9] transition-colors"
              >
                <Bell size={15} className="text-[#5E6E8E]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-[#C52B2B] text-white text-[9px] font-semibold leading-none">
                    {unreadBadge}
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/dashboard/profile"
                className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-[#EEF2F9] transition-colors"
              >
                <Settings size={15} className="text-[#5E6E8E]" />
              </NavLink>
            </div>
          </div>
        </header>

        {/* Page content — extra bottom padding on mobile for the bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 md:p-5 pb-24 md:pb-5">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[rgba(11,50,112,0.08)] safe-area-bottom">
        <div className="flex items-stretch">
          {BOTTOM_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="flex-1"
            >
              {({ isActive }) => (
                <div
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                    isActive ? "text-[#0B3270]" : "text-[#9AAABF]"
                  }`}
                >
                  <span className={isActive ? "text-[#0B3270]" : "text-[#9AAABF]"}>
                    {item.icon}
                  </span>
                  <span className={`text-[9px] font-semibold tracking-wide ${isActive ? "text-[#0B3270]" : "text-[#B0BECE]"}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute top-0 inset-x-0 h-0.5 bg-[#0B3270] rounded-full" />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
