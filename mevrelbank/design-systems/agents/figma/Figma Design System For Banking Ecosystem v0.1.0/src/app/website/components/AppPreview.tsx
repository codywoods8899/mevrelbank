// A static, non-interactive preview of the MevrelBank internet banking dashboard.
// Used in the homepage to demonstrate the product visually.

import {
  Home, CreditCard, Activity, SendHorizontal, FileText, Settings,
  Bell, Search, TrendingUp, ArrowUpRight, ArrowDownLeft, LogOut,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: Home,            label: "Dashboard",    active: true  },
  { icon: CreditCard,      label: "Accounts",     active: false },
  { icon: Activity,        label: "Transactions", active: false },
  { icon: SendHorizontal,  label: "Transfers",    active: false },
  { icon: FileText,        label: "Statements",   active: false },
  { icon: Settings,        label: "Settings",     active: false },
];

const ACCOUNTS = [
  { label: "Current Account", amount: "38,240.00", sub: "Available balance", change: "+$1,240 this month", positive: true  },
  { label: "Savings Account", amount: "12,500.00", sub: "Instant Access",    change: "+$500 this month",  positive: true  },
  { label: "Monthly Budget",  amount: "5,200.00",  sub: "of $7,000 spent",   change: "$1,800 remaining",  positive: null  },
];

const TRANSACTIONS = [
  { name: "Waitrose Supermarket",        date: "Today, 14:32", amount: -86.40  },
  { name: "Salary – Apex Solutions Ltd", date: "Today, 09:00", amount: 8400.00 },
  { name: "Netflix UK",                  date: "Yesterday",    amount: -15.99  },
  { name: "Transfer to J. Chen",         date: "Yesterday",    amount: -500.00 },
  { name: "TfL Contactless",             date: "Mon 7 Jul",    amount: -4.80   },
];

