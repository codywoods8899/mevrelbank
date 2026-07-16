/**
 * widgetCoordinator — v2
 *
 * Observe-only approach: never modifies Smartsupp DOM, classes, animations,
 * or styles. Never injects CSS targeting Smartsupp elements. Never relies on
 * generated or internal Smartsupp IDs.
 *
 * ─── Pipeline ────────────────────────────────────────────────────────────────
 *
 *   Smartsupp API ready  (smartsupp 'on' 'ready')
 *   ↓ 300 ms DOM-mount settle
 *   Locate the rendered floating button
 *   ↓
 *   Wait until visual state has settled
 *   (position, size, opacity stable — 6 × 80 ms frames, max 3 000 ms)
 *   ↓
 *   Capture final appearance
 *   (rect, computed styles, icon clone attempt)
 *   ↓
 *   Poll for WhatsApp readiness
 *   (check immediately, then every 1 500 ms — fired by signalWhatsapp())
 *   ↓
 *   Build runtime clone  (#mevrel-ss-clone)
 *   ↓
 *   Animate clone + WhatsApp together (same keyframe, same JS tick)
 *
 * ─── Clone lifecycle ─────────────────────────────────────────────────────────
 *
 *   Clone click
 *   → smartsupp('chat', 'open')  — official API, no DOM mutation
 *   → Observe real widget for opened state (size/panel detection)
 *   → Fade out clone only after real widget has visibly opened
 *     (hard fallback: remove after 3 000 ms regardless)
 *
 * ─── Fallbacks (nothing stays hidden forever) ────────────────────────────────
 *
 *   • Smartsupp settles but WhatsApp slow  → 2 000 ms then reveal
 *   • WhatsApp ready but Smartsupp blocked → 6 000 ms then reveal (no clone)
 */

// ─── Animation constants — must match animations.css .whatsapp-enter exactly ─

const ANIM_DURATION_MS = 400;
const ANIM_EASING      = 'cubic-bezier(0.215, 0.61, 0.355, 1)';

// ─── Clone element ID (exported so WhatsAppButton can prefer it for tracking) ─

export const CLONE_ID = 'mevrel-ss-clone';

// ─── Fallback chat icon SVG ───────────────────────────────────────────────────
// Used only when actual icon content cannot be safely cloned from the real button.

const FALLBACK_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
  'stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' +
  '</svg>';

// ─── Detection constants ──────────────────────────────────────────────────────

const MAX_BUBBLE_PX = 160;  // larger → container or expanded chat, not the button
const EDGE_NEAR_PX  = 120;  // must be this close to a viewport edge to be a corner widget

// ─── State ────────────────────────────────────────────────────────────────────

let _whatsappReady  = false;
let _smartsuppReady = false;
let _revealed       = false;
let _waPolling      = false;

let _ssButtonEl:   HTMLElement | null = null;   // real button — observed, never mutated
let _appearance:   CapturedAppearance | null = null;
let _cloneEl:      HTMLElement | null = null;

const _subscribers: Array<() => void> = [];
let _fallbackTimer: ReturnType<typeof setTimeout> | null = null;

const FALLBACK_AFTER_SS_SETTLE_MS = 2_000;
const FALLBACK_AFTER_WA_MS        = 6_000;

// ─── Types ────────────────────────────────────────────────────────────────────

interface CapturedAppearance {
  right:         number;
  bottom:        number;
  width:         number;
  height:        number;
  borderRadius:  string;
  background:    string;
  boxShadow:     string;
  zIndex:        number;
  iconHtml:      string;
  iconFallback:  boolean;
}

// ─── Button detection ─────────────────────────────────────────────────────────

function isCornerButton(el: HTMLElement): boolean {
  const s = window.getComputedStyle(el);
  if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
  const r  = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return false;
  if (r.width > MAX_BUBBLE_PX || r.height > MAX_BUBBLE_PX) return false;
  const vw = window.innerWidth, vh = window.innerHeight;
  const nearBottom = vh - r.bottom < EDGE_NEAR_PX;
  const nearRight  = vw - r.right  < EDGE_NEAR_PX;
  const nearLeft   = r.left        < EDGE_NEAR_PX;
  return nearBottom && (nearRight || nearLeft);
}

