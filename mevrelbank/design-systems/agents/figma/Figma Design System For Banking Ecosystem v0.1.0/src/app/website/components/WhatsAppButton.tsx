import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { widgetCoordinator } from "../../../lib/widgetCoordinator";

// Global floating WhatsApp contact bubble, shown on every page.
// Icon: /public/icons/whatsapp.svg  (preloaded in index.html <head>)
//
// Coordinated reveal:
//   widgetCoordinator listens for smartsupp('on', 'ready', ...) — the official
//   signal that Smartsupp has finished loading all its assets.  At that moment
//   it "seizes" the widget (Smartsupp is held invisible by hold CSS injected at
//   module-eval time) and checks whether WhatsApp is also ready.
//
//   WhatsApp is considered ready once BOTH:
//     • the SVG icon is cached (no bare-circle flash), AND
//     • the phone number has been fetched (needed to render the <a> at all).
//
//   When both sides are ready the coordinator fires reveal():
//     • hold CSS is removed
//     • the same whatsapp-enter keyframe is applied to the Smartsupp container
//     • onReveal callbacks fire for WhatsApp
//   Both animations start in the same JS tick — identical visual timing.
//
//   Fallbacks ensure nothing stays hidden forever:
//     • Smartsupp ready but WhatsApp slow  → 2 s then reveal
//     • WhatsApp ready but Smartsupp blocked → 6 s then reveal
//
// SVG flash prevention:
//   The SVG is preloaded via <link rel="preload"> in index.html AND via
//   new Image() here.  The button stays phase "hidden" (opacity:0,
//   translateY(20px)) until the coordinator fires, so the user always
//   sees background + icon together — never a bare green circle.

const BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

// ─── Smartsupp offset helpers ─────────────────────────────────────────────────

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

// ─── Layout constants ─────────────────────────────────────────────────────────

const DEFAULT_SIZE    = 56;  // px — Smartsupp standard closed-chat button size
const STACK_GAP       = 12;  // px — gap between our bubble and Smartsupp's
const MAX_BUBBLE_SIZE = 160; // px — above this assume Smartsupp is open/expanded
const EDGE_THRESHOLD  = 100; // px — proximity to viewport corner = "corner widget"

function defaultBottom(): number {
  return getSmartsuppOffset().y + DEFAULT_SIZE + STACK_GAP;
}
function defaultRight(): number {
  return getSmartsuppOffset().x;
}

// ─── Smartsupp bubble detection (position tracking only) ─────────────────────

function digitsOnly(value: string) {
  return value.replace(/[^0-9]/g, "");
}

