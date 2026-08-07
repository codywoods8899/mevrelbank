import { useRef, useEffect, useState } from "react";
import { Shield, Zap, Activity, Globe, Wallet, FileText } from "lucide-react";

const FEATURES = [
  {
    icon: Shield,
    title: "Bank-Grade Security",
    desc: "256-bit TLS encryption, biometric authentication, and real-time fraud monitoring on every account.",
    accent: "#1764C0",
    bg: "#EBF0FA",
  },
  {
    icon: Zap,
    title: "Instant Transfers",
    desc: "Send money 24/7 via Faster Payments — free, immediate, and reliable.",
    accent: "#0E7C4D",
    bg: "#D6F0E6",
  },
  {
    icon: Activity,
    title: "Financial Intelligence",
    desc: "Spending analysis, categorisation, and personalised insights to help you reach your goals.",
    accent: "#7B3FC5",
    bg: "#EDE6FA",
  },
  {
    icon: Globe,
    title: "Worldwide Access",
    desc: "Spend in 180+ countries at real exchange rates. No hidden fees. No surprises on your statement.",
    accent: "#4AA2D8",
    bg: "#E0F0FA",
  },
  {
    icon: Wallet,
    title: "Smart Savings",
    desc: "Round-up pots, automated transfers, and competitive rates to grow your money effortlessly.",
    accent: "#B46A0A",
    bg: "#FAF0DC",
  },
  {
    icon: FileText,
    title: "Clear Statements",
    desc: "Downloadable statements, categorised history, and annual tax summaries always available.",
    accent: "#1764C0",
    bg: "#EBF0FA",
  },
];

function FeatureCard({
  icon: Icon,
  title,
  desc,
  accent,
  bg,
  delay,
}: (typeof FEATURES)[number] & { delay: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <li
      ref={ref}
      className={`reveal reveal-delay-${delay} ${visible ? "visible" : ""} group p-6 rounded-[12px] border border-[rgba(11,50,112,0.08)] hover:border-[rgba(23,100,192,0.25)] hover:shadow-[0_8px_32px_rgba(11,50,112,0.09)] transition-all duration-300 bg-white relative overflow-hidden`}
    >
      {/* Subtle accent bar at top */}
      <div
        className="absolute top-0 left-6 right-6 h-[2px] rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: accent }}
        aria-hidden="true"
      />
      <div
        className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
        style={{ background: bg, color: accent }}
        aria-hidden="true"
      >
        <Icon size={18} />
      </div>
      <h3
        className="text-[15px] font-semibold text-[#0D1829] mb-2"
        style={{ fontFamily: "Figtree, sans-serif" }}
      >
        {title}
      </h3>
      <p className="text-[13px] text-[#5E6E8E] leading-relaxed">{desc}</p>
    </li>
  );
}

export function Features() {
  const headingRef = useRef<HTMLDivElement>(null);
  const [headingVisible, setHeadingVisible] = useState(false);

  useEffect(() => {
    const el = headingRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setHeadingVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="features"
      className="py-24 bg-white"
      aria-labelledby="features-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div
          ref={headingRef as React.RefObject<HTMLDivElement>}
          className={`text-center mb-14 reveal ${headingVisible ? "visible" : ""}`}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EBF0FA] mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1764C0]" aria-hidden="true" />
            <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#1764C0]">
              Why MevrelBank
            </span>
          </div>
          <h2
            id="features-heading"
            className="text-[34px] sm:text-[40px] font-bold text-[#0D1829] leading-tight mb-4"
            style={{ fontFamily: "Figtree, sans-serif" }}
          >
            Everything you need.<br />Nothing you don't.
          </h2>
          <p className="text-[16px] text-[#5E6E8E] max-w-[460px] mx-auto leading-relaxed">
            Thoughtfully engineered features that make managing money effortless.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">
          {FEATURES.map((feat, i) => (
            <FeatureCard key={feat.title} {...feat} delay={(i % 3) + 1} />
          ))}
        </ul>
      </div>
    </section>
  );
}
