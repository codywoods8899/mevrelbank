import { useEffect, useState, useCallback } from "react";
import {
  Search, ArrowUpDown, TrendingUp, TrendingDown, CheckCircle2,
  AlertTriangle, X, Pencil, BanknoteIcon, Check,
} from "lucide-react";
import { PageMeta } from "../website/components/PageMeta";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminReAuthModal from "./AdminReAuthModal";

interface Account {
  id: string;
  name: string;
  type: string;
  routingNumber: string;
  accountNumber: string;
  balance: number;
  available: number;
  status: string;
  closeReason: string | null;
  closedAt: string | null;
  closedById: string | null;
  closedByName: string | null;
  userName: string;
  userEmail: string;
  userId: string;
}

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

type ActionMode = "credit" | "debit" | "transfer" | "rename" | "close";

interface ActiveModal { mode: ActionMode; account: Account; }

// ─── Action modal (credit / debit / transfer) ─────────────────────────────────

function FinanceModal({
  modal,
  allAccounts,
  onClose,
  onSuccess,
  authedJson,
}: {
  modal: ActiveModal;
  allAccounts: Account[];
  onClose: () => void;
  onSuccess: (msg: string) => void;
  authedJson: any;
}) {
  const { mode, account } = modal;
  const [amount, setAmount]       = useState("");
  const [description, setDescription] = useState("");
  const [reason, setReason]       = useState("");
  const [category, setCategory]   = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [allowNegative, setAllowNegative] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const otherActive = allAccounts.filter((a) => a.id !== account.id && a.status === "active");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode !== "transfer" && !reason.trim()) { setError("Internal reason is required."); return; }
    setLoading(true);
    try {
      if (mode === "transfer") {
        if (!toAccountId) throw new Error("Select a destination account.");
        await authedJson("/admin/transfer", {
          method: "POST",
          body: JSON.stringify({ fromAccountId: account.id, toAccountId, amount: parseFloat(amount), description: description.trim() || undefined }),
        });
        onSuccess(`Transfer of ${currency(parseFloat(amount))} completed.`);
      } else {
        await authedJson(`/admin/accounts/${account.id}/${mode}`, {
          method: "POST",
          body: JSON.stringify({
            amount: parseFloat(amount),
            description: description.trim(),
            reason: reason.trim(),
            category: category.trim() || undefined,
            allowNegative: mode === "debit" ? allowNegative : undefined,
          }),
        });
        onSuccess(`${mode === "credit" ? "Credit" : "Debit"} of ${currency(parseFloat(amount))} posted.`);
      }
    } catch (err: any) {
      setError(err.message ?? "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  const titles:    Record<ActionMode, string>          = { credit: "Credit account", debit: "Debit account", transfer: "Transfer funds", rename: "", close: "" };
  const btnColors: Record<ActionMode, string>          = { credit: "bg-[#0E7C4D] hover:bg-[#0a6340]", debit: "bg-[#C52B2B] hover:bg-[#a82424]", transfer: "bg-[#0B3270] hover:bg-[#0d3d8a]", rename: "", close: "" };
  const icons: Record<ActionMode, React.ReactNode> = {
    credit: <TrendingUp size={15} className="text-[#0E7C4D]" />,
    debit:  <TrendingDown size={15} className="text-[#C52B2B]" />,
    transfer: <ArrowUpDown size={15} className="text-[#0B3270]" />,
    rename: null, close: null,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-[16px] shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icons[mode]}
            <h3 className="text-[17px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>{titles[mode]}</h3>
          </div>
          <button onClick={onClose} className="text-[#9AAABF] hover:text-[#5E6E8E]"><X size={16} /></button>
        </div>

        <div className="bg-[#F4F7FB] rounded-[10px] px-4 py-3 mb-4">
          <div className="text-[12px] font-semibold text-[#0D1829]">{account.userName}</div>
          <div className="text-[11px] text-[#8A9BBE]">{account.name} · {account.routingNumber} {account.accountNumber}</div>
          <div className="text-[11px] text-[#5E6E8E] mt-1">Balance: {currency(account.balance)} · Available: {currency(account.available)}</div>
        </div>

        {error && (
          <div className="rounded-[8px] border border-[rgba(197,43,43,0.18)] bg-[#FEF2F2] px-3 py-2 text-[12px] text-[#C52B2B] mb-3">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Amount ($)</label>
            <input type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
              className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270]" />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Customer-visible description</label>
            <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Account correction"
              className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270]" />
          </div>

          {mode !== "transfer" && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">
                  Internal reason <span className="text-[#C52B2B]">*</span>
                </label>
                <input type="text" required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Correction for duplicate charge on 2026-07-10"
                  className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270]" />
                <p className="text-[10px] text-[#9AAABF] mt-0.5">Stored as an audit record — not shown to the customer.</p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Category (optional)</label>
                <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Adjustment, Fee, Refund"
                  className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270]" />
              </div>
            </>
          )}

          {mode === "transfer" && (
            <div>
              <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Destination account</label>
              <select required value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270]">
                <option value="">Select account…</option>
                {otherActive.map((a) => (
                  <option key={a.id} value={a.id}>{a.userName} — {a.name} ({currency(a.balance)})</option>
                ))}
              </select>
            </div>
          )}

          {mode === "debit" && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={allowNegative} onChange={(e) => setAllowNegative(e.target.checked)} className="rounded" />
              <span className="text-[12px] text-[#5E6E8E]">Allow negative balance</span>
            </label>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-[10px] border border-[rgba(11,50,112,0.15)] text-[13px] font-semibold text-[#5E6E8E] hover:bg-[#F4F7FB] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className={`flex-1 px-4 py-2.5 rounded-[10px] text-white text-[13px] font-semibold disabled:opacity-60 transition-colors ${btnColors[mode]}`}>
              {loading ? "Processing…" : titles[mode]}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Rename modal ─────────────────────────────────────────────────────────────

function RenameModal({ account, onClose, onSuccess, authedJson }: { account: Account; onClose: () => void; onSuccess: (msg: string) => void; authedJson: any; }) {
  const [name, setName] = useState(account.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    setLoading(true);
    setError("");
    try {
      await authedJson(`/admin/accounts/${account.id}/name`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      onSuccess(`Account renamed to "${name.trim()}".`);
    } catch (err: any) {
      setError(err.message ?? "Failed to rename account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-[16px] shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Pencil size={15} className="text-[#0B3270]" />
            <h3 className="text-[17px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Rename account</h3>
          </div>
          <button onClick={onClose} className="text-[#9AAABF] hover:text-[#5E6E8E]"><X size={16} /></button>
        </div>
        {error && <div className="rounded-[8px] bg-[#FEF2F2] border border-[rgba(197,43,43,0.18)] px-3 py-2 text-[12px] text-[#C52B2B] mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Account name</label>
            <input autoFocus type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270]" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-[10px] border border-[rgba(11,50,112,0.15)] text-[13px] font-semibold text-[#5E6E8E] hover:bg-[#F4F7FB] transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[10px] bg-[#0B3270] text-white text-[13px] font-semibold hover:bg-[#0d3d8a] disabled:opacity-60 transition-colors">
              <Check size={13} />{loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Close account modal (after re-auth) ─────────────────────────────────────

function CloseAccountModal({ account, confirmToken, onClose, onSuccess, authedJson }: { account: Account; confirmToken: string; onClose: () => void; onSuccess: (msg: string) => void; authedJson: any; }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = async () => {
    setError("");
    setLoading(true);
    try {
      await authedJson(`/admin/accounts/${account.id}/close`, {
        method: "POST",
        headers: { "X-Admin-Confirm-Token": confirmToken },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      onSuccess(`Account "${account.name}" closed.`);
    } catch (err: any) {
      setError(err.message ?? "Failed to close account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-[18px] shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[17px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Close account</h3>
          <button onClick={onClose} className="text-[#9AAABF] hover:text-[#5E6E8E]"><X size={16} /></button>
        </div>
        <div className="rounded-[10px] bg-[#EBF0FA] border border-[rgba(11,50,112,0.12)] px-4 py-3 mb-4">
          <p className="text-[12px] font-semibold text-[#0B3270]">Account: {account.name} — {currency(account.balance)}</p>
          <p className="text-[11px] text-[#5E6E8E] mt-0.5">
            Balance, available balance, held funds, and pending transactions must all be zero before closure can proceed. The backend will reject the request if any condition is unmet.
          </p>
        </div>
        {error && <div className="rounded-[8px] bg-[#FEF2F2] border border-[rgba(197,43,43,0.18)] px-3 py-2 text-[12px] text-[#C52B2B] mb-3">{error}</div>}
        <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">
          Reason <span className="text-[#C52B2B]">*</span>
        </label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. Customer requested closure."
          className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270] resize-none mb-4" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-[10px] border border-[rgba(11,50,112,0.15)] text-[13px] font-semibold text-[#5E6E8E] hover:bg-[#F4F7FB] transition-colors">Cancel</button>
          <button onClick={handleClose} disabled={loading || !reason.trim()} className="flex-1 px-4 py-2.5 rounded-[10px] bg-[#C52B2B] text-white text-[13px] font-semibold hover:bg-[#a82424] disabled:opacity-60 transition-colors">
            {loading ? "Closing…" : "Close account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminAccountsPage() {
  const { authedJson } = useAdminAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [total, setTotal]       = useState(0);
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const [showClosed, setShowClosed] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [modal, setModal]       = useState<ActiveModal | null>(null);
  const [toast, setToast]       = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Close account 2-step: re-auth → confirm modal
  const [closeTarget, setCloseTarget]         = useState<Account | null>(null);
  const [closeConfirmToken, setCloseConfirmToken] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(() => {
    setLoading(true);
    authedJson(`/admin/accounts?page=${page}&search=${encodeURIComponent(search)}&includeClosed=${showClosed}`)
      .then((data: any) => { setAccounts(data.accounts ?? []); setTotal(data.total ?? 0); })
      .catch((err: any) => setError(err.message ?? "Failed to load accounts."))
      .finally(() => setLoading(false));
  }, [page, search, showClosed, authedJson]);

  useEffect(() => { load(); }, [load]);

  const handleSuccess = (msg: string) => {
    setModal(null);
    setCloseTarget(null);
    setCloseConfirmToken(null);
    showToast(msg, "success");
    load();
  };

  const pageSize  = 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <PageMeta title="Accounts — Admin — MevrelBank" description="Manage all customer accounts." />

      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-[10px] text-[13px] font-semibold shadow-lg text-white flex items-center gap-2 ${toast.type === "success" ? "bg-[#0E7C4D]" : "bg-[#C52B2B]"}`}>
          {toast.type === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Finance action modal */}
      {modal && modal.mode !== "rename" && modal.mode !== "close" && (
        <FinanceModal modal={modal} allAccounts={accounts} onClose={() => setModal(null)} onSuccess={handleSuccess} authedJson={authedJson} />
      )}

      {/* Rename modal */}
      {modal?.mode === "rename" && (
        <RenameModal account={modal.account} onClose={() => setModal(null)} onSuccess={handleSuccess} authedJson={authedJson} />
      )}

      {/* Close account: step 1 — re-auth */}
      {closeTarget && !closeConfirmToken && (
        <AdminReAuthModal
          title="Close account"
          description={`Closing "${closeTarget.name}" is irreversible from the UI. Transaction history will be preserved. Confirm your identity to continue.`}
          onClose={() => setCloseTarget(null)}
          onConfirm={(token) => setCloseConfirmToken(token)}
        />
      )}

      {/* Close account: step 2 — reason + confirm */}
      {closeTarget && closeConfirmToken && (
        <CloseAccountModal
          account={closeTarget}
          confirmToken={closeConfirmToken}
          onClose={() => { setCloseTarget(null); setCloseConfirmToken(null); }}
          onSuccess={handleSuccess}
          authedJson={authedJson}
        />
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#0D1829] tracking-tight" style={{ fontFamily: "Figtree, sans-serif" }}>Accounts</h1>
          <p className="text-[14px] text-[#5E6E8E] mt-0.5">Credit, debit, transfer, rename, or close customer accounts.</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#5E6E8E] font-medium">
          <input type="checkbox" checked={showClosed} onChange={(e) => { setShowClosed(e.target.checked); setPage(1); }} className="rounded" />
          Show closed accounts
        </label>
      </div>

      {error && (
        <div className="rounded-[10px] border border-[rgba(197,43,43,0.18)] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#C52B2B] mb-6">{error}</div>
      )}

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AAABF]" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by customer or account…"
            className="w-full pl-9 pr-4 py-2.5 rounded-[10px] border border-[rgba(11,50,112,0.12)] text-[13px] outline-none focus:border-[#0B3270] bg-white" />
        </div>
        <span className="text-[13px] text-[#8A9BBE]">{total} accounts</span>
      </div>

      <div className="rounded-[16px] border border-[rgba(11,50,112,0.08)] bg-white overflow-hidden">
        {loading ? (
          <p className="px-5 py-10 text-center text-[13px] text-[#8A9BBE]">Loading…</p>
        ) : accounts.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-[#8A9BBE]">No accounts found.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(11,50,112,0.07)] text-[11px] uppercase tracking-[0.05em] text-[#9AAABF]">
                <th className="px-5 py-3.5 font-semibold">Customer</th>
                <th className="px-5 py-3.5 font-semibold">Account</th>
                <th className="px-5 py-3.5 font-semibold">Balance</th>
                <th className="px-5 py-3.5 font-semibold">Available</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className={`border-b border-[rgba(11,50,112,0.05)] last:border-0 ${a.status === "closed" ? "opacity-60" : ""}`}>
                  <td className="px-5 py-4">
                    <div className="text-[13px] font-semibold text-[#0D1829]">{a.userName}</div>
                    <div className="text-[11px] text-[#9AAABF]">{a.userEmail}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-[13px] text-[#0D1829]">{a.name}</div>
                    <div className="text-[11px] text-[#9AAABF]">{a.routingNumber} · {a.accountNumber}</div>
                  </td>
                  <td className="px-5 py-4 text-[13px] font-semibold text-[#0D1829]">{currency(a.balance)}</td>
                  <td className="px-5 py-4 text-[13px] text-[#5E6E8E]">{currency(a.available)}</td>
                  <td className="px-5 py-4">
                    {a.status === "closed" ? (
                      <div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F4F7FB] text-[#9AAABF]">Closed</span>
                        {a.closedAt && (
                          <p className="text-[10px] text-[#9AAABF] mt-0.5">{new Date(a.closedAt).toLocaleDateString()}</p>
                        )}
                        {a.closedByName && (
                          <p className="text-[10px] text-[#9AAABF]">by {a.closedByName}</p>
                        )}
                        {a.closeReason && (
                          <p className="text-[10px] text-[#5E6E8E] mt-0.5 max-w-[160px] truncate" title={a.closeReason}>"{a.closeReason}"</p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#D6F0E6] text-[#0E7C4D]">Active</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {a.status === "active" ? (
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setModal({ mode: "credit", account: a })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#D6F0E6] text-[#0E7C4D] text-[12px] font-semibold hover:bg-[#c2e8d7] transition-colors">
                          <TrendingUp size={12} /> Credit
                        </button>
                        <button onClick={() => setModal({ mode: "debit", account: a })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#FDE8E8] text-[#C52B2B] text-[12px] font-semibold hover:bg-[#fad5d5] transition-colors">
                          <TrendingDown size={12} /> Debit
                        </button>
                        <button onClick={() => setModal({ mode: "transfer", account: a })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#EBF0FA] text-[#0B3270] text-[12px] font-semibold hover:bg-[#dce5f5] transition-colors">
                          <ArrowUpDown size={12} /> Transfer
                        </button>
                        <button onClick={() => setModal({ mode: "rename", account: a })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#F4F7FB] text-[#5E6E8E] text-[12px] font-semibold hover:bg-[#e8edf5] transition-colors">
                          <Pencil size={12} /> Rename
                        </button>
                        <button onClick={() => setCloseTarget(a)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#FEF2F2] text-[#C52B2B] text-[12px] font-semibold hover:bg-[#fde8e8] transition-colors">
                          <BanknoteIcon size={12} /> Close
                        </button>
                      </div>
                    ) : (
                      <span className="text-[12px] text-[#9AAABF]">—</span>
                    )}
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
