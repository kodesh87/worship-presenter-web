/**
 * The resting box worn by every control in the shared header row except the
 * active nav pill, which inverts to `primary` and shares nothing but the radius
 * and the padding.
 *
 * It lives here, in neither `Header` nor `ThemeToggle`, because both need it and
 * `Header` already imports `ThemeToggle` — importing back would close a cycle.
 * It exists at all because `ThemeToggle` hand-reproduced these seven classes
 * when it was written, and a hand-reproduced box drifts the moment someone
 * restyles the nav pills: exactly the failure the toggle's own comment says it
 * cannot have, since matching its siblings is the whole point of the shape.
 *
 * **The box and its text tone are separate exports, because the row has two
 * tones and one box.** The doc above read *"every inactive control"* while the
 * profile dropdown trigger — on the same row, at `Header.tsx:120` — still stated
 * the whole box inline; two of the three copies had been closed and the sentence
 * generalised over all three. It is not a pure lift, which is why it needed the
 * split rather than an import: the trigger rests at `text-foreground` where the
 * pills and the toggle rest at `text-muted-foreground` and reach `foreground` on
 * hover. Splitting keeps every control's box in one place and leaves each one's
 * tone at its own call site, with no visual change to any of them.
 *
 * `cursor-pointer` is a no-op for the `<Link>` pills (a UA gives an `<a href>` a
 * pointer anyway) and is the fix for the toggle, which is a `<button>` and was
 * the one control in the row showing a default arrow.
 */
export const HEADER_CONTROL_BOX_BASE =
  'rounded-xl border border-border bg-card/50 shadow-sm transition-all cursor-pointer hover:bg-card';

/** The box plus the muted-at-rest tone the nav pills and the theme toggle share. */
export const HEADER_CONTROL_BOX = `${HEADER_CONTROL_BOX_BASE} text-muted-foreground hover:text-foreground`;

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
