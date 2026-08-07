import { searchCode, searchFilenames } from './github.js';
import { isBlocked } from './tree.js';

export async function search(query, mode = 'both', config) {
  if (!query || !query.trim()) {
    const err = new Error('Query parameter "q" is required');
    err.code = 400;
    throw err;
  }

  const { owner, repo, token } = config.github;
  const filenameResults = [];
  const codeResults     = [];
  let   codeError       = null;

  if (mode === 'filename' || mode === 'both') {
    const matches = await searchFilenames(owner, repo, token, query);
    filenameResults.push(
      ...matches
        .filter(m => !isBlocked(m.path, config))
        .map(m => ({ ...m, matchType: 'filename' })),
    );
  }

  if (mode === 'code' || mode === 'both') {
    try {
      const matches = await searchCode(owner, repo, token, query);
      codeResults.push(
        ...matches
          .filter(m => !isBlocked(m.path, config))
          .map(m => ({ ...m, matchType: 'code' })),
      );
    } catch (err) {
      codeError = err.message;
    }
  }

  const seen   = new Set();
  const ranked = [];
  for (const r of filenameResults) { if (!seen.has(r.path)) { seen.add(r.path); ranked.push(r); } }
  for (const r of codeResults)     { if (!seen.has(r.path)) { seen.add(r.path); ranked.push(r); } }

  const response = { query, total: ranked.length, results: ranked };
  if (codeError) response.codeSearchUnavailable = codeError;
  return response;
}
