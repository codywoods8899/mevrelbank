import { useEffect, useState } from "react";
import {
  CreditCard, ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
  X, AlertCircle, Plus, Landmark, PiggyBank, CheckCircle2,
} from "lucide-react";
import { PageMeta } from "../components/PageMeta";
import { Btn } from "../shared/Btn";
import { useAuth } from "../../context/AuthContext";
import { bankingApi, formatRelativeDate, type Account, type Transaction } from "../shared/bankingApi";

// ─── Transfer Modal ───────────────────────────────────────────────────────────

function TransferModal({
  accounts,
  onClose,
  onDone,
}: {
  accounts: Account[];
  onClose: () => void;
  onDone: (updated: Account[]) => void;
}) {
  const { authedFetch } = useAuth();
  const [fromId, setFromId] = useState(accounts[0]?.id ?? "");
  const [toId, setToId]     = useState(accounts[1]?.id ?? accounts[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote]     = useState("");
  const [error, setError]   = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fromId === toId) { setError("Choose two different accounts."); return; }
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) { setError("Enter a valid amount."); return; }
    setSaving(true);
    try {
      const res = await bankingApi.transfer(authedFetch, {
        fromAccountId: fromId, toAccountId: toId, amount: value, note: note.trim() || undefined,
      });
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
        <button onClick={onClose} className="absolute top-4 right-4 text-[#9AAABF] hover:text-[#5E6E8E]" aria-label="Close">
          <X size={16} />
        </button>
        {done ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-[#D6F0E6] flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={22} className="text-[#0E7C4D]" />
            </div>
            <div className="text-[15px] font-bold text-[#0D1829] mb-1">Transfer submitted</div>
            <div className="text-[12px] text-[#5E6E8E] mb-4">
              ${parseFloat(amount).toFixed(2)} is being processed and will appear in your account shortly.
            </div>
            <Btn size="md" className="w-full justify-center" onClick={onClose}>Done</Btn>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="text-[15px] font-bold text-[#0D1829] mb-4">Move money between your accounts</div>
            <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">From</label>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded-[6px] border border-[rgba(11,50,112,0.15)] text-[12px] outline-none focus:border-[#0B3270]"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} — ${a.available.toFixed(2)} available</option>
              ))}
            </select>
            <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">To</label>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded-[6px] border border-[rgba(11,50,112,0.15)] text-[12px] outline-none focus:border-[#0B3270]"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Amount ($)</label>
            <input
              type="number" min="0.01" step="0.01" value={amount}
              onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
              className="w-full mb-3 px-3 py-2 rounded-[6px] border border-[rgba(11,50,112,0.15)] text-[12px] outline-none focus:border-[#0B3270]"
            />
            <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Reference (optional)</label>
            <input
              value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Rent"
              className="w-full mb-4 px-3 py-2 rounded-[6px] border border-[rgba(11,50,112,0.15)] text-[12px] outline-none focus:border-[#0B3270]"
            />
            {error && (
              <div className="flex items-center gap-2 mb-3 text-[12px] text-[#C52B2B]">
                <AlertCircle size={13} />{error}
              </div>
            )}
            <Btn size="md" type="submit" className="w-full justify-center" disabled={saving}>
              {saving ? "Transferring…" : "Transfer"}
            </Btn>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Open Account Modal ───────────────────────────────────────────────────────

const ACCOUNT_OPTIONS: {
  type: "Current Account" | "Savings Account";
  icon: typeof Landmark;
  title: string;
  desc: string;
  accent: string;
  bg: string;
}[] = [
  {
    type: "Current Account",
    icon: Landmark,
    title: "Current Account",
    desc: "Your everyday spending account. Instant access, card controls, and payment support.",
    accent: "#0B3270",
    bg: "#EBF0FA",
  },
  {
    type: "Savings Account",
    icon: PiggyBank,
    title: "Savings Account",
    desc: "Set money aside and track your progress toward goals. Instant access whenever you need it.",
    accent: "#0E7C4D",
    bg: "#D6F0E6",
  },
];

