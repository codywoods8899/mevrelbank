import { Btn } from "../shared/Btn";

export function CTA() {
  return (
    <section
      id="open-account"
      className="py-24 bg-[#0B3270] relative overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Subtle glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(ellipse, #4AA2D8 0%, transparent 70%)" }}
        />
      </div>

      <div className="max-w-[580px] mx-auto px-6 text-center relative">
        <h2
          id="cta-heading"
          className="text-[38px] font-bold text-white mb-5 leading-tight"
          style={{ fontFamily: "Figtree, sans-serif" }}
        >
          Ready to bank differently?
        </h2>
        <p className="text-[17px] text-[rgba(255,255,255,0.55)] mb-10 leading-relaxed">
          Register your interest and our team will contact you with onboarding details and next
          steps.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Btn variant="secondary" size="lg" href="mailto:hello@mevrelbank.com?subject=Open%20account%20interest">
            Open a Free Account
          </Btn>
          <Btn variant="outline" size="lg" href="#business" className="border-[rgba(255,255,255,0.25)] text-white hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.50)]">
            Explore Business Accounts
          </Btn>
        </div>
        <p className="mt-6 text-[12px] text-[rgba(255,255,255,0.30)]">
          Regulatory status and account protection details are shared during onboarding.
        </p>
      </div>
    </section>
  );
}
