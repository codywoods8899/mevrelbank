import { PageSection, PageShell } from "../components/PageShell";

export default function BlogPage() {
  return (
    <PageShell
      eyebrow="Blog & News"
      title="Updates, perspectives, and product thinking from MevrelBank."
      intro="The editorial layer is being prepared as part of the broader website experience. This page establishes the space for future launch notes, product updates, and company news."
      primaryCta={{ label: "Request updates", href: "mailto:hello@mevrelbank.com?subject=Subscribe%20to%20updates" }}
      secondaryCta={{ label: "See contact options", href: "/contact" }}
    >
      <PageSection
        title="What will appear here"
        description="As the platform grows, this section will become the public home for timely and useful communication."
      >
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ["Product updates", "Progress on the website, customer journeys, and future launch milestones."],
            ["Company news", "Announcements, partnerships, and important public-facing developments."],
            ["Security & trust", "Operational updates, educational content, and platform trust signals."],
          ].map(([title, text]) => (
            <article key={title} className="rounded-[20px] border border-[rgba(11,50,112,0.08)] bg-white p-8">
              <h3 className="text-[19px] font-semibold text-[#0D1829] mb-3">{title}</h3>
              <p className="text-[15px] leading-relaxed text-[#5E6E8E]">{text}</p>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection
        title="Editorial note"
        description="This is currently a placeholder page so the public site has a stable destination for future content."
        className="bg-[#F6F8FC]"
      >
        <div className="rounded-[24px] border border-[rgba(11,50,112,0.08)] bg-white p-8 sm:p-10">
          <p className="text-[17px] leading-relaxed text-[#5E6E8E] max-w-3xl">
            Until the editorial workflow is active, visitors can request product updates and announcements directly by email. The page is intentionally light today and ready to expand later without changing the route structure.
          </p>
        </div>
      </PageSection>
    </PageShell>
  );
}
