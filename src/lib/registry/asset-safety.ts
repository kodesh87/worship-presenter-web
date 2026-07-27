import fs from 'fs';
import path from 'path';
import { isLocalUploadRef } from '../uploads';
import { isSafeImageUrl } from '../images';

const PUBLIC_ASSETS_DIR = path.join(process.cwd(), 'public', 'assets');

/** Bundled registry asset paths must be /assets/<filename> with a committed file. */
export function isBundledAssetRef(ref: string): boolean {
  if (typeof ref !== 'string' || !ref.startsWith('/assets/')) return false;
  if (ref.includes('..') || ref.includes('\\')) return false;
  const filename = ref.slice('/assets/'.length);
  if (!filename || filename.includes('/')) return false;
  if (!/^[a-zA-Z0-9._-]+\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
    return false;
  }
  return fs.existsSync(path.join(PUBLIC_ASSETS_DIR, filename));
}

export function isRegistryImageRef(ref: string): boolean {
  if (isBundledAssetRef(ref)) return true;
  if (isLocalUploadRef(ref)) return true;
  if (isSafeImageUrl(ref)) return true;
  return false;
}
