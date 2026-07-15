/**
 * GitHub API calls via native fetch.
 * Requires env.AICG_PAT, env.GITHUB_OWNER, env.GITHUB_REPO.
 */

const UA = 'AICG-Worker/0.1.0';

function headers(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept':        'application/vnd.github.v3+json',
    'User-Agent':    UA,
  };
}

async function ghFetch(path, env) {
  const owner = env.GITHUB_OWNER || 'codywoods8899';
  const repo  = env.GITHUB_REPO  || 'mevrelbank';
  const url   = `https://api.github.com/repos/${owner}/${repo}${path}`;

  const res = await fetch(url, { headers: headers(env.AICG_PAT) });

  if (!res.ok) {
    const err = new Error(`GitHub ${res.status}: ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Fetch the full recursive file tree for the default branch.
 * @returns {Array<{ path, type, sha, size }>}
 */
export async function getTree(env) {
  // Get default branch first
  const meta   = await ghFetch('', env);
  const branch = meta.default_branch;

  const data = await ghFetch(`/git/trees/${branch}?recursive=1`, env);
  return (data.tree || []).map(item => ({
    path: item.path,
    type: item.type, // 'blob' | 'tree'
    sha:  item.sha,
    size: item.size ?? null,
  }));
}

/**
 * Read a single file's content (base64 decoded).
 * @returns {{ path, name, size, sha, content, encoding }}
 */
export async function readFile(filePath, env) {
  const data = await ghFetch(`/contents/${encodeURIComponent(filePath)}`, env);

  if (data.type !== 'file') {
    const err = new Error('Requested path is not a file');
    err.status = 400;
    throw err;
  }

  const content = data.encoding === 'base64'
    ? atob(data.content.replace(/\n/g, ''))
    : data.content;

  return {
    path:     data.path,
    name:     data.name,
    size:     data.size,
    sha:      data.sha,
    content,
    encoding: 'utf8',
  };
}

/**
 * GitHub code search (10 req/min rate limit for authenticated).
 * @returns {Array<{ path, name, sha, score, htmlUrl }>}
 */
export async function searchCode(query, env) {
  const owner = env.GITHUB_OWNER || 'codywoods8899';
  const repo  = env.GITHUB_REPO  || 'mevrelbank';
  const q     = encodeURIComponent(`${query} repo:${owner}/${repo}`);
  const url   = `https://api.github.com/search/code?q=${q}&per_page=30`;

  const res = await fetch(url, { headers: headers(env.AICG_PAT) });
  if (!res.ok) {
    const err = new Error(`GitHub search ${res.status}: ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return (data.items || []).map(item => ({
    path:    item.path,
    name:    item.name,
    sha:     item.sha,
    score:   item.score,
    htmlUrl: item.html_url,
  }));
}

/**
 * Fast filename search — filters the tree locally, no extra API quota.
 */
export async function searchFilenames(query, env) {
  const tree = await getTree(env);
  const q    = query.toLowerCase();
  return tree
    .filter(item => item.type === 'blob' && item.path.toLowerCase().includes(q))
    .map(item => ({ path: item.path, sha: item.sha, size: item.size }));
}
