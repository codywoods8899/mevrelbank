import { CreditCard, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { PageMeta } from "../components/PageMeta";
import { Btn } from "../shared/Btn";
import { accounts, transactions } from "../shared/mockBankingData";

export default function AccountsPage() {
  return (
    <>
      <PageMeta title="Accounts — MevrelBank" description="View your MevrelBank current and savings accounts." />
      <div className="mb-5">
        <h1 className="text-[20px] font-bold text-[#0D1829] mb-0.5" style={{ fontFamily: "Figtree, sans-serif" }}>Accounts</h1>
        <div className="text-[12px] text-[#8A9BBE]">{accounts.length} accounts · mock data, pending Phase 2 backend</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {accounts.map((acc) => (
          <div key={acc.id} className="p-5 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] shadow-[0_1px_4px_rgba(11,50,112,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-[7px] bg-[#EBF0FA] flex items-center justify-center text-[#0B3270]">
                <CreditCard size={16} />
              </div>
              <Btn variant="outline" size="sm">Manage</Btn>
            </div>
            <div className="text-[9px] font-semibold tracking-[0.16em] uppercase text-[#8A9BBE] mb-2">{acc.type}</div>
            <div className="text-[24px] font-bold text-[#0D1829] leading-none mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
              £{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-[#8A9BBE] mb-4">Available: £{acc.available.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
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
              <div className="text-[10px] text-[#8A9BBE]">{tx.account} · {tx.date}</div>
            </div>
            <div className="text-[12px] font-medium w-24 text-right" style={{ fontFamily: "'DM Mono', monospace", color: tx.amount > 0 ? "#0E7C4D" : "#0D1829" }}>
              {tx.amount > 0 ? "+" : ""}£{Math.abs(tx.amount).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
