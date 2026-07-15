import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

// Global floating WhatsApp contact bubble, shown on every page.
// Icon: /public/icons/whatsapp.svg  (preloaded in index.html <head>)
//
// Entrance animation:
//   Measured from Smartsupp widget-v3 source (assets/main-t6WxLABA.js):
//     fly({ y: 20, delay: 300, duration: 400 })   ← Svelte transition directive
//   Easing: Svelte's default cubicOut (t => --t*t*t+1)
//         ≡ CSS cubic-bezier(0.215, 0.61, 0.355, 1)
//   Opacity: 0 → 1  (Svelte fly always animates opacity)
//   Translation: translateY(20px) → translateY(0)
//
//   We synchronise the trigger with Smartsupp's entrance so both bubbles
//   appear as a coordinated pair (Law of Proximity):
//     • We detect when Smartsupp's element first appears in the DOM via
//       MutationObserver (this coincides with Svelte component mount, T+0).
//     • We wait 300 ms from that moment — matching Smartsupp's internal
//       fly delay — before setting phase → "entering".
//     • The .whatsapp-enter CSS class (animations.css) plays the 400 ms
//       keyframe, running in parallel with Smartsupp's animation.
//     • Fallback: if Smartsupp never loads (e.g. ad-blocker), we enter
//       after ENTRANCE_FALLBACK_MS.
//
// SVG flash prevention:
//   The SVG is preloaded via <link rel="preload"> in index.html AND via
//   new Image() here.  The button stays in phase "hidden" (opacity:0,
//   translateY(20px)) until BOTH the icon is cached AND the Smartsupp
//   timing signal fires, so the user always sees background + icon
//   together during the entrance animation — never a bare green circle.

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

const DEFAULT_SIZE = 56;     // px — Smartsupp standard closed-chat button size
const STACK_GAP = 12;        // px — gap between our bubble and Smartsupp's
const MAX_BUBBLE_SIZE = 160; // px — above this we assume Smartsupp is open/expanded
const EDGE_THRESHOLD = 100;  // px — proximity to viewport corner counts as "corner widget"

function defaultBottom(): number {
  return getSmartsuppOffset().y + DEFAULT_SIZE + STACK_GAP;
}
function defaultRight(): number {
  return getSmartsuppOffset().x;
}

// ─── Entrance animation timing ────────────────────────────────────────────────

// Measured from Smartsupp widget-v3: fly({ y:20, delay:300, duration:400 })
const SS_ENTER_DELAY_MS = 300;    // Smartsupp's Svelte fly delay
const ENTRANCE_FALLBACK_MS = 3000; // max wait before forcing entrance

// ─── Smartsupp bubble detection ───────────────────────────────────────────────

function digitsOnly(value: string) {
  return value.replace(/[^0-9]/g, "");
}

/**
 * Returns the element representing Smartsupp's closed-chat button.
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

  // Collect large Smartsupp containers to walk their children.
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
  // "hidden"   → opacity:0 + translateY(20px); invisible before both conditions met
  // "entering" → .whatsapp-enter CSS animation plays (400 ms, cubicOut, no delay)
  // "visible"  → animation done; hover/active transitions re-enabled
  const [phase, setPhase] = useState<Phase>("hidden");

  const anchorRef = useRef<HTMLAnchorElement | null>(null);

  // Coordination refs — accessed by stable callbacks so no stale-closure risk
  const iconReadyRef    = useRef(false);
  const ssSeenAtRef     = useRef<number | null>(null); // timestamp of first SS detection
  const enterFiredRef   = useRef(false);               // guard: enter triggered at most once

  /**
   * Fire the entrance transition, synchronised with Smartsupp's 300 ms fly delay.
   * Safe to call multiple times — guarded by enterFiredRef.
   */
  const tryEnter = useCallback(() => {
    if (enterFiredRef.current) return;
    if (!iconReadyRef.current) return;
    if (ssSeenAtRef.current === null) return;

    enterFiredRef.current = true;
    const elapsed = Date.now() - ssSeenAtRef.current;
    const wait = Math.max(0, SS_ENTER_DELAY_MS - elapsed);
    setTimeout(() => setPhase((p) => (p === "hidden" ? "entering" : p)), wait);
  }, []); // refs + stable setPhase → no deps needed

  // Preload SVG programmatically — ensures icon is cached before entrance starts.
  // index.html also has <link rel="preload"> for early browser-level fetch.
  useEffect(() => {
    const img = new Image();
    img.onload = img.onerror = () => {
      iconReadyRef.current = true;
      tryEnter();
    };
    img.src = "/icons/whatsapp.svg";
  }, [tryEnter]);

  // Fetch WhatsApp number from API
  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE_URL}/api/settings/public`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.whatsappNumber) setNumber(data.whatsappNumber);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Position tracking + Smartsupp detection + fallback timer
  useEffect(() => {
    if (!number) return;

    // Safety net: if Smartsupp never loads (ad-blocker etc.), enter anyway
    const fallback = setTimeout(() => {
      if (!enterFiredRef.current) {
        enterFiredRef.current = true;
        setPhase((p) => (p === "hidden" ? "entering" : p));
      }
    }, ENTRANCE_FALLBACK_MS);

    function sync() {
      const bubble = findSmartsuppBubble(anchorRef.current);

      if (!bubble) {
        const fb = { right: defaultRight(), bottom: defaultBottom(), size: DEFAULT_SIZE };
        setPos((prev) =>
          prev.right === fb.right && prev.bottom === fb.bottom && prev.size === fb.size
            ? prev : fb
        );
      } else {
        const rect = bubble.getBoundingClientRect();
        const size  = Math.round(Math.max(rect.width, rect.height));
        const right = Math.round(window.innerWidth  - rect.right);
        const bottom = Math.round(window.innerHeight - rect.bottom + size + STACK_GAP);
        setPos((prev) =>
          prev.right === right && prev.bottom === bottom && prev.size === size
            ? prev : { right, bottom, size }
        );

        // First detection — record timestamp and attempt to trigger entrance
        if (ssSeenAtRef.current === null) {
          ssSeenAtRef.current = Date.now();
          tryEnter();
        }
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
      clearTimeout(fallback);
    };
  }, [number, tryEnter]);

  if (!number) return null;

  const href = `https://wa.me/${digitsOnly(number)}`;
  const iconSize = Math.round(pos.size * 0.5);

  // Inline style — position is always set; opacity/transform only while hidden
  // so that once visible the CSS animation (and later hover transforms) apply cleanly.
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
        // Base — always present
        "fixed z-[60] flex items-center justify-center rounded-full bg-[#1FAF54]",
        "shadow-[0_6px_20px_rgba(0,0,0,0.25)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D366]",
        // Entrance animation (keyframe defined in animations.css)
        phase === "entering" && "whatsapp-enter",
        // Hover/active only re-enabled after animation so transform doesn't conflict
        phase === "visible" && "hover:scale-105 active:scale-95 transition-transform",
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
