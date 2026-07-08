import { ArrowRight, Shield } from "lucide-react";
import { Btn } from "../shared/Btn";

const STATS = [
  { val: "£18B+",  label: "Assets under management" },
  { val: "99.99%", label: "Platform uptime"          },
  { val: "4.9★",   label: "App Store rating"         },
];

export function Hero() {
  return (
    <section
      className="bg-[#0B3270] relative overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Subtle radial glows */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute -right-32 -top-32 w-[600px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(74,162,216,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -left-24 bottom-0 w-[400px] h-[400px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(17,85,166,0.15) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-28 relative">
        <div className="max-w-[640px]">
          {/* Regulatory badge */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[rgba(74,162,216,0.3)] bg-[rgba(74,162,216,0.08)] mb-8"
            role="note"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#4AA2D8]" aria-hidden="true" />
            <span className="text-[11px] font-semibold text-[#4AA2D8] tracking-[0.08em]">
              <Shield size={11} className="inline -mt-px mr-1" aria-hidden="true" />
              FSCS Protected · FCA Authorised
            </span>
          </div>

          <h1
            id="hero-heading"
            className="text-[52px] sm:text-[60px] font-extrabold text-white leading-[1.03] mb-7 tracking-tight"
            style={{ fontFamily: "Figtree, sans-serif" }}
          >
            Banking built for the way you live.
          </h1>

          <p className="text-[18px] text-[rgba(255,255,255,0.60)] leading-relaxed mb-10 max-w-[520px]">
            MevrelBank brings clarity, speed, and intelligence to your finances — from your first deposit to your future goals.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <Btn variant="secondary" size="lg" href="#open-account">
              Open a Free Account
            </Btn>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 text-[14px] font-semibold text-[rgba(255,255,255,0.55)] hover:text-white transition-colors focus:outline-none focus-visible:underline"
            >
              See how it works <ArrowRight size={14} aria-hidden="true" />
            </a>
          </div>

          {/* Stats row */}
          <div className="mt-12 flex items-stretch gap-8 flex-wrap">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={`${
                  i > 0
                    ? "border-l border-[rgba(255,255,255,0.12)] pl-8"
                    : ""
                }`}
              >
                <div
                  className="text-[24px] font-bold text-white leading-none mb-1"
                  style={{ fontFamily: "Figtree, sans-serif" }}
                >
                  {s.val}
                </div>
                <div className="text-[12px] text-[rgba(255,255,255,0.45)]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
