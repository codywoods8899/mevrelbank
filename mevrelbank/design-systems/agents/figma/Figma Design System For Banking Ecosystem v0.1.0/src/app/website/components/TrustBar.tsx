import { Shield, Lock, CheckCircle, Star, Users, Cpu, Globe } from "lucide-react";

const TRUST_ITEMS = [
  { icon: Shield,      label: "Security-first architecture" },
  { icon: Lock,        label: "256-bit TLS encrypted" },
  { icon: CheckCircle, label: "Continuous monitoring" },
  { icon: Star,        label: "No hidden fees" },
  { icon: Users,       label: "Human support team" },
  { icon: Cpu,         label: "Real-time fraud detection" },
  { icon: Globe,       label: "Worldwide access" },
];

/* Duplicate for seamless loop */
const ITEMS = [...TRUST_ITEMS, ...TRUST_ITEMS];

export function TrustBar() {
  return (
    <section
      className="py-4 bg-[#F4F7FB] border-b border-[rgba(11,50,112,0.07)] overflow-hidden"
      aria-label="Trust and security information"
    >
      <div className="flex" aria-hidden="true">
        <ul className="animate-marquee flex items-center gap-10 list-none p-0 m-0 flex-shrink-0">
          {ITEMS.map(({ icon: Icon, label }, i) => (
            <li
              key={`${label}-${i}`}
              className="flex items-center gap-2 text-[#5E6E8E] whitespace-nowrap"
            >
              <Icon size={13} className="text-[#1764C0] flex-shrink-0" aria-hidden="true" />
              <span className="text-[12px] font-medium">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Accessible fallback for screen readers */}
      <ul className="sr-only list-none">
        {TRUST_ITEMS.map(({ label }) => (
          <li key={label}>{label}</li>
        ))}
      </ul>
    </section>
  );
}
