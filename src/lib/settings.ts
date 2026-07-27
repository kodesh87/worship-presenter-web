import { getDb } from './db';
import {
  DEFAULT_SLIDE_TRANSITION,
  isSlideTransition,
  parseSlideTransition,
  SLIDE_TRANSITIONS,
  type SlideTransition,
} from './transitions';

const RETENTION_KEY = 'pptx_retention_days';
const DEFAULT_RETENTION_DAYS = 60;

const SLIDE_TRANSITION_KEY = 'slide_transition';

export function getSetting(key: string): string | null {
  const row = getDb()
    .prepare(`SELECT value FROM settings WHERE key = ?`)
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  getDb()
    .prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(key, value);
}

/** Retention days: settings table → PPTX_RETENTION_DAYS env → 60. */
export function getPptxRetentionDays(): number {
  const fromDb = getSetting(RETENTION_KEY);
  if (fromDb != null) {
    const n = Number(fromDb);
    if (Number.isInteger(n) && n >= 0) return n;
  }
  const fromEnv = process.env.PPTX_RETENTION_DAYS?.trim();
  if (fromEnv) {
    const n = Number(fromEnv);
    if (Number.isInteger(n) && n >= 0) return n;
  }
  return DEFAULT_RETENTION_DAYS;
}

export function setPptxRetentionDays(days: number): void {
  if (!Number.isInteger(days) || days < 0) {
    throw new Error('pptx_retention_days must be a non-negative integer');
  }
  setSetting(RETENTION_KEY, String(days));
}

/**
 * Deck transition: settings table → fade.
 *
 * A stored value that is not one of the known styles is coerced to the default
 * and logged rather than thrown. Deck generation reads this on every download,
 * and a junk row must never be the reason a service has no slides.
 */
export function getSlideTransition(): SlideTransition {
  const stored = getSetting(SLIDE_TRANSITION_KEY);
  if (stored == null) return DEFAULT_SLIDE_TRANSITION;

  const parsed = parseSlideTransition(stored);
  if (parsed !== stored) {
    console.error(
      `[settings] ignoring unknown ${SLIDE_TRANSITION_KEY} "${stored}"; ` +
        `falling back to "${DEFAULT_SLIDE_TRANSITION}"`
    );
  }
  return parsed;
}

export function setSlideTransition(value: SlideTransition): void {
  if (!isSlideTransition(value)) {
    throw new Error(
      `${SLIDE_TRANSITION_KEY} must be one of: ${SLIDE_TRANSITIONS.join(', ')}`
    );
  }
  setSetting(SLIDE_TRANSITION_KEY, value);
}
