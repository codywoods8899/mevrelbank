import { Shield, Lock, CheckCircle, Star, Users } from "lucide-react";

const TRUST_ITEMS = [
  { icon: Shield, label: "Security-first architecture" },
  { icon: Lock, label: "Encrypted connections" },
  { icon: CheckCircle, label: "Continuous monitoring" },
  { icon: Star, label: "Clear product terms" },
  { icon: Users, label: "Human support channels" },
];

export function TrustBar() {
  return (
    <section
      className="py-5 bg-[#F4F7FB] border-b border-[rgba(11,50,112,0.07)]"
      aria-label="Trust and regulatory information"
    >
      <div className="max-w-6xl mx-auto px-6">
        <ul className="flex flex-wrap items-center justify-center gap-8 md:gap-14 list-none p-0 m-0">
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2 text-[#5E6E8E]"
            >
              <Icon size={14} className="text-[#0B3270]" aria-hidden="true" />
              <span className="text-[12px] font-medium">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
