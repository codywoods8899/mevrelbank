import { NavLink, Outlet, useNavigate } from "react-router";
import { LayoutDashboard, Users, LogOut, ShieldCheck, Clock, Landmark } from "lucide-react";
import { Logo } from "../website/shared/Logo";
import { useAdminAuth } from "../context/AdminAuthContext";

const navItems = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/customers", label: "Customers", icon: Users, end: false },
  { to: "/admin/transactions", label: "Transactions", icon: Clock, end: false },
  { to: "/admin/accounts", label: "Accounts", icon: Landmark, end: false },
];

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex">
      <aside className="w-[240px] flex-shrink-0 bg-[#0B3270] text-white flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <Logo heightClass="h-6" variant="dark" />
          <div className="mt-3 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-white/60">
            <ShieldCheck size={12} />
            Admin panel
          </div>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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
      </aside>
      <main className="flex-1 min-w-0">
        <div className="max-w-[1100px] mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
