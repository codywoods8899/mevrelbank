import { readFile as ghReadFile } from './github.js';
import { isBlocked } from './tree.js';

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.tiff',
  '.pdf', '.zip', '.tar', '.gz', '.bz2', '.rar', '.7z',
  '.exe', '.bin', '.dll', '.so', '.dylib',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp3', '.mp4', '.wav', '.ogg', '.flac', '.avi', '.mov', '.mkv',
  '.psd', '.ai', '.sketch', '.fig',
  '.db', '.sqlite',
]);

function ext(filePath) {
  const dot = filePath.lastIndexOf('.');
  return dot === -1 ? '' : filePath.slice(dot).toLowerCase();
}

export function isReadable(filePath) {
  if (!filePath || isBlocked(filePath)) return false;
  const e = ext(filePath);
  if (!e) return true; // Makefile, Dockerfile, etc.
  return !BINARY_EXTENSIONS.has(e);
}

export async function readAllowed(filePath, env) {
  if (!filePath) {
    const err = new Error('Query parameter "path" is required');
    err.status = 400;
    throw err;
  }
  if (isBlocked(filePath)) {
    const err = new Error('Access denied: path is restricted');
    err.status = 403;
    throw err;
  }
  if (!isReadable(filePath)) {
    const err = new Error(`Binary file type not supported: ${ext(filePath)}`);
    err.status = 415;
    throw err;
  }
  return ghReadFile(filePath, env);
}
