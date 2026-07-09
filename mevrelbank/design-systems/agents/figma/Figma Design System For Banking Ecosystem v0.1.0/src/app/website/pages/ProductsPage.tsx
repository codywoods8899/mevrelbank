import { PageSection, PageShell } from "../components/PageShell";

const PRODUCTS = [
  {
    id: "personal",
    title: "Personal Banking",
    text: "Everyday accounts designed for simple spending, strong visibility, and smooth financial routines.",
    bullets: ["Clear balances and transaction views", "Fast payments and transfers", "Savings spaces for goals"],
  },
  {
    id: "savings",
    title: "Savings",
    text: "Structured savings experiences that help customers build consistency and see progress clearly.",
    bullets: ["Goal-based saving journeys", "Simple contribution patterns", "Calm progress tracking"],
  },
  {
    id: "business",
    title: "Business Banking",
    text: "Operational banking for founders and growing teams who want better control over working capital.",
    bullets: ["Multi-purpose business accounts", "Payment visibility for teams", "Dependable money movement"],
  },
  {
    id: "payments",
    title: "Payments",
    text: "Local and internal payment experiences built to feel fast, understandable, and reliable.",
    bullets: ["Transfer flows with clear confirmation", "Scheduled payment support", "Recipient management"],
  },
  {
    id: "cards",
    title: "Cards",
    text: "Card products and controls designed around confidence, visibility, and day-to-day control.",
    bullets: ["Debit and virtual card support", "Freeze and unfreeze controls", "Card management from one place"],
  },
  {
    id: "international",
    title: "International",
    text: "Cross-border capabilities planned with transparency and trust at the center of the experience.",
    bullets: ["Clear transfer status", "Transparent fee communication", "Multi-currency roadmap alignment"],
  },
];

export default function ProductsPage() {
  return (
    <PageShell
      eyebrow="Products & Services"
      title="Core banking products designed for clarity, movement, and control."
      intro="MevrelBank is being structured around essential financial journeys first: accounts, saving, payments, cards, and the tools customers use most often."
      primaryCta={{ label: "Open account interest", href: "mailto:hello@mevrelbank.com?subject=Open%20account%20interest" }}
      secondaryCta={{ label: "Review security posture", href: "/security-center" }}
    >
      <PageSection
        title="Banking built around real usage"
        description="Each product area is planned to feel direct, understandable, and premium rather than overloaded or overly technical."
      >
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {PRODUCTS.map((product) => (
            <article
              id={product.id}
              key={product.title}
              className="rounded-[20px] border border-[rgba(11,50,112,0.08)] bg-white p-8"
            >
              <h3 className="text-[20px] font-semibold text-[#0D1829] mb-3">{product.title}</h3>
              <p className="text-[15px] leading-relaxed text-[#5E6E8E] mb-5">{product.text}</p>
              <ul className="space-y-2 text-[14px] text-[#3A4A62]">
                {product.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3">
                    <span className="mt-[8px] h-1.5 w-1.5 rounded-full bg-[#4AA2D8]" aria-hidden="true" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection
        title="What customers should expect"
        description="The product direction stays anchored in a few practical standards regardless of feature set."
        className="bg-[#F6F8FC]"
      >
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ["Clear status", "Balances, movement, and next steps should always feel visible."],
            ["Controlled growth", "Products expand gradually without losing consistency or trust."],
            ["Premium experience", "Interfaces should feel refined, fast, and intentionally simple."],
          ].map(([title, text]) => (
            <article key={title} className="rounded-[20px] border border-[rgba(11,50,112,0.08)] bg-white p-8">
              <h3 className="text-[19px] font-semibold text-[#0D1829] mb-3">{title}</h3>
              <p className="text-[15px] leading-relaxed text-[#5E6E8E]">{text}</p>
            </article>
          ))}
        </div>
      </PageSection>
    </PageShell>
  );
}
