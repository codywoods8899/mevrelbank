import { searchCode as ghSearchCode, searchFilenames as ghSearchFilenames } from './github.js';
import { isBlocked } from './tree.js';

/**
 * Search by filename and/or code content.
 * @param {string} query
 * @param {'filename'|'code'|'both'} mode
 * @param {object} env
 */
export async function search(query, mode = 'both', env) {
  if (!query?.trim()) {
    const err = new Error('Query parameter "q" is required');
    err.status = 400;
    throw err;
  }

  const filenameResults = [];
  const codeResults     = [];
  let   codeError       = null;

  if (mode === 'filename' || mode === 'both') {
    const matches = await ghSearchFilenames(query, env);
    filenameResults.push(...matches.filter(m => !isBlocked(m.path)).map(m => ({ ...m, matchType: 'filename' })));
  }

  if (mode === 'code' || mode === 'both') {
    try {
      const matches = await ghSearchCode(query, env);
      codeResults.push(...matches.filter(m => !isBlocked(m.path)).map(m => ({ ...m, matchType: 'code' })));
    } catch (err) {
      codeError = err.message;
    }
  }

  const seen   = new Set();
  const ranked = [];
  for (const r of [...filenameResults, ...codeResults]) {
    if (!seen.has(r.path)) { seen.add(r.path); ranked.push(r); }
  }

  const response = { query, total: ranked.length, results: ranked };
  if (codeError) response.codeSearchUnavailable = codeError;
  return response;
}
