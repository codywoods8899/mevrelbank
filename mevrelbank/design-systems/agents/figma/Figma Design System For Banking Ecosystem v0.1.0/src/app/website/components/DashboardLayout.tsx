import { Outlet, useNavigate } from "react-router";
import { DashboardShell } from "./DashboardShell";
import { useAuth } from "../../context/AuthContext";
import { NotificationsProvider } from "../../context/NotificationsContext";

const accountLabel: Record<string, string> = {
  personal: "Personal · Premium",
  business: "Business",
};

/** Layout route for every /dashboard/* page: provides the shared sidebar/top bar and signs out via AuthContext. */
export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // DashboardShell is itself h-screen and full-viewport.
  // Do NOT wrap it in a container or add padding here — for a sidebar-based
  // dashboard, a max-width centered wrapper creates dead space and is bad UX.
  return (
    <NotificationsProvider>
      <DashboardShell
        userName={user?.name ?? "Customer"}
        accountLabel={user ? accountLabel[user.accountType] ?? "Personal" : "Personal"}
        onLogout={handleLogout}
      >
        <Outlet />
      </DashboardShell>
    </NotificationsProvider>
  );
}