function findSmartsuppButton(): HTMLElement | null {
  const cloneEl = document.getElementById(CLONE_ID);
  const waEl    = document.querySelector<HTMLElement>('[aria-label="Chat with us on WhatsApp"]');

  // ── Strategy 1: known Smartsupp containers ──────────────────────────────────
  const containers: HTMLElement[] = [];
  document
    .querySelectorAll<HTMLElement>('#smartsupp-widget-container, [id*="smartsupp" i], [class*="smartsupp" i]')
    .forEach(el => containers.push(el));

  for (const container of containers) {
    if (container === cloneEl || container === waEl) continue;
    const r = container.getBoundingClientRect();
    if (r.width > MAX_BUBBLE_PX || r.height > MAX_BUBBLE_PX) {
      // Large container — the actual button is a child
      for (const child of Array.from(container.children)) {
        if (child instanceof HTMLElement && child !== cloneEl && child !== waEl) {
          if (isCornerButton(child)) return child;
        }
      }
    } else if (isCornerButton(container)) {
      return container;
    }
  }

  // ── Strategy 2: scan body-level iframes / divs ──────────────────────────────
  for (const el of Array.from(document.querySelectorAll<HTMLElement>('body > div, body > iframe'))) {
    if (el === cloneEl || el === waEl || el.id === 'root') continue;
    const r = el.getBoundingClientRect();
    if (r.width > MAX_BUBBLE_PX || r.height > MAX_BUBBLE_PX) {
      // Large sibling — check its children
      for (const child of Array.from(el.children)) {
        if (child instanceof HTMLElement && child !== cloneEl && child !== waEl) {
          if (isCornerButton(child)) return child;
        }
      }
    } else if (isCornerButton(el)) {
      return el;
    }
  }

  return null;
}

// ─── Stability detection ──────────────────────────────────────────────────────

interface Snapshot { x: number; y: number; w: number; h: number; op: string; }

function snap(el: HTMLElement): Snapshot {
  const r = el.getBoundingClientRect();
  return {
    x:  Math.round(r.x),
    y:  Math.round(r.y),
    w:  Math.round(r.width),
    h:  Math.round(r.height),
    op: window.getComputedStyle(el).opacity,
  };
}

function snapEq(a: Snapshot, b: Snapshot): boolean {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h && a.op === b.op;
}

function waitForStability(el: HTMLElement, onStable: () => void): void {
  const POLL_MS   = 80;
  const REQUIRED  = 6;      // 6 × 80 ms = 480 ms of no change at full opacity
  const MAX_MS    = 3_000;

  let streak = 0;
  let last: Snapshot | null = null;
  const t0 = Date.now();

  const id = setInterval(() => {
    const now = snap(el);
    if (last && snapEq(last, now) && now.op === '1') {
      streak++;
    } else {
      streak = 0;
    }
    last = now;

    if (streak >= REQUIRED || Date.now() - t0 >= MAX_MS) {
      clearInterval(id);
      onStable();
    }
  }, POLL_MS);
}

// ─── Icon cloning ─────────────────────────────────────────────────────────────
// Attempts, in order:
//   1. Clone SVG found anywhere inside the element
//   2. Clone first child that contains an img/svg or is icon-sized
//   3. Fallback SVG (chat bubble)

function tryCloneIcon(el: HTMLElement): { html: string; fallback: boolean } {
  try {
    // 1. Direct SVG inside the element
    const svg = el.querySelector('svg');
    if (svg) {
      const clone = svg.cloneNode(true) as SVGElement;
      const html  = clone.outerHTML;
      if (html.length > 20) return { html, fallback: false };
    }

    // 2. First img inside the element
    const img = el.querySelector('img');
    if (img && img.src) {
      return {
        html: `<img src="${img.src}" alt="" style="width:100%;height:100%;object-fit:contain;" />`,
        fallback: false,
      };
    }

    // 3. First child that looks like an icon (small text or contains icon primitives)
    for (const child of Array.from(el.children)) {
      if (child instanceof HTMLElement) {
        const hasSvg = child.querySelector('svg') !== null;
        const hasImg = child.querySelector('img') !== null;
        const text   = child.textContent?.trim() ?? '';
        if (hasSvg || hasImg || text.length < 4) {
          const cloned = child.cloneNode(true) as HTMLElement;
          const html   = cloned.outerHTML;
          if (html.length > 15) return { html, fallback: false };
        }
      }
    }
  } catch {
    // SecurityError (cross-origin) or other restriction — fall through
  }

  return { html: FALLBACK_ICON_SVG, fallback: true };
}