function OpenAccountModal({
  onClose,
  onOpened,
}: {
  onClose: () => void;
  onOpened: (account: Account) => void;
}) {
  const { authedFetch } = useAuth();
  const [selected, setSelected] = useState<"Current Account" | "Savings Account" | null>(null);
  const [customName, setCustomName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [done, setDone]     = useState<Account | null>(null);

  async function handleOpen() {
    if (!selected) return;
    setError(null);
    setSaving(true);
    try {
      const res = await bankingApi.openAccount(authedFetch, {
        type: selected,
        name: customName.trim() || undefined,
      });
      setDone(res.account);
      onOpened(res.account);
    } catch (err: any) {
      setError(err.message ?? "Could not open account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[20px] w-full max-w-md p-6 shadow-2xl border border-[rgba(11,50,112,0.08)] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9AAABF] hover:text-[#5E6E8E]"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {done ? (
          /* Success state */
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-[#D6F0E6] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={26} className="text-[#0E7C4D]" />
            </div>
            <div className="text-[16px] font-bold text-[#0D1829] mb-1">Account opened!</div>
            <div className="text-[13px] text-[#5E6E8E] mb-1">
              Your <strong>{done.name}</strong> is ready.
            </div>
            <div
              className="text-[11px] text-[#9AAABF] mb-6"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Sort code {done.sortCode} · Acc {done.accountNumber}
            </div>
            <Btn size="md" className="w-full justify-center" onClick={onClose}>
              View my accounts
            </Btn>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <h2
                className="text-[17px] font-bold text-[#0D1829]"
                style={{ fontFamily: "Figtree, sans-serif" }}
              >
                Open a new account
              </h2>
              <p className="text-[12px] text-[#8A9BBE] mt-1">
                Choose the account type you'd like to add.
              </p>
            </div>

            {/* Account type cards */}
            <div className="flex flex-col gap-3 mb-5">
              {ACCOUNT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isChosen = selected === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setSelected(opt.type)}
                    className={`text-left w-full flex items-start gap-4 p-4 rounded-[12px] border-2 transition-all ${
                      isChosen
                        ? "border-[#0B3270] bg-[#F4F7FB]"
                        : "border-[rgba(11,50,112,0.10)] hover:border-[rgba(11,50,112,0.25)] bg-white"
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-[9px] flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: opt.bg, color: opt.accent }}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[#0D1829] mb-0.5">{opt.title}</div>
                      <div className="text-[11px] text-[#5E6E8E] leading-relaxed">{opt.desc}</div>
                    </div>
                    {isChosen && (
                      <CheckCircle2 size={16} className="text-[#0B3270] flex-shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Optional custom name */}
            {selected && (
              <div className="mb-5">
                <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">
                  Account name (optional)
                </label>
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={`e.g. Holiday Fund, ${selected}`}
                  maxLength={60}
                  className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270]"
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 mb-3 text-[12px] text-[#C52B2B]">
                <AlertCircle size={13} />{error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-[10px] border border-[rgba(11,50,112,0.15)] text-[13px] font-semibold text-[#5E6E8E] hover:bg-[#F4F7FB] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOpen}
                disabled={!selected || saving}
                className="flex-1 px-4 py-2.5 rounded-[10px] bg-[#0B3270] text-white text-[13px] font-semibold hover:bg-[#0E3E8C] disabled:opacity-40 transition-colors"
              >
                {saving ? "Opening…" : "Open account"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const { authedFetch } = useAuth();
  const [accounts, setAccounts]         = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showOpen, setShowOpen]         = useState(false);

  function load() {
    Promise.all([
      bankingApi.getAccounts(authedFetch),
      bankingApi.getTransactions(authedFetch, { limit: 20 }),
    ])
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
      <PageMeta
        title="Accounts — MevrelBank"
        description="View and manage your MevrelBank accounts."
      />

      {showTransfer && accounts.length >= 2 && (
        <TransferModal
          accounts={accounts}
          onClose={() => { setShowTransfer(false); load(); }}
          onDone={() => {}}
        />
      )}

      {showOpen && (
        <OpenAccountModal
          onClose={() => { setShowOpen(false); }}
          onOpened={(newAccount) => {
            setAccounts((prev) => [...prev, newAccount]);
          }}
        />
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1
            className="text-[20px] font-bold text-[#0D1829] mb-0.5"
            style={{ fontFamily: "Figtree, sans-serif" }}
          >
            Accounts
          </h1>
          <div className="text-[12px] text-[#8A9BBE]">
            {loading ? "Loading…" : `${accounts.length} account${accounts.length !== 1 ? "s" : ""}`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {accounts.length >= 2 && (
            <Btn
              size="sm"
              variant="outline"
              icon={<ArrowLeftRight size={13} />}
              onClick={() => setShowTransfer(true)}
            >
              Transfer
            </Btn>
          )}
          <Btn
            size="sm"
            icon={<Plus size={13} />}
            onClick={() => setShowOpen(true)}
          >
            Open Account
          </Btn>
        </div>
      </div>

      {/* Account cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="p-5 bg-white rounded-[12px] border border-[rgba(11,50,112,0.07)] shadow-[0_1px_4px_rgba(11,50,112,0.04)] hover:shadow-[0_4px_16px_rgba(11,50,112,0.08)] transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-[8px] bg-[#EBF0FA] flex items-center justify-center text-[#0B3270]">
                {acc.type === "Savings Account"
                  ? <PiggyBank size={16} />
                  : <CreditCard size={16} />
                }
              </div>
              <span className="text-[10px] font-semibold tracking-[0.12em] uppercase px-2 py-0.5 rounded-full bg-[#F4F7FB] text-[#8A9BBE]">
                {acc.type}
              </span>
            </div>
            <div className="text-[11px] font-semibold text-[#8A9BBE] mb-1">{acc.name}</div>
            <div
              className="text-[26px] font-bold text-[#0D1829] leading-none mb-1"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-[#8A9BBE] mb-4">
              Available: ${acc.available.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div
              className="flex items-center gap-4 text-[11px] text-[#5E6E8E] pt-3 border-t border-[rgba(11,50,112,0.06)]"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              <span>Sort code {acc.sortCode}</span>
              <span>Acc {acc.accountNumber}</span>
            </div>
          </div>
        ))}

        {/* Empty-state "open account" prompt when user has no accounts yet */}
        {!loading && accounts.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#EBF0FA] flex items-center justify-center mb-3">
              <CreditCard size={20} className="text-[#0B3270]" />
            </div>
            <p className="text-[14px] font-semibold text-[#0D1829] mb-1">No accounts yet</p>
            <p className="text-[12px] text-[#8A9BBE] mb-4">Open your first account to get started.</p>
            <Btn size="sm" icon={<Plus size={13} />} onClick={() => setShowOpen(true)}>
              Open an Account
            </Btn>
          </div>
        )}
      </div>

      {/* Recent activity */}
      {(accounts.length > 0 || loading) && (
        <div className="bg-white rounded-[12px] border border-[rgba(11,50,112,0.07)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[rgba(11,50,112,0.05)] text-[13px] font-semibold text-[#0D1829]"
               style={{ fontFamily: "Figtree, sans-serif" }}>
            Activity across all accounts
          </div>
          {transactions.map((tx, i) => (
            <div
              key={tx.id}
              className={`flex items-center gap-3.5 px-5 py-3 ${
                i < transactions.length - 1 ? "border-b border-[rgba(11,50,112,0.04)]" : ""
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  tx.amount > 0 ? "bg-[#D6F0E6]" : "bg-[#EEF2F9]"
                }`}
              >
                {tx.amount > 0
                  ? <ArrowDownLeft size={12} className="text-[#0E7C4D]" />
                  : <ArrowUpRight size={12} className="text-[#7A8CAA]" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-[#0D1829] truncate">{tx.name}</div>
                <div className="text-[10px] text-[#8A9BBE]">
                  {tx.account} · {formatRelativeDate(tx.date)}
                  {tx.status === "pending" && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#FDF0D6] text-[#B46A0A] text-[9px] font-semibold">
                      Pending
                    </span>
                  )}
                </div>
              </div>
              <div
                className="text-[12px] font-medium w-24 text-right"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  color: tx.amount > 0 ? "#0E7C4D" : "#0D1829",
                }}
              >
                {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
              </div>
            </div>
          ))}
          {!loading && transactions.length === 0 && (
            <div className="px-5 py-10 text-center text-[12px] text-[#8A9BBE]">No activity yet.</div>
          )}
        </div>
      )}
    </>
  );
}
