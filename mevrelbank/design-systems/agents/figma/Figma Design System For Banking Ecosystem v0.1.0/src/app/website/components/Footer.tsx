import { Logo } from "../shared/Logo";

const FOOTER_COLS = [
  {
    title: "Products",
    links: ["Personal Account", "Savings", "Business", "International"],
  },
  {
    title: "Company",
    links: ["About Us", "Careers", "Press", "Blog"],
  },
  {
    title: "Legal",
    links: ["Privacy Policy", "Cookie Policy", "Terms", "Accessibility"],
  },
  {
    title: "Support",
    links: ["Help Centre", "Contact Us", "Security", "Status"],
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0D1829] py-14" role="contentinfo">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-wrap gap-10 justify-between mb-10">
          {/* Brand column */}
          <div className="max-w-[280px]">
            <Logo variant="dark" heightClass="h-7" className="mb-5" />
            <p className="text-[12px] text-[rgba(255,255,255,0.32)] leading-relaxed">
              MevrelBank is a digital banking platform. Banking services are
              subject to regulatory authorisation. All deposits held in your
              MevrelBank account are eligible for protection under applicable
              financial services compensation schemes.
            </p>
          </div>

          {/* Link columns */}
          <nav
            className="flex flex-wrap gap-10"
            aria-label="Footer navigation"
          >
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[rgba(255,255,255,0.26)] mb-3">
                  {col.title}
                </div>
                <ul className="space-y-2.5 list-none p-0 m-0">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="block text-[12px] text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.80)] transition-colors focus:outline-none focus-visible:underline"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom row */}
        <div className="border-t border-[rgba(255,255,255,0.07)] pt-6 flex flex-wrap gap-4 justify-between items-center">
          <p className="text-[11px] text-[rgba(255,255,255,0.22)]">
            © {currentYear} MevrelBank. All rights reserved.
          </p>
          <p className="text-[11px] text-[rgba(255,255,255,0.18)]">
            Built with purpose. Designed for life.
          </p>
        </div>
      </div>
    </footer>
  );
}
