/**
 * Notification Action Resolver Service
 *
 * Single source of truth for destination logic and row-highlight behaviour.
 *
 * Architecture decision (approved 2026-07-15):
 *   Routing logic lives here, NOT in bankingApi.ts (transport layer) and NOT
 *   inside individual page components. This keeps the API layer pure and gives
 *   a single place to update if routing rules change.
 *
 * Contract:
 *   • resolveNotificationPath() maps (entityType, entityId) → route path.
 *     It never inspects notification text — only the structured backend fields.
 *   • applyRowHighlight() scrolls to and animates the destination row after the
 *     page data has loaded. Elements must expose data-entity-id="<uuid>".
 *     The CSS animation class is defined in src/styles/animations.css.
 */

import type { Notification } from "../shared/bankingApi";

// ─── Route resolution ─────────────────────────────────────────────────────────

/**
 * Returns the React Router destination path for a notification, or null if the
 * notification has no navigable destination (e.g. welcome messages).
 *
 * Only uses (entityType, entityId) from the backend-owned routing vocabulary.
 * The ?highlight param is consumed by destination pages to scroll/animate the row.
 */
export function resolveNotificationPath(n: Notification): string | null {
  if (!n.entityType) return null;

  const withHighlight = (base: string) =>
    n.entityId ? `${base}?highlight=${n.entityId}` : base;

  switch (n.entityType) {
    case "transaction":
      return withHighlight("/dashboard/transactions");
    case "account":
      return withHighlight("/dashboard/accounts");
    case "beneficiary":
      return withHighlight("/dashboard/beneficiaries");
    case "statement":
      return withHighlight("/dashboard/statements");
    case "security":
      // Security notifications land on the profile page; no specific entity row.
      return "/dashboard/profile";
    default:
      return null;
  }
}

// ─── Row highlight ────────────────────────────────────────────────────────────

const HIGHLIGHT_CLASS = "row-highlight"; // defined in src/styles/animations.css
/**
 * How long to wait before scrolling. This absorbs the async data fetch + React
 * render cycle that runs after the router navigates to the destination page.
 * 150 ms is enough for a warm cache; cold fetches take longer but the highlight
 * fires whenever the page calls applyRowHighlight() after its own data load.
 */
const SCROLL_DELAY_MS = 150;

/**
 * Finds the DOM element tagged with data-entity-id="<entityId>", scrolls it
 * into view, and plays the .row-highlight CSS animation once.
 *
 * Call this from destination-page useEffects, AFTER data has loaded, so the
 * element actually exists in the DOM when the function runs.
 *
 * The animation class is removed on animationend so it does not interfere with
 * hover/active states that are declared separately in the page component.
 *
 * @param entityId  UUID to target. If the element is not found (e.g. it was
 *                  filtered out or is on a different page) the call is a no-op.
 */
export function applyRowHighlight(entityId: string): void {
  setTimeout(() => {
    const el = document.querySelector<HTMLElement>(
      `[data-entity-id="${CSS.escape(entityId)}"]`
    );
    if (!el) return;

    // Scroll first, then animate — avoids the highlight playing off-screen.
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Force-reset so re-navigating to the same page replays the animation.
    el.classList.remove(HIGHLIGHT_CLASS);
    void el.offsetWidth; // reflow — required for animation to restart
    el.classList.add(HIGHLIGHT_CLASS);

    el.addEventListener(
      "animationend",
      () => el.classList.remove(HIGHLIGHT_CLASS),
      { once: true }
    );
  }, SCROLL_DELAY_MS);
}
