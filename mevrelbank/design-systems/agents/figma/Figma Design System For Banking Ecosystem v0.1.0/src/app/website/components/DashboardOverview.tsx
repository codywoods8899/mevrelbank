import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight, ArrowDownLeft, ChevronRight, Download,
  Plus, SendHorizontal, Users,
} from "lucide-react";
import { Link } from "react-router";
import { Btn } from "../shared/Btn";
import { StatusDot } from "../shared/StatusDot";
import { useAuth } from "../../context/AuthContext";
import { bankingApi, formatRelativeDate, type Account, type Transaction } from "../shared/bankingApi";
import { TransactionReceiptModal } from "./TransactionReceiptModal";
import { FXPanel } from "./FXPanel";
import { formatAmount } from "../shared/currencyUtils";

/** The default /dashboard landing content: balance cards, trend chart, quick actions, recent activity. */
export function DashboardOverview({ userName = "James Chen" }: { userName?: string }) {
  const firstName = userName.trim().split(/\s+/)[0] || userName;
  const { authedFetch } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([bankingApi.getAccounts(authedFetch), bankingApi.getTransactions(authedFetch, { limit: 8 })])
      .then(([a, t]) => {
        if (!active) return;
        setAccounts(a.accounts);
        setTransactions(t.transactions);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [authedFetch]);

  // - If the user has no accounts yet → show a single "Total Balance" card ($0.00).
  // - Once they open accounts → show individual per-account cards.
  // - When all accounts share the same currency the Total card shows the summed amount.
  // - When currencies differ the Total card is labelled "Multiple Currencies".
  const summaryCards = useMemo(() => {
    const subByType: Record<string, string> = {
      "Current Account": "Available balance",
      "Savings Account": "Instant Access",
    };

    if (accounts.length === 0) {
      return [{ label: "Total Balance", amount: 0, currency: "USD", sub: "Across all accounts", isTotal: true }];
    }

    const currencies = [...new Set(accounts.map((a) => a.currency ?? "USD"))];
    const singleCurrency = currencies.length === 1 ? currencies[0] : null;
    const totalAmount = singleCurrency
      ? accounts.reduce((sum, a) => sum + (a.available ?? 0), 0)
      : 0;

    const typeCards = accounts.map((a) => ({
      label: a.name,
      amount: a.available ?? 0,
      currency: a.currency ?? "USD",
      sub: subByType[a.type] ?? "Available balance",
      isTotal: false,
    }));

    return [
      {
        label: singleCurrency ? "Total Balance" : "Multiple Currencies",
        amount: totalAmount,
        currency: singleCurrency ?? "USD",
        sub: singleCurrency ? "Across all accounts" : "See individual accounts below",
        isTotal: true,
      },
      ...typeCards,
    ];
  }, [accounts]);

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold text-[#0D1829] mb-0.5" style={{ fontFamily: "Figtree, sans-serif" }}>
          Good morning, {firstName}
        </h1>
        <div className="text-[12px] text-[#8A9BBE]">{loading ? "Loading your accounts…" : "Last login: Today"}</div>
      </div>

      {/* Account summary cards */}
      {!loading && (
        <div className="mb-4 space-y-3">
          {/* Total Balance — always shown full-width as primary card */}
          {summaryCards.filter((c) => c.isTotal).map((c) => (
            <div
              key={c.label}
              className="p-5 bg-[#0B3270] rounded-[10px] shadow-[0_2px_10px_rgba(11,50,112,0.18)]"
            >
              <div className="text-[9px] font-semibold tracking-[0.16em] uppercase text-[rgba(255,255,255,0.55)] mb-3">{c.label}</div>
              <div className="text-[28px] font-bold text-white leading-none mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                {c.amount > 0 ? formatAmount(c.amount, c.currency) : formatAmount(0, c.currency)}
              </div>
              <div className="text-[11px] text-[rgba(255,255,255,0.5)]">{c.sub}</div>
            </div>
          ))}

          {/* Individual account cards — only appear once accounts exist */}
          {summaryCards.filter((c) => !c.isTotal).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {summaryCards.filter((c) => !c.isTotal).map((c) => (
                <div key={c.label} className="p-4 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] shadow-[0_1px_4px_rgba(11,50,112,0.04)] hover:shadow-[0_3px_10px_rgba(11,50,112,0.07)] transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[9px] font-semibold tracking-[0.16em] uppercase text-[#8A9BBE]">{c.label}</div>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#F0F4FF] text-[#0B3270] border border-[rgba(11,50,112,0.12)]">
                      {c.currency}
                    </span>
                  </div>
                  <div className="text-[22px] font-bold text-[#0D1829] leading-none mb-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {formatAmount(c.amount, c.currency)}
                  </div>
                  <div className="text-[11px] text-[#8A9BBE]">{c.sub}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FX Rates Panel */}
      {!loading && accounts.length > 0 && (
        <FXPanel accounts={accounts} authedFetch={authedFetch} />
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="col-span-3 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] p-4">
          <div className="text-[13px] font-semibold text-[#0D1829] mb-3" style={{ fontFamily: "Figtree, sans-serif" }}>Quick Actions</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { label: "Send Money", to: "/dashboard/beneficiaries", icon: <SendHorizontal size={13} />, color: "#0B3270", bg: "#EBF0FA" },
              { label: "New Payee", to: "/dashboard/beneficiaries", icon: <Users size={13} />, color: "#B46A0A", bg: "#FDF0D6" },
              { label: "Accounts", to: "/dashboard/accounts", icon: <Plus size={13} />, color: "#0E7C4D", bg: "#D6F0E6" },
              { label: "Statements", to: "/dashboard/statements", icon: <Download size={13} />, color: "#5E6E8E", bg: "#E8EBF0" },
            ].map((a) => (
              <Link key={a.label} to={a.to} className="w-full flex items-center gap-2.5 p-2.5 rounded-[7px] hover:bg-[#F4F7FB] transition-colors text-left group">
                <div className="w-7 h-7 rounded-[5px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: a.bg, color: a.color }}>
                  {a.icon}
                </div>
                <span className="text-[12px] font-medium text-[#3A4A62] group-hover:text-[#0B3270]">{a.label}</span>
                <ChevronRight size={11} className="ml-auto text-[#C8D4E8]" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(11,50,112,0.05)]">
          <div className="text-[13px] font-semibold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Recent Transactions</div>
          <Link to="/dashboard/transactions"><Btn variant="ghost" size="sm" icon={<ChevronRight size={12} />}>View all</Btn></Link>
        </div>
        {transactions.slice(0, 8).map((tx, i, arr) => (
          <button
            key={tx.id}
            type="button"
            onClick={() => setSelectedTx(tx)}
            className={`w-full flex items-center gap-3.5 px-5 py-3 text-left ${i < arr.length - 1 ? "border-b border-[rgba(11,50,112,0.04)]" : ""} hover:bg-[#F8FAFD] active:bg-[#EEF2F9] transition-colors cursor-pointer`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${tx.amount > 0 ? "bg-[#D6F0E6]" : "bg-[#EEF2F9]"}`}>
              {tx.amount > 0 ? <ArrowDownLeft size={12} className="text-[#0E7C4D]" /> : <ArrowUpRight size={12} className="text-[#7A8CAA]" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-[#0D1829] truncate">{tx.name}</div>
              <div className="text-[10px] text-[#8A9BBE]">{formatRelativeDate(tx.date)}</div>
            </div>
            <StatusDot status={tx.status} />
            <div className="text-[12px] font-medium w-20 text-right" style={{ fontFamily: "'DM Mono', monospace", color: tx.amount > 0 ? "#0E7C4D" : "#0D1829" }}>
              {tx.amount > 0 ? "+" : ""}{formatAmount(Math.abs(tx.amount), accounts.find(a => a.id === tx.accountId)?.currency ?? 'USD')}
            </div>
          </button>
        ))}
        {!loading && transactions.length === 0 && (
          <div className="px-5 py-10 text-center text-[12px] text-[#8A9BBE]">No activity yet. Once you make transactions they'll show up here.</div>
        )}
      </div>

      {selectedTx && (
        <TransactionReceiptModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
      )}
    </>
  );
}