// ─── Appearance capture ───────────────────────────────────────────────────────

function captureAppearance(el: HTMLElement): CapturedAppearance {
  const r  = el.getBoundingClientRect();
  const cs = window.getComputedStyle(el);
  const vw = window.innerWidth, vh = window.innerHeight;

  const rawZ = parseInt(cs.zIndex, 10);
  const zIndex = isNaN(rawZ) ? 9999 : rawZ;

  const { html: iconHtml, fallback: iconFallback } = tryCloneIcon(el);

  return {
    right:        Math.round(vw - r.right),
    bottom:       Math.round(vh - r.bottom),
    width:        Math.round(r.width),
    height:       Math.round(r.height),
    borderRadius: cs.borderRadius || '50%',
    background:   cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? cs.backgroundColor : (cs.background || '#1566C0'),
    boxShadow:    cs.boxShadow !== 'none' ? cs.boxShadow : '0 6px 20px rgba(0,0,0,0.25)',
    zIndex:       Math.max(zIndex, 9999),
    iconHtml,
    iconFallback,
  };
}

// ─── Clone build ──────────────────────────────────────────────────────────────

function buildClone(a: CapturedAppearance): HTMLElement {
  // Remove any stale clone from a previous render
  document.getElementById(CLONE_ID)?.remove();

  const el = document.createElement('div');
  el.id = CLONE_ID;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', 'Open live chat');
  el.setAttribute('tabindex', '0');

  Object.assign(el.style, {
    position:       'fixed',
    right:          `${a.right}px`,
    bottom:         `${a.bottom}px`,
    width:          `${a.width}px`,
    height:         `${a.height}px`,
    borderRadius:   a.borderRadius,
    background:     a.background,
    boxShadow:      a.boxShadow,
    zIndex:         String(a.zIndex),
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    cursor:         'pointer',
    overflow:       'hidden',
    userSelect:     'none',
    // Initial state — identical to WhatsApp "hidden" phase
    opacity:        '0',
    transform:      'translateY(20px)',
  });

  // Icon
  const iconSize = Math.round(a.width * 0.5);
  const iconWrap = document.createElement('div');
  Object.assign(iconWrap.style, {
    width:          `${iconSize}px`,
    height:         `${iconSize}px`,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    pointerEvents:  'none',
  });
  iconWrap.innerHTML = a.iconHtml;
  // Normalise size on any direct SVG
  const svgEl = iconWrap.querySelector('svg');
  if (svgEl) {
    svgEl.setAttribute('width',  String(iconSize));
    svgEl.setAttribute('height', String(iconSize));
  }
  el.appendChild(iconWrap);

  // ── Click handler ─────────────────────────────────────────────────────────
  // 1. Call official Smartsupp API to open chat.
  // 2. Observe real widget for opened state.
  // 3. Only then fade out and remove clone.
  const handleActivate = () => {
    const ss = (window as Record<string, unknown>).smartsupp as
      ((...args: unknown[]) => void) | undefined;
    if (typeof ss === 'function') ss('chat', 'open');
    watchForChatOpen(el);
  };
  el.addEventListener('click', handleActivate);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleActivate(); }
  });

  // Hover polish (applied after animation completes)
  const onEnter = () => { el.style.transform = 'scale(1.05)'; };
  const onLeave = () => { el.style.transform = 'scale(1)'; };

  // ── Position re-sync on resize / layout changes ───────────────────────────
  const resync = () => {
    if (!_ssButtonEl) return;
    const r = _ssButtonEl.getBoundingClientRect();
    if (r.width <= 0) return;
    el.style.right  = `${Math.round(window.innerWidth  - r.right)}px`;
    el.style.bottom = `${Math.round(window.innerHeight - r.bottom)}px`;
    el.style.width  = `${Math.round(r.width)}px`;
    el.style.height = `${Math.round(r.height)}px`;
  };

  window.addEventListener('resize', resync);

  // ResizeObserver on the real button (if supported)
  if (typeof ResizeObserver !== 'undefined' && _ssButtonEl) {
    const ro = new ResizeObserver(resync);
    ro.observe(_ssButtonEl);
  }

  el.addEventListener('animationend', () => {
    // After entrance: lock final position and enable hover
    el.style.opacity   = '1';
    el.style.transform = 'translateY(0)';
    el.style.animation = '';
    el.style.transition = 'transform 0.18s ease, box-shadow 0.18s ease';
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
  }, { once: true });

  document.body.appendChild(el);
  return el;
}

