import fs from 'fs';
import path from 'path';
import { getPptxRetentionDays } from './settings';

/** Ephemeral on-disk PPTX cache. Service rows are never deleted by retention. */
export function pptxCacheDir(): string {
  return (
    process.env.PPTX_CACHE_DIR?.trim() ||
    path.join(/* turbopackIgnore: true */ process.cwd(), '.cache', 'pptx')
  );
}

export function pptxCachePath(serviceId: number): string {
  return path.join(pptxCacheDir(), `service-${serviceId}.pptx`);
}

export function writePptxCache(serviceId: number, buffer: Buffer): string {
  const dir = pptxCacheDir();
  fs.mkdirSync(dir, { recursive: true });
  const filePath = pptxCachePath(serviceId);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

/**
 * Delete cached PPTX files older than the retention window.
 * Does not touch Service rows, announcements, or images.
 * Returns number of files removed.
 */
export function cleanupExpiredPptxCache(now = Date.now()): number {
  const days = getPptxRetentionDays();
  const dir = pptxCacheDir();
  if (!fs.existsSync(dir)) return 0;
  if (days === 0) {
    // 0 = retain forever (no-op cleanup)
    return 0;
  }

  const cutoff = now - days * 24 * 60 * 60 * 1000;
  let removed = 0;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.pptx')) continue;
    const full = path.join(dir, name);
    try {
      const st = fs.statSync(full);
      if (st.mtimeMs < cutoff) {
        fs.unlinkSync(full);
        removed += 1;
      }
    } catch {
      // ignore individual file errors
    }
  }
  return removed;
}
