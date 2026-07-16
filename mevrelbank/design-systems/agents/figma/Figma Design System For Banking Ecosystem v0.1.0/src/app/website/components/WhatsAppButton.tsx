import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { widgetCoordinator, CLONE_ID } from "../../../lib/widgetCoordinator";

// Global floating WhatsApp contact bubble, shown on every page.
// Icon: /public/icons/whatsapp.svg  (preloaded in index.html <head>)
//
// ─── Coordinated reveal (v2 — observe-only) ───────────────────────────────────
//
// widgetCoordinator:
//   1. Registers smartsupp('on', 'ready') via the official queue function.
//   2. Once Smartsupp fires ready, finds the rendered floating button in DOM
//      and waits for its visual state to settle (opacity stable at 1, position/
//      size stable for ≥6 × 80 ms frames — never touching the element itself).
//   3. Captures its appearance (rect, computed styles, icon clone attempt).
//   4. Polls for WhatsApp readiness (immediately, then every 1 500 ms).
//   5. Builds a runtime clone (#mevrel-ss-clone) matching the real button.
//   6. Animates clone + WhatsApp together — same keyframe, same JS tick.
//
// WhatsApp signals readiness once BOTH:
//   • The SVG icon is cached (no bare-circle flash), AND
//   • The phone number has been fetched (needed to render the <a> at all).
//
// Position tracking:
//   Prefers the clone element (#mevrel-ss-clone) if it exists — this is the
//   coordinator's presentation layer sitting where Smartsupp's button is.
//   Falls back to scanning for the real Smartsupp button directly.
//   WhatsApp is always stacked directly above whichever element is found.
//
// Fallbacks (nothing hidden forever):
//   • Smartsupp settles, WhatsApp slow  → 2 000 ms then reveal
//   • WhatsApp ready, Smartsupp blocked → 6 000 ms then reveal alone
//
// z-index:
//   The clone sits at the real Smartsupp's z-index (≥ 9 999).
//   WhatsApp uses z-index 10 001 (inline) so it always floats above the clone.

const BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

// ─── Smartsupp offset helpers ─────────────────────────────────────────────────
// Used for WhatsApp default positioning when no Smartsupp/clone element is found.

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

const DEFAULT_SIZE    = 56;   // px — standard Smartsupp closed-chat button size
const STACK_GAP       = 12;   // px — vertical gap between our bubble and the reference button
const MAX_BUBBLE_SIZE = 160;  // px — above this the element is an expanded chat, not the button
const EDGE_THRESHOLD  = 120;  // px — must be this close to a viewport corner

function defaultBottom(): number {
  return getSmartsuppOffset().y + DEFAULT_SIZE + STACK_GAP;
}
function defaultRight(): number {
  return getSmartsuppOffset().x;
}

// ─── Reference button detection (position tracking only) ─────────────────────
// We stack WhatsApp above the coordinator's clone if it exists,
// otherwise we locate the real Smartsupp button for positioning.
// This function NEVER mutates any element — read-only observation only.

function digitsOnly(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function isQualifiedRef(el: HTMLElement, ownEl: HTMLElement | null): boolean {
  if (!el || el === ownEl || (ownEl && ownEl.contains(el))) return false;
  const s = window.getComputedStyle(el);
  if (s.display === "none" || s.visibility === "hidden") return false;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  if (rect.width > MAX_BUBBLE_SIZE || rect.height > MAX_BUBBLE_SIZE) return false;
  const vw = window.innerWidth, vh = window.innerHeight;
  return vw - rect.right < EDGE_THRESHOLD && vh - rect.bottom < EDGE_THRESHOLD;
}

/**
 * Returns the element to position WhatsApp above.
 * Priority:
 *   1. The coordinator's runtime clone (#mevrel-ss-clone) — once it exists,
 *      use it as the reference so WhatsApp stacks above the presentation layer.
 *   2. The real Smartsupp button — scanned from DOM when clone doesn't exist yet.
 */
function findReferenceButton(ownEl: HTMLElement | null): HTMLElement | null {
  // 1. Prefer the coordinator clone
  const clone = document.getElementById(CLONE_ID);
  if (clone && isQualifiedRef(clone, ownEl)) return clone;

  // 2. Fall back: locate real Smartsupp button
  const selectors = [
    "#smartsupp-widget-container",
    "[id*='smartsupp' i]",
    "[class*='smartsupp' i]",
    "iframe[title*='chat' i]",
    "iframe[src*='smartsuppchat' i]",
  ];

  const candidates = new Set<HTMLElement>();
  const containers  = new Set<HTMLElement>();

  for (const selector of selectors) {
    document.querySelectorAll<HTMLElement>(selector).forEach(el => candidates.add(el));
  }
  document
    .querySelectorAll<HTMLElement>("body > div, body > iframe")
    .forEach(el => candidates.add(el));

  for (const el of candidates) {
    if (!el || el === ownEl || (ownEl && ownEl.contains(el))) continue;
    const r = el.getBoundingClientRect();
    if (r.width > MAX_BUBBLE_SIZE || r.height > MAX_BUBBLE_SIZE) containers.add(el);
  }
  for (const container of containers) {
    Array.from(container.children).forEach(child => {
      if (child instanceof HTMLElement) candidates.add(child);
    });
  }

  let best: HTMLElement | null = null;
  let bestArea = Infinity;
  for (const el of candidates) {
    if (isQualifiedRef(el, ownEl)) {
      const r    = el.getBoundingClientRect();
      const area = r.width * r.height;
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
    right:  defaultRight(),
    bottom: defaultBottom(),
    size:   DEFAULT_SIZE,
  });
  // "hidden"   → opacity:0 + translateY(20px); stays until coordinator fires
  // "entering" → .whatsapp-enter CSS animation plays (400 ms, cubicOut)
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
    setPhase(p => p === "hidden" ? "entering" : p);
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
      .then(res => res.ok ? res.json() : null)
      .then(data => {
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
  // Polls for the reference button (clone first, real button fallback) to keep
  // the WhatsApp bubble stacked directly above it.
  // Purely for layout — entrance timing is owned by the coordinator.
  useEffect(() => {
    if (!number) return;

    function sync() {
      const ref = findReferenceButton(anchorRef.current);

      if (!ref) {
        const fb = { right: defaultRight(), bottom: defaultBottom(), size: DEFAULT_SIZE };
        setPos(prev =>
          prev.right === fb.right && prev.bottom === fb.bottom && prev.size === fb.size
            ? prev : fb
        );
      } else {
        const rect   = ref.getBoundingClientRect();
        const size   = Math.round(Math.max(rect.width, rect.height));
        const right  = Math.round(window.innerWidth  - rect.right);
        const bottom = Math.round(window.innerHeight - rect.bottom + size + STACK_GAP);
        setPos(prev =>
          prev.right === right && prev.bottom === bottom && prev.size === size
            ? prev : { right, bottom, size }
        );
      }
    }

    sync();
    const interval = window.setInterval(sync, 1_000);
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
    right:   pos.right,
    bottom:  pos.bottom,
    width:   pos.size,
    height:  pos.size,
    // z-index: always above the clone (which sits at ≥ 9 999)
    zIndex:  10_001,
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
      onAnimationEnd={() => setPhase(p => p === "entering" ? "visible" : p)}
      className={[
        "fixed flex items-center justify-center rounded-full bg-[#1FAF54]",
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
