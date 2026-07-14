import { useEffect, useState } from "react";

// Global floating WhatsApp contact bubble, bottom-right, shown on every page
// (public site, dashboard, admin). The number is admin-editable — see
// /admin/settings — and fetched from the public, unauthenticated settings
// endpoint so this widget works for signed-out visitors too.

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
      <svg viewBox="0 0 32 32" width="30" height="30" fill="white" aria-hidden="true">
        <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.386.7 4.605 1.912 6.47L4.5 28.5l7.24-1.9A11.94 11.94 0 0 0 16.001 27C22.628 27 28 21.627 28 15S22.628 3 16.001 3Zm0 21.75c-1.98 0-3.83-.55-5.412-1.5l-.388-.23-4.017 1.054 1.073-3.918-.253-.402A9.71 9.71 0 0 1 5.75 15c0-5.66 4.59-10.25 10.251-10.25S26.25 9.34 26.25 15 21.663 24.75 16.001 24.75Zm5.652-7.68c-.31-.155-1.833-.905-2.117-1.008-.284-.104-.492-.155-.699.155-.207.31-.804 1.008-.985 1.215-.181.207-.362.233-.673.078-.31-.155-1.31-.483-2.494-1.54-.922-.822-1.543-1.837-1.724-2.147-.181-.31-.02-.478.16-.633.181-.155.404-.402.606-.604.203-.202.27-.345.404-.575.135-.23.068-.43-.034-.605-.103-.176-.925-2.225-1.267-3.045-.335-.803-.677-.695-.93-.708-.24-.012-.514-.014-.79-.014-.276 0-.72.103-.98.464-.26.362-.994 1.14-.994 2.68 0 1.54.98 3.03 1.117 3.24.135.207 1.865 3.153 4.596 4.42 2.73 1.267 2.73.845 3.222.79.492-.055 1.833-.75 2.093-1.474.26-.723.26-1.34.181-1.475-.078-.135-.284-.207-.594-.362Z" />
      </svg>
    </a>
  );
}
