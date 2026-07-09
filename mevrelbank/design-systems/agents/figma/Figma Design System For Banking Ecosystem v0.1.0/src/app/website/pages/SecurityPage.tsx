import { PageSection, PageShell } from "../components/PageShell";

const PRACTICES = [
  ["Access protection", "Authentication and account protection are planned as core product capabilities, not afterthoughts."],
  ["Operational control", "Infrastructure and delivery choices are being shaped around dependable monitoring, review, and change discipline."],
  ["Privacy mindset", "Customer data handling should remain deliberate, limited, and aligned with clearly defined product needs."],
  ["Incident readiness", "Security reporting channels and response expectations are being established before broader platform rollout."],
] as const;

export default function SecurityPage() {
  return (
    <PageShell
      eyebrow="Security Center"
      title="Security and trust are part of the product foundation."
      intro="MevrelBank is being designed with a security-first posture so the product can scale on reliable operational practices, not reactive fixes."
      primaryCta={{ label: "Report a security concern", href: "mailto:security@mevrelbank.com?subject=Security%20report" }}
      secondaryCta={{ label: "Read FAQs", href: "/faqs" }}
    >
      <PageSection
        title="Security priorities"
        description="The security center sets clear expectations about the standards shaping the platform and how visitors can raise questions responsibly."
      >
        <div className="grid gap-6 md:grid-cols-2">
          {PRACTICES.map(([title, text]) => (
            <article key={title} className="rounded-[20px] border border-[rgba(11,50,112,0.08)] bg-white p-8">
              <h3 className="text-[19px] font-semibold text-[#0D1829] mb-3">{title}</h3>
              <p className="text-[15px] leading-relaxed text-[#5E6E8E]">{text}</p>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection
        title="Responsible reporting"
        description="If you discover a possible security issue, use the dedicated reporting channel so the team can review it responsibly."
        className="bg-[#F6F8FC]"
      >
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[20px] border border-[rgba(11,50,112,0.08)] bg-white p-8">
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#4AA2D8] mb-3">Security contact</div>
            <a href="mailto:security@mevrelbank.com" className="text-[22px] font-semibold text-[#0B3270] hover:text-[#0E3E8C] transition-colors">
              security@mevrelbank.com
            </a>
            <p className="mt-4 text-[15px] leading-relaxed text-[#5E6E8E]">
              Include the issue summary, affected area, reproduction steps, and any material impact you observed.
            </p>
          </div>
          <div className="rounded-[20px] border border-[rgba(11,50,112,0.08)] bg-white p-8">
            <ol className="space-y-5">
              {[
                "Send the report with as much practical detail as possible.",
                "Allow time for triage, validation, and coordinated follow-up.",
                "Avoid public disclosure while the issue is under review.",
              ].map((step, index) => (
                <li key={step} className="flex gap-4">
                  <div className="h-8 w-8 flex-shrink-0 rounded-full bg-[#EBF0FA] text-[#0B3270] flex items-center justify-center text-[13px] font-semibold">
                    {index + 1}
                  </div>
                  <p className="pt-1 text-[15px] leading-relaxed text-[#5E6E8E]">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </PageSection>
    </PageShell>
  );
}
