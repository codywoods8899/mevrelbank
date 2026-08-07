import { ArrowRight } from "lucide-react";
import { useRef, useEffect, useState } from "react";

export function CTA() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="open-account"
      ref={ref}
      className="py-24 bg-[#0B3270] relative overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(ellipse, #4AA2D8 0%, transparent 70%)" }}
        />
        {/* Subtle animated top ring */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(74,162,216,0.4), transparent)" }}
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(74,162,216,0.2), transparent)" }}
        />
      </div>

      <div className="max-w-[620px] mx-auto px-4 sm:px-6 text-center relative">
        {/* Eyebrow */}
        <div className={`reveal ${visible ? "visible" : ""} inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(74,162,216,0.25)] bg-[rgba(74,162,216,0.08)] mb-7`}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#4AA2D8] pulse-live" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-[#4AA2D8] tracking-[0.08em]">
            Now accepting applications
          </span>
        </div>

        <h2
          id="cta-heading"
          className={`reveal reveal-delay-1 ${visible ? "visible" : ""} text-[36px] sm:text-[44px] font-bold text-white mb-5 leading-[1.08]`}
          style={{ fontFamily: "Figtree, sans-serif" }}
        >
          Ready to bank differently?
        </h2>
        <p className={`reveal reveal-delay-2 ${visible ? "visible" : ""} text-[17px] text-[rgba(255,255,255,0.55)] mb-10 leading-relaxed`}>
          Open your account in minutes and get straight into your dashboard.
        </p>
        <div className={`reveal reveal-delay-3 ${visible ? "visible" : ""} flex items-center justify-center gap-3 flex-wrap`}>
          {/* Primary — white with shimmer */}
          <a
            href="/register"
            className="relative inline-flex items-center gap-2 px-7 py-3.5 rounded-[8px] text-[14px] font-semibold text-[#0B3270] bg-white hover:bg-[#EBF0FA] transition-colors overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span className="shimmer-btn absolute inset-0 rounded-[8px]" aria-hidden="true" />
            <span className="relative z-10">Open a Free Account</span>
            <ArrowRight size={14} className="relative z-10" aria-hidden="true" />
          </a>
          {/* Secondary — ghost */}
          <a
            href="/products#business"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[8px] text-[14px] font-semibold text-white border border-[rgba(255,255,255,0.22)] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.45)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Explore Business Accounts
          </a>
        </div>
        <p className={`reveal reveal-delay-4 ${visible ? "visible" : ""} mt-6 text-[12px] text-[rgba(255,255,255,0.28)]`}>
          Regulatory status and account protection details are shared during onboarding.
        </p>
      </div>
    </section>
  );
}
