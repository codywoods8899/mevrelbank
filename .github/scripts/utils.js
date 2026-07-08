'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Utility helpers shared across the sync system.
 */

/**
 * Compute a SHA-256 hash of a file's contents.
 * @param {string} filePath - Absolute path to the file.
 * @returns {string} Hex-encoded SHA-256 hash.
 */
function computeHash(filePath) {
  const contents = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(contents).digest('hex');
}

/**
 * Compute a SHA-256 hash of a Buffer.
 * @param {Buffer} buf
 * @returns {string}
 */
function hashBuffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/**
 * Normalize a file-system path to use forward slashes.
 * @param {string} p
 * @returns {string}
 */
function normalizePath(p) {
  return p.replace(/\\/g, '/');
}

/**
 * Build a Dropbox path by joining the root and a relative path.
 * Dropbox paths always start with "/" and never end with "/".
 * @param {string} root - e.g. "/TK Pro Enterprise OS"
 * @param {string} relativePath - e.g. "src/index.js"
 * @returns {string} e.g. "/TK Pro Enterprise OS/src/index.js"
 */
function dropboxPath(root, relativePath) {
  const normalRoot = root.replace(/\/$/, '');
  const normalRel = normalizePath(relativePath).replace(/^\//, '');
  return `${normalRoot}/${normalRel}`;
}

/**
 * Return a UTC timestamp string safe for filenames.
 * Example: "2026-07-08T200102Z"
 * @returns {string}
 */
function utcTimestamp() {
  // "2026-07-08T20:01:02.000Z" → "2026-07-08T200102Z"
  // Keep date dashes, remove time colons, strip milliseconds.
  return new Date()
    .toISOString()
    .replace(/:/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Inject a timestamp suffix into a filename, before the extension.
 * Example: ("button.tsx", "2026-07-08T200102Z") → "button__2026-07-08T200102Z.tsx"
 * @param {string} filename
 * @param {string} ts
 * @returns {string}
 */
function stampedFilename(filename, ts) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  return `${base}__${ts}${ext}`;
}

/**
 * Sleep for the given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async function up to `attempts` times with exponential back-off.
 * Re-throws on auth errors (status 401) without retrying.
 * @template T
 * @param {() => Promise<T>} fn
 * @param {object} [opts]
 * @param {number} [opts.attempts=3]
 * @param {number} [opts.baseDelay=1000] - ms
 * @returns {Promise<T>}
 */
async function withRetry(fn, opts = {}) {
  const { attempts = 3, baseDelay = 1000 } = opts;
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err.status || (err.error && err.error.status);
      if (status === 401) throw err; // auth failures are fatal
      if (i < attempts - 1) {
        await sleep(baseDelay * Math.pow(2, i));
      }
    }
  }
  throw lastError;
}

module.exports = {
  computeHash,
  hashBuffer,
  normalizePath,
  dropboxPath,
  utcTimestamp,
  stampedFilename,
  sleep,
  withRetry,
};
