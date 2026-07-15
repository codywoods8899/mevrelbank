import { useEffect, useState } from "react";

// Global floating WhatsApp contact bubble, bottom-right, shown on every page.
// Icon: /public/icons/whatsapp.svg (free SVG, stored in the repo under public/icons/)

const BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function digitsOnly(value: string) {
  return value.replace(/[^0-9]/g, "");
}

export function WhatsAppButton() {
  const [number, setNumber] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE_URL}/api/settings/public`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.whatsappNumber) setNumber(data.whatsappNumber);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!number) return null;

  const href = `https://wa.me/${digitsOnly(number)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-24 right-5 z-[60] flex items-center gap-3 rounded-full bg-[#25D366] pl-5 pr-1.5 h-14 shadow-[0_6px_20px_rgba(0,0,0,0.25)] hover:scale-105 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D366]"
    >
      <span className="text-white font-semibold text-sm whitespace-nowrap">WhatsApp</span>
      <span className="flex items-center justify-center w-11 h-11 rounded-full bg-white shrink-0">
        <img src="/icons/whatsapp.svg" alt="" aria-hidden="true" className="w-6 h-6" />
      </span>
    </a>
  );
}
