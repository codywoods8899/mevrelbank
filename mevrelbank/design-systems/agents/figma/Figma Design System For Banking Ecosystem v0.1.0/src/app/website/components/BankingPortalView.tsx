import { useState } from "react";
import {
  Search, Bell, Settings, CreditCard, ArrowUpRight, ArrowDownLeft,
  TrendingUp, ChevronRight, Download, Plus, Home, FileText,
  SendHorizontal, LogOut, Activity, Users,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Btn } from "../shared/Btn";
import { Logo } from "../shared/Logo";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// Demo-only figures for the dashboard preview. Replace with real API data once
// the backend (Phase 2 roadmap item) is available.

const balanceTrend = [
  { month: "Jan", balance: 24800 },
  { month: "Feb", balance: 28500 },
  { month: "Mar", balance: 26200 },
  { month: "Apr", balance: 29400 },
  { month: "May", balance: 32100 },
  { month: "Jun", balance: 35600 },
  { month: "Jul", balance: 38240 },
];

const transactions = [
  { id: 1, name: "Waitrose Supermarket", category: "Groceries", date: "Today, 14:32", amount: -86.40, status: "completed" },
  { id: 2, name: "Salary – Apex Solutions Ltd", category: "Income", date: "Today, 09:00", amount: 8400.00, status: "completed" },
  { id: 3, name: "Netflix UK", category: "Entertainment", date: "Yesterday", amount: -15.99, status: "completed" },
  { id: 4, name: "Transfer to J. Chen", category: "Transfer", date: "Yesterday", amount: -500.00, status: "completed" },
  { id: 5, name: "TfL Contactless", category: "Transport", date: "Mon 7 Jul", amount: -4.80, status: "completed" },
  { id: 6, name: "Amazon.co.uk", category: "Shopping", date: "Mon 7 Jul", amount: -34.99, status: "pending" },
  { id: 7, name: "EDF Energy Direct Debit", category: "Utilities", date: "Sat 5 Jul", amount: -89.00, status: "completed" },
  { id: 8, name: "Nando's Westfield", category: "Dining", date: "Fri 4 Jul", amount: -28.50, status: "completed" },
];

function StatusDot({ status }: { status: string }) {
  const c: Record<string, string> = { completed: "#0E7C4D", pending: "#B46A0A", failed: "#C52B2B" };
  return <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: c[status] ?? "#B8C5DD" }} />;
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface BankingPortalViewProps {
  /** Full display name of the signed-in customer. Defaults to the design demo persona. */
  userName?: string;
  /** Account tier/type shown under the name in the sidebar. */
  accountLabel?: string;
  /** Called when the user clicks logout in the sidebar. */
  onLogout?: () => void;
}

