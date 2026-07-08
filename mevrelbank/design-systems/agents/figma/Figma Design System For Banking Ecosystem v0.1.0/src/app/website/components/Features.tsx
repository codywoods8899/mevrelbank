import { Shield, Zap, Activity, Globe, Wallet, FileText } from "lucide-react";

const FEATURES = [
  {
    icon: Shield,
    title: "Bank-Grade Security",
    desc: "256-bit TLS encryption, biometric authentication, and real-time fraud monitoring on every account.",
  },
  {
    icon: Zap,
    title: "Instant Transfers",
    desc: "Send money 24/7 via Faster Payments — free, immediate, and reliable.",
  },
  {
    icon: Activity,
    title: "Financial Intelligence",
    desc: "Spending analysis, categorisation, and personalised insights to help you reach your goals.",
  },
  {
    icon: Globe,
    title: "Worldwide Access",
    desc: "Spend in 180+ countries at real exchange rates. No hidden fees. No surprises on your statement.",
  },
  {
    icon: Wallet,
    title: "Smart Savings",
    desc: "Round-up pots, automated transfers, and competitive AER rates to grow your money effortlessly.",
  },
  {
    icon: FileText,
    title: "Clear Statements",
    desc: "Downloadable statements, categorised history, and annual tax summaries always available.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="py-24 bg-white"
      aria-labelledby="features-heading"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#1764C0] mb-3">
            Why MevrelBank
          </div>
          <h2
            id="features-heading"
            className="text-[38px] font-bold text-[#0D1829] leading-tight mb-4"
            style={{ fontFamily: "Figtree, sans-serif" }}
          >
            Everything you need.<br />Nothing you don't.
          </h2>
          <p className="text-[16px] text-[#5E6E8E] max-w-[480px] mx-auto leading-relaxed">
            Thoughtfully engineered features that make managing money effortless.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <li
              key={title}
              className="p-6 rounded-[10px] border border-[rgba(11,50,112,0.08)] hover:border-[rgba(23,100,192,0.30)] hover:shadow-[0_4px_20px_rgba(11,50,112,0.07)] transition-all group"
            >
              <div
                className="w-10 h-10 rounded-[8px] bg-[#EBF0FA] flex items-center justify-center text-[#1764C0] mb-5 group-hover:bg-[#0B3270] group-hover:text-white transition-colors"
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
          ))}
        </ul>
      </div>
    </section>
  );
}
