import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { PageMeta } from "../website/components/PageMeta";
import { useAdminAuth } from "../context/AdminAuthContext";

interface PendingTx {
  id: string;
  accountId: string;
  accountName: string;
  userName: string;
  userEmail: string;
  name: string;
  category: string;
  amount: number;
  status: string;
  initiatedBy: string;
  metadata: Record<string, any> | null;
  date: string;
}

const currency = (n: number) =>
  Math.abs(n).toLocaleString("en-US", { style: "currency", currency: "USD" });

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending:   { bg: "#FDF0D6", text: "#B46A0A", label: "Pending" },
    completed: { bg: "#D6F0E6", text: "#0E7C4D", label: "Completed" },
    failed:    { bg: "#FDE8E8", text: "#C52B2B", label: "Unsuccessful" },
  };
  const s = map[status] ?? { bg: "#EBF0FA", text: "#5E6E8E", label: status };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

function RejectModal({
  tx,
  onClose,
  onConfirm,
}: {
  tx: PendingTx;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-[16px] shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-[18px] font-bold text-[#0D1829] mb-1" style={{ fontFamily: "Figtree, sans-serif" }}>
          Reject transaction?
        </h3>
        <p className="text-[13px] text-[#5E6E8E] mb-4">
          This will mark the transaction as unsuccessful and return held funds to <strong>{tx.userName}</strong>.
        </p>
        <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Reason (optional — shown to customer)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Unable to verify beneficiary details."
          className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270] resize-none mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-[10px] border border-[rgba(11,50,112,0.15)] text-[13px] font-semibold text-[#5E6E8E] hover:bg-[#F4F7FB] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className="flex-1 px-4 py-2.5 rounded-[10px] bg-[#C52B2B] text-white text-[13px] font-semibold hover:bg-[#a82424] transition-colors"
          >
            Reject transaction
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTransactionsPage() {
  const { authedJson } = useAdminAuth();
  const [transactions, setTransactions] = useState<PendingTx[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectTarget, setRejectTarget] = useState<PendingTx | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [page, setPage] = useState(1);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(() => {
    setLoading(true);
    const url = tab === "pending"
      ? `/admin/pending?page=${page}`
      : `/admin/transactions?page=${page}`;
    authedJson(url)
      .then((data) => {
        setTransactions(data.transactions ?? []);
        setTotal(data.total ?? 0);
      })
      .catch((err) => setError(err.message ?? "Failed to load transactions."))
      .finally(() => setLoading(false));
  }, [tab, page, authedJson]);

  useEffect(() => { load(); }, [load]);

  const confirm = async (tx: PendingTx) => {
    setProcessing(tx.id);
    try {
      await authedJson(`/admin/transactions/${tx.id}/confirm`, { method: "PATCH" });
      showToast("Transaction confirmed and completed.", "success");
      load();
    } catch (err: any) {
      showToast(err.message ?? "Failed to confirm.", "error");
    } finally {
      setProcessing(null);
    }
  };

  const reject = async (tx: PendingTx, reason: string) => {
    setRejectTarget(null);
    setProcessing(tx.id);
    try {
      await authedJson(`/admin/transactions/${tx.id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      });
      showToast("Transaction rejected. Funds returned to customer.", "success");
      load();
    } catch (err: any) {
      showToast(err.message ?? "Failed to reject.", "error");
    } finally {
      setProcessing(null);
    }
  };

  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <PageMeta title="Transactions — Admin — MevrelBank" description="Manage and confirm customer transactions." />

      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-[10px] text-[13px] font-semibold shadow-lg text-white flex items-center gap-2 ${
            toast.type === "success" ? "bg-[#0E7C4D]" : "bg-[#C52B2B]"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          tx={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={(reason) => reject(rejectTarget, reason)}
        />
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#0D1829] tracking-tight" style={{ fontFamily: "Figtree, sans-serif" }}>
            Transactions
          </h1>
          <p className="text-[14px] text-[#5E6E8E] mt-0.5">Review, confirm, or reject customer transactions.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-[rgba(11,50,112,0.15)] text-[13px] font-medium text-[#5E6E8E] hover:bg-[#F4F7FB] transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-[10px] border border-[rgba(197,43,43,0.18)] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#C52B2B] mb-6">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#EBF0FA] rounded-[10px] w-fit mb-6">
        {(["pending", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`px-5 py-2 rounded-[8px] text-[13px] font-semibold transition-colors capitalize ${
              tab === t ? "bg-white text-[#0B3270] shadow-sm" : "text-[#5E6E8E] hover:text-[#0B3270]"
            }`}
          >
            {t === "pending" ? "Pending" : "All transactions"}
          </button>
        ))}
      </div>

      <div className="rounded-[16px] border border-[rgba(11,50,112,0.08)] bg-white overflow-hidden">
        {loading ? (
          <p className="px-5 py-10 text-center text-[13px] text-[#8A9BBE]">Loading…</p>
        ) : transactions.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <Clock size={32} className="text-[#C4D0E8] mx-auto mb-3" />
            <p className="text-[14px] font-semibold text-[#5E6E8E]">
              {tab === "pending" ? "No pending transactions" : "No transactions found"}
            </p>
            <p className="text-[12px] text-[#9AAABF] mt-1">
              {tab === "pending" ? "All caught up — customer submissions will appear here." : "No transaction records yet."}
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(11,50,112,0.07)] text-[11px] uppercase tracking-[0.05em] text-[#9AAABF]">
                <th className="px-5 py-3.5 font-semibold">Customer</th>
                <th className="px-5 py-3.5 font-semibold">Description</th>
                <th className="px-5 py-3.5 font-semibold">Account</th>
                <th className="px-5 py-3.5 font-semibold">Amount</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold">Date</th>
                {tab === "pending" && <th className="px-5 py-3.5 font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-[rgba(11,50,112,0.05)] last:border-0">
                  <td className="px-5 py-4">
                    <div className="text-[13px] font-semibold text-[#0D1829]">{tx.userName}</div>
                    <div className="text-[11px] text-[#9AAABF]">{tx.userEmail}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-[13px] text-[#0D1829]">{tx.name}</div>
                    <div className="text-[11px] text-[#9AAABF] capitalize">{tx.category}</div>
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[#5E6E8E]">{tx.accountName}</td>
                  <td className="px-5 py-4 text-[13px] font-semibold" style={{ color: tx.amount < 0 ? "#C52B2B" : "#0E7C4D" }}>
                    {tx.amount < 0 ? "-" : "+"}{currency(tx.amount)}
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={tx.status} /></td>
                  <td className="px-5 py-4 text-[12px] text-[#9AAABF]">
                    {new Date(tx.date).toLocaleDateString()}{" "}
                    <span className="text-[11px]">{new Date(tx.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </td>
                  {tab === "pending" && (
                    <td className="px-5 py-4">
                      {tx.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => confirm(tx)}
                            disabled={!!processing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#D6F0E6] text-[#0E7C4D] text-[12px] font-semibold hover:bg-[#c2e8d7] disabled:opacity-50 transition-colors"
                          >
                            <CheckCircle2 size={13} />
                            {processing === tx.id ? "…" : "Confirm"}
                          </button>
                          <button
                            onClick={() => setRejectTarget(tx)}
                            disabled={!!processing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#FDE8E8] text-[#C52B2B] text-[12px] font-semibold hover:bg-[#fad5d5] disabled:opacity-50 transition-colors"
                          >
                            <XCircle size={13} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <StatusBadge status={tx.status} />
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-[13px] text-[#8A9BBE]">{total} total</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[12px] font-medium text-[#5E6E8E] hover:bg-[#F4F7FB] disabled:opacity-40 transition-colors">
              Previous
            </button>
            <span className="px-3 py-1.5 text-[12px] text-[#5E6E8E]">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[12px] font-medium text-[#5E6E8E] hover:bg-[#F4F7FB] disabled:opacity-40 transition-colors">
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}
