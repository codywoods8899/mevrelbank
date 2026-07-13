import { useRef, useEffect, useState } from "react";
import { UserPlus, CreditCard, BarChart3, ChevronRight } from "lucide-react";

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: UserPlus,
    title: "Open your account",
    text: "Sign up in minutes with our digital onboarding. Verify your identity securely — no branch visits, no paperwork.",
  },
  {
    step: "02",
    icon: CreditCard,
    title: "Fund and spend",
    text: "Deposit via bank transfer or debit card. Spend worldwide with zero hidden fees and real exchange rates.",
  },
  {
    step: "03",
    icon: BarChart3,
    title: "Grow your money",
    text: "Use savings pots, spending insights, and smart budgeting tools to reach your financial goals faster.",
  },
] as const;

const PILLARS = [
  {
    stat: "$0",
    label: "Monthly fees",
    sub: "No minimum balance or maintenance charges. Ever.",
  },
  {
    stat: "2 min",
    label: "Onboarding",
    sub: "From sign-up to a live account — fully digital.",
  },
  {
    stat: "180+",
    label: "Countries",
    sub: "Spend globally at real exchange rates with no surprises.",
  },
] as const;

function useReveal() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

export function BusinessModel() {
  const howRef = useReveal();
  const pillarsRef = useReveal();

  return (
    <>
      {/* ── How it works ─────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="py-24 bg-[#F4F7FB]"
        aria-labelledby="how-heading"
        ref={howRef.ref as React.RefObject<HTMLElement>}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className={`text-center mb-14 reveal ${howRef.visible ? "visible" : ""}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EBF0FA] mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1764C0]" aria-hidden="true" />
              <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#1764C0]">
                How it works
              </span>
            </div>
            <h2
              id="how-heading"
              className="text-[34px] sm:text-[40px] font-bold text-[#0D1829] leading-tight mb-4"
              style={{ fontFamily: "Figtree, sans-serif" }}
            >
              Up and running in three steps.
            </h2>
            <p className="text-[16px] text-[#5E6E8E] max-w-[460px] mx-auto leading-relaxed">
              No branch. No paperwork. Just a clean account that works the moment you open it.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((item, i) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.step}
                  className={`reveal reveal-delay-${i + 1} ${howRef.visible ? "visible" : ""} relative bg-white rounded-[16px] border border-[rgba(11,50,112,0.08)] p-8 hover:shadow-[0_8px_32px_rgba(11,50,112,0.09)] transition-all duration-300 group`}
                >
                  {/* Step number */}
                  <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#4AA2D8] mb-4">
                    Step {item.step}
                  </div>
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-[10px] bg-[#EBF0FA] text-[#1764C0] flex items-center justify-center mb-5 group-hover:bg-[#0B3270] group-hover:text-white transition-colors duration-300">
                    <Icon size={20} />
                  </div>
                  <h3
                    className="text-[18px] font-semibold text-[#0D1829] mb-2"
                    style={{ fontFamily: "Figtree, sans-serif" }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[#5E6E8E]">{item.text}</p>
                  {/* Connector arrow — hidden on last */}
                  {i < 2 && (
                    <ChevronRight
                      size={18}
                      className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-[#C5D3E8] z-10"
                      aria-hidden="true"
                    />
                  )}
                </article>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <a
              href="/waitlist"
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#1764C0] hover:text-[#0B3270] transition-colors"
            >
              Start your application <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* ── By the numbers ───────────────────────────────────────────── */}
      <section
        className="py-20 bg-[#0B3270] relative overflow-hidden"
        aria-labelledby="pillars-heading"
        ref={pillarsRef.ref as React.RefObject<HTMLElement>}
      >
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full opacity-[0.06]"
            style={{ background: "radial-gradient(ellipse, #4AA2D8 0%, transparent 70%)" }}
          />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <h2
            id="pillars-heading"
            className={`reveal ${pillarsRef.visible ? "visible" : ""} text-center text-[28px] sm:text-[34px] font-bold text-white mb-12 leading-tight`}
            style={{ fontFamily: "Figtree, sans-serif" }}
          >
            Built around what matters to you.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-0 sm:divide-x sm:divide-[rgba(255,255,255,0.10)]">
            {PILLARS.map((p, i) => (
              <div
                key={p.label}
                className={`reveal reveal-delay-${i + 1} ${pillarsRef.visible ? "visible" : ""} text-center sm:px-10`}
              >
                <div
                  className="text-[48px] sm:text-[56px] font-extrabold text-white leading-none mb-2"
                  style={{ fontFamily: "Figtree, sans-serif" }}
                >
                  {p.stat}
                </div>
                <div className="text-[15px] font-semibold text-[#4AA2D8] mb-2">{p.label}</div>
                <div className="text-[13px] text-[rgba(255,255,255,0.48)] leading-relaxed max-w-[200px] mx-auto">
                  {p.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
