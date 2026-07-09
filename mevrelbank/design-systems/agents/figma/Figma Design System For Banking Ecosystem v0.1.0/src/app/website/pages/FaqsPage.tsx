import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { PageSection, PageShell } from "../components/PageShell";

const FAQS = [
  ["Is MevrelBank live for customers today?", "MevrelBank is in active development. The public website is live while broader product capabilities continue to be planned and built in phases."],
  ["What types of accounts are planned?", "The roadmap currently centers on personal banking, business banking, payments, cards, savings, and broader financial services over time."],
  ["How will customer security be handled?", "Security is a foundational design priority, with account protection, controlled access, and operational safeguards planned into the platform architecture."],
  ["Can I register interest before launch?", "Yes. Use the contact page or the email calls to action on the site to signal interest in accounts, partnerships, or product updates."],
  ["Will there be support for businesses?", "Yes. Business banking is part of the core product direction and is already reflected in the public product structure."],
  ["Where can I send security questions?", "Security-related questions or responsible disclosures can be directed to security@mevrelbank.com."],
] as const;

export default function FaqsPage() {
  return (
    <PageShell
      eyebrow="FAQs"
      title="Answers to the questions visitors are most likely to ask first."
      intro="This page is designed to give clear, direct context about the current stage of the project, what is planned, and how to reach the team."
      primaryCta={{ label: "Contact us", href: "/contact" }}
      secondaryCta={{ label: "Visit security center", href: "/security-center" }}
    >
      <PageSection
        title="Frequently asked questions"
        description="If you need a more specific answer, contact the team directly and we will route your message appropriately."
      >
        <div className="rounded-[24px] border border-[rgba(11,50,112,0.08)] bg-white px-6 sm:px-8">
          <Accordion type="single" collapsible>
            {FAQS.map(([question, answer], index) => (
              <AccordionItem key={question} value={`item-${index + 1}`} className="border-[rgba(11,50,112,0.08)]">
                <AccordionTrigger className="py-5 text-[16px] font-semibold text-[#0D1829] hover:no-underline">
                  {question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[15px] leading-relaxed text-[#5E6E8E]">
                  {answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </PageSection>
    </PageShell>
  );
}
