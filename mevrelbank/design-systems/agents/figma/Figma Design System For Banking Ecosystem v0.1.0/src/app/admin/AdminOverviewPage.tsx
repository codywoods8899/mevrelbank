import { useEffect, useState } from "react";
import { Users, Wallet, CheckCircle2, Activity } from "lucide-react";
import { PageMeta } from "../website/components/PageMeta";
import { useAdminAuth } from "../context/AdminAuthContext";

interface Overview {
  totalUsers: number;
  verifiedUsers: number;
  totalAccounts: number;
  totalBalance: number;
  transactionsTotal: number;
  pendingTransactions: number;
}

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function KpiCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[16px] border border-[rgba(11,50,112,0.08)] bg-white p-6">
      <div className="w-9 h-9 rounded-[9px] bg-[#EBF0FA] flex items-center justify-center mb-4">
        <Icon size={16} className="text-[#0B3270]" aria-hidden="true" />
      </div>
      <p className="text-[13px] text-[#5E6E8E] font-medium">{label}</p>
      <p className="text-[26px] font-bold text-[#0D1829] tracking-tight mt-1" style={{ fontFamily: "Figtree, sans-serif" }}>
        {value}
      </p>
      {sub && <p className="text-[12px] text-[#9AAABF] mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminOverviewPage() {
  const { authedJson } = useAdminAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    authedJson("/admin/overview")
      .then(setData)
      .catch((err) => setError(err.message ?? "Failed to load overview."));
  }, []);

  return (
    <>
      <PageMeta title="Admin Overview — MevrelBank" description="Bank-wide overview for MevrelBank support staff." />
      <div className="mb-8">
        <h1 className="text-[26px] font-bold text-[#0D1829] tracking-tight" style={{ fontFamily: "Figtree, sans-serif" }}>
          Overview
        </h1>
        <p className="text-[14px] text-[#5E6E8E] mt-1">Bank-wide snapshot across all customers.</p>
      </div>

      {error && (
        <div className="rounded-[10px] border border-[rgba(197,43,43,0.18)] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#C52B2B] mb-6">
          {error}
        </div>
      )}

      {!data && !error ? (
        <p className="text-[14px] text-[#5E6E8E]">Loading…</p>
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard icon={Users} label="Total customers" value={data.totalUsers.toLocaleString()} sub={`${data.verifiedUsers} verified`} />
          <KpiCard icon={CheckCircle2} label="Accounts" value={data.totalAccounts.toLocaleString()} />
          <KpiCard icon={Wallet} label="Total balance held" value={currency(data.totalBalance)} />
          <KpiCard icon={Activity} label="All transactions" value={data.transactionsTotal.toLocaleString()} />
          <KpiCard icon={Activity} label="Pending transactions" value={data.pendingTransactions.toLocaleString()} sub="Awaiting review" />
        </div>
      ) : null}
    </>
  );
}
