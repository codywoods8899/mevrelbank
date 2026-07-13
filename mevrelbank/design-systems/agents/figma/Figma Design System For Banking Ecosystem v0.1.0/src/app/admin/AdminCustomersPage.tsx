import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Search, CheckCircle2, XCircle } from "lucide-react";
import { PageMeta } from "../website/components/PageMeta";
import { useAdminAuth } from "../context/AdminAuthContext";

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  accountType: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  accountCount: number;
  totalBalance: number;
}

const currency = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

export default function AdminCustomersPage() {
  const { authedJson } = useAdminAuth();
  const [users, setUsers] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pageSize = 25;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search.trim()) params.set("search", search.trim());
    authedJson(`/admin/users?${params.toString()}`)
      .then((data) => {
        setUsers(data.users);
        setTotal(data.total);
      })
      .catch((err) => setError(err.message ?? "Failed to load customers."))
      .finally(() => setLoading(false));
  }, [page, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <PageMeta title="Customers — Admin — MevrelBank" description="Browse and manage MevrelBank customers." />
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#0D1829] tracking-tight" style={{ fontFamily: "Figtree, sans-serif" }}>
            Customers
          </h1>
          <p className="text-[14px] text-[#5E6E8E] mt-1">{total.toLocaleString()} total customers</p>
        </div>
        <div className="relative w-full sm:w-[280px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AAABF]" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name or email…"
            className="w-full rounded-[10px] border border-[rgba(11,50,112,0.14)] pl-10 pr-4 py-2.5 text-[13px] text-[#0D1829] outline-none focus:border-[#0B3270] transition-colors"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-[10px] border border-[rgba(197,43,43,0.18)] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#C52B2B] mb-6">
          {error}
        </div>
      )}

      <div className="rounded-[16px] border border-[rgba(11,50,112,0.08)] bg-white overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[rgba(11,50,112,0.07)] text-[12px] uppercase tracking-[0.04em] text-[#9AAABF]">
              <th className="px-5 py-3.5 font-semibold">Customer</th>
              <th className="px-5 py-3.5 font-semibold">Type</th>
              <th className="px-5 py-3.5 font-semibold">Accounts</th>
              <th className="px-5 py-3.5 font-semibold">Balance</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-[13px] text-[#5E6E8E]">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-[13px] text-[#5E6E8E]">No customers found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-[rgba(11,50,112,0.05)] last:border-0 hover:bg-[#F8FAFD] transition-colors">
                  <td className="px-5 py-4">
                    <Link to={`/admin/customers/${u.id}`} className="block">
                      <p className="text-[14px] font-semibold text-[#0D1829]">{u.name}</p>
                      <p className="text-[12px] text-[#9AAABF]">{u.email}</p>
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[#5E6E8E] capitalize">{u.accountType}</td>
                  <td className="px-5 py-4 text-[13px] text-[#5E6E8E]">{u.accountCount}</td>
                  <td className="px-5 py-4 text-[13px] font-semibold text-[#0D1829]">{currency(u.totalBalance)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${u.isActive ? "text-[#0E7C4D]" : "text-[#C52B2B]"}`}>
                      {u.isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      {u.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-[13px] font-medium text-[#0B3270] disabled:text-[#B0BDCF] transition-colors"
          >
            Previous
          </button>
          <span className="text-[13px] text-[#5E6E8E]">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-[13px] font-medium text-[#0B3270] disabled:text-[#B0BDCF] transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
