export function getConfig(env) {
  return {
    github: {
      token: env.G_TOKEN || env.CHAT_GPT_READONLY_PAT,
      owner: env.GITHUB_OWNER || 'codywoods8899',
      repo:  env.GITHUB_REPO  || 'mevrelbank',
    },
    session: {
      ttlMs: parseInt(env.SESSION_TTL_MS || '86400000', 10),
    },
    auth: {
      secret: env.SESSION_SECRET,
    },
    blockedPrefixes:  ['.github', '.env', 'secrets'],
    blockedFilenames: ['.env', '.env.local', '.env.production', '.env.development'],
  };
}
