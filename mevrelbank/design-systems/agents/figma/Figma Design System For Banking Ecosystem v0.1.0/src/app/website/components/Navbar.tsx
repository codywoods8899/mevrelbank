import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "../shared/Logo";
import { Btn } from "../shared/Btn";
import { useAuth } from "../../context/AuthContext";

const NAV_LINKS = [
  { label: "Personal", href: "/products#personal" },
  { label: "Business", href: "/products#business" },
  { label: "About",    href: "/about" },
  { label: "Careers",  href: "/careers" },
  { label: "Support",  href: "/contact" },
];

export function Navbar() {
  const { isAuthenticated, isRestoringSession, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [pathname, setPathname]     = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/"
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keep pathname in sync with client-side navigation
  useEffect(() => {
    const onNav = () => {
      setPathname(window.location.pathname);
      setMobileOpen(false);
    };
    window.addEventListener("popstate", onNav);
    return () => window.removeEventListener("popstate", onNav);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.split("#")[0]);

  return (
    <header
      className={`sticky top-0 z-40 bg-white border-b border-[rgba(11,50,112,0.08)] transition-all duration-300 ${
        scrolled
          ? "shadow-[0_4px_24px_rgba(11,50,112,0.10)] backdrop-blur-sm"
          : "shadow-[0_1px_0_rgba(11,50,112,0.04)]"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        <a href="/" aria-label="MevrelBank home" className="flex-shrink-0">
          <Logo heightClass="h-10" />
        </a>

        <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className={`relative text-[13px] font-medium transition-colors focus:outline-none focus-visible:underline pb-0.5
                ${isActive(href)
                  ? "text-[#0B3270]"
                  : "text-[#5E6E8E] hover:text-[#0B3270]"
                }`}
            >
              {label}
              {isActive(href) && (
                <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full bg-[#1764C0]" />
              )}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2.5">
          {isRestoringSession ? null : isAuthenticated ? (
            <>
              <Btn variant="ghost" size="sm" onClick={() => logout()}>
                Log out
              </Btn>
              <Btn variant="primary" size="sm" href="/dashboard">
                Dashboard
              </Btn>
            </>
          ) : (
            <>
              <Btn variant="ghost" size="sm" href="/login">
                Sign in
              </Btn>
              <Btn variant="primary" size="sm" href="/register">
                Open Account
              </Btn>
            </>
          )}
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

      {/* Mobile dropdown */}
      <div
        className={`md:hidden border-t border-[rgba(11,50,112,0.07)] bg-white overflow-hidden transition-all duration-300 ${
          mobileOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-5 pt-3">
          <nav className="flex flex-col gap-0.5 mb-4" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className={`py-2.5 px-3 rounded-[6px] text-[14px] font-medium transition-colors ${
                  isActive(href)
                    ? "text-[#0B3270] bg-[#EBF0FA]"
                    : "text-[#3A4A62] hover:text-[#0B3270] hover:bg-[#F4F7FB]"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2">
            {isRestoringSession ? null : isAuthenticated ? (
              <>
                <Btn variant="primary" size="md" href="/dashboard" className="w-full justify-center">
                  Dashboard
                </Btn>
                <Btn variant="outline" size="md" onClick={() => logout()} className="w-full justify-center">
                  Log out
                </Btn>
              </>
            ) : (
              <>
                <Btn variant="primary" size="md" href="/register" className="w-full justify-center">
                  Open Account
                </Btn>
                <Btn variant="outline" size="md" href="/login" className="w-full justify-center">
                  Sign in
                </Btn>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
