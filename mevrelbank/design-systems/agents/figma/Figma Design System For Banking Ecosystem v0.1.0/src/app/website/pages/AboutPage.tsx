import { PageSection, PageShell } from "../components/PageShell";

const VALUES = [
  {
    title: "Clarity over noise",
    text: "Every interaction is designed to make money easier to understand, manage, and move with confidence.",
  },
  {
    title: "Security by default",
    text: "Trust is built into the product from the first screen, from access controls to communication standards.",
  },
  {
    title: "Human-centered speed",
    text: "Fast should still feel calm. We reduce friction without making customers feel rushed or uncertain.",
  },
];

const LEADERSHIP = [
  {
    title: "Product & Experience",
    text: "Focused on building a banking experience that feels premium, intuitive, and dependable from day one.",
  },
  {
    title: "Operations & Risk",
    text: "Grounded in resilient operating models, clear controls, and practical readiness for scale.",
  },
  {
    title: "Technology & Security",
    text: "Driven by modern infrastructure choices that prioritize privacy, performance, and long-term maintainability.",
  },
];

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About MevrelBank"
      title="A modern banking brand built around trust, speed, and clarity."
      intro="MevrelBank is being shaped as a digital banking experience for people and businesses who expect premium design, straightforward products, and a dependable financial home."
      primaryCta={{ label: "Explore products", href: "/products" }}
      secondaryCta={{ label: "Contact the team", href: "/contact" }}
    >
      <PageSection
        title="Why MevrelBank exists"
        description="We are building a brand that removes unnecessary friction from everyday banking while keeping the experience clear, controlled, and reassuring."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[20px] border border-[rgba(11,50,112,0.08)] bg-white p-8">
            <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#4AA2D8] mb-4">
              Mission
            </div>
            <p className="text-[16px] leading-relaxed text-[#3A4A62]">
              Create a digital banking platform that feels intelligent, calm, and premium at every touchpoint — from onboarding to daily money movement.
            </p>
          </div>
          <div className="rounded-[20px] border border-[rgba(11,50,112,0.08)] bg-[#F6F8FC] p-8">
            <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#4AA2D8] mb-4">
              Vision
            </div>
            <p className="text-[16px] leading-relaxed text-[#3A4A62]">
              Become a trusted financial ecosystem that combines elegant user experience with strong infrastructure, disciplined security, and clear product design.
            </p>
          </div>
        </div>
      </PageSection>

      <PageSection
        title="What guides the brand"
        description="Our design and product choices follow a small number of principles that keep the experience consistent."
        className="bg-[#F6F8FC]"
      >
        <div className="grid gap-6 md:grid-cols-3">
          {VALUES.map((value) => (
            <article
              key={value.title}
              className="rounded-[20px] border border-[rgba(11,50,112,0.08)] bg-white p-8"
            >
              <h3 className="text-[20px] font-semibold text-[#0D1829] mb-3">{value.title}</h3>
              <p className="text-[15px] leading-relaxed text-[#5E6E8E]">{value.text}</p>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection
        title="Leadership focus"
        description="The operating model is being shaped around a few core disciplines so the brand scales with discipline, not noise."
      >
        <div className="grid gap-6 md:grid-cols-3">
          {LEADERSHIP.map((item) => (
            <article
              key={item.title}
              className="rounded-[20px] border border-[rgba(11,50,112,0.08)] bg-white p-8"
            >
              <h3 className="text-[19px] font-semibold text-[#0D1829] mb-3">{item.title}</h3>
              <p className="text-[15px] leading-relaxed text-[#5E6E8E]">{item.text}</p>
            </article>
          ))}
        </div>
      </PageSection>
    </PageShell>
  );
}
