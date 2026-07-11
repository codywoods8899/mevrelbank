import { useNavigate } from "react-router";
import { PageMeta } from "../components/PageMeta";
import { BankingPortalView } from "../components/BankingPortalView";
import { useAuth } from "../../context/AuthContext";

const accountLabel: Record<string, string> = {
  personal: "Personal · Premium",
  business: "Business",
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <PageMeta
        title="Dashboard — MevrelBank"
        description="Your MevrelBank account overview, balances, and recent transactions."
      />
      <div className="min-h-screen bg-[#F4F7FB] p-5">
        <div className="max-w-[1200px] mx-auto">
          <BankingPortalView
            userName={user?.name ?? "Customer"}
            accountLabel={user ? accountLabel[user.accountType] ?? "Personal" : "Personal"}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </>
  );
}
