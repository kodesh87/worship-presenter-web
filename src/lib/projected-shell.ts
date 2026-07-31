/**
 * Hold the app shell at literal black while a full-screen projected surface is
 * on screen, and hand it back when the last one leaves.
 *
 * Both `/services/[id]/present/projector` and `/services/[id]/slideshow` are
 * `fixed inset-0` surfaces that must never scroll, and the app shell paints
 * `body` with the theme background — `globals.css` has `body { bg-background }`.
 * It also sets `scrollbar-gutter: stable` on `html`, which is right for the app
 * (a run sheet growing past the fold must not shift while an operator scans it)
 * and wrong here: the reserved gutter means `fixed inset-0` sizes to the
 * viewport *minus* that gutter, so the page underneath shows as a strip down the
 * edge — on the projector, in front of the congregation.
 *
 * This lived inside `ProjectorClient` until 2026-07-31, and the slideshow — the
 * same `fixed inset-0` pattern at an equally room-facing URL — had no reset at
 * all. That was survivable while the strip was permanently white: it was wrong,
 * but it was not *variable*. Story 17.1 gives the operator a theme, and
 * next-themes syncs across same-origin windows on the `storage` event, so
 * without this the strip would follow the operator's choice live, mid-service.
 *
 * The colour is the literal `#000000` these surfaces already paint themselves,
 * never a theme token — `tests/theme-chrome.test.mjs` asserts that too, because
 * a token here would reintroduce exactly the leak this closes.
 *
 * **It is reference-counted, and that is not speculative.** A snapshot-and-
 * restore that assumes one consumer breaks as soon as there are two: the second
 * claim would snapshot the first claim's `#000000`, and the first release would
 * then restore black to the operator's whole app shell permanently. Story 17.1
 * already doubled the callers from one to two, and Story 17.7 adds a route-group
 * layout over the same URLs. Only the first claim snapshots and only the last
 * release restores.
 *
 * It lives apart from the `useProjectedShell` hook because none of this is
 * React: it is a DOM mutation with a lifetime, so it is testable with a document
 * stub in the `node:test` harness, and a Server-Component layout can reach it
 * without a hook.
 */

/**
 * The subset of `document` this needs — so a test can pass a plain object.
 *
 * Named properties rather than `Record<string, string>`: a real
 * `CSSStyleDeclaration` has no index signature, so the broad form made
 * `claimProjectedShell(document)` a type error at the one call site that matters.
 */
type ClaimedProperty = 'overflow' | 'scrollbarGutter' | 'backgroundColor';

type ClaimedStyle = { [K in ClaimedProperty]: string };

export type ShellDocument = {
  documentElement: { style: ClaimedStyle };
  body: { style: ClaimedStyle };
};

/** The five properties claimed, snapshotted and restored as one unit. */
const CLAIMED: ReadonlyArray<
  readonly ['documentElement' | 'body', ClaimedProperty, string]
> = [
  ['documentElement', 'overflow', 'hidden'],
  ['body', 'overflow', 'hidden'],
  ['documentElement', 'scrollbarGutter', 'auto'],
  ['documentElement', 'backgroundColor', '#000000'],
  ['body', 'backgroundColor', '#000000'],
];

let claims = 0;
let restore: (() => void) | null = null;

/**
 * Claim the shell. Returns the release function; call it exactly once per
 * claim. Safe to nest and to interleave — React's StrictMode double-invoke in
 * development is one such interleaving.
 */
export function claimProjectedShell(doc: ShellDocument): () => void {
  if (claims === 0) {
    const previous = CLAIMED.map(
      ([element, property]) => doc[element].style[property] ?? ''
    );
    for (const [element, property, value] of CLAIMED) {
      doc[element].style[property] = value;
    }
    restore = () => {
      CLAIMED.forEach(([element, property], i) => {
        doc[element].style[property] = previous[i];
      });
    };
  }
  claims += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    claims -= 1;
    if (claims === 0 && restore) {
      restore();
      restore = null;
    }
  };
}

/** Test seam: the counter is module state, so a test must be able to zero it. */
export function resetProjectedShellForTest(): void {
  claims = 0;
  restore = null;
}
