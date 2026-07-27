import { parseSlideTransition, type SlideTransition } from './transitions';

/**
 * The Presenter → projector wire.
 *
 * The Presenter is the single authority. Every message that touches shared
 * state carries the *intended* value rather than an instruction to flip one:
 * a bare "toggle blank" is fragile because two windows that missed different
 * messages disagree about whose turn it is, and they stay disagreeing. With the
 * state on the wire, a late or duplicated message is idempotent. The same rule
 * is why `transition` names the style it wants rather than saying "next style":
 * two projectors given a cycle instruction would end up on different styles the
 * moment one of them missed a message, and they would never converge again.
 *
 * `sync` therefore answers `request-sync` with the deck position, the blank
 * state *and* the live transition, so a projector opened or reloaded mid-session
 * comes up correct on the one round trip it already makes.
 */
export type PresentMessage =
  | {
      type: 'sync';
      index: number;
      blank: boolean;
      transition: SlideTransition;
    }
  | { type: 'request-sync' }
  | { type: 'blank'; blank: boolean }
  /**
   * A live-only override of the deck's configured transition. Nothing stores
   * it: it exists for the length of a Presenter session and no longer.
   */
  | { type: 'transition'; transition: SlideTransition }
  | {
      type: 'scripture';
      reference: string;
      text: string;
    }
  | { type: 'clear-scripture' };

/**
 * The blank state a message asserts, or `null` when it says nothing about it —
 * blanking must not disturb the scripture overlay or the deck position, so
 * `scripture` and `clear-scripture` deliberately leave it alone.
 *
 * The coercion matters at the boundary: the payload comes from another window,
 * which may still be running the build that had no `blank` field at all. Absent
 * reads as "not blanked" rather than leaving the projector in an undefined
 * state.
 */
export function blankStateOf(msg: PresentMessage): boolean | null {
  if (msg.type === 'sync' || msg.type === 'blank') return msg.blank === true;
  return null;
}

/**
 * The transition a message asserts, or `null` when it says nothing about it.
 *
 * Note where this deliberately parts company with `blankStateOf`. Absent is not
 * a value here. A projector already holds the deck's configured style, handed
 * to it by its own server render, so a message that carries no transition at
 * all — a payload from a window still running the build that had no such field
 * — must leave that setting alone rather than assert the default over it. There
 * is no equivalent fallback for blanking, which is why absent resolves to
 * `false` there and to `null` here.
 *
 * A field that *is* present but unrecognised is a different case: something on
 * the wire is wrong, and the projector still has to render. `parseSlideTransition`
 * coerces it to the default rather than throwing, exactly as a junk settings row
 * does on the server.
 */
export function liveTransitionOf(msg: PresentMessage): SlideTransition | null {
  if (msg.type !== 'sync' && msg.type !== 'transition') return null;
  // Widened on purpose: the declared type says this field is there, and the
  // sending window is the one thing that cannot be trusted to agree.
  const value: unknown = msg.transition;
  return value === undefined ? null : parseSlideTransition(value);
}

export function presentChannelName(serviceId: number | string): string {
  return `bic-present-${serviceId}`;
}

export function openPresentChannel(
  serviceId: number | string
): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  return new BroadcastChannel(presentChannelName(serviceId));
}
