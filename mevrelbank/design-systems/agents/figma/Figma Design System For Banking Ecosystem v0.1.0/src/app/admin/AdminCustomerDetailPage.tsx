import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, ShieldAlert, ShieldCheck } from "lucide-react";
import { PageMeta } from "../website/components/PageMeta";
import { useAdminAuth } from "../context/AdminAuthContext";

interface Detail {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    accountType: string;
    emailVerified: boolean;
    totpEnabled: boolean;
    isActive: boolean;
    createdAt: string;
  };
  accounts: {
    id: string;
    name: string;
    type: string;
    sortCode: string;
    accountNumber: string;
    balance: number;
    available: number;
  }[];
  transactions: {
    id: string;
    account: string;
    name: string;
    category: string;
    amount: number;
    status: string;
    date: string;
  }[];
}

const currency = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });

export default function AdminCustomerDetailPage() {
  const { id } = useParams();
  const { authedJson } = useAdminAuth();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  const load = () => {
    if (!id) return;
    authedJson(`/admin/users/${id}`)
      .then(setData)
      .catch((err) => setError(err.message ?? "Failed to load customer."));
  };

  useEffect(load, [id]);

  const toggleActive = async () => {
    if (!data) return;
    setUpdating(true);
    try {
      await authedJson(`/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !data.user.isActive }),
      });
      load();
    } catch (err: any) {
      setError(err.message ?? "Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <PageMeta title="Customer detail — Admin — MevrelBank" description="Customer account detail for MevrelBank support staff." />
      <Link to="/admin/customers" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0B3270] hover:text-[#0E3E8C] mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to customers
      </Link>

      {error && (
        <div className="rounded-[10px] border border-[rgba(197,43,43,0.18)] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#C52B2B] mb-6">
          {error}
        </div>
      )}

      {!data ? (
        <p className="text-[14px] text-[#5E6E8E]">Loading…</p>
      ) : (
        <>
          <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
            <div>
              <h1 className="text-[26px] font-bold text-[#0D1829] tracking-tight" style={{ fontFamily: "Figtree, sans-serif" }}>
                {data.user.name}
              </h1>
              <p className="text-[14px] text-[#5E6E8E] mt-1">{data.user.email}</p>
              {data.user.phone && <p className="text-[13px] text-[#9AAABF] mt-0.5">{data.user.phone}</p>}
            </div>
            <button
              onClick={toggleActive}
              disabled={updating}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold transition-colors ${
                data.user.isActive
                  ? "bg-[#FEF2F2] text-[#C52B2B] hover:bg-[#FDE8E8]"
                  : "bg-[#D6F0E6] text-[#0A5E3A] hover:bg-[#c3e9d8]"
              }`}
            >
              {data.user.isActive ? <ShieldAlert size={15} /> : <ShieldCheck size={15} />}
              {data.user.isActive ? "Suspend account" : "Reactivate account"}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="rounded-[14px] border border-[rgba(11,50,112,0.08)] bg-white p-4">
              <p className="text-[12px] text-[#9AAABF]">Account type</p>
              <p className="text-[14px] font-semibold text-[#0D1829] capitalize mt-1">{data.user.accountType}</p>
            </div>
            <div className="rounded-[14px] border border-[rgba(11,50,112,0.08)] bg-white p-4">
              <p className="text-[12px] text-[#9AAABF]">Email verified</p>
              <p className="text-[14px] font-semibold text-[#0D1829] mt-1">{data.user.emailVerified ? "Yes" : "No"}</p>
            </div>
            <div className="rounded-[14px] border border-[rgba(11,50,112,0.08)] bg-white p-4">
              <p className="text-[12px] text-[#9AAABF]">2FA enabled</p>
              <p className="text-[14px] font-semibold text-[#0D1829] mt-1">{data.user.totpEnabled ? "Yes" : "No"}</p>
            </div>
            <div className="rounded-[14px] border border-[rgba(11,50,112,0.08)] bg-white p-4">
              <p className="text-[12px] text-[#9AAABF]">Joined</p>
              <p className="text-[14px] font-semibold text-[#0D1829] mt-1">{new Date(data.user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <h2 className="text-[16px] font-bold text-[#0D1829] mb-3">Accounts</h2>
          <div className="rounded-[16px] border border-[rgba(11,50,112,0.08)] bg-white overflow-hidden mb-8">
            {data.accounts.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-[#5E6E8E]">No accounts.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[rgba(11,50,112,0.07)] text-[12px] uppercase tracking-[0.04em] text-[#9AAABF]">
                    <th className="px-5 py-3.5 font-semibold">Account</th>
                    <th className="px-5 py-3.5 font-semibold">Sort code / number</th>
                    <th className="px-5 py-3.5 font-semibold">Balance</th>
                    <th className="px-5 py-3.5 font-semibold">Available</th>
                  </tr>
                </thead>
                <tbody>
                  {data.accounts.map((a) => (
                    <tr key={a.id} className="border-b border-[rgba(11,50,112,0.05)] last:border-0">
                      <td className="px-5 py-4 text-[14px] font-medium text-[#0D1829]">{a.name}</td>
                      <td className="px-5 py-4 text-[13px] text-[#5E6E8E]">{a.sortCode} · {a.accountNumber}</td>
                      <td className="px-5 py-4 text-[13px] font-semibold text-[#0D1829]">{currency(a.balance)}</td>
                      <td className="px-5 py-4 text-[13px] text-[#5E6E8E]">{currency(a.available)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <h2 className="text-[16px] font-bold text-[#0D1829] mb-3">Recent transactions</h2>
          <div className="rounded-[16px] border border-[rgba(11,50,112,0.08)] bg-white overflow-hidden">
            {data.transactions.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-[#5E6E8E]">No transactions.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[rgba(11,50,112,0.07)] text-[12px] uppercase tracking-[0.04em] text-[#9AAABF]">
                    <th className="px-5 py-3.5 font-semibold">Description</th>
                    <th className="px-5 py-3.5 font-semibold">Account</th>
                    <th className="px-5 py-3.5 font-semibold">Amount</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                    <th className="px-5 py-3.5 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((t) => (
                    <tr key={t.id} className="border-b border-[rgba(11,50,112,0.05)] last:border-0">
                      <td className="px-5 py-4 text-[14px] text-[#0D1829]">{t.name}</td>
                      <td className="px-5 py-4 text-[13px] text-[#5E6E8E]">{t.account}</td>
                      <td className={`px-5 py-4 text-[13px] font-semibold ${t.amount < 0 ? "text-[#C52B2B]" : "text-[#0E7C4D]"}`}>
                        {currency(t.amount)}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#5E6E8E] capitalize">{t.status}</td>
                      <td className="px-5 py-4 text-[13px] text-[#9AAABF]">{new Date(t.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </>
  );
}
