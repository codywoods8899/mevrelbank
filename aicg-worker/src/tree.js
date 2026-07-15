import { getTree } from './github.js';

function basename(p) {
  return p.split('/').pop() || '';
}

/**
 * Return true when a repository path should never be exposed.
 */
export function isBlocked(itemPath, config) {
  if (!itemPath) return true;

  const normalized = itemPath
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .toLowerCase();

  const base = basename(normalized);

  if (config.blockedFilenames.includes(base)) return true;

  for (const prefix of config.blockedPrefixes) {
    if (normalized === prefix || normalized.startsWith(prefix + '/')) return true;
  }

  return false;
}

/**
 * Fetch the complete repository tree and strip all blocked paths.
 */
export async function getFilteredTree(config) {
  const raw = await getTree(config.github.owner, config.github.repo, config.github.token);

  return raw
    .filter(item => !isBlocked(item.path, config))
    .map(item => ({
      path: item.path,
      type: item.type === 'blob' ? 'file' : 'tree',
      size: item.size ?? null,
      sha:  item.sha,
    }));
}