/**
 * Returns the element representing Smartsupp's closed-chat button.
 * Used only for position tracking after reveal — not for entrance timing.
 *
 * Smartsupp v5 renders inside a full-screen transparent iframe overlay,
 * so we also walk direct children of any large Smartsupp-tagged container
 * to find the actual button div sitting inside the overlay.
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
  document
    .querySelectorAll<HTMLElement>("body > div, body > iframe")
    .forEach((el) => candidates.add(el));

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  function isQualified(el: HTMLElement): boolean {
    if (!el || el === ownEl || (ownEl && ownEl.contains(el))) return false;
    const s = window.getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    if (rect.width > MAX_BUBBLE_SIZE || rect.height > MAX_BUBBLE_SIZE) return false;
    return vw - rect.right < EDGE_THRESHOLD && vh - rect.bottom < EDGE_THRESHOLD;
  }

  for (const el of candidates) {
    if (!el || el === ownEl || (ownEl && ownEl.contains(el))) continue;
    const s = window.getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") continue;
    const rect = el.getBoundingClientRect();
    if (rect.width > MAX_BUBBLE_SIZE || rect.height > MAX_BUBBLE_SIZE) {
      containers.add(el);
    }
  }

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
      if (area < bestArea) { best = el; bestArea = area; }
    }
  }

  return best;
}

// ─── Component ────────────────────────────────────────────────────────────────

type Phase = "hidden" | "entering" | "visible";

export function WhatsAppButton() {
  const [number, setNumber] = useState<string | null>(null);
  const [pos, setPos] = useState<{ right: number; bottom: number; size: number }>({
    right: defaultRight(),
    bottom: defaultBottom(),
    size: DEFAULT_SIZE,
  });
  // "hidden"   → opacity:0 + translateY(20px); stays here until coordinator fires
  // "entering" → .whatsapp-enter CSS animation plays (400 ms, cubicOut, no delay)
  // "visible"  → animation done; hover/active transitions re-enabled
  const [phase, setPhase] = useState<Phase>("hidden");

  const anchorRef = useRef<HTMLAnchorElement | null>(null);

  // Both must be true before we signal the coordinator.
  const iconReadyRef   = useRef(false);
  const numberReadyRef = useRef(false);
  // Guard: entrance fires at most once.
  const enterFiredRef  = useRef(false);

  // Triggered by coordinator when both widgets are ready (or fallback fires).
  const triggerEntrance = useCallback(() => {
    if (enterFiredRef.current) return;
    enterFiredRef.current = true;
    setPhase((p) => (p === "hidden" ? "entering" : p));
  }, []);

  // Subscribe to coordinator reveal once on mount.
  useEffect(() => {
    widgetCoordinator.onReveal(triggerEntrance);
  }, [triggerEntrance]);

  // Signal coordinator once BOTH icon and phone number are ready.
  const trySignalWhatsapp = useCallback(() => {
    if (iconReadyRef.current && numberReadyRef.current) {
      widgetCoordinator.signalWhatsapp();
    }
  }, []);

  // Preload SVG — keeps icon cached so background + icon animate in together.
  useEffect(() => {
    const img = new Image();
    img.onload = img.onerror = () => {
      iconReadyRef.current = true;
      trySignalWhatsapp();
    };
    img.src = "/icons/whatsapp.svg";
  }, [trySignalWhatsapp]);

  // Fetch WhatsApp number from API.
  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE_URL}/api/settings/public`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.whatsappNumber) {
          setNumber(data.whatsappNumber);
          numberReadyRef.current = true;
          trySignalWhatsapp();
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [trySignalWhatsapp]);

  // Position tracking — runs after number is available.
  // Polls for Smartsupp's bubble to keep the WhatsApp button stacked above it.
  // This is purely for layout; entrance timing is owned by the coordinator.
  useEffect(() => {
    if (!number) return;

    function sync() {
      const bubble = findSmartsuppBubble(anchorRef.current);

      if (!bubble) {
        const fb = { right: defaultRight(), bottom: defaultBottom(), size: DEFAULT_SIZE };
        setPos((prev) =>
          prev.right === fb.right && prev.bottom === fb.bottom && prev.size === fb.size
            ? prev : fb
        );
      } else {
        const rect   = bubble.getBoundingClientRect();
        const size   = Math.round(Math.max(rect.width, rect.height));
        const right  = Math.round(window.innerWidth  - rect.right);
        const bottom = Math.round(window.innerHeight - rect.bottom + size + STACK_GAP);
        setPos((prev) =>
          prev.right === right && prev.bottom === bottom && prev.size === size
            ? prev : { right, bottom, size }
        );
      }
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

  const href     = `https://wa.me/${digitsOnly(number)}`;
  const iconSize = Math.round(pos.size * 0.5);

  const inlineStyle: CSSProperties = {
    right:  pos.right,
    bottom: pos.bottom,
    width:  pos.size,
    height: pos.size,
    ...(phase === "hidden" ? { opacity: 0, transform: "translateY(20px)" } : {}),
  };

  return (
    <a
      ref={anchorRef}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      style={inlineStyle}
      onAnimationEnd={() => setPhase((p) => (p === "entering" ? "visible" : p))}
      className={[
        "fixed z-[60] flex items-center justify-center rounded-full bg-[#1FAF54]",
        "shadow-[0_6px_20px_rgba(0,0,0,0.25)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D366]",
        phase === "entering" && "whatsapp-enter",
        phase === "visible"  && "hover:scale-105 active:scale-95 transition-transform",
      ].filter(Boolean).join(" ")}
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
