/**
 * The operator's three theme choices and the order the header control cycles
 * them in.
 *
 * `system` stays in the cycle deliberately — it is what a first visit gets, and
 * a two-way switch would make it unreachable the moment the operator touched the
 * control once.
 *
 * This lives apart from `ThemeToggle` for one reason: `nextTheme` is where an
 * off-by-one would live, and a modulo inside a `.tsx` component can only be
 * checked by a regex over its own source — which is to say, not checked. Here it
 * is a pure function the `node:test` harness can call.
 */
export const THEME_ORDER = ['system', 'light', 'dark'] as const;

export type ThemeChoice = (typeof THEME_ORDER)[number];

/** Anything unrecognised — a hand-edited `localStorage` — reads as `system`. */
export function asThemeChoice(value: string | undefined): ThemeChoice {
  return THEME_ORDER.includes(value as ThemeChoice)
    ? (value as ThemeChoice)
    : 'system';
}

/** The choice one press advances to, wrapping back to the start. */
export function nextTheme(current: ThemeChoice): ThemeChoice {
  return THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length];
}

export const THEME_LABEL: Record<ThemeChoice, string> = {
  system: 'Follow system theme',
  light: 'Light theme',
  dark: 'Dark theme',
};
