---
name: WhatsApp / Smartsupp alignment
description: How the WhatsApp floating button and Smartsupp clone are coordinated — positioning, entrance animation, and the correct Smartsupp API event names.
---

# WhatsApp / Smartsupp Alignment — v2 (observe-only coordinator)

## Architecture overview

`widgetCoordinator.ts` is the single source of truth. It observes Smartsupp, never mutates it.

**Pipeline:**
1. `smartsupp('on', 'widget_init', cb)` — the only valid Smartsupp init event  
   (**NOT** `'ready'` — that event does not exist and produces a console warning)
2. 300 ms DOM-mount pause → `findSmartsuppButton()` scans for corner-positioned button
3. Stability loop (80 ms × 6 = 480 ms of unchanged rect + opacity === '1', cap 3 000 ms)
4. `captureAppearance()` — rect, computed styles, icon clone attempt
5. Poll WhatsApp readiness (check immediately, then every 1 500 ms)
6. `buildClone()` → `animateBothIn()` — same `whatsapp-enter` keyframe, same JS tick
7. Clone click → `smartsupp('chat', 'open')` + `watchForChatOpen()` → fade/remove clone

## Smartsupp API — correct event names
Documented events (from https://docs.smartsupp.com/chat-box/javascript-api/events/):
- `widget_init` — fires when widget is initialized ✅ USE THIS for readiness detection
- `message_sent`, `message_received`, `messenger_close` — runtime events
- ~~`ready`~~ — **does not exist**, produces `[Smartsupp] Unknown event` warning

## Clone lifecycle
- ID: `mevrel-ss-clone`
- z-index: `max(capturedZIndex, 9999)`
- WhatsApp z-index: `10001` (inline) — always above the clone
- Clone click → `smartsupp('chat', 'open')` official API
- `watchForChatOpen()` polls every 150 ms: if real button grows >160 px or a panel >260×300 px appears → fade clone out (300 ms transition), remove on transitionend
- Hard fallback: remove after 3 000 ms regardless

## Icon cloning priority
1. `el.querySelector('svg')` → `cloneNode(true)` → `outerHTML`
2. `el.querySelector('img')` → re-emit as `<img src="...">` 
3. First child containing svg/img or with short text
4. Fallback: generic chat-bubble outline SVG in white

## Position tracking (WhatsAppButton)
`findReferenceButton()` prefers `#mevrel-ss-clone` (coordinator's presentation layer),
falls back to scanning real Smartsupp DOM. WhatsApp stacks `STACK_GAP = 12 px` above it.
`DEFAULT_BOTTOM = getSmartsuppOffset().y + DEFAULT_SIZE + STACK_GAP` (20 + 56 + 12 = 88 px).

## Fallbacks
- Smartsupp settles, WhatsApp slow → 2 000 ms then reveal
- WhatsApp ready, Smartsupp blocked → 6 000 ms then reveal alone (no clone built)

## Key invariants
- NEVER modify Smartsupp DOM, classes, animations, or styles
- NEVER inject CSS targeting Smartsupp elements
- NEVER use generated/internal Smartsupp IDs (only `[id*="smartsupp" i]` attribute selectors)

## Relevant files
- `src/lib/widgetCoordinator.ts` — full coordinator, clone builder, lifecycle
- `src/app/website/components/WhatsAppButton.tsx` — entrance phase, position tracking
- `src/styles/animations.css` — `@keyframes whatsapp-enter` (shared by both)
- `public/icons/whatsapp.svg` — WhatsApp icon (free SVG, static asset)
- `index.html` — Smartsupp loader script + SVG preload link
