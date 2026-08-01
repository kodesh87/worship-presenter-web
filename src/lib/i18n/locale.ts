/**
 * UI locale vocabulary — the locales this build ships catalogues for.
 *
 * This is not the data-locale vocabulary (corpus files discovered at runtime).
 * The two sets legitimately differ: an Indonesian song book can be installed
 * with no Indonesian catalogue in the build, and the reverse.
 */
export const UI_LOCALE_ORDER = ['en', 'id'] as const;

export type UiLocale = (typeof UI_LOCALE_ORDER)[number];

export const DEFAULT_UI_LOCALE: UiLocale = 'en';

export function isUiLocale(value: unknown): value is UiLocale {
  return (
    typeof value === 'string' &&
    (UI_LOCALE_ORDER as readonly string[]).includes(value)
  );
}

/** Anything unrecognised — a hand-edited settings row — reads as `en`. */
export function asUiLocale(value: string | undefined | null): UiLocale {
  return isUiLocale(value) ? value : DEFAULT_UI_LOCALE;
}
