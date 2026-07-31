/**
 * The resting box worn by every inactive control in the shared header row.
 *
 * It lives here, in neither `Header` nor `ThemeToggle`, because both need it and
 * `Header` already imports `ThemeToggle` — importing back would close a cycle.
 * It exists at all because `ThemeToggle` hand-reproduced these seven classes
 * when it was written, and a hand-reproduced box drifts the moment someone
 * restyles the nav pills: exactly the failure the toggle's own comment says it
 * cannot have, since matching its siblings is the whole point of the shape.
 *
 * `cursor-pointer` is a no-op for the `<Link>` pills (a UA gives an `<a href>` a
 * pointer anyway) and is the fix for the toggle, which is a `<button>` and was
 * the one control in the row showing a default arrow.
 */
export const HEADER_CONTROL_BOX =
  'rounded-xl border border-border bg-card/50 text-muted-foreground shadow-sm transition-all cursor-pointer hover:bg-card hover:text-foreground';

/** Nav pills: the shared box plus the link's own type and padding. */
export const HEADER_LINK_INACTIVE = `text-xs font-semibold px-4 py-2.5 ${HEADER_CONTROL_BOX}`;

/**
 * The active pill states its own box rather than overriding the shared one —
 * it inverts to `primary`, so it shares nothing with the resting shape but the
 * radius and the padding.
 */
export const HEADER_LINK_ACTIVE =
  'text-xs font-bold px-4 py-2.5 rounded-xl border border-primary bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/95';

export function headerLinkClass(isActive: boolean): string {
  return isActive ? HEADER_LINK_ACTIVE : HEADER_LINK_INACTIVE;
}
