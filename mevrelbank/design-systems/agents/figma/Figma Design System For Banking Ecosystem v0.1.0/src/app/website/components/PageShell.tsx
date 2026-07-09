import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { Btn } from "../shared/Btn";

interface PageShellProps {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  primaryCta?: {
    label: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
}

export function PageShell({
  eyebrow,
  title,
  intro,
  children,
  primaryCta,
  secondaryCta,
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main id="main-content">
        <section className="bg-[#F6F8FC] border-b border-[rgba(11,50,112,0.08)]">
          <div className="max-w-6xl mx-auto px-6 py-20 sm:py-24">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[rgba(11,50,112,0.08)] bg-white mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4AA2D8]" aria-hidden="true" />
              <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#0B3270]">
                {eyebrow}
              </span>
            </div>
            <div className="max-w-3xl">
              <h1
                className="text-[42px] sm:text-[56px] font-extrabold text-[#0D1829] leading-[1.04] tracking-tight mb-6"
                style={{ fontFamily: "Figtree, sans-serif" }}
              >
                {title}
              </h1>
              <p className="text-[17px] leading-relaxed text-[#5E6E8E] max-w-2xl">
                {intro}
              </p>
            </div>
            {(primaryCta || secondaryCta) && (
              <div className="flex flex-wrap items-center gap-3 mt-10">
                {primaryCta && (
                  <Btn variant="primary" size="lg" href={primaryCta.href}>
                    {primaryCta.label}
                  </Btn>
                )}
                {secondaryCta && (
                  <a
                    href={secondaryCta.href}
                    className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#0B3270] hover:text-[#0E3E8C] transition-colors"
                  >
                    {secondaryCta.label} <ArrowRight size={14} aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
        {children}
      </main>
      <Footer />
    </div>
  );
}

interface PageSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function PageSection({
  title,
  description,
  children,
  className = "",
}: PageSectionProps) {
  return (
    <section className={`py-16 sm:py-20 ${className}`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mb-10">
          <h2
            className="text-[30px] sm:text-[36px] font-bold text-[#0D1829] tracking-tight mb-3"
            style={{ fontFamily: "Figtree, sans-serif" }}
          >
            {title}
          </h2>
          {description && (
            <p className="text-[16px] leading-relaxed text-[#5E6E8E]">{description}</p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
