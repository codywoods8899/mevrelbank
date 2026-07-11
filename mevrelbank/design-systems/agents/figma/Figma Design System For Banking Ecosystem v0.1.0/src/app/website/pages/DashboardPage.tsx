import { PageMeta } from "../components/PageMeta";
import { DashboardOverview } from "../components/DashboardOverview";
import { useAuth } from "../../context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <>
      <PageMeta
        title="Dashboard — MevrelBank"
        description="Your MevrelBank account overview, balances, and recent transactions."
      />
      <DashboardOverview userName={user?.name ?? "Customer"} />
    </>
  );
}
