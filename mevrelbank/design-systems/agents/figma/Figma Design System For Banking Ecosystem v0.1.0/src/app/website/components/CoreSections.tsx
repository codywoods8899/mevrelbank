import { Btn } from "../shared/Btn";

export function CoreSections() {
  return (
    <>
      <section id="personal" className="py-24 bg-white" aria-labelledby="personal-heading">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mb-10">
            <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#1764C0] mb-3">
              Personal Banking
            </div>
            <h2
              id="personal-heading"
              className="text-[34px] font-bold text-[#0D1829] leading-tight mb-4"
              style={{ fontFamily: "Figtree, sans-serif" }}
            >
              Everyday banking that stays simple.
            </h2>
            <p className="text-[16px] text-[#5E6E8E] leading-relaxed">
              Manage daily spending, savings goals, and payments from one clear dashboard designed
              for speed and confidence.
            </p>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-5 list-none p-0 m-0">
            {["Current account", "Savings pots", "Card controls"].map((item) => (
              <li
                key={item}
                className="rounded-[10px] border border-[rgba(11,50,112,0.10)] p-6 text-[14px] text-[#3A4A62] bg-[#F9FBFE]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="business" className="py-24 bg-[#F4F7FB]" aria-labelledby="business-heading">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mb-10">
            <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#1764C0] mb-3">
              Business Banking
            </div>
            <h2
              id="business-heading"
              className="text-[34px] font-bold text-[#0D1829] leading-tight mb-4"
              style={{ fontFamily: "Figtree, sans-serif" }}
            >
              Built to support growing teams.
            </h2>
            <p className="text-[16px] text-[#5E6E8E] leading-relaxed">
              Keep business spending visible with multi-user access, payment controls, and account
              views that help teams move quickly.
            </p>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-5 list-none p-0 m-0">
            {["Team permissions", "Business transfers", "Expense visibility"].map((item) => (
              <li
                key={item}
                className="rounded-[10px] border border-[rgba(11,50,112,0.10)] p-6 text-[14px] text-[#3A4A62] bg-white"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="about" className="py-24 bg-white" aria-labelledby="about-heading">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#1764C0] mb-3">
              About MevrelBank
            </div>
            <h2
              id="about-heading"
              className="text-[34px] font-bold text-[#0D1829] leading-tight mb-4"
              style={{ fontFamily: "Figtree, sans-serif" }}
            >
              Designed for clarity, built with intent.
            </h2>
            <p className="text-[16px] text-[#5E6E8E] leading-relaxed">
              We focus on practical banking tools that reduce friction and help customers stay in
              control of their money every day.
            </p>
          </div>
        </div>
      </section>

      <section id="careers" className="py-24 bg-[#F4F7FB]" aria-labelledby="careers-heading">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#1764C0] mb-3">
              Careers
            </div>
            <h2
              id="careers-heading"
              className="text-[34px] font-bold text-[#0D1829] leading-tight mb-4"
              style={{ fontFamily: "Figtree, sans-serif" }}
            >
              We're building carefully and hiring intentionally.
            </h2>
            <p className="text-[16px] text-[#5E6E8E] leading-relaxed mb-7">
              Interested in future opportunities? Share your profile and we will reach out as
              roles open.
            </p>
            <Btn variant="outline" size="md" href="mailto:careers@mevrelbank.com?subject=Career%20interest">
              Register Career Interest
            </Btn>
          </div>
        </div>
      </section>

      <section id="support" className="py-24 bg-white" aria-labelledby="support-heading">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mb-10">
            <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#1764C0] mb-3">
              Support
            </div>
            <h2
              id="support-heading"
              className="text-[34px] font-bold text-[#0D1829] leading-tight mb-4"
              style={{ fontFamily: "Figtree, sans-serif" }}
            >
              Need help? Contact our team.
            </h2>
            <p className="text-[16px] text-[#5E6E8E] leading-relaxed">
              Use the channels below for account interest, support enquiries, and security
              reporting.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <a
              id="support-contact"
              href="mailto:support@mevrelbank.com?subject=Support%20request"
              className="rounded-[10px] border border-[rgba(11,50,112,0.10)] p-6 text-[14px] text-[#3A4A62] hover:border-[rgba(23,100,192,0.45)] transition-colors"
            >
              Contact support
            </a>
            <a
              id="support-security"
              href="mailto:security@mevrelbank.com?subject=Security%20report"
              className="rounded-[10px] border border-[rgba(11,50,112,0.10)] p-6 text-[14px] text-[#3A4A62] hover:border-[rgba(23,100,192,0.45)] transition-colors"
            >
              Report a security issue
            </a>
            <a
              id="support-status"
              href="mailto:status@mevrelbank.com?subject=Service%20status%20question"
              className="rounded-[10px] border border-[rgba(11,50,112,0.10)] p-6 text-[14px] text-[#3A4A62] hover:border-[rgba(23,100,192,0.45)] transition-colors"
            >
              Ask about service status
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
