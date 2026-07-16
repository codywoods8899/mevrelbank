import { Logo } from "../shared/Logo";

const FOOTER_COLS = [
  {
    title: "Products",
    links: [
      { label: "Personal Account", href: "/products#personal" },
      { label: "Savings", href: "/products#savings" },
      { label: "Business", href: "/products#business" },
      { label: "Payments", href: "/products#payments" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "mailto:press@mevrelbank.com?subject=Press%20enquiry" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/security-center" },
      { label: "Cookie Policy", href: "/security-center" },
      { label: "Terms", href: "/security-center" },
      { label: "Accessibility", href: "/contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Centre", href: "/faqs" },
      { label: "Contact Us", href: "/contact" },
      { label: "Security", href: "/security-center" },
      { label: "Status", href: "/about" },
    ],
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0D1829] py-14" role="contentinfo">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap gap-10 justify-between mb-10">
          <div className="max-w-[280px]">
            <Logo variant="dark" heightClass="h-7" className="mb-5" />
            <p id="legal-notice" className="text-[12px] text-[rgba(255,255,255,0.32)] leading-relaxed">
              MevrelBank is a digital banking platform in development. Product
              availability, regulatory status, and customer protections depend
              on final launch structure and applicable jurisdiction.
            </p>
          </div>

          <nav className="flex flex-wrap gap-10" aria-label="Footer navigation">
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[rgba(255,255,255,0.26)] mb-3">
                  {col.title}
                </div>
                <ul className="space-y-2.5 list-none p-0 m-0">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="block text-[12px] text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.80)] transition-colors focus:outline-none focus-visible:underline"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

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
