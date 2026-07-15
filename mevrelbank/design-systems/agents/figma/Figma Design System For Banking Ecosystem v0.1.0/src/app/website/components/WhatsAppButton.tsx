import { useEffect, useRef, useState } from "react";

// Global floating WhatsApp contact bubble, shown on every page.
// Icon: /public/icons/whatsapp.svg (free SVG, stored in the repo under public/icons/)
//
// Smartsupp injects its own closed-chat bubble as a third-party widget with no
// fixed selector/size contract, and its markup can change without notice. Rather
// than hardcoding an offset that can drift out of alignment, we measure the
// live Smartsupp bubble in the DOM at runtime and mirror its size + right/bottom
// position (stacked just above it), falling back to a sane default position
// when Smartsupp hasn't loaded (or isn't present) yet.

const BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

const DEFAULT_SIZE = 56; // px, matches the previous fixed w-14/h-14 button
const DEFAULT_RIGHT = 20;
const DEFAULT_BOTTOM = 96; // stacked above Smartsupp's own default ~20px+56px slot
const STACK_GAP = 12; // px gap between the WhatsApp bubble and the Smartsupp bubble
const MAX_BUBBLE_SIZE = 110; // ignore matches once Smartsupp expands into an open chat window

function digitsOnly(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function findSmartsuppBubble(ownEl: HTMLElement | null): HTMLElement | null {
  const selectors = [
    "#smartsupp-widget-container",
    "[id*='smartsupp' i]",
    "[class*='smartsupp' i]",
    "iframe[title*='chat' i]",
    "iframe[src*='smartsuppchat' i]",
  ];
  const candidates = new Set<HTMLElement>();
  for (const selector of selectors) {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => candidates.add(el));
  }
  // Fallback: any element Smartsupp's loader appended directly to <body>, sitting
  // near the bottom-right corner, that isn't our own button.
  document.querySelectorAll<HTMLElement>("body > div, body > iframe").forEach((el) => candidates.add(el));

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  let best: HTMLElement | null = null;
  let bestArea = Infinity;

  for (const el of candidates) {
    if (!el || el === ownEl || (ownEl && ownEl.contains(el))) continue;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    if (rect.width > MAX_BUBBLE_SIZE || rect.height > MAX_BUBBLE_SIZE) continue; // skip an opened chat window
    const nearRightEdge = viewportW - rect.right < 60;
    const nearBottomEdge = viewportH - rect.bottom < 60;
    if (!nearRightEdge || !nearBottomEdge) continue;
    const area = rect.width * rect.height;
    if (area < bestArea) {
      best = el;
      bestArea = area;
    }
  }
  return best;
}

export function WhatsAppButton() {
  const [number, setNumber] = useState<string | null>(null);
  const [style, setStyle] = useState<{ right: number; bottom: number; size: number }>({
    right: DEFAULT_RIGHT,
    bottom: DEFAULT_BOTTOM,
    size: DEFAULT_SIZE,
  });
  const anchorRef = useRef<HTMLAnchorElement | null>(null);

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

  useEffect(() => {
    if (!number) return;

    function sync() {
      const bubble = findSmartsuppBubble(anchorRef.current);
      if (!bubble) return;
      const rect = bubble.getBoundingClientRect();
      const size = Math.round(Math.max(rect.width, rect.height));
      const right = Math.round(window.innerWidth - rect.right);
      const bottom = Math.round(window.innerHeight - rect.bottom + size + STACK_GAP);
      setStyle((prev) =>
        prev.right === right && prev.bottom === bottom && prev.size === size
          ? prev
          : { right, bottom, size }
      );
    }

    sync();
    const interval = window.setInterval(sync, 1000);
    window.addEventListener("resize", sync);

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("resize", sync);
      observer.disconnect();
    };
  }, [number]);

  if (!number) return null;

  const href = `https://wa.me/${digitsOnly(number)}`;
  const iconSize = Math.round(style.size * 0.5);

  return (
    <a
      ref={anchorRef}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      style={{ right: style.right, bottom: style.bottom, width: style.size, height: style.size }}
      className="fixed z-[60] flex items-center justify-center rounded-full bg-[#1FAF54] shadow-[0_6px_20px_rgba(0,0,0,0.25)] hover:scale-105 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D366]"
    >
      <img
        src="/icons/whatsapp.svg"
        alt=""
        aria-hidden="true"
        style={{ width: iconSize, height: iconSize }}
        className="brightness-0 invert"
      />
    </a>
  );
}
