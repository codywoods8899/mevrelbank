/**
 * widgetCoordinator
 *
 * Holds both the WhatsApp bubble and the Smartsupp widget invisible until
 * both are fully ready, then reveals them simultaneously with the same
 * entrance animation.
 *
 * How it works
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. At module-evaluation time a <style> tag is injected that suppresses
 *    Smartsupp's container (opacity:0, translateY(20px), animation:none).
 *    Smartsupp's own Svelte fly() is effectively cancelled — we own the reveal.
 *
 * 2. We immediately register smartsupp('on', 'ready', ...) using the queue
 *    function the Smartsupp snippet creates synchronously in index.html.
 *    The call is queued and fires once Smartsupp's script finishes loading.
 *
 * 3. The WhatsApp component calls coordinator.signalWhatsapp() once its icon
 *    is cached AND the phone number has been fetched (both needed to render).
 *
 * 4. As soon as BOTH signals have arrived, reveal() runs:
 *      • Hold <style> is removed.
 *      • The same whatsapp-enter keyframe (animations.css) is applied inline
 *        to the Smartsupp container element.
 *      • All onReveal subscribers fire (WhatsApp entrance).
 *    Both animations begin in the same JS tick → identical visual start time.
 *
 * Fallbacks (nothing stays hidden forever)
 * ─────────────────────────────────────────────────────────────────────────────
 * • Smartsupp fires 'ready' but WhatsApp isn't ready yet:
 *     Start a 2 s timer. If WhatsApp doesn't signal in time, reveal anyway
 *     (Smartsupp shows; WhatsApp renders later without entrance, which is
 *     acceptable — its icon/number failed or the API is very slow).
 *
 * • WhatsApp signals but Smartsupp 'ready' never fires (ad-blocker etc.):
 *     Start a 6 s timer from the first WhatsApp signal. After that, reveal
 *     (WhatsApp shows on its own; Smartsupp simply isn't there).
 */

// ─── Animation — must match animations.css .whatsapp-enter exactly ───────────

const ANIM_DURATION_MS = 400;
const ANIM_EASING      = 'cubic-bezier(0.215, 0.61, 0.355, 1)';

// ─── Hold CSS — injected before any Smartsupp script executes ────────────────

const HOLD_ID = 'mevrel-widget-coord-hold';

function injectHold(): void {
  if (document.getElementById(HOLD_ID)) return;
  const style = document.createElement('style');
  style.id = HOLD_ID;
  style.textContent =
    '#smartsupp-widget-container, [id*="smartsupp"] {' +
    '  opacity: 0 !important;' +
    '  transform: translateY(20px) !important;' +
    '  pointer-events: none !important;' +
    '  transition: none !important;' +
    '  animation: none !important;' +
    '}';
  (document.head ?? document.documentElement).appendChild(style);
}

if (typeof document !== 'undefined') injectHold();

// ─── State ────────────────────────────────────────────────────────────────────

let _whatsappReady  = false;
let _smartsuppReady = false;
let _revealed       = false;

// Timer started after Smartsupp ready fires, waiting for WhatsApp
const FALLBACK_AFTER_SS_MS = 2_000;
// Timer started after WhatsApp signals, waiting for Smartsupp ready
const FALLBACK_AFTER_WA_MS = 6_000;

let _fallbackTimer: ReturnType<typeof setTimeout> | null = null;
const _subscribers: Array<() => void> = [];

// ─── Internal ─────────────────────────────────────────────────────────────────

function _clearFallback(): void {
  if (_fallbackTimer !== null) { clearTimeout(_fallbackTimer); _fallbackTimer = null; }
}

function _reveal(): void {
  if (_revealed) return;
  _revealed = true;
  _clearFallback();

  // 1. Lift the CSS that was holding Smartsupp invisible.
  document.getElementById(HOLD_ID)?.remove();

  // 2. Apply the same entrance animation to the Smartsupp container.
  //    Targets the outermost container Smartsupp renders into the DOM.
  const ssEl =
    document.getElementById('smartsupp-widget-container') ??
    document.querySelector<HTMLElement>('[id*="smartsupp"]');
  if (ssEl) {
    ssEl.style.animation = `whatsapp-enter ${ANIM_DURATION_MS}ms ${ANIM_EASING} both`;
  }

  // 3. Fire WhatsApp (and any other) entrance callbacks — same tick as above.
  _subscribers.splice(0).forEach((cb) => cb());
}

function _onSmartsuppReady(): void {
  _smartsuppReady = true;
  if (_whatsappReady) {
    // Both ready — reveal immediately.
    _reveal();
  } else {
    // WhatsApp not ready yet. Give it a short window, then reveal regardless.
    _clearFallback();
    _fallbackTimer = setTimeout(() => { if (!_revealed) _reveal(); }, FALLBACK_AFTER_SS_MS);
  }
}

// Register the 'ready' listener via the Smartsupp queue function.
// The snippet in index.html creates window.smartsupp synchronously as a
// queue: calls are stored and replayed once the real Smartsupp script loads.
(function registerSmartsuppListener() {
  const ss = (window as Record<string, unknown>).smartsupp as
    ((...args: unknown[]) => void) | undefined;
  if (typeof ss === 'function') {
    ss('on', 'ready', _onSmartsuppReady);
  }
  // If the snippet hasn't run yet (edge case: module evaluated before <head>
  // scripts), wait for DOMContentLoaded and try once more.
  else if (typeof document !== 'undefined') {
    const retry = () => {
      const ss2 = (window as Record<string, unknown>).smartsupp as
        ((...args: unknown[]) => void) | undefined;
      if (typeof ss2 === 'function') ss2('on', 'ready', _onSmartsuppReady);
      // If still not available, Smartsupp is blocked — WhatsApp fallback handles it.
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', retry, { once: true });
    } else {
      retry();
    }
  }
})();

// ─── Public API ───────────────────────────────────────────────────────────────

export const widgetCoordinator = {
  /**
   * Called by WhatsApp component once its icon is cached AND the phone
   * number has been fetched — both are required for it to render visibly.
   */
  signalWhatsapp(): void {
    if (_whatsappReady) return; // idempotent
    _whatsappReady = true;
    if (_smartsuppReady) {
      _reveal();
    } else {
      // Smartsupp not ready yet. Start the long fallback so WhatsApp isn't
      // held invisible forever if Smartsupp is blocked or very slow.
      _clearFallback();
      _fallbackTimer = setTimeout(() => { if (!_revealed) _reveal(); }, FALLBACK_AFTER_WA_MS);
    }
  },

  /**
   * Register a callback that fires exactly once when the coordinator reveals.
   * If reveal has already happened the callback is invoked immediately.
   */
  onReveal(cb: () => void): void {
    if (_revealed) { cb(); return; }
    _subscribers.push(cb);
  },
};
