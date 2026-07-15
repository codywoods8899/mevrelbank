---
name: WhatsApp / Smartsupp alignment
description: How the WhatsApp floating button is positioned relative to the Smartsupp chat widget, and the root cause of variable spacing across viewport sizes.
---

# WhatsApp / Smartsupp Alignment

## The rule
The WhatsApp bubble must always sit exactly `STACK_GAP = 12 px` above the Smartsupp closed-chat button, on every supported layout (mobile <640 px, sm 640 px, md 768 px, lg 1024 px+). Both the dynamic detection path and the fallback path must use the same 12 px gap — inconsistent gap values are the main way this breaks.

**Why:** Smartsupp v5 renders its closed-chat button inside a full-screen transparent overlay iframe (`position: fixed; inset: 0`). The outer iframe is viewport-sized and gets filtered by `MAX_BUBBLE_SIZE`; detection falls back to hardcoded defaults. If those defaults imply a different gap than `STACK_GAP`, the spacing shifts depending on whether detection succeeds or fails at a given viewport width.

## How to apply
- `DEFAULT_BOTTOM` must equal `getSmartsuppOffset().y + DEFAULT_SIZE + STACK_GAP` (currently 20 + 56 + 12 = 88 px). Do not hard-code 96 or any other value that implies a different gap.
- `getSmartsuppOffset()` reads `window._smartsupp.offsetX/offsetY` at runtime, falling back to 20 px — this mirrors any custom Smartsupp position config.
- `findSmartsuppBubble()` walks direct children of large Smartsupp-tagged containers so it can discover the actual button div sitting inside the full-screen overlay.
- `MAX_BUBBLE_SIZE = 160` and `EDGE_THRESHOLD = 100 px` — raised from 110/60 to handle larger mobile iframes.
- No breakpoint-specific offsets — all positioning is derived from the live Smartsupp element or its configured defaults.

## Entrance animation (measured from Smartsupp widget-v3)
Smartsupp's entrance is a Svelte `fly({ y: 20, delay: 300, duration: 400 })` transition:
- `translateY(20px) → translateY(0)`, `opacity: 0 → 1`
- Easing: Svelte `cubicOut` = CSS `cubic-bezier(0.215, 0.61, 0.355, 1)`
- 300 ms delay from when Svelte component mounts (element appears in DOM)
- 400 ms animation duration → fully visible at T+700 ms

Source: `https://widget-v3.smartsuppcdn.com/assets/main-t6WxLABA.js` manifest at `https://widget-v3.smartsuppcdn.com/manifest.json`

### Synchronisation approach
- MutationObserver fires when Smartsupp element appears in DOM (T+0).
- We wait `max(0, 300 - elapsed)` ms from detection before setting `phase = "entering"`.
- `@keyframes whatsapp-enter` in `animations.css` runs the 400 ms keyframe.
- Both bubbles begin and finish animating together.
- Fallback: 3 000 ms after `number` loads if Smartsupp never appears.

### SVG flash fix
- `<link rel="preload" as="image" href="/icons/whatsapp.svg">` in `index.html`.
- `new Image()` in `useEffect` tracks when SVG is actually cached (`iconReadyRef`).
- Button stays `phase = "hidden"` (opacity:0, translateY(20px)) until BOTH `iconReady` AND Smartsupp signal fire — no bare green circle ever shown.

### Phase state machine
`hidden → entering → visible` (transitions via `tryEnter()` + `onAnimationEnd`).
`hover:scale-105 / active:scale-95` only re-applied in `visible` phase to avoid transform conflicts with the CSS animation.

## Relevant files
- `src/app/website/components/WhatsAppButton.tsx`
- `src/styles/animations.css` — `@keyframes whatsapp-enter` + `.whatsapp-enter`
- `index.html` — SVG preload link
