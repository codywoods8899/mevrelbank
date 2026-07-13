import { useEffect, useState } from "react";
import { CreditCard, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, X, AlertCircle } from "lucide-react";
import { PageMeta } from "../components/PageMeta";
import { Btn } from "../shared/Btn";
import { useAuth } from "../../context/AuthContext";
import { bankingApi, formatRelativeDate, type Account, type Transaction } from "../shared/bankingApi";

function TransferModal({ accounts, onClose, onDone }: { accounts: Account[]; onClose: () => void; onDone: (updated: Account[]) => void }) {
  const { authedFetch } = useAuth();
  const [fromId, setFromId] = useState(accounts[0]?.id ?? "");
  const [toId, setToId] = useState(accounts[1]?.id ?? accounts[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fromId === toId) { setError("Choose two different accounts."); return; }
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) { setError("Enter a valid amount."); return; }
    setSaving(true);
    try {
      const res = await bankingApi.transfer(authedFetch, { fromAccountId: fromId, toAccountId: toId, amount: value, note: note.trim() || undefined });
      setDone(true);
      onDone(res.accounts);
    } catch (err: any) {
      setError(err.message ?? "Transfer failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[16px] w-full max-w-sm p-6 shadow-2xl border border-[rgba(11,50,112,0.08)] relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#9AAABF] hover:text-[#5E6E8E]" aria-label="Close"><X size={16} /></button>
        {done ? (
          <div className="text-center py-4">
            <div className="text-[15px] font-bold text-[#0D1829] mb-1">Transfer complete</div>
            <div className="text-[12px] text-[#5E6E8E] mb-4">${parseFloat(amount).toFixed(2)} moved between your accounts.</div>
            <Btn size="md" className="w-full justify-center" onClick={onClose}>Done</Btn>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="text-[15px] font-bold text-[#0D1829] mb-4">Move money between your accounts</div>
            <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">From</label>
            <select value={fromId} onChange={(e) => setFromId(e.target.value)} className="w-full mb-3 px-3 py-2 rounded-[6px] border border-[rgba(11,50,112,0.15)] text-[12px] outline-none focus:border-[#0B3270]">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} — ${a.available.toFixed(2)} available</option>)}
            </select>
            <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">To</label>
            <select value={toId} onChange={(e) => setToId(e.target.value)} className="w-full mb-3 px-3 py-2 rounded-[6px] border border-[rgba(11,50,112,0.15)] text-[12px] outline-none focus:border-[#0B3270]">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Amount ($)</label>
            <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
              className="w-full mb-3 px-3 py-2 rounded-[6px] border border-[rgba(11,50,112,0.15)] text-[12px] outline-none focus:border-[#0B3270]" />
            <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Reference (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Rent"
              className="w-full mb-4 px-3 py-2 rounded-[6px] border border-[rgba(11,50,112,0.15)] text-[12px] outline-none focus:border-[#0B3270]" />
            {error && (
              <div className="flex items-center gap-2 mb-3 text-[12px] text-[#C52B2B]"><AlertCircle size={13} />{error}</div>
            )}
            <Btn size="md" type="submit" className="w-full justify-center" disabled={saving}>{saving ? "Transferring…" : "Transfer"}</Btn>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const { authedFetch } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransfer, setShowTransfer] = useState(false);

  function load() {
    Promise.all([bankingApi.getAccounts(authedFetch), bankingApi.getTransactions(authedFetch, { limit: 20 })])
      .then(([a, t]) => {
        setAccounts(a.accounts);
        setTransactions(t.transactions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [authedFetch]);

  return (
    <>
      <PageMeta title="Accounts — MevrelBank" description="View your MevrelBank current and savings accounts." />
      {showTransfer && accounts.length >= 2 && (
        <TransferModal
          accounts={accounts}
          onClose={() => { setShowTransfer(false); load(); }}
          onDone={() => {}}
        />
      )}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold text-[#0D1829] mb-0.5" style={{ fontFamily: "Figtree, sans-serif" }}>Accounts</h1>
          <div className="text-[12px] text-[#8A9BBE]">{loading ? "Loading…" : `${accounts.length} accounts`}</div>
        </div>
        {accounts.length >= 2 && (
          <Btn size="sm" icon={<ArrowLeftRight size={13} />} onClick={() => setShowTransfer(true)}>Transfer</Btn>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {accounts.map((acc) => (
          <div key={acc.id} className="p-5 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] shadow-[0_1px_4px_rgba(11,50,112,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-[7px] bg-[#EBF0FA] flex items-center justify-center text-[#0B3270]">
                <CreditCard size={16} />
              </div>
            </div>
            <div className="text-[9px] font-semibold tracking-[0.16em] uppercase text-[#8A9BBE] mb-2">{acc.type}</div>
            <div className="text-[24px] font-bold text-[#0D1829] leading-none mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
              ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-[#8A9BBE] mb-4">Available: ${acc.available.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="flex items-center gap-4 text-[11px] text-[#5E6E8E] pt-3 border-t border-[rgba(11,50,112,0.06)]" style={{ fontFamily: "'DM Mono', monospace" }}>
              <span>Sort code {acc.sortCode}</span>
              <span>Acc {acc.accountNumber}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[rgba(11,50,112,0.05)] text-[13px] font-semibold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>
          Activity across all accounts
        </div>
        {transactions.map((tx, i) => (
          <div key={tx.id} className={`flex items-center gap-3.5 px-5 py-3 ${i < transactions.length - 1 ? "border-b border-[rgba(11,50,112,0.04)]" : ""}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${tx.amount > 0 ? "bg-[#D6F0E6]" : "bg-[#EEF2F9]"}`}>
              {tx.amount > 0 ? <ArrowDownLeft size={12} className="text-[#0E7C4D]" /> : <ArrowUpRight size={12} className="text-[#7A8CAA]" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-[#0D1829] truncate">{tx.name}</div>
              <div className="text-[10px] text-[#8A9BBE]">{tx.account} · {formatRelativeDate(tx.date)}</div>
            </div>
            <div className="text-[12px] font-medium w-24 text-right" style={{ fontFamily: "'DM Mono', monospace", color: tx.amount > 0 ? "#0E7C4D" : "#0D1829" }}>
              {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
            </div>
          </div>
        ))}
        {!loading && transactions.length === 0 && (
          <div className="px-5 py-10 text-center text-[12px] text-[#8A9BBE]">No activity yet.</div>
        )}
      </div>
    </>
  );
}
