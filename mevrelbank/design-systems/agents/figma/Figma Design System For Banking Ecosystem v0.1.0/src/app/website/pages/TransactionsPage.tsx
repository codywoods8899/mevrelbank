import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Download } from "lucide-react";
import { PageMeta } from "../components/PageMeta";
import { Btn } from "../shared/Btn";
import { StatusDot } from "../shared/StatusDot";
import { useAuth } from "../../context/AuthContext";
import { bankingApi, formatRelativeDate, type Transaction } from "../shared/bankingApi";
import { TransactionReceiptModal } from "../components/TransactionReceiptModal";

const FILTERS = ["All", "Current Account", "Savings Account"] as const;

export default function TransactionsPage() {
  const { authedFetch } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<typeof FILTERS[number]>("All");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    let active = true;
    bankingApi.getTransactions(authedFetch, { limit: 100 })
      .then((r) => active && setTransactions(r.transactions))
      .catch(() => active && setError("Couldn't load your transactions. Please try again."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [authedFetch]);

  const filtered = filter === "All" ? transactions : transactions.filter((t) => t.account === filter);

  function handleExport() {
    const header = ["Date", "Description", "Category", "Account", "Status", "Amount (GBP)"];
    const rows = filtered.map((t) => [
      new Date(t.date).toISOString(),
      t.name,
      t.category,
      t.account,
      t.status,
      t.amount.toFixed(2),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mevrelbank-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageMeta title="Transactions — MevrelBank" description="Search and review your MevrelBank transaction history." />
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold text-[#0D1829] mb-0.5" style={{ fontFamily: "Figtree, sans-serif" }}>Transaction History</h1>
          <div className="text-[12px] text-[#8A9BBE]">{loading ? "Loading…" : `${filtered.length} transactions`}</div>
        </div>
        <Btn variant="outline" size="sm" icon={<Download size={13} />} disabled={filtered.length === 0} onClick={handleExport}>Export CSV</Btn>
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-[6px] text-[12px] font-semibold transition-colors ${
              filter === f ? "bg-[#0B3270] text-white" : "bg-white text-[#5E6E8E] border border-[rgba(11,50,112,0.10)] hover:bg-[#EEF2F9]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-[8px] bg-[#FBE9E7] text-[#9A2C1D] text-[12px] font-medium">{error}</div>
      )}

      <div className="bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] overflow-hidden">
        {filtered.map((tx, i) => (
          <button
            key={tx.id}
            type="button"
            onClick={() => setSelectedTx(tx)}
            className={`w-full flex items-center gap-3.5 px-5 py-3 text-left ${i < filtered.length - 1 ? "border-b border-[rgba(11,50,112,0.04)]" : ""} hover:bg-[#F8FAFD] active:bg-[#EEF2F9] transition-colors cursor-pointer`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${tx.amount > 0 ? "bg-[#D6F0E6]" : "bg-[#EEF2F9]"}`}>
              {tx.amount > 0 ? <ArrowDownLeft size={12} className="text-[#0E7C4D]" /> : <ArrowUpRight size={12} className="text-[#7A8CAA]" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-[#0D1829] truncate">{tx.name}</div>
              <div className="text-[10px] text-[#8A9BBE] truncate">{tx.category} · {tx.account} · {formatRelativeDate(tx.date)}</div>
            </div>
            <StatusDot status={tx.status} />
            <div className="text-[12px] font-medium w-24 text-right flex-shrink-0" style={{ fontFamily: "'DM Mono', monospace", color: tx.amount > 0 ? "#0E7C4D" : "#0D1829" }}>
              {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
            </div>
          </button>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="px-5 py-10 text-center text-[12px] text-[#8A9BBE]">No transactions for this account.</div>
        )}
      </div>

      {selectedTx && (
        <TransactionReceiptModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
      )}
    </>
  );
}
