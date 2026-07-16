/**
 * widgetCoordinator
 *
 * Coordinates the reveal of the WhatsApp and Smartsupp floating widgets so
 * that neither becomes visible until both are fully initialised.
 *
 * How it works
 * ────────────
 * 1. At module-evaluation time a <style> tag is injected that suppresses
 *    Smartsupp's container (opacity:0, translateY(20px), animation:none).
 *    This replaces Smartsupp's own Svelte fly() with our controlled animation.
 *
 * 2. Each widget signals readiness via coordinator.signal('whatsapp' | 'smartsupp').
 *
 * 3. Once both signals have arrived, reveal() fires:
 *      • The hold <style> is removed.
 *      • The same whatsapp-enter keyframe (defined in animations.css) is applied
 *        inline to the Smartsupp container.
 *      • Registered onReveal callbacks fire (WhatsApp entrance).
 *    Both animations start in the same JS tick → identical start time.
 *
 * 4. Fallback: if one widget never signals (ad-blocker, network error, etc.),
 *    a FALLBACK_MS timer reveals whatever is ready so nothing stays hidden forever.
 *    The timer starts on the first signal received.
 */

// ─── Animation — must match animations.css .whatsapp-enter ───────────────────

const ANIM_DURATION_MS = 400;
const ANIM_EASING      = 'cubic-bezier(0.215, 0.61, 0.355, 1)';

// ─── Smartsupp hold CSS ───────────────────────────────────────────────────────

const HOLD_ID = 'mevrel-widget-coord-hold';

function injectHold(): void {
  if (document.getElementById(HOLD_ID)) return;
  const style = document.createElement('style');
  style.id = HOLD_ID;
  // Suppress Smartsupp's container so its own Svelte animation never plays.
  // We animate it ourselves (same keyframe as WhatsApp) on coordinated reveal.
  style.textContent = [
    '#smartsupp-widget-container,',
    '[id*="smartsupp"] {',
    '  opacity: 0 !important;',
    '  transform: translateY(20px) !important;',
    '  pointer-events: none !important;',
    '  transition: none !important;',
    '  animation: none !important;',
    '}',
  ].join('\n');
  (document.head ?? document.documentElement).appendChild(style);
}

// Inject at module-evaluation time — before any Smartsupp script runs.
if (typeof document !== 'undefined') injectHold();

// ─── State ────────────────────────────────────────────────────────────────────

type Source = 'whatsapp' | 'smartsupp';

let _whatsappReady  = false;
let _smartsuppReady = false;
let _revealed       = false;
let _fallbackTimer: ReturnType<typeof setTimeout> | null = null;
const _subscribers: Array<() => void> = [];

/** How long to wait before revealing whatever is loaded (network/script failure guard). */
const FALLBACK_MS = 5_000;

// ─── Internal ─────────────────────────────────────────────────────────────────

function _startFallback(): void {
  if (_fallbackTimer !== null) return; // already running
  _fallbackTimer = setTimeout(() => {
    if (!_revealed) _reveal();
  }, FALLBACK_MS);
}

function _reveal(): void {
  if (_revealed) return;
  _revealed = true;

  if (_fallbackTimer !== null) {
    clearTimeout(_fallbackTimer);
    _fallbackTimer = null;
  }

  // 1. Remove the CSS suppressing Smartsupp.
  document.getElementById(HOLD_ID)?.remove();

  // 2. Apply the same entrance animation to the Smartsupp container.
  //    This runs in the same tick as the WhatsApp onReveal callbacks below,
  //    so both animations begin at exactly the same time.
  const ssEl =
    document.getElementById('smartsupp-widget-container') ??
    document.querySelector<HTMLElement>('[id*="smartsupp"]');
  if (ssEl) {
    // whatsapp-enter keyframe is defined globally in animations.css
    ssEl.style.animation = `whatsapp-enter ${ANIM_DURATION_MS}ms ${ANIM_EASING} both`;
  }

  // 3. Notify WhatsApp (and any other subscribers) to start their entrance.
  _subscribers.splice(0).forEach((cb) => cb());
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const widgetCoordinator = {
  /**
   * Called by each widget when it is fully initialised and ready to show.
   * Once both 'whatsapp' and 'smartsupp' have signalled, both are revealed
   * together. Calling signal() for the same source more than once is safe.
   */
  signal(source: Source): void {
    if (source === 'whatsapp') _whatsappReady = true;
    if (source === 'smartsupp') _smartsuppReady = true;

    // Start the fallback countdown on the very first signal.
    _startFallback();

    if (_whatsappReady && _smartsuppReady) _reveal();
  },

  /**
   * Register a callback that fires exactly once when the coordinator
   * decides it is time to reveal. If reveal has already happened,
   * the callback is invoked immediately.
   */
  onReveal(cb: () => void): void {
    if (_revealed) {
      cb();
      return;
    }
    _subscribers.push(cb);
  },
};
