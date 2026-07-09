import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "../shared/Logo";
import { Btn } from "../shared/Btn";

const NAV_LINKS = [
  { label: "Personal", href: "/products#personal" },
  { label: "Business", href: "/products#business" },
  { label: "About", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "Support", href: "/contact" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[rgba(11,50,112,0.08)] shadow-[0_1px_0_rgba(11,50,112,0.04)]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <a href="/" aria-label="MevrelBank home">
          <Logo heightClass="h-8" />
        </a>

        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-[13px] text-[#5E6E8E] hover:text-[#0B3270] font-medium transition-colors focus:outline-none focus-visible:underline"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2.5">
          <Btn variant="ghost" size="sm" href="/contact">
            Contact
          </Btn>
          <Btn variant="primary" size="sm" href="mailto:hello@mevrelbank.com?subject=Open%20account%20interest">
            Open Account
          </Btn>
        </div>

        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-[6px] text-[#5E6E8E] hover:bg-[#F4F7FB] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B3270]"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[rgba(11,50,112,0.07)] bg-white px-6 pb-5 pt-3">
          <nav className="flex flex-col gap-1 mb-4" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="py-2.5 text-[14px] text-[#3A4A62] font-medium hover:text-[#0B3270] transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2">
            <Btn variant="outline" size="md" href="/contact" className="w-full justify-center">
              Contact
            </Btn>
            <Btn variant="primary" size="md" href="mailto:hello@mevrelbank.com?subject=Open%20account%20interest" className="w-full justify-center">
              Open Account
            </Btn>
          </div>
        </div>
      )}
    </header>
  );
}
