const BASE = 'https://api.github.com';

async function ghFetch(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization:        `Bearer ${token}`,
      Accept:               'application/vnd.github.v3+json',
      'User-Agent':         'AICG/0.1.0',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) {
    const err = new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function getRepoMeta(owner, repo, token) {
  const d = await ghFetch(`/repos/${owner}/${repo}`, token);
  return {
    name:          d.name,
    owner:         d.owner.login,
    description:   d.description,
    defaultBranch: d.default_branch,
    private:       d.private,
    size:          d.size,
    updatedAt:     d.updated_at,
    language:      d.language,
    topics:        d.topics,
  };
}

export async function getTree(owner, repo, token, branch = null) {
  let ref = branch;
  if (!ref) {
    const meta = await getRepoMeta(owner, repo, token);
    ref = meta.defaultBranch;
  }
  const d = await ghFetch(
    `/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`,
    token,
  );
  return d.tree; // [{ path, mode, type, sha, size, url }]
}

export async function listFolder(owner, repo, token, folderPath) {
  const p = folderPath
    ? '/' + folderPath.split('/').map(encodeURIComponent).join('/')
    : '';
  const d = await ghFetch(`/repos/${owner}/${repo}/contents${p}`, token);
  if (!Array.isArray(d)) {
    const err = new Error('Path is a file, not a directory');
    err.status = 400;
    throw err;
  }
  return d.map(item => ({
    name: item.name,
    path: item.path,
    type: item.type,
    size: item.size ?? null,
    sha:  item.sha,
  }));
}

export async function readFile(owner, repo, token, filePath) {
  const p = '/' + filePath.split('/').map(encodeURIComponent).join('/');
  const d = await ghFetch(`/repos/${owner}/${repo}/contents${p}`, token);
  if (Array.isArray(d)) {
    const err = new Error('Path is a directory, not a file');
    err.status = 400;
    throw err;
  }
  // Decode base64 — GitHub always returns file content encoded
  const content = d.encoding === 'base64'
    ? new TextDecoder().decode(
        Uint8Array.from(atob(d.content.replace(/\n/g, '')), c => c.charCodeAt(0)),
      )
    : d.content;

  return {
    path:     d.path,
    name:     d.name,
    size:     d.size,
    sha:      d.sha,
    content,
    encoding: 'utf8',
  };
}

export async function searchCode(owner, repo, token, query) {
  const q = encodeURIComponent(`${query} repo:${owner}/${repo}`);
  const d = await ghFetch(`/search/code?q=${q}&per_page=30`, token);
  return d.items.map(item => ({
    path:    item.path,
    name:    item.name,
    sha:     item.sha,
    score:   item.score,
    htmlUrl: item.html_url,
  }));
}

export async function searchFilenames(owner, repo, token, query) {
  const tree = await getTree(owner, repo, token);
  const q = query.toLowerCase();
  return tree
    .filter(item => item.type === 'blob' && item.path.toLowerCase().includes(q))
    .map(item => ({ path: item.path, sha: item.sha, size: item.size ?? null }));
}
