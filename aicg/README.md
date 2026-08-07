# AI Context Gateway (AICG)

## ⏸ STATUS: PAUSED

**This component is on pause and should not be modified or re-enabled without the project owner's instruction.**

The AICG was used to give AI sessions read-only access to the GitHub repository. It is not currently needed and has been suspended to conserve resources.

The run workflow has been disabled. Do not re-enable it, change its configuration, or start the server.

---

## Original Purpose

A secure, read-only Node.js/Express intelligence gateway that gives an authorised AI session autonomous access to a GitHub repository (search, read files, navigate folders, inspect the tree). It never modifies the repository.

## Stack
- Node.js 20 / Express 5
- `@octokit/rest` for GitHub API access
- `bcrypt`, `uuid`, `dotenv`

## Required Secrets (when active)
| Secret | Purpose |
|---|---|
| `CHAT_GPT_READONLY_PAT` | GitHub personal access token (read-only scope) |
| `SESSION_SECRET` | Authorization credential — present to `POST /authorize` |

## Session Flow (when active)
1. `POST /authorize` with `{ "token": "<SESSION_SECRET>" }` → returns `{ "sessionId": "..." }`
2. All subsequent requests include header `X-Session-ID: <sessionId>`
3. `POST /invalidate` to terminate the session

## Modules
- server.js
- config.js
- auth.js
- session.js
- github.js
- search.js
- read.js
- tree.js
- logger.js

## Folders
sessions/
logs/

Version 0.1.0