export function AppPreview() {
  return (
    <section
      id="product"
      className="py-24 bg-[#F4F7FB]"
      aria-labelledby="preview-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-14">
          <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#1764C0] mb-3">
            The Product
          </div>
          <h2
            id="preview-heading"
            className="text-[26px] sm:text-[34px] md:text-[38px] font-bold text-[#0D1829] leading-tight mb-4"
            style={{ fontFamily: "Figtree, sans-serif" }}
          >
            Your finances, at a glance.
          </h2>
          <p className="text-[16px] text-[#5E6E8E] max-w-[460px] mx-auto leading-relaxed">
            A clean, fast dashboard that puts everything in reach — accounts,
            transactions, transfers, and more.
          </p>
        </div>

        {/*
          Browser chrome frame — the inner app layout is a miniature UI with
          fixed pixel sizes. On narrow viewports we let it scroll horizontally
          so the preview stays intact and readable rather than crushing columns.
        */}
        <div
          className="rounded-[14px] overflow-x-auto shadow-[0_24px_64px_rgba(11,50,112,0.18)] border border-[rgba(11,50,112,0.10)]"
          aria-label="MevrelBank app preview"
          role="img"
        >
          {/* Inner min-width keeps the mock layout intact at every viewport */}
          <div className="min-w-[640px]">

          {/* Chrome bar */}
          <div className="h-9 bg-[#F0F4F8] flex items-center px-4 gap-2 border-b border-[rgba(11,50,112,0.07)]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[rgba(11,50,112,0.15)]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[rgba(11,50,112,0.10)]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[rgba(11,50,112,0.08)]" />
            </div>
            <div className="flex-1 mx-4 h-5 bg-white rounded-full border border-[rgba(11,50,112,0.10)] flex items-center px-3">
              <span className="text-[9px] text-[#8A9BBE]">app.mevrelbank.com/dashboard</span>
            </div>
          </div>

          {/* App layout */}
          <div className="flex h-[480px] bg-[#F4F7FB] overflow-hidden">
            {/* Sidebar */}
            <aside className="w-[200px] bg-[#081E42] flex flex-col flex-shrink-0" aria-hidden="true">
              <div className="px-4 py-4 border-b border-[rgba(255,255,255,0.06)]">
                <img
                  src="/brand/mevrelbank-reverse-logo-v1.png"
                  alt="MevrelBank"
                  className="h-6 w-auto"
                />
              </div>
              <nav className="flex-1 py-3 overflow-hidden">
                <div className="px-4 py-2 mb-1">
                  <span className="text-[8px] font-semibold tracking-[0.18em] uppercase text-[rgba(255,255,255,0.22)]">
                    Main Menu
                  </span>
                </div>
                {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
                  <div
                    key={label}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-[11px] font-medium ${
                      active
                        ? "bg-[rgba(255,255,255,0.09)] text-white"
                        : "text-[rgba(255,255,255,0.40)]"
                    }`}
                  >
                    <Icon
                      size={12}
                      className={active ? "text-[#4AA2D8]" : ""}
                    />
                    {label}
                    {active && (
                      <div className="ml-auto w-0.5 h-3.5 rounded-full bg-[#4AA2D8]" />
                    )}
                  </div>
                ))}
              </nav>
              <div className="p-3.5 border-t border-[rgba(255,255,255,0.06)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#1764C0] flex items-center justify-center text-white text-[9px] font-semibold flex-shrink-0">
                    JC
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-white truncate">
                      James Chen
                    </div>
                    <div className="text-[9px] text-[rgba(255,255,255,0.32)] truncate">
                      Personal · Premium
                    </div>
                  </div>
                  <LogOut size={11} className="text-[rgba(255,255,255,0.22)] flex-shrink-0" />
                </div>
              </div>
            </aside>

            {/* Main area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Top bar */}
              <header
                className="h-12 bg-white border-b border-[rgba(11,50,112,0.07)] flex items-center justify-between px-5 flex-shrink-0"
                aria-hidden="true"
              >
                <span
                  className="text-[11px] text-[#8A9BBE]"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  Tuesday, 8 July 2026
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex items-center">
                    <Search size={10} className="absolute left-2 text-[#8A9BBE]" />
                    <div className="h-6 w-36 pl-6 pr-2 rounded-[5px] bg-[#EEF2F9] text-[10px] text-[#8A9BBE] flex items-center">
                      Search…
                    </div>
                  </div>
                  <div className="relative w-6 h-6 flex items-center justify-center rounded-[5px] hover:bg-[#EEF2F9]">
                    <Bell size={12} className="text-[#5E6E8E]" />
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#C52B2B] rounded-full" />
                  </div>
                </div>
              </header>

              {/* Dashboard */}
              <main className="flex-1 overflow-y-auto p-4" aria-hidden="true">
                <div className="mb-4">
                  <h1
                    className="text-[16px] font-bold text-[#0D1829]"
                    style={{ fontFamily: "Figtree, sans-serif" }}
                  >
                    Good morning, James
                  </h1>
                  <div className="text-[10px] text-[#8A9BBE]">
                    Last login: Today at 08:41 · London, UK
                  </div>
                </div>

                {/* Account cards */}
                <div className="grid grid-cols-3 gap-2.5 mb-3">
                  {ACCOUNTS.map((c) => (
                    <div
                      key={c.label}
                      className="p-3 bg-white rounded-[8px] border border-[rgba(11,50,112,0.07)] shadow-[0_1px_3px_rgba(11,50,112,0.04)]"
                    >
                      <div className="text-[8px] font-semibold tracking-[0.14em] uppercase text-[#8A9BBE] mb-2">
                        {c.label}
                      </div>
                      <div
                        className="text-[17px] font-bold text-[#0D1829] leading-none mb-0.5"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        ${c.amount}
                      </div>
                      <div className="text-[9px] text-[#8A9BBE] mb-2">{c.sub}</div>
                      {c.positive !== null ? (
                        <div className="flex items-center gap-1">
                          <TrendingUp size={8} className="text-[#0E7C4D]" />
                          <span className="text-[9px] font-semibold text-[#0E7C4D]">
                            {c.change}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-[#8A9BBE]">{c.change}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Recent transactions */}
                <div className="bg-white rounded-[8px] border border-[rgba(11,50,112,0.07)] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-[rgba(11,50,112,0.05)]">
                    <div
                      className="text-[11px] font-semibold text-[#0D1829]"
                      style={{ fontFamily: "Figtree, sans-serif" }}
                    >
                      Recent Transactions
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[#8A9BBE]">
                      View all <ChevronRight size={10} />
                    </div>
                  </div>
                  {TRANSACTIONS.map((tx, i) => (
                    <div
                      key={tx.name}
                      className={`flex items-center gap-3 px-4 py-2 ${
                        i < TRANSACTIONS.length - 1
                          ? "border-b border-[rgba(11,50,112,0.04)]"
                          : ""
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          tx.amount > 0 ? "bg-[#D6F0E6]" : "bg-[#EEF2F9]"
                        }`}
                      >
                        {tx.amount > 0 ? (
                          <ArrowDownLeft size={10} className="text-[#0E7C4D]" />
                        ) : (
                          <ArrowUpRight size={10} className="text-[#7A8CAA]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-semibold text-[#0D1829] truncate">
                          {tx.name}
                        </div>
                        <div className="text-[8px] text-[#8A9BBE]">{tx.date}</div>
                      </div>
                      <div
                        className="text-[10px] font-medium"
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          color: tx.amount > 0 ? "#0E7C4D" : "#0D1829",
                        }}
                      >
                        {tx.amount > 0 ? "+" : ""}$
                        {Math.abs(tx.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </main>
            </div>
          </div>
          </div>{/* /min-w-[640px] */}
        </div>

        {/* Caption */}
        <p className="text-center text-[12px] text-[#8A9BBE] mt-5">
          Customer dashboard — designed for clarity, built for speed.
        </p>
      </div>
    </section>
  );
}