// ─── Animate both widgets in (same JS tick) ───────────────────────────────────

function animateBothIn(cloneEl: HTMLElement): void {
  const anim = `whatsapp-enter ${ANIM_DURATION_MS}ms ${ANIM_EASING} both`;

  // Two rAF frames: ensures browser has painted the clone at opacity:0
  // before starting the animation, preventing a single-frame flicker.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Apply entrance animation to clone
      cloneEl.style.animation = anim;
      // Fire all WhatsApp (and any other) subscribers — same tick
      _subscribers.splice(0).forEach(cb => cb());
    });
  });
}

// ─── Chat-open detection ──────────────────────────────────────────────────────
// Called after clone is clicked. Observes the real Smartsupp widget for signs
// that the chat panel has opened, then removes the clone gracefully.

function watchForChatOpen(cloneEl: HTMLElement): void {
  const POLL_MS      = 150;
  const TIMEOUT_MS   = 3_000;
  const t0 = Date.now();

  const fadeAndRemove = () => {
    if (!cloneEl.isConnected) return;
    cloneEl.style.transition = 'opacity 0.3s ease';
    cloneEl.style.opacity    = '0';
    const cleanup = () => { cloneEl.isConnected && cloneEl.remove(); };
    cloneEl.addEventListener('transitionend', cleanup, { once: true });
    // Belt-and-suspenders: also remove after 400 ms even if transitionend never fires
    setTimeout(cleanup, 400);
  };

  const id = setInterval(() => {
    // ── Timeout fallback ──
    if (Date.now() - t0 >= TIMEOUT_MS) {
      clearInterval(id);
      fadeAndRemove();
      return;
    }

    // ── Real Smartsupp button expanded → chat is open ──
    if (_ssButtonEl) {
      const r = _ssButtonEl.getBoundingClientRect();
      if (r.width > MAX_BUBBLE_PX || r.height > MAX_BUBBLE_PX) {
        clearInterval(id);
        fadeAndRemove();
        return;
      }
    }

    // ── A Smartsupp chat panel appeared ──
    const candidates = document.querySelectorAll<HTMLElement>(
      '#smartsupp-widget-container > *, [id*="smartsupp" i] > *, [class*="smartsupp" i] > *'
    );
    for (const panel of Array.from(candidates)) {
      const pr = panel.getBoundingClientRect();
      if (pr.width > 260 && pr.height > 300) {
        clearInterval(id);
        fadeAndRemove();
        return;
      }
    }
  }, POLL_MS);
}

// ─── Reveal ───────────────────────────────────────────────────────────────────

function _clearFallback(): void {
  if (_fallbackTimer !== null) { clearTimeout(_fallbackTimer); _fallbackTimer = null; }
}

function _reveal(): void {
  if (_revealed) return;
  _revealed = true;
  _clearFallback();

  if (_appearance) {
    _cloneEl = buildClone(_appearance);
    animateBothIn(_cloneEl);
  } else {
    // Smartsupp not found (blocked, slow, or not installed) — reveal WhatsApp alone
    _subscribers.splice(0).forEach(cb => cb());
  }
}

