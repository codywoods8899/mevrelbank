import { useRef, useEffect, useState } from "react";
import { Check, Building2, ShieldCheck, BarChart2, ArrowRight } from "lucide-react";

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

const PERSONAL_ITEMS = [
  { label: "Current account with virtual card" },
  { label: "Savings pots with custom goals" },
  { label: "Instant card freeze & controls" },
  { label: "Spending categories & insights" },
];

const BUSINESS_ITEMS = [
  { label: "Multi-user team access" },
  { label: "Business payment controls" },
  { label: "Expense visibility dashboard" },
  { label: "Dedicated business support" },
];

export function CoreSections() {
  const personalRef = useReveal();
  const businessRef = useReveal();
  const supportRef  = useReveal();

  return (
    <>
      {/* ── Personal Banking ─────────────────────────────────────────── */}
      <section
        id="personal"
        className="py-24 bg-white overflow-hidden"
        aria-labelledby="personal-heading"
        ref={personalRef.ref as React.RefObject<HTMLElement>}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text */}
            <div className={`reveal ${personalRef.visible ? "visible" : ""}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EBF0FA] mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1764C0]" aria-hidden="true" />
                <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#1764C0]">
                  Personal Banking
                </span>
              </div>
              <h2
                id="personal-heading"
                className="text-[34px] sm:text-[38px] font-bold text-[#0D1829] leading-tight mb-4"
                style={{ fontFamily: "Figtree, sans-serif" }}
              >
                Everyday banking that stays simple.
              </h2>
              <p className="text-[16px] text-[#5E6E8E] leading-relaxed mb-8">
                Manage daily spending, savings goals, and payments from one clear dashboard
                designed for speed and confidence.
              </p>
              <ul className="space-y-3 mb-8 list-none p-0 m-0">
                {PERSONAL_ITEMS.map((item) => (
                  <li key={item.label} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D6F0E6] text-[#0E7C4D] flex items-center justify-center">
                      <Check size={11} strokeWidth={2.5} />
                    </span>
                    <span className="text-[14px] text-[#3A4A62]">{item.label}</span>
                  </li>
                ))}
              </ul>
              <a
                href="/products#personal"
                className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#1764C0] hover:text-[#0B3270] transition-colors"
              >
                Learn more about personal accounts <ArrowRight size={14} />
              </a>
            </div>

            {/* Visual card — right column */}
            <div className={`slide-in-right ${personalRef.visible ? "visible" : ""}`}>
              <div className="bg-[#F4F7FB] rounded-[20px] p-6 border border-[rgba(11,50,112,0.07)] shadow-[0_8px_40px_rgba(11,50,112,0.08)]">
                {/* Mini balance card */}
                <div className="bg-[#0B3270] rounded-[14px] p-5 mb-4 relative overflow-hidden">
                  <div
                    className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20"
                    style={{ background: "radial-gradient(circle, #4AA2D8, transparent)" }}
                    aria-hidden="true"
                  />
                  <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[rgba(255,255,255,0.45)] mb-3">
                    Total balance
                  </div>
                  <div
                    className="text-[32px] font-bold text-white leading-none mb-1"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    $50,740.00
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[11px] font-semibold text-[#34C77A]">↑ +3.2% this month</span>
                  </div>
                </div>
                {/* Two sub-cards */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Current",  val: "$38,240", color: "#0B3270" },
                    { label: "Savings",  val: "$12,500", color: "#0E7C4D" },
                  ].map((c) => (
                    <div key={c.label} className="bg-white rounded-[10px] p-4 border border-[rgba(11,50,112,0.07)]">
                      <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#8A9BBE] mb-2">
                        {c.label}
                      </div>
                      <div
                        className="text-[18px] font-bold leading-none"
                        style={{ fontFamily: "'DM Mono', monospace", color: c.color }}
                      >
                        {c.val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Business Banking ─────────────────────────────────────────── */}
      <section
        id="business"
        className="py-24 bg-[#F4F7FB] overflow-hidden"
        aria-labelledby="business-heading"
        ref={businessRef.ref as React.RefObject<HTMLElement>}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Visual card — left column (order reversed on mobile) */}
            <div className={`order-last lg:order-first slide-in-right ${businessRef.visible ? "visible" : ""}`}>
              <div className="bg-white rounded-[20px] p-6 border border-[rgba(11,50,112,0.07)] shadow-[0_8px_40px_rgba(11,50,112,0.06)]">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[rgba(11,50,112,0.07)]">
                  <div className="w-9 h-9 rounded-[8px] bg-[#EBF0FA] text-[#1764C0] flex items-center justify-center">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#0D1829]">Apex Solutions Ltd</div>
                    <div className="text-[11px] text-[#8A9BBE]">Business account · 4 users</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="pulse-live w-1.5 h-1.5 rounded-full bg-[#34C77A]" />
                    <span className="text-[10px] font-medium text-[#34C77A]">Active</span>
                  </div>
                </div>
                {[
                  { label: "This month's spend",  val: "$24,180" },
                  { label: "Pending payments",    val: "3" },
                  { label: "Team members",        val: "4" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-[rgba(11,50,112,0.05)] last:border-0">
                    <span className="text-[13px] text-[#5E6E8E]">{row.label}</span>
                    <span
                      className="text-[14px] font-semibold text-[#0D1829]"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {row.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Text */}
            <div className={`reveal ${businessRef.visible ? "visible" : ""}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EBF0FA] mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1764C0]" aria-hidden="true" />
                <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#1764C0]">
                  Business Banking
                </span>
              </div>
              <h2
                id="business-heading"
                className="text-[34px] sm:text-[38px] font-bold text-[#0D1829] leading-tight mb-4"
                style={{ fontFamily: "Figtree, sans-serif" }}
              >
                Built to support growing teams.
              </h2>
              <p className="text-[16px] text-[#5E6E8E] leading-relaxed mb-8">
                Keep business spending visible with multi-user access, payment controls, and account
                views that help teams move quickly.
              </p>
              <ul className="space-y-3 mb-8 list-none p-0 m-0">
                {BUSINESS_ITEMS.map((item) => (
                  <li key={item.label} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#EBF0FA] text-[#1764C0] flex items-center justify-center">
                      <Check size={11} strokeWidth={2.5} />
                    </span>
                    <span className="text-[14px] text-[#3A4A62]">{item.label}</span>
                  </li>
                ))}
              </ul>
              <a
                href="/products#business"
                className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#1764C0] hover:text-[#0B3270] transition-colors"
              >
                Explore business accounts <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Support channels ─────────────────────────────────────────── */}
      <section
        id="support"
        className="py-24 bg-white"
        aria-labelledby="support-heading"
        ref={supportRef.ref as React.RefObject<HTMLElement>}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className={`reveal ${supportRef.visible ? "visible" : ""} text-center max-w-2xl mx-auto mb-14`}>
            <h2
              id="support-heading"
              className="text-[34px] sm:text-[40px] font-bold text-[#0D1829] leading-tight mb-4"
              style={{ fontFamily: "Figtree, sans-serif" }}
            >
              We're here when you need us.
            </h2>
            <p className="text-[16px] text-[#5E6E8E] leading-relaxed">
              Real humans behind every channel — no chatbots, no runaround.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: ShieldCheck,
                title: "General Support",
                desc: "Account queries, onboarding help, and everyday banking questions.",
                href: "mailto:support@mevrelbank.com?subject=Support%20request",
                label: "Email support",
                color: "#1764C0",
                bg: "#EBF0FA",
              },
              {
                icon: BarChart2,
                title: "Security Issues",
                desc: "Report suspicious activity or a potential security vulnerability.",
                href: "mailto:security@mevrelbank.com?subject=Security%20report",
                label: "Report securely",
                color: "#0E7C4D",
                bg: "#D6F0E6",
              },
              {
                icon: Building2,
                title: "Help Centre",
                desc: "Browse our FAQ library for instant answers to common questions.",
                href: "/faqs",
                label: "Browse FAQs",
                color: "#7B3FC5",
                bg: "#EDE6FA",
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <a
                  key={card.title}
                  href={card.href}
                  className={`reveal reveal-delay-${i + 1} ${supportRef.visible ? "visible" : ""} group block rounded-[14px] border border-[rgba(11,50,112,0.08)] p-7 hover:border-[rgba(23,100,192,0.25)] hover:shadow-[0_8px_32px_rgba(11,50,112,0.09)] transition-all duration-300 bg-white no-underline`}
                >
                  <div
                    className="w-11 h-11 rounded-[10px] flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                    style={{ background: card.bg, color: card.color }}
                    aria-hidden="true"
                  >
                    <Icon size={20} />
                  </div>
                  <h3
                    className="text-[16px] font-semibold text-[#0D1829] mb-2"
                    style={{ fontFamily: "Figtree, sans-serif" }}
                  >
                    {card.title}
                  </h3>
                  <p className="text-[13px] text-[#5E6E8E] leading-relaxed mb-4">{card.desc}</p>
                  <span
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
                    style={{ color: card.color }}
                  >
                    {card.label} <ArrowRight size={12} />
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
