/**
 * The Presenter → projector wire.
 *
 * Neither window is testable here — the repo has no DOM harness — but the parts
 * that actually decide what the congregation sees are not the markup, they are
 * the rules for reading blank state and the live transition off a message.
 * Both are pure functions, so both are asserted here: which messages are
 * authoritative, which must leave the receiver alone, and what a payload from a
 * window still running an older build resolves to.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const {
  blankStateOf,
  liveTransitionOf,
  openPresentChannel,
  presentChannelName,
} = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'present-channel.ts')).href
);

const { DEFAULT_SLIDE_TRANSITION, SLIDE_TRANSITIONS } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'transitions.ts')).href
);

test('channel name is stable and scoped to one service', () => {
  assert.equal(presentChannelName(7), 'bic-present-7');
  assert.equal(presentChannelName('7'), 'bic-present-7');
  assert.notEqual(presentChannelName(7), presentChannelName(8));
});

test('openPresentChannel yields null where BroadcastChannel is absent', () => {
  const saved = globalThis.BroadcastChannel;
  delete globalThis.BroadcastChannel;
  try {
    assert.equal(openPresentChannel(1), null);
  } finally {
    globalThis.BroadcastChannel = saved;
  }
});

test('sync is authoritative about blank, so a fresh projector comes up right', () => {
  // This is the `request-sync` answer. A projector opened or reloaded while
  // blanked has exactly this one message to go on.
  assert.equal(blankStateOf({ type: 'sync', index: 4, blank: true }), true);
  assert.equal(blankStateOf({ type: 'sync', index: 4, blank: false }), false);
});

test('advancing while blanked keeps the projector black', () => {
  // The Presenter moves the deck and re-asserts the blank state on the same
  // message; nothing here may reset it just because the index changed.
  assert.equal(blankStateOf({ type: 'sync', index: 9, blank: true }), true);
});

test('blank carries the intended state, not a toggle', () => {
  assert.equal(blankStateOf({ type: 'blank', blank: true }), true);
  assert.equal(blankStateOf({ type: 'blank', blank: false }), false);
  // Applying the same message twice must not invert anything — that is the
  // whole reason the state travels instead of an instruction to flip.
  const msg = { type: 'blank', blank: true };
  assert.equal(blankStateOf(msg), blankStateOf(msg));
});

test('scripture messages say nothing about blank', () => {
  // `null`, not `false`: blanking must not clear the overlay and showing an
  // overlay must not unblank. Either one collapsing to a boolean would make one
  // of those two things happen.
  assert.equal(
    blankStateOf({ type: 'scripture', reference: 'John 4:23', text: '...' }),
    null
  );
  assert.equal(blankStateOf({ type: 'clear-scripture' }), null);
  assert.equal(blankStateOf({ type: 'request-sync' }), null);
});

test('a payload without blank reads as not blanked', () => {
  // A window still running the build that had no blank field at all. Absent
  // must resolve to a definite state rather than leaving the projector holding
  // `undefined`.
  assert.equal(blankStateOf({ type: 'sync', index: 0 }), false);
  assert.equal(blankStateOf({ type: 'blank' }), false);
  assert.equal(blankStateOf({ type: 'blank', blank: 'yes' }), false);
});

test('the sync answer carries index, blank and transition together', () => {
  // This one message is everything a projector opened or reloaded mid-session
  // has to go on. If the transition were left off it, that window would come up
  // on the deck's configured style while every other projector in the room ran
  // the operator's live choice — the exact split this shape exists to prevent.
  const answer = {
    type: 'sync',
    index: 12,
    blank: true,
    transition: 'push',
  };
  assert.equal(answer.index, 12);
  assert.equal(blankStateOf(answer), true);
  assert.equal(liveTransitionOf(answer), 'push');
});

test('transition carries the intended style, not a cycle', () => {
  // Two projectors have to converge. A "next style" instruction would leave one
  // that missed a message permanently one step behind; naming the style makes a
  // duplicated or late message idempotent.
  for (const style of SLIDE_TRANSITIONS) {
    assert.equal(liveTransitionOf({ type: 'transition', transition: style }), style);
  }
  const msg = { type: 'transition', transition: 'dissolve' };
  assert.equal(liveTransitionOf(msg), liveTransitionOf(msg));
});

test('an unknown style coerces to the default rather than throwing', () => {
  // Junk on the wire must not take the projector down mid-service, and it must
  // not leave it rendering with an undefined spec either.
  assert.equal(
    liveTransitionOf({ type: 'transition', transition: 'morph' }),
    DEFAULT_SLIDE_TRANSITION
  );
  assert.equal(
    liveTransitionOf({ type: 'sync', index: 0, blank: false, transition: 42 }),
    DEFAULT_SLIDE_TRANSITION
  );
  assert.equal(
    liveTransitionOf({ type: 'sync', index: 0, blank: false, transition: null }),
    DEFAULT_SLIDE_TRANSITION
  );
});

test('messages that say nothing about the style leave it alone', () => {
  // `null`, not the default: pushing scripture or blanking must not quietly
  // reset a live transition the operator chose.
  assert.equal(liveTransitionOf({ type: 'blank', blank: true }), null);
  assert.equal(liveTransitionOf({ type: 'clear-scripture' }), null);
  assert.equal(liveTransitionOf({ type: 'request-sync' }), null);
  assert.equal(
    liveTransitionOf({ type: 'scripture', reference: 'John 4:23', text: '...' }),
    null
  );
});

test('a sync with no transition field leaves the projector on its own setting', () => {
  // Deliberately unlike `blankStateOf`, and the asymmetry is the point: a
  // projector already holds the deck's configured style from its own server
  // render, so a payload from a window that predates this field must not assert
  // the default over it. Blanking has no such fallback, which is why absent
  // resolves to `false` there and to `null` here.
  assert.equal(liveTransitionOf({ type: 'sync', index: 3, blank: false }), null);
  assert.equal(liveTransitionOf({ type: 'transition' }), null);
});