// ─── WhatsApp polling (after Smartsupp settles) ───────────────────────────────
// Checks _whatsappReady immediately, then every 1 500 ms.
// Complementary to the push-based signalWhatsapp(); belt-and-suspenders.

function _startWhatsappPolling(): void {
  if (_waPolling || _revealed) return;
  _waPolling = true;

  const tick = () => {
    if (_revealed) return;
    if (_whatsappReady) { _clearFallback(); _reveal(); return; }
    setTimeout(tick, 1_500);
  };
  tick();
}

// ─── Smartsupp API-ready pipeline ────────────────────────────────────────────

function _onSmartsuppApiReady(): void {
  // Brief wait: Smartsupp fires 'ready' just before mounting its DOM elements.
  setTimeout(() => {
    const btn = findSmartsuppButton();

    if (!btn) {
      // Button not in DOM yet (or not findable) — treat Smartsupp as settled.
      // WhatsApp will reveal alone or with the 2 s fallback.
      _smartsuppReady = true;
      _checkBothReady();
      return;
    }

    _ssButtonEl = btn;

    // Wait for the button's own entrance animation to finish and stabilise.
    waitForStability(btn, () => {
      _appearance     = captureAppearance(btn);
      _smartsuppReady = true;
      _checkBothReady();
    });
  }, 300);
}

function _checkBothReady(): void {
  if (_whatsappReady && _smartsuppReady) {
    _reveal();
    return;
  }

  if (_smartsuppReady && !_whatsappReady) {
    // Smartsupp settled — poll for WhatsApp, 2 s fallback if it never arrives.
    _startWhatsappPolling();
    _clearFallback();
    _fallbackTimer = setTimeout(() => { if (!_revealed) _reveal(); }, FALLBACK_AFTER_SS_SETTLE_MS);
    return;
  }

  if (_whatsappReady && !_smartsuppReady) {
    // WhatsApp ready but Smartsupp hasn't settled — long fallback.
    _clearFallback();
    _fallbackTimer = setTimeout(() => { if (!_revealed) _reveal(); }, FALLBACK_AFTER_WA_MS);
  }
}

// ─── Register Smartsupp 'widget_init' listener via official queue function ────
// 'widget_init' is the correct event name per Smartsupp's documented API:
//   https://docs.smartsupp.com/chat-box/javascript-api/events/
// ('ready' is not a valid Smartsupp event and will produce a console warning.)

(function registerSmartsuppListener() {
  function attach() {
    const ss = (window as Record<string, unknown>).smartsupp as
      ((...args: unknown[]) => void) | undefined;
    if (typeof ss === 'function') {
      ss('on', 'widget_init', _onSmartsuppApiReady);
      return true;
    }
    return false;
  }

  if (!attach()) {
    // Snippet hasn't run yet (edge case: module evaluated before <head>).
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attach, { once: true });
    } else {
      attach();
    }
  }
})();

// ─── Public API ───────────────────────────────────────────────────────────────

export const widgetCoordinator = {
  /**
   * Called by WhatsAppButton once its icon is cached AND the phone number has
   * been fetched. Both are required before it can render visibly.
   */
  signalWhatsapp(): void {
    if (_whatsappReady) return;  // idempotent
    _whatsappReady = true;

    if (_smartsuppReady) {
      // Both ready — reveal immediately.
      _clearFallback();
      _reveal();
    } else {
      // Smartsupp not settled yet — start long fallback so WhatsApp is never
      // held invisible forever if Smartsupp is blocked or very slow.
      _clearFallback();
      _fallbackTimer = setTimeout(() => { if (!_revealed) _reveal(); }, FALLBACK_AFTER_WA_MS);
    }
  },

  /**
   * Subscribe to the reveal event. If reveal has already fired, the callback
   * is invoked immediately (next microtask).
   */
  onReveal(cb: () => void): void {
    if (_revealed) { Promise.resolve().then(cb); return; }
    _subscribers.push(cb);
  },

  /** True once the clone has been built (useful for tests / position tracking). */
  get cloneEl(): HTMLElement | null {
    return _cloneEl;
  },
};