export function BankingPortalView({
  userName = "James Chen",
  accountLabel = "Personal · Premium",
  onLogout,
}: BankingPortalViewProps) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const firstName = userName.trim().split(/\s+/)[0] || userName;

  const navItems = [
    { id: "dashboard", icon: <Home size={15} />, label: "Dashboard" },
    { id: "accounts", icon: <CreditCard size={15} />, label: "Accounts" },
    { id: "transactions", icon: <Activity size={15} />, label: "Transactions" },
    { id: "transfers", icon: <SendHorizontal size={15} />, label: "Transfers" },
    { id: "statements", icon: <FileText size={15} />, label: "Statements" },
    { id: "settings", icon: <Settings size={15} />, label: "Settings" },
  ];

  return (
    <div className="flex h-[820px] bg-[#F4F7FB] overflow-hidden rounded-[12px] border border-[rgba(11,50,112,0.10)] shadow-[0_12px_40px_rgba(11,50,112,0.12)]">
      {/* Sidebar */}
      <aside className="w-[216px] bg-[#081E42] flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-[rgba(255,255,255,0.06)]">
          <Logo variant="dark" heightClass="h-6" />
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="px-4 py-2 mb-1">
            <span className="text-[9px] font-semibold tracking-[0.20em] uppercase text-[rgba(255,255,255,0.25)]">Main Menu</span>
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-all ${
                activeNav === item.id
                  ? "bg-[rgba(255,255,255,0.09)] text-white"
                  : "text-[rgba(255,255,255,0.45)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[rgba(255,255,255,0.75)]"
              }`}
            >
              <span className={activeNav === item.id ? "text-[#4AA2D8]" : ""}>{item.icon}</span>
              {item.label}
              {activeNav === item.id && (
                <div className="ml-auto w-1 h-4 rounded-full bg-[#4AA2D8]" />
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#1764C0] flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
              {initialsFor(userName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-white truncate">{userName}</div>
              <div className="text-[10px] text-[rgba(255,255,255,0.35)] truncate">{accountLabel}</div>
            </div>
            <button
              type="button"
              aria-label="Log out"
              onClick={onLogout}
              className="text-[rgba(255,255,255,0.25)] flex-shrink-0 cursor-pointer hover:text-[rgba(255,255,255,0.7)] transition-colors"
            >
              <LogOut size={13} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-[rgba(255,255,255,0.06)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0E7C4D]" />
            <span className="text-[10px] text-[rgba(255,255,255,0.35)]">Session active</span>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-[rgba(11,50,112,0.07)] flex items-center justify-between px-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-[13px] text-[#8A9BBE]" style={{ fontFamily: "'DM Mono', monospace" }}>
              {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-3 text-[#8A9BBE]" />
              <input type="text" placeholder="Search…" className="h-8 w-44 pl-8 pr-3 rounded-[6px] bg-[#EEF2F9] text-[12px] text-[#0D1829] placeholder-[#8A9BBE] focus:outline-none focus:ring-2 focus:ring-[#1764C0]/20 transition-all" />
            </div>
            <button className="relative w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-[#EEF2F9] transition-colors">
              <Bell size={15} className="text-[#5E6E8E]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#C52B2B] rounded-full" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-[#EEF2F9] transition-colors">
              <Settings size={15} className="text-[#5E6E8E]" />
            </button>
          </div>
        </header>

        {/* Dashboard content */}
        <main className="flex-1 overflow-y-auto p-5">
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
                  { label: "Send Money", icon: <SendHorizontal size={13} />, color: "#0B3270", bg: "#EBF0FA" },
                  { label: "Pay a Bill", icon: <FileText size={13} />, color: "#1764C0", bg: "#EBF0FA" },
                  { label: "Top Up", icon: <Plus size={13} />, color: "#0E7C4D", bg: "#D6F0E6" },
                  { label: "New Payee", icon: <Users size={13} />, color: "#B46A0A", bg: "#FDF0D6" },
                  { label: "Statements", icon: <Download size={13} />, color: "#5E6E8E", bg: "#E8EBF0" },
                ].map((a) => (
                  <button key={a.label} className="w-full flex items-center gap-2.5 p-2.5 rounded-[7px] hover:bg-[#F4F7FB] transition-colors text-left group">
                    <div className="w-7 h-7 rounded-[5px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: a.bg, color: a.color }}>
                      {a.icon}
                    </div>
                    <span className="text-[12px] font-medium text-[#3A4A62] group-hover:text-[#0B3270]">{a.label}</span>
                    <ChevronRight size={11} className="ml-auto text-[#C8D4E8]" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(11,50,112,0.05)]">
              <div className="text-[13px] font-semibold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Recent Transactions</div>
              <Btn variant="ghost" size="sm" icon={<ChevronRight size={12} />}>View all</Btn>
            </div>
            {transactions.map((tx, i) => (
              <div key={tx.id} className={`flex items-center gap-3.5 px-5 py-3 ${i < transactions.length - 1 ? "border-b border-[rgba(11,50,112,0.04)]" : ""} hover:bg-[#F8FAFD] transition-colors`}>
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
        </main>
      </div>
    </div>
  );
}
