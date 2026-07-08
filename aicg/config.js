require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,

  github: {
    // CHAT_GPT_READONLY_PAT is the read-only token the gateway uses to talk to GitHub.
    // G_TOKEN is the fallback (write-capable — used for Replit pushes, not preferred here).
    token: process.env.CHAT_GPT_READONLY_PAT || process.env.G_TOKEN,
    owner: process.env.GITHUB_OWNER || 'codywoods8899',
    repo:  process.env.GITHUB_REPO  || 'mevrelbank',
  },

  session: {
    // Default TTL: 24 hours. Override with SESSION_TTL_MS env var.
    ttlMs: parseInt(process.env.SESSION_TTL_MS || '86400000', 10),
  },

  auth: {
    // The caller must present this exact value to POST /authorize.
    secret: process.env.SESSION_SECRET,
  },

  // Path prefixes that are never accessible.
  // Any tree entry whose path starts with one of these is blocked.
  blockedPrefixes: [
    '.github',
    '.env',
    'secrets',
  ],

  // Exact filenames that are always blocked regardless of location.
  blockedFilenames: [
    '.env',
    '.env.local',
    '.env.production',
    '.env.development',
  ],
};
