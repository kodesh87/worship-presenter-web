/**
 * When the Artifact canvas carries unsaved authoring, and what each exit owes
 * the operator before it discards it.
 *
 * `AD-13` gives Fabric ownership of the canvas and lets React read it only on
 * an explicit Save. The consequence is that a move, an insert, a delete or a
 * style edit is invisible to the application until then — and the editor had
 * three unguarded ways out that threw all of it away without a word: closing or
 * reloading the tab, clicking a different template in the list, and following
 * any link in the header.
 *
 * **This is a warning, never a recovery.** `AD-24` names Story 17.4 by number as
 * its live instance of the persisted-local tier's boundary: *"an `ArtifactLayout`
 * parked in `localStorage` would pass every word of the tier test while escaping
 * the entire registry write contract. Unsaved editor state stays in memory."*
 * Nothing here may serialize the canvas, and nothing here may write to browser
 * storage. The flag is a boolean that dies with the tab, on purpose.
 *
 * It lives apart from `ArtifactEditor.tsx` for the reason `project-context.md`
 * gives and `theme-cycle.ts` set the precedent for: a transition table inside a
 * `.tsx` component can only be checked by a regex over its own source, which is
 * to say not checked. Here it is a plain module the `node:test` harness calls.
 * Framework-agnostic is therefore load-bearing — no React, no Fabric, no `next`,
 * and no imports at all.
 */

/**
 * The Fabric canvas events that mean the operator changed something.
 *
 * Named once so the editor registers and tears down the same list. `object:added`
 * also fires for the seed elements a fresh mount paints, which is why the editor
 * attaches these *after* its paint loop and not before.
 */
export const CANVAS_MUTATION_EVENTS = [
  'object:added',
  'object:removed',
  'object:modified',
] as const;

export type CanvasMutationEvent = (typeof CANVAS_MUTATION_EVENTS)[number];

/**
 * Everything that can move the flag.
 *
 * `template-changed` is a fresh mount — a switch to another template, or the
 * reload that follows a 409. A freshly mounted canvas is never dirty.
 */
export type CanvasDirtyEvent = 'mutated' | 'saved' | 'reset' | 'template-changed';

/**
 * The flag after `event`, given it was `current` before.
 *
 * An event kind this table does not recognise leaves the flag alone rather than
 * clearing it. Clearing is the one direction that loses work, and a kind added
 * later but wired at only one call site would otherwise take that direction by
 * default — the same fail-closed posture `asThemeChoice` takes for a hand-edited
 * `localStorage` value.
 */
export function nextDirtyState(current: boolean, event: CanvasDirtyEvent): boolean {
  if (event === 'mutated') return true;
  if (event === 'saved' || event === 'reset' || event === 'template-changed') {
    return false;
  }
  return current;
}

/** Shown beside Save/Reset while the mounted canvas has unsaved authoring. */
export const UNSAVED_INDICATOR_LABEL = 'Unsaved changes';

/**
 * The two confirmations, deliberately not one string.
 *
 * Switching template keeps the operator on the page and loses one template's
 * work; leaving the route loses it and takes them elsewhere. Saying the same
 * sentence for both would make the smaller action read as the larger one.
 */
export const DISCARD_ON_SWITCH_CONFIRMATION =
  'This template has unsaved canvas changes. Switch template and discard them?';

export const DISCARD_ON_LEAVE_CONFIRMATION =
  'This template has unsaved canvas changes. Leave this page and discard them?';

/**
 * Whether an exit may proceed, asking only when there is something to lose.
 *
 * Shared by the template switch and by every header link, because "must not
 * prompt when nothing is dirty" is one rule and an operator who meets a dialog
 * after touching nothing stops reading dialogs.
 *
 * `confirm` is injected rather than reached for: `window.confirm` is not
 * callable from the test runner, and a caller must pass it as `(message) =>
 * window.confirm(message)` since the unbound method loses its receiver.
 */
export function mayDiscard(
  isDirty: boolean,
  message: string,
  confirm: (message: string) => boolean
): boolean {
  if (!isDirty) return true;
  return confirm(message);
}

/**
 * The subset of `BeforeUnloadEvent` this needs, so a test can pass a plain
 * object. A real `BeforeUnloadEvent` satisfies it structurally, which is what
 * keeps `window.addEventListener('beforeunload', beforeUnloadGuard)` type-safe.
 */
export type BeforeUnloadEventLike = {
  preventDefault: () => void;
  returnValue: unknown;
};

/**
 * Trigger the browser's native "leave site?" prompt.
 *
 * Both halves are required and neither is redundant: modern Chrome and Firefox
 * honour `preventDefault()`, Safari and older Chrome only honour the legacy
 * `returnValue` assignment. The string is never displayed — every browser
 * substitutes its own wording, which is why there is no message to configure.
 *
 * Whether the operator *should* be prompted is decided by registration: the
 * editor adds this listener only while an editable canvas is dirty and removes
 * it in the same effect's cleanup. A handler that decided for itself would need
 * to read React state from outside React, which is how the listener ends up
 * outliving the surface that armed it.
 */
export function beforeUnloadGuard(event: BeforeUnloadEventLike): void {
  event.preventDefault();
  event.returnValue = '';
}
