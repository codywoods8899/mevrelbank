import { useState } from "react";
import { PageSection, PageShell } from "../components/PageShell";
import { Btn } from "../shared/Btn";

const SUPPORT_CHANNELS = [
  ["General enquiries", "hello@mevrelbank.com"],
  ["Customer support", "support@mevrelbank.com"],
  ["Security reporting", "security@mevrelbank.com"],
  ["Press", "press@mevrelbank.com"],
] as const;

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const composedSubject = subject.trim() || "Website enquiry";
    const composedBody = [
      `Name: ${name.trim() || "Not provided"}`,
      `Email: ${email.trim() || "Not provided"}`,
      "",
      message.trim() || "No message provided.",
    ].join("\n");

    window.location.href = `mailto:hello@mevrelbank.com?subject=${encodeURIComponent(composedSubject)}&body=${encodeURIComponent(composedBody)}`;
  };

  return (
    <PageShell
      eyebrow="Contact"
      title="Get in touch with the team behind MevrelBank."
      intro="Whether you are interested in product updates, partnerships, support pathways, or launch readiness, use the page below to reach the right contact channel."
      primaryCta={{ label: "Email hello@mevrelbank.com", href: "mailto:hello@mevrelbank.com" }}
      secondaryCta={{ label: "Read FAQs", href: "/faqs" }}
    >
      <PageSection
        title="Contact form"
        description="Send an enquiry directly from your device. Submitting opens your default email client with your message prefilled."
      >
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[24px] border border-[rgba(11,50,112,0.08)] bg-white p-8 space-y-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="block text-[13px] font-semibold text-[#0D1829] mb-2">Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-[10px] border border-[rgba(11,50,112,0.14)] px-4 py-3 text-[14px] text-[#0D1829] outline-none focus:border-[#0B3270]"
                  placeholder="Your name"
                />
              </label>
              <label className="block">
                <span className="block text-[13px] font-semibold text-[#0D1829] mb-2">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-[10px] border border-[rgba(11,50,112,0.14)] px-4 py-3 text-[14px] text-[#0D1829] outline-none focus:border-[#0B3270]"
                  placeholder="you@example.com"
                />
              </label>
            </div>
            <label className="block">
              <span className="block text-[13px] font-semibold text-[#0D1829] mb-2">Subject</span>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="w-full rounded-[10px] border border-[rgba(11,50,112,0.14)] px-4 py-3 text-[14px] text-[#0D1829] outline-none focus:border-[#0B3270]"
                placeholder="How can we help?"
              />
            </label>
            <label className="block">
              <span className="block text-[13px] font-semibold text-[#0D1829] mb-2">Message</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={7}
                className="w-full rounded-[10px] border border-[rgba(11,50,112,0.14)] px-4 py-3 text-[14px] text-[#0D1829] outline-none focus:border-[#0B3270] resize-vertical"
                placeholder="Tell us more about your enquiry."
              />
            </label>
            <Btn type="submit" size="lg">Prepare email</Btn>
          </form>

          <aside className="rounded-[24px] border border-[rgba(11,50,112,0.08)] bg-[#F6F8FC] p-8">
            <h3 className="text-[20px] font-semibold text-[#0D1829] mb-5">Support channels</h3>
            <ul className="space-y-4 mb-8">
              {SUPPORT_CHANNELS.map(([label, value]) => (
                <li key={label}>
                  <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#4AA2D8] mb-1">{label}</div>
                  <a href={`mailto:${value}`} className="text-[15px] text-[#0B3270] hover:text-[#0E3E8C] transition-colors">
                    {value}
                  </a>
                </li>
              ))}
            </ul>
            <div className="pt-6 border-t border-[rgba(11,50,112,0.08)]">
              <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#4AA2D8] mb-2">Registered address</div>
              <p className="text-[15px] leading-relaxed text-[#5E6E8E]">
                Registered address details will be published here as part of final launch and regulatory readiness.
              </p>
            </div>
          </aside>
        </div>
      </PageSection>
    </PageShell>
  );
}
