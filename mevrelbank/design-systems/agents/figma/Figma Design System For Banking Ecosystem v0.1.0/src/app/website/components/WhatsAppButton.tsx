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
//
// Smartsupp v5 renders its closed-chat button inside a full-screen transparent
// overlay iframe (position:fixed; inset:0). We cannot read inside the cross-origin
// iframe, so we also walk the direct children of any Smartsupp-tagged containers
// to find a small positioned child (their button div, if same-origin), and we
// read window._smartsupp for any configured offset values.

const BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

// Smartsupp's default offset is 20 px from both edges on all screen sizes
// unless the _smartsupp.offsetX / _smartsupp.offsetY globals are set.
function getSmartsuppOffset(): { x: number; y: number } {
  try {
    const ss = (window as unknown as Record<string, unknown>)._smartsupp as
      | { offsetX?: number; offsetY?: number }
      | undefined;
    return {
      x: typeof ss?.offsetX === "number" ? ss.offsetX : 20,
      y: typeof ss?.offsetY === "number" ? ss.offsetY : 20,
    };
  } catch {
    return { x: 20, y: 20 };
  }
}

const DEFAULT_SIZE = 56;   // px — matches Smartsupp's standard closed-chat button
const STACK_GAP = 12;      // px gap between the two bubbles (all paths use this)
const MAX_BUBBLE_SIZE = 160; // ignore elements once Smartsupp expands into an open window
const EDGE_THRESHOLD = 100;  // px — how close to the viewport edge counts as "corner"

// Derived fallback: Smartsupp's configured bottom margin + button height + our gap.
// Uses getSmartsuppOffset().y at call-time so it respects any runtime config.
function defaultBottom(): number {
  return getSmartsuppOffset().y + DEFAULT_SIZE + STACK_GAP;
}
function defaultRight(): number {
  return getSmartsuppOffset().x;
}

function digitsOnly(value: string) {
  return value.replace(/[^0-9]/g, "");
}

/**
 * Returns a small element representing Smartsupp's closed-chat button.
 *
 * Strategy:
 *  1. Collect all elements that match Smartsupp selectors (including iframes).
 *  2. For every Smartsupp-tagged container that is too large to be the button,
 *     also walk its direct children — this handles the full-screen overlay case
 *     where the actual button div sits inside a transparent cover layer.
 *  3. Among all candidates, return the one nearest to the viewport corner
 *     that is small enough to be a closed-chat button.
 */
function findSmartsuppBubble(ownEl: HTMLElement | null): HTMLElement | null {
  const selectors = [
    "#smartsupp-widget-container",
    "[id*='smartsupp' i]",
    "[class*='smartsupp' i]",
    "iframe[title*='chat' i]",
    "iframe[src*='smartsuppchat' i]",
  ];

  const candidates = new Set<HTMLElement>();
  const containers = new Set<HTMLElement>();

  for (const selector of selectors) {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) =>
      candidates.add(el)
    );
  }
  // Fallback: any element appended directly to <body> near the bottom-right corner.
  document
    .querySelectorAll<HTMLElement>("body > div, body > iframe")
    .forEach((el) => candidates.add(el));

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  function isQualified(el: HTMLElement): boolean {
    if (!el || el === ownEl || (ownEl && ownEl.contains(el))) return false;
    const s = window.getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    if (rect.width > MAX_BUBBLE_SIZE || rect.height > MAX_BUBBLE_SIZE) return false;
    const nearRight = viewportW - rect.right < EDGE_THRESHOLD;
    const nearBottom = viewportH - rect.bottom < EDGE_THRESHOLD;
    return nearRight && nearBottom;
  }

  // Collect large Smartsupp containers so we can walk their children.
  for (const el of candidates) {
    if (!el || el === ownEl || (ownEl && ownEl.contains(el))) continue;
    const s = window.getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") continue;
    const rect = el.getBoundingClientRect();
    if (rect.width > MAX_BUBBLE_SIZE || rect.height > MAX_BUBBLE_SIZE) {
      containers.add(el);
    }
  }

  // Walk direct children of any large Smartsupp containers.
  for (const container of containers) {
    Array.from(container.children).forEach((child) => {
      if (child instanceof HTMLElement) candidates.add(child);
    });
  }

  let best: HTMLElement | null = null;
  let bestArea = Infinity;

  for (const el of candidates) {
    if (isQualified(el)) {
      const rect = el.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area < bestArea) {
        best = el;
        bestArea = area;
      }
    }
  }

  return best;
}

export function WhatsAppButton() {
  const [number, setNumber] = useState<string | null>(null);
  const [style, setStyle] = useState<{ right: number; bottom: number; size: number }>({
    right: defaultRight(),
    bottom: defaultBottom(),
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

      if (!bubble) {
        // Keep our position in sync with Smartsupp's configured offset even
        // when we cannot find the actual element (e.g. cross-origin iframe).
        const fb = { right: defaultRight(), bottom: defaultBottom(), size: DEFAULT_SIZE };
        setStyle((prev) =>
          prev.right === fb.right && prev.bottom === fb.bottom && prev.size === fb.size
            ? prev
            : fb
        );
        return;
      }

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
