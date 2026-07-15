import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { LayoutDashboard, Users, LogOut, ShieldCheck, Clock, Landmark, Settings, Menu, X, Inbox } from "lucide-react";
import { Logo } from "../website/shared/Logo";
import { useAdminAuth } from "../context/AdminAuthContext";

const navItems = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/customers", label: "Customers", icon: Users, end: false },
  { to: "/admin/transactions", label: "Transactions", icon: Clock, end: false },
  { to: "/admin/accounts", label: "Accounts", icon: Landmark, end: false },
  { to: "/admin/mailboxes", label: "Mailboxes", icon: Inbox, end: false },
  { to: "/admin/settings", label: "Settings", icon: Settings, end: false },
];

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <>
      <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <Logo heightClass="h-8" variant="dark" />
          <div className="mt-3 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-white/60">
            <ShieldCheck size={12} />
            Admin panel
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="md:hidden text-white/50 hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>
        )}
      </div>
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-colors ${
                isActive ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/8 hover:text-white"
              }`
            }
          >
            <Icon size={17} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-5 border-t border-white/10">
        <div className="px-3 mb-3">
          <p className="text-[13px] font-semibold text-white truncate">{admin?.name ?? "Support"}</p>
          <p className="text-[12px] text-white/55 truncate">{admin?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium text-white/70 hover:bg-white/8 hover:text-white transition-colors"
        >
          <LogOut size={17} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[240px] flex-shrink-0 bg-[#0B3270] text-white flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden h-14 bg-[#0B3270] text-white flex items-center justify-between px-4 flex-shrink-0">
        <Logo heightClass="h-7" variant="dark" />
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-[8px] hover:bg-white/10 transition-colors"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-[270px] max-w-[80vw] bg-[#0B3270] flex flex-col h-full shadow-2xl">
            <SidebarContent onClose={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
