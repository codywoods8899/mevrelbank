import { Outlet, useNavigate } from "react-router";
import { DashboardShell } from "./DashboardShell";
import { useAuth } from "../../context/AuthContext";

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

  return (
    <div className="min-h-screen bg-[#F4F7FB] p-5">
      <div className="max-w-[1200px] mx-auto">
        <DashboardShell
          userName={user?.name ?? "Customer"}
          accountLabel={user ? accountLabel[user.accountType] ?? "Personal" : "Personal"}
          onLogout={handleLogout}
        >
          <Outlet />
        </DashboardShell>
      </div>
    </div>
  );
}
