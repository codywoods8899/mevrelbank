import { PageSection, PageShell } from "../components/PageShell";

export default function CareersPage() {
  return (
    <PageShell
      eyebrow="Careers"
      title="Build calm, modern financial experiences with us."
      intro="As MevrelBank grows, we want to bring together people who care deeply about product quality, operational discipline, and purposeful execution."
      primaryCta={{ label: "Send your profile", href: "mailto:careers@mevrelbank.com?subject=Career%20interest" }}
      secondaryCta={{ label: "Learn about MevrelBank", href: "/about" }}
    >
      <PageSection
        title="What we value"
        description="The culture we are aiming for reflects the same principles behind the brand: clarity, speed, and intentional work."
      >
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ["High ownership", "Take responsibility for outcomes, not just activity."],
            ["Thoughtful craft", "Ship work that feels deliberate, clear, and durable."],
            ["Low-ego execution", "Collaborate with discipline and stay focused on the customer."],
          ].map(([title, text]) => (
            <article key={title} className="rounded-[20px] border border-[rgba(11,50,112,0.08)] bg-white p-8">
              <h3 className="text-[19px] font-semibold text-[#0D1829] mb-3">{title}</h3>
              <p className="text-[15px] leading-relaxed text-[#5E6E8E]">{text}</p>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection
        title="Hiring status"
        description="Public hiring is not broadly open yet, but we welcome early interest from people aligned with the mission."
        className="bg-[#F6F8FC]"
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[20px] border border-[rgba(11,50,112,0.08)] bg-white p-8">
            <h3 className="text-[22px] font-semibold text-[#0D1829] mb-4">Current status</h3>
            <p className="text-[15px] leading-relaxed text-[#5E6E8E] mb-5">
              We are building foundational product and brand layers first. If you are interested in future roles across product, design, engineering, operations, or security, send a concise introduction and relevant work samples.
            </p>
            <p className="text-[15px] leading-relaxed text-[#5E6E8E]">
              Early conversations help us build a strong network ahead of broader launch phases.
            </p>
          </div>
          <div className="rounded-[20px] border border-[rgba(11,50,112,0.08)] bg-white p-8">
            <h3 className="text-[22px] font-semibold text-[#0D1829] mb-4">How to reach us</h3>
            <ul className="space-y-4 text-[15px] text-[#5E6E8E]">
              <li>Email: <a className="text-[#0B3270]" href="mailto:careers@mevrelbank.com">careers@mevrelbank.com</a></li>
              <li>Subject line: Career interest — [Discipline]</li>
              <li>Include: short intro, profile or CV, and links to relevant work</li>
            </ul>
          </div>
        </div>
      </PageSection>
    </PageShell>
  );
}
