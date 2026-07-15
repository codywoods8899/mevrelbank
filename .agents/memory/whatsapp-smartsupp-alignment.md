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

## Relevant file
`mevrelbank/design-systems/agents/figma/Figma Design System For Banking Ecosystem v0.1.0/src/app/website/components/WhatsAppButton.tsx`
