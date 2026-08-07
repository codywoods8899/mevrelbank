import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2, XCircle, Clock, RefreshCw, AlertTriangle,
  Pencil, Ban, X, Check, History,
} from "lucide-react";
import { PageMeta } from "../website/components/PageMeta";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminReAuthModal from "./AdminReAuthModal";

interface Tx {
  id: string;
  accountId: string;
  accountName: string;
  userName: string;
  userEmail: string;
  name: string;
  category: string;
  txType: string;
  amount: number;
  status: string;
  initiatedBy: string;
  adminReason: string | null;
  adminId: string | null;
  adminName: string | null;
  reversalOf: string | null;
  reversedBy: string | null;
  metadata: Record<string, any> | null;
  date: string;
}

interface TxEdit {
  id: string;
  oldName: string;
  newName: string;
  oldCategory: string | null;
  newCategory: string | null;
  reason: string;
  adminId: string | null;
  adminName: string | null;
  adminEmail: string | null;
  editedAt: string;
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

function TxTypeBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    transaction:   { bg: "#EBF0FA",   text: "#5E6E8E", label: "Regular" },
    adjustment:    { bg: "#FDF0D6",   text: "#B46A0A", label: "Adjustment" },
    reversal:      { bg: "#E8F0FD",   text: "#0B3270", label: "Reversal" },
    void_reversal: { bg: "#F4E6FA",   text: "#7C2DB0", label: "Void" },
  };
  const s = map[type] ?? map.transaction;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

// ─── Reject modal ─────────────────────────────────────────────────────────────

