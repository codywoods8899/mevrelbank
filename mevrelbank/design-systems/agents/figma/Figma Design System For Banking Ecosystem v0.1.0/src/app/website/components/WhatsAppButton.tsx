import { useEffect, useState } from "react";

// Global floating WhatsApp contact bubble, bottom-right, shown on every page.
// The green circle is intentionally left icon-free — a custom PNG icon will be
// placed inside once sourced. Just add an <img> tag as the sole child here.

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
      className="fixed bottom-24 right-5 z-[60] w-14 h-14 rounded-full bg-[#25D366] shadow-[0_6px_20px_rgba(0,0,0,0.25)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D366]"
    >
      {/* WhatsApp icon PNG goes here — drop an <img src="/brand/whatsapp-icon.png" ... /> */}
    </a>
  );
}
