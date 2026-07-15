---
name: Fresh import restores
description: What to do when node_modules are missing after a GitHub import into Replit
---

# Fresh import restores

## Rule
After any fresh GitHub import into Replit, `node_modules/` directories are absent. All three sub-projects need `npm install` before their workflows can start.

**Why:** Replit's import strips `node_modules/` (they're gitignored). The workflows immediately fail with `Cannot find module 'dotenv'` or similar.

## How to apply
Run in parallel before restarting workflows:
- `cd aicg && npm install`
- `cd mevrelbank/backend && npm install`
- Frontend (`mevrelbank/design-systems/agents/figma/Figma Design System For Banking Ecosystem v0.1.0/`) — usually already present from the Vite workflow auto-installing, but verify with `ls node_modules` first.

Then restart all three workflows:
- **Start application** (AICG, port 3000)
- **MevrelBank Backend** (port 3001)
- **MevrelBank Dev (verify)** (Vite frontend, port 5173)
