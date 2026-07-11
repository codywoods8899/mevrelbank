import {
  ArrowUpRight, ArrowDownLeft, TrendingUp, ChevronRight, Download,
  Plus, FileText, SendHorizontal, Users,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Link } from "react-router";
import { Btn } from "../shared/Btn";
import { StatusDot } from "../shared/StatusDot";
import { balanceTrend, transactions } from "../shared/mockBankingData";

/** The default /dashboard landing content: balance cards, trend chart, quick actions, recent activity. */
export function DashboardOverview({ userName = "James Chen" }: { userName?: string }) {
  const firstName = userName.trim().split(/\s+/)[0] || userName;

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold text-[#0D1829] mb-0.5" style={{ fontFamily: "Figtree, sans-serif" }}>
          Good morning, {firstName}
        </h1>
        <div className="text-[12px] text-[#8A9BBE]">Last login: Today</div>
      </div>

      {/* Account summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Current Account", amount: "38,240.00", sub: "Available balance", change: "+£1,240 this month", up: true },
          { label: "Savings Account", amount: "12,500.00", sub: "Instant Access", change: "+£500 this month", up: true },
          { label: "Monthly Budget", amount: "5,200.00", sub: "of £7,000 spent", change: "£1,800 remaining", up: null },
        ].map((c) => (
          <div key={c.label} className="p-4 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] shadow-[0_1px_4px_rgba(11,50,112,0.04)] hover:shadow-[0_3px_10px_rgba(11,50,112,0.07)] transition-shadow">
            <div className="text-[9px] font-semibold tracking-[0.16em] uppercase text-[#8A9BBE] mb-3">{c.label}</div>
            <div className="text-[22px] font-bold text-[#0D1829] leading-none mb-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
              £{c.amount}
            </div>
            <div className="text-[11px] text-[#8A9BBE] mb-3">{c.sub}</div>
            <div className="flex items-center gap-1.5">
              {c.up !== null ? (
                <>
                  <TrendingUp size={10} className={c.up ? "text-[#0E7C4D]" : "text-[#C52B2B]"} />
                  <span className={`text-[11px] font-semibold ${c.up ? "text-[#0E7C4D]" : "text-[#C52B2B]"}`}>{c.change}</span>
                </>
              ) : (
                <span className="text-[11px] text-[#8A9BBE]">{c.change}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="col-span-2 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[13px] font-semibold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Balance Trend</div>
              <div className="text-[11px] text-[#8A9BBE]">Jan–Jul 2026</div>
            </div>
            <div className="flex gap-1.5">
              {["3M", "6M", "1Y", "All"].map((p) => (
                <button key={p} className={`px-2 py-1 rounded-[4px] text-[10px] font-semibold transition-colors ${p === "6M" ? "bg-[#0B3270] text-white" : "text-[#7A8CAA] hover:bg-[#EEF2F9]"}`}>{p}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={balanceTrend} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboardBalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1764C0" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#1764C0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,50,112,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8A9BBE" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#8A9BBE" }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} width={30} />
              <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid rgba(11,50,112,0.10)", fontSize: 11 }} formatter={(v: number) => [`£${v.toLocaleString()}`, "Balance"]} />
              <Area type="monotone" dataKey="balance" stroke="#1764C0" strokeWidth={1.5} fill="url(#dashboardBalGrad)" dot={false} activeDot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] p-4">
          <div className="text-[13px] font-semibold text-[#0D1829] mb-3" style={{ fontFamily: "Figtree, sans-serif" }}>Quick Actions</div>
          <div className="space-y-1.5">
            {[
              { label: "Send Money", to: "/dashboard/beneficiaries", icon: <SendHorizontal size={13} />, color: "#0B3270", bg: "#EBF0FA" },
              { label: "Pay a Bill", to: "/dashboard/beneficiaries", icon: <FileText size={13} />, color: "#1764C0", bg: "#EBF0FA" },
              { label: "Top Up", to: "/dashboard/accounts", icon: <Plus size={13} />, color: "#0E7C4D", bg: "#D6F0E6" },
              { label: "New Payee", to: "/dashboard/beneficiaries", icon: <Users size={13} />, color: "#B46A0A", bg: "#FDF0D6" },
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
          <div key={tx.id} className={`flex items-center gap-3.5 px-5 py-3 ${i < arr.length - 1 ? "border-b border-[rgba(11,50,112,0.04)]" : ""} hover:bg-[#F8FAFD] transition-colors`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${tx.amount > 0 ? "bg-[#D6F0E6]" : "bg-[#EEF2F9]"}`}>
              {tx.amount > 0 ? <ArrowDownLeft size={12} className="text-[#0E7C4D]" /> : <ArrowUpRight size={12} className="text-[#7A8CAA]" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-[#0D1829] truncate">{tx.name}</div>
              <div className="text-[10px] text-[#8A9BBE]">{tx.date}</div>
            </div>
            <StatusDot status={tx.status} />
            <div className="text-[12px] font-medium w-20 text-right" style={{ fontFamily: "'DM Mono', monospace", color: tx.amount > 0 ? "#0E7C4D" : "#0D1829" }}>
              {tx.amount > 0 ? "+" : ""}£{Math.abs(tx.amount).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
