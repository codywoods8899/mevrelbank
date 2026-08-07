import { ArrowRight, Shield, TrendingUp, ArrowDownLeft, Wallet } from "lucide-react";
import { Btn } from "../shared/Btn";

const STATS = [
  { val: "24/7",  label: "Customer support" },
  { val: "$0",    label: "Monthly fees" },
  { val: "256-bit", label: "TLS encryption" },
];

/* Floating balance card shown beside hero text on larger screens */
function FloatingCard() {
  return (
    <div
      className="animate-float hidden lg:block w-[300px] xl:w-[330px] flex-shrink-0 rounded-[18px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.28)] border border-[rgba(255,255,255,0.10)]"
      aria-hidden="true"
    >
      {/* Card header */}
      <div className="bg-[#091E42] px-5 py-4 border-b border-[rgba(255,255,255,0.07)]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[rgba(255,255,255,0.35)]">
            Current Account
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-[#34C77A]">
            <span className="pulse-live w-1.5 h-1.5 rounded-full bg-[#34C77A] inline-block" />
            Live
          </span>
        </div>
        <div className="text-[28px] font-bold text-white tracking-tight leading-none mb-1"
             style={{ fontFamily: "'DM Mono', monospace" }}>
          $38,240<span className="text-[18px] text-[rgba(255,255,255,0.45)]">.00</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <TrendingUp size={11} className="text-[#34C77A]" />
          <span className="text-[11px] font-semibold text-[#34C77A]">+$1,240 this month</span>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-[#0D2444] px-5 py-4">
        <div className="text-[9px] font-semibold tracking-[0.16em] uppercase text-[rgba(255,255,255,0.28)] mb-3">
          Recent
        </div>
        {[
          { name: "Salary — Apex Solutions", amt: "+$8,400.00", positive: true  },
          { name: "Waitrose Supermarket",    amt: "−$86.40",    positive: false },
          { name: "Netflix",                 amt: "−$15.99",    positive: false },
        ].map((tx) => (
          <div key={tx.name} className="flex items-center gap-2.5 py-1.5 border-b border-[rgba(255,255,255,0.05)] last:border-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              tx.positive ? "bg-[rgba(52,199,122,0.15)]" : "bg-[rgba(255,255,255,0.07)]"
            }`}>
              {tx.positive
                ? <ArrowDownLeft size={9} className="text-[#34C77A]" />
                : <Wallet size={9} className="text-[rgba(255,255,255,0.40)]" />
              }
            </div>
            <span className="text-[10px] text-[rgba(255,255,255,0.55)] flex-1 truncate">{tx.name}</span>
            <span
              className="text-[10px] font-semibold"
              style={{
                fontFamily: "'DM Mono', monospace",
                color: tx.positive ? "#34C77A" : "rgba(255,255,255,0.65)",
              }}
            >
              {tx.amt}
            </span>
          </div>
        ))}

        {/* Quick-action row */}
        <div className="flex gap-2 mt-4">
          {["Send", "Pay", "Save"].map((label) => (
            <div
              key={label}
              className="flex-1 h-7 rounded-[6px] bg-[rgba(255,255,255,0.07)] flex items-center justify-center text-[10px] font-semibold text-[rgba(255,255,255,0.50)]"
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section
      className="bg-[#0B3270] relative overflow-hidden hero-grid"
      aria-labelledby="hero-heading"
    >
      {/* Animated radial glows */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="animate-glow-drift absolute -right-16 -top-16 w-[560px] h-[560px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(74,162,216,0.14) 0%, transparent 68%)" }}
        />
        <div
          className="absolute -left-24 bottom-0 w-[420px] h-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(17,85,166,0.18) 0%, transparent 70%)" }}
        />
        {/* Subtle top edge highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(74,162,216,0.35), transparent)" }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 relative">
        <div className="flex items-center gap-12 xl:gap-16">
          {/* Text column */}
          <div className="flex-1 min-w-0 max-w-[600px]">
            {/* Regulatory badge */}
            <div
              className="hero-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[rgba(74,162,216,0.30)] bg-[rgba(74,162,216,0.08)] mb-8"
              role="note"
            >
              <Shield size={11} className="text-[#4AA2D8]" aria-hidden="true" />
              <span className="text-[11px] font-semibold text-[#4AA2D8] tracking-[0.08em]">
                FDIC Insured · Protected up to $250,000
              </span>
            </div>

            <h1
              id="hero-heading"
              className="hero-h1 text-[44px] sm:text-[56px] lg:text-[62px] font-extrabold text-white leading-[1.03] mb-6 tracking-tight"
              style={{ fontFamily: "Figtree, sans-serif" }}
            >
              Banking built for the{" "}
              <span
                className="relative inline-block"
                style={{
                  backgroundImage: "linear-gradient(90deg, #FFFFFF 0%, #4AA2D8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                way you live.
              </span>
            </h1>

            <p className="hero-body text-[17px] sm:text-[18px] text-[rgba(255,255,255,0.60)] leading-relaxed mb-10 max-w-[500px]">
              MevrelBank brings clarity, speed, and intelligence to your finances — from your first deposit to your future goals.
            </p>

            <div className="hero-cta flex items-center gap-4 flex-wrap">
              <a
                href="/register"
                className="relative inline-flex items-center gap-2 px-6 py-3 rounded-[7px] text-[14px] font-semibold text-[#0B3270] bg-white hover:bg-[#EBF0FA] transition-colors overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span className="shimmer-btn absolute inset-0 rounded-[7px]" aria-hidden="true" />
                <span className="relative z-10">Open a Free Account</span>
              </a>
              <a
                href="#product"
                className="flex items-center gap-2 text-[14px] font-semibold text-[rgba(255,255,255,0.55)] hover:text-white transition-colors focus:outline-none focus-visible:underline"
              >
                See how it works <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>

            {/* Stats row */}
            <div className="hero-stats mt-12 flex items-stretch gap-6 sm:gap-10 flex-wrap">
              {STATS.map((s, i) => (
                <div
                  key={s.label}
                  className={`count-in count-in-${i + 1} ${i > 0 ? "border-l border-[rgba(255,255,255,0.12)] pl-6 sm:pl-10" : ""}`}
                >
                  <div
                    className="text-[22px] sm:text-[26px] font-bold text-white leading-none mb-1"
                    style={{ fontFamily: "Figtree, sans-serif" }}
                  >
                    {s.val}
                  </div>
                  <div className="text-[11px] text-[rgba(255,255,255,0.42)]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating dashboard card — desktop only */}
          <div className="hero-card hidden lg:block">
            <FloatingCard />
          </div>
        </div>
      </div>
    </section>
  );
}
