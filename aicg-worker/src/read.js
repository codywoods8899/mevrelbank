import { readFile } from './github.js';
import { isBlocked }  from './tree.js';

function extname(p) {
  const base = (p.split('/').pop() || '');
  const dot  = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot).toLowerCase() : '';
}

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.tiff',
  '.pdf', '.zip', '.tar', '.gz', '.bz2', '.rar', '.7z',
  '.exe', '.bin', '.dll', '.so', '.dylib',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp3', '.mp4', '.wav', '.ogg', '.flac', '.avi', '.mov', '.mkv',
  '.psd', '.ai', '.sketch', '.fig',
  '.db', '.sqlite',
]);

export function isReadable(filePath, config) {
  if (!filePath) return false;
  if (isBlocked(filePath, config)) return false;
  const ext = extname(filePath);
  if (!ext) return true;           // Makefile, LICENSE, Dockerfile, etc.
  if (BINARY_EXTENSIONS.has(ext)) return false;
  return true;
}

export async function readAllowed(filePath, config) {
  if (!filePath) {
    const err = new Error('Query parameter "path" is required');
    err.code = 400;
    throw err;
  }
  if (isBlocked(filePath, config)) {
    const err = new Error('Access denied: path is restricted');
    err.code = 403;
    throw err;
  }
  if (!isReadable(filePath, config)) {
    const ext = extname(filePath);
    const err = new Error(`Binary file type not supported: ${ext}`);
    err.code = 415;
    throw err;
  }
  return readFile(config.github.owner, config.github.repo, config.github.token, filePath);
}