function RejectModal({ tx, onClose, onConfirm }: { tx: Tx; onClose: () => void; onConfirm: (reason: string) => void; }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-[16px] shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-[18px] font-bold text-[#0D1829] mb-1" style={{ fontFamily: "Figtree, sans-serif" }}>Reject transaction?</h3>
        <p className="text-[13px] text-[#5E6E8E] mb-4">
          This will mark the transaction as unsuccessful and return held funds to <strong>{tx.userName}</strong>.
        </p>
        <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Reason (optional — shown to customer)</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. Unable to verify beneficiary details."
          className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270] resize-none mb-4" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-[10px] border border-[rgba(11,50,112,0.15)] text-[13px] font-semibold text-[#5E6E8E] hover:bg-[#F4F7FB] transition-colors">Cancel</button>
          <button onClick={() => onConfirm(reason)} className="flex-1 px-4 py-2.5 rounded-[10px] bg-[#C52B2B] text-white text-[13px] font-semibold hover:bg-[#a82424] transition-colors">Reject transaction</button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit description modal ───────────────────────────────────────────────────

function EditDescriptionModal({ tx, onClose, onSuccess, authedJson }: { tx: Tx; onClose: () => void; onSuccess: (msg: string) => void; authedJson: any; }) {
  const [name, setName]         = useState(tx.name);
  const [category, setCategory] = useState(tx.category);
  const [reason, setReason]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim())   { setError("Description is required."); return; }
    if (!reason.trim()) { setError("Reason is required — it is stored as an immutable audit record."); return; }
    setError(""); setLoading(true);
    try {
      await authedJson(`/admin/transactions/${tx.id}/description`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), category: category.trim() || undefined, reason: reason.trim() }),
      });
      onSuccess("Transaction description updated.");
    } catch (err: any) {
      setError(err.message ?? "Failed to update.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-[16px] shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Pencil size={15} className="text-[#0B3270]" />
            <h3 className="text-[17px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Edit description</h3>
          </div>
          <button onClick={onClose} className="text-[#9AAABF] hover:text-[#5E6E8E]"><X size={16} /></button>
        </div>
        <div className="bg-[#F4F7FB] rounded-[10px] px-4 py-3 mb-4">
          <div className="text-[11px] text-[#8A9BBE]">{tx.userName} · {tx.accountName}</div>
          <div className="text-[12px] font-semibold text-[#0D1829] mt-0.5">{currency(tx.amount)} · {new Date(tx.date).toLocaleDateString()}</div>
        </div>
        {error && <div className="rounded-[8px] bg-[#FEF2F2] border border-[rgba(197,43,43,0.18)] px-3 py-2 text-[12px] text-[#C52B2B] mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Description</label>
            <input autoFocus type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270]" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Category</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270]" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">
              Reason for change <span className="text-[#C52B2B]">*</span>
            </label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Corrected merchant name per customer request"
              className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270]" />
            <p className="text-[10px] text-[#9AAABF] mt-0.5">Stored as an immutable audit record — not shown to the customer.</p>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-[10px] border border-[rgba(11,50,112,0.15)] text-[13px] font-semibold text-[#5E6E8E] hover:bg-[#F4F7FB] transition-colors">Cancel</button>
            <button type="submit" disabled={loading || !name.trim() || !reason.trim()} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[10px] bg-[#0B3270] text-white text-[13px] font-semibold hover:bg-[#0d3d8a] disabled:opacity-60 transition-colors">
              <Check size={13} />{loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit history modal ───────────────────────────────────────────────────────

function EditHistoryModal({ tx, onClose, authedJson }: { tx: Tx; onClose: () => void; authedJson: any; }) {
  const [edits, setEdits] = useState<TxEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    authedJson(`/admin/transactions/${tx.id}/edits`)
      .then((d: any) => setEdits(d.edits ?? []))
      .catch((err: any) => setError(err.message ?? "Failed to load edit history."))
      .finally(() => setLoading(false));
  }, [tx.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-[16px] shadow-xl w-full max-w-lg mx-4 p-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <History size={15} className="text-[#0B3270]" />
            <h3 className="text-[17px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Edit history</h3>
          </div>
          <button onClick={onClose} className="text-[#9AAABF] hover:text-[#5E6E8E]"><X size={16} /></button>
        </div>
        <div className="bg-[#F4F7FB] rounded-[10px] px-4 py-3 mb-4 flex-shrink-0">
          <div className="text-[11px] text-[#8A9BBE]">{tx.userName} · {tx.accountName}</div>
          <div className="text-[12px] font-semibold text-[#0D1829] mt-0.5">{tx.name} · {currency(tx.amount)}</div>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <p className="text-[13px] text-[#8A9BBE] text-center py-6">Loading…</p>
          ) : error ? (
            <p className="text-[12px] text-[#C52B2B] text-center py-6">{error}</p>
          ) : edits.length === 0 ? (
            <p className="text-[13px] text-[#5E6E8E] text-center py-6">No edit history for this transaction.</p>
          ) : (
            <div className="space-y-3">
              {edits.map((e) => (
                <div key={e.id} className="rounded-[10px] border border-[rgba(11,50,112,0.08)] bg-[#F8FAFD] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-[#0B3270]">{e.adminName ?? "Administrator"}</span>
                    <span className="text-[10px] text-[#9AAABF]">{new Date(e.editedAt).toLocaleString()}</span>
                  </div>
                  <div className="space-y-1.5 text-[12px]">
                    {e.oldName !== e.newName && (
                      <div className="flex gap-2 items-start">
                        <span className="text-[#9AAABF] w-16 flex-shrink-0">Name</span>
                        <span className="line-through text-[#C52B2B]">{e.oldName}</span>
                        <span className="text-[#0E7C4D]">→ {e.newName}</span>
                      </div>
                    )}
                    {e.oldCategory !== e.newCategory && (
                      <div className="flex gap-2 items-start">
                        <span className="text-[#9AAABF] w-16 flex-shrink-0">Category</span>
                        <span className="line-through text-[#C52B2B]">{e.oldCategory ?? "—"}</span>
                        <span className="text-[#0E7C4D]">→ {e.newCategory ?? "—"}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-[rgba(11,50,112,0.06)]">
                    <span className="text-[10px] text-[#9AAABF]">Reason: </span>
                    <span className="text-[11px] text-[#5E6E8E]">{e.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Void modal (after re-auth) ───────────────────────────────────────────────

function VoidModal({ tx, confirmToken, onClose, onSuccess, authedJson }: { tx: Tx; confirmToken: string; onClose: () => void; onSuccess: (msg: string) => void; authedJson: any; }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVoid = async () => {
    if (!reason.trim()) { setError("Reason is required for a void."); return; }
    setError(""); setLoading(true);
    try {
      await authedJson(`/admin/transactions/${tx.id}/void`, {
        method: "POST",
        headers: { "X-Admin-Confirm-Token": confirmToken },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      onSuccess("Transaction voided. Reversal posted.");
    } catch (err: any) {
      setError(err.message ?? "Failed to void transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-[18px] shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ban size={15} className="text-[#C52B2B]" />
            <h3 className="text-[17px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Void transaction</h3>
          </div>
          <button onClick={onClose} className="text-[#9AAABF] hover:text-[#5E6E8E]"><X size={16} /></button>
        </div>
        <div className="rounded-[10px] bg-[#FDF5E6] border border-[rgba(180,106,10,0.2)] px-4 py-3 mb-4">
          <p className="text-[12px] font-semibold text-[#B46A0A]">{tx.name} — {tx.amount < 0 ? "-" : "+"}{currency(tx.amount)}</p>
          <p className="text-[11px] text-[#8A5C0A] mt-0.5">A reversal transaction of the opposite sign will be posted. The original transaction will be marked as reversed.</p>
        </div>
        {error && <div className="rounded-[8px] bg-[#FEF2F2] border border-[rgba(197,43,43,0.18)] px-3 py-2 text-[12px] text-[#C52B2B] mb-3">{error}</div>}
        <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">
          Reason <span className="text-[#C52B2B]">*</span>
        </label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. Duplicate transaction — customer reported."
          className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270] resize-none mb-4" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-[10px] border border-[rgba(11,50,112,0.15)] text-[13px] font-semibold text-[#5E6E8E] hover:bg-[#F4F7FB] transition-colors">Cancel</button>
          <button onClick={handleVoid} disabled={loading} className="flex-1 px-4 py-2.5 rounded-[10px] bg-[#C52B2B] text-white text-[13px] font-semibold hover:bg-[#a82424] disabled:opacity-60 transition-colors">
            {loading ? "Voiding…" : "Void transaction"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminTransactionsPage() {
  const { authedJson } = useAdminAuth();
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [rejectTarget, setRejectTarget] = useState<Tx | null>(null);
  const [rejectToken, setRejectToken]   = useState<string | null>(null);
  const [confirmTxTarget, setConfirmTxTarget] = useState<Tx | null>(null);
  const [editTarget, setEditTarget]     = useState<Tx | null>(null);
  const [historyTx, setHistoryTx]       = useState<Tx | null>(null);
  const [voidTarget, setVoidTarget]     = useState<Tx | null>(null);
  const [voidToken, setVoidToken]       = useState<string | null>(null);
  const [processing, setProcessing]     = useState<string | null>(null);
  const [toast, setToast]         = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [tab, setTab]             = useState<"pending" | "all">("pending");
  const [page, setPage]           = useState(1);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(() => {
    setLoading(true);
    const url = tab === "pending" ? `/admin/pending?page=${page}` : `/admin/transactions?page=${page}`;
    authedJson(url)
      .then((data: any) => { setTransactions(data.transactions ?? []); setTotal(data.total ?? 0); })
      .catch((err: any) => setError(err.message ?? "Failed to load transactions."))
      .finally(() => setLoading(false));
  }, [tab, page, authedJson]);

  useEffect(() => { load(); }, [load]);

  const confirm = async (tx: Tx, token: string) => {
    setProcessing(tx.id);
    try {
      await authedJson(`/admin/transactions/${tx.id}/confirm`, {
        method: "PATCH",
        headers: { "X-Admin-Confirm-Token": token },
      });
      showToast("Transaction confirmed and completed.", "success");
      load();
    } catch (err: any) {
      showToast(err.message ?? "Failed to confirm.", "error");
    } finally {
      setProcessing(null);
    }
  };

  const reject = async (tx: Tx, reason: string, token: string) => {
    setRejectTarget(null);
    setRejectToken(null);
    setProcessing(tx.id);
    try {
      await authedJson(`/admin/transactions/${tx.id}/reject`, {
        method: "PATCH",
        headers: { "X-Admin-Confirm-Token": token },
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

  const pageSize   = 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Can this completed tx be voided?
  const canVoid = (tx: Tx) =>
    tx.status === "completed" && !tx.reversedBy && tx.txType !== "void_reversal";

  return (
    <>
      <PageMeta title="Transactions — Admin — MevrelBank" description="Manage and confirm customer transactions." />

      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-[10px] text-[13px] font-semibold shadow-lg text-white flex items-center gap-2 ${toast.type === "success" ? "bg-[#0E7C4D]" : "bg-[#C52B2B]"}`}>
          {toast.type === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Confirm: step 1 — re-auth, then execute immediately */}
      {confirmTxTarget && (
        <AdminReAuthModal
          title="Confirm transaction"
          description="Confirming this transaction settles the funds and cannot be undone. Confirm your identity to continue."
          onClose={() => setConfirmTxTarget(null)}
          onConfirm={async (token) => {
            const tx = confirmTxTarget;
            setConfirmTxTarget(null);
            await confirm(tx, token);
          }}
        />
      )}

      {/* Reject: step 1 — re-auth */}
      {rejectTarget && !rejectToken && (
        <AdminReAuthModal
          title="Reject transaction"
          description="This will mark the transaction as unsuccessful and return held funds to the customer. Confirm your identity to continue."
          onClose={() => setRejectTarget(null)}
          onConfirm={(token) => setRejectToken(token)}
        />
      )}

      {/* Reject: step 2 — reason */}
      {rejectTarget && rejectToken && (
        <RejectModal
          tx={rejectTarget}
          onClose={() => { setRejectTarget(null); setRejectToken(null); }}
          onConfirm={(r) => reject(rejectTarget, r, rejectToken)}
        />
      )}

      {/* Edit description modal */}
      {editTarget && (
        <EditDescriptionModal
          tx={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={(msg) => { setEditTarget(null); showToast(msg, "success"); load(); }}
          authedJson={authedJson}
        />
      )}

      {/* Edit history modal */}
      {historyTx && (
        <EditHistoryModal
          tx={historyTx}
          onClose={() => setHistoryTx(null)}
          authedJson={authedJson}
        />
      )}

      {/* Void: step 1 — re-auth */}
      {voidTarget && !voidToken && (
        <AdminReAuthModal
          title="Void transaction"
          description="Voiding posts a reversal transaction and adjusts the account balance. This action cannot be undone. Confirm your identity to continue."
          onClose={() => setVoidTarget(null)}
          onConfirm={(token) => setVoidToken(token)}
        />
      )}

      {/* Void: step 2 — reason */}
      {voidTarget && voidToken && (
        <VoidModal
          tx={voidTarget}
          confirmToken={voidToken}
          onClose={() => { setVoidTarget(null); setVoidToken(null); }}
          onSuccess={(msg) => { setVoidTarget(null); setVoidToken(null); showToast(msg, "success"); load(); }}
          authedJson={authedJson}
        />
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#0D1829] tracking-tight" style={{ fontFamily: "Figtree, sans-serif" }}>Transactions</h1>
          <p className="text-[14px] text-[#5E6E8E] mt-0.5">Review, confirm, reject, edit descriptions, or void customer transactions.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-[rgba(11,50,112,0.15)] text-[13px] font-medium text-[#5E6E8E] hover:bg-[#F4F7FB] transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-[10px] border border-[rgba(197,43,43,0.18)] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#C52B2B] mb-6">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#EBF0FA] rounded-[10px] w-fit mb-6">
        {(["pending", "all"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            className={`px-5 py-2 rounded-[8px] text-[13px] font-semibold transition-colors capitalize ${tab === t ? "bg-white text-[#0B3270] shadow-sm" : "text-[#5E6E8E] hover:text-[#0B3270]"}`}>
            {t === "pending" ? "Pending" : "All transactions"}
          </button>
        ))}
      </div>

      <div className="rounded-[16px] border border-[rgba(11,50,112,0.08)] bg-white overflow-x-auto">
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
                <th className="px-5 py-3.5 font-semibold">Type</th>
                <th className="px-5 py-3.5 font-semibold">Amount</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold">Date</th>
                <th className="px-5 py-3.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className={`border-b border-[rgba(11,50,112,0.05)] last:border-0 ${tx.reversedBy ? "opacity-50" : ""}`}>
                  <td className="px-5 py-4">
                    <div className="text-[13px] font-semibold text-[#0D1829]">{tx.userName}</div>
                    <div className="text-[11px] text-[#9AAABF]">{tx.userEmail}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-[13px] text-[#0D1829]">{tx.name}</div>
                    <div className="text-[11px] text-[#9AAABF] capitalize">{tx.category}</div>
                    {tx.adminReason && (
                      <div className="text-[10px] text-[#5E6E8E] mt-0.5 italic max-w-[200px] truncate"
                           title={`${tx.adminReason}${tx.adminName ? ` — ${tx.adminName}` : ""}`}>
                        ↳ {tx.adminReason}{tx.adminName ? ` — ${tx.adminName}` : ""}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[#5E6E8E]">{tx.accountName}</td>
                  <td className="px-5 py-4"><TxTypeBadge type={tx.txType} /></td>
                  <td className="px-5 py-4 text-[13px] font-semibold" style={{ color: tx.amount < 0 ? "#C52B2B" : "#0E7C4D" }}>
                    {tx.amount < 0 ? "-" : "+"}{currency(tx.amount)}
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={tx.status} /></td>
                  <td className="px-5 py-4 text-[12px] text-[#9AAABF]">
                    {new Date(tx.date).toLocaleDateString()}{" "}
                    <span className="text-[11px]">{new Date(tx.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2 flex-wrap">
                      {/* Pending actions */}
                      {tx.status === "pending" && tab === "pending" && (
                        <>
                          <button onClick={() => setConfirmTxTarget(tx)} disabled={!!processing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#D6F0E6] text-[#0E7C4D] text-[12px] font-semibold hover:bg-[#c2e8d7] disabled:opacity-50 transition-colors">
                            <CheckCircle2 size={13} />{processing === tx.id ? "…" : "Confirm"}
                          </button>
                          <button onClick={() => setRejectTarget(tx)} disabled={!!processing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#FDE8E8] text-[#C52B2B] text-[12px] font-semibold hover:bg-[#fad5d5] disabled:opacity-50 transition-colors">
                            <XCircle size={13} />Reject
                          </button>
                        </>
                      )}

                      {/* All-tab: edit description */}
                      {tab === "all" && tx.txType === "transaction" && tx.status !== "pending" && (
                        <button onClick={() => setEditTarget(tx)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#EBF0FA] text-[#0B3270] text-[12px] font-semibold hover:bg-[#dce5f5] transition-colors">
                          <Pencil size={12} />Edit
                        </button>
                      )}

                      {/* All-tab: edit history */}
                      {tab === "all" && tx.txType === "transaction" && (
                        <button onClick={() => setHistoryTx(tx)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#F4F7FB] text-[#5E6E8E] text-[12px] font-semibold hover:bg-[#e8edf5] transition-colors">
                          <History size={12} />History
                        </button>
                      )}

                      {/* All-tab: void */}
                      {tab === "all" && canVoid(tx) && (
                        <button onClick={() => setVoidTarget(tx)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#FEF2F2] text-[#C52B2B] text-[12px] font-semibold hover:bg-[#fde8e8] transition-colors">
                          <Ban size={12} />Void
                        </button>
                      )}

                      {/* Voided indicator */}
                      {tx.reversedBy && (
                        <span className="text-[11px] text-[#9AAABF] italic">Voided</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-[13px] text-[#8A9BBE]">{total} total</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[12px] font-medium text-[#5E6E8E] hover:bg-[#F4F7FB] disabled:opacity-40 transition-colors">Previous</button>
            <span className="px-3 py-1.5 text-[12px] text-[#5E6E8E]">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[12px] font-medium text-[#5E6E8E] hover:bg-[#F4F7FB] disabled:opacity-40 transition-colors">Next</button>
          </div>
        </div>
      )}
    </>
  );
}
