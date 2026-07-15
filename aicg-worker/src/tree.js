import { getTree as ghGetTree } from './github.js';

const BLOCKED_PREFIXES = ['.github', '.env', 'secrets'];
const BLOCKED_FILENAMES = ['.env', '.env.local', '.env.production', '.env.development'];

export function isBlocked(itemPath) {
  if (!itemPath) return true;

  const normalized = itemPath.replace(/\\/g, '/').replace(/^\/+/, '').toLowerCase();
  const basename   = normalized.split('/').pop();

  if (BLOCKED_FILENAMES.includes(basename)) return true;

  for (const prefix of BLOCKED_PREFIXES) {
    if (normalized === prefix || normalized.startsWith(prefix + '/')) return true;
  }

  return false;
}

export async function getFilteredTree(env) {
  const raw = await ghGetTree(env);
  return raw
    .filter(item => !isBlocked(item.path))
    .map(item => ({
      path: item.path,
      type: item.type === 'blob' ? 'file' : 'tree',
      size: item.size,
      sha:  item.sha,
    }));
}
