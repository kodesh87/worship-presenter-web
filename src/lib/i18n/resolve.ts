import { CATALOGUE_EN } from './catalogue-en';
import { CATALOGUE_ID } from './catalogue-id';
import type { I18nKey } from './keys';
import { type UiLocale } from './locale';

const CATALOGUES = {
  en: CATALOGUE_EN,
  id: CATALOGUE_ID,
} as const satisfies Record<UiLocale, Record<I18nKey, string>>;

/** Visible defect marker — names the key, never blank, never silent English. */
export function missingKeyMarker(key: string): string {
  return `[missing:i18n:${key}]`;
}

/**
 * Key + locale → string. Pure, callable directly by `node:test`.
 *
 * A missing entry renders a defect marker and logs server-side; it does not
 * fall back to `en`.
 */
export function resolveString(key: I18nKey, locale: UiLocale): string {
  const table = CATALOGUES[locale];
  const value = table[key];
  if (value !== undefined) return value;

  console.error(
    `[i18n] missing catalogue entry for key "${key}" in locale "${locale}"`
  );
  return missingKeyMarker(key);
}

/** For parity tests — derive the expected key set from one catalogue. */
export function catalogueKeys(locale: UiLocale = 'en'): string[] {
  return Object.keys(CATALOGUES[locale]).sort();
}
