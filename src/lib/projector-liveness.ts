/**
 * Whether the projector is still answering, decided by one predicate (`AD-29`).
 *
 * The presenter has two windows onto the same fact and neither is trustworthy
 * alone: the projector may be answering with no usable handle (the
 * popup-blocked fallback tab, a Presenter remount, a crashed or frozen
 * window), and a held handle may report `closed === false` for a window that
 * has stopped responding just as easily as it may report `closed === true`
 * for one that closed cleanly. `AD-29` fixes that both facts feed **one**
 * evaluator rather than two mechanisms with two verdicts — a poll that keeps
 * its own flag, or a component that renders its own "is it live" state
 * alongside this one, is the defect this module exists to make impossible to
 * write correctly.
 *
 * Framework-agnostic on purpose, on the `theme-cycle.ts`/`canvas-dirty-guard.ts`
 * precedent `project-context.md` names: no React, no `window`, no imports at
 * all, and every timestamp arrives as an argument rather than a read of
 * `Date.now()`, so `node:test` can drive a whole session's timeline
 * deterministically.
 */

/**
 * `never-opened` is silent by design — a presenter opened without a projector
 * must not warn about one, or the operator learns to ignore the line before
 * it has ever meant anything (AC-5). It is a distinct verdict from `lost`
 * precisely because "no evidence yet" and "evidence stopped" are different
 * facts, which is the boundary Story 17.4's review found its one real defect
 * at one epic earlier.
 */
export type LivenessVerdict = 'never-opened' | 'live' | 'lost';

/**
 * The four observable facts this evaluator accepts, and the only ones.
 *
 * `ack` is raised for *every* genuine projector message, the heartbeat and
 * the mount-time `request-sync` alike — both are the projector reporting
 * that it is there, and neither carries anything else into this module.
 * (Classifying *which* inbound wire messages are genuinely projector-
 * originated, as opposed to another Presenter tab's own broadcast state, is
 * `present-channel.ts`'s `isProjectorMessage` — a wire-shape concern, not a
 * liveness-timing one, so it lives there rather than duplicating a second
 * copy of `PresentMessage`'s variants in this import-free module.)
 * `handle-closed` is raised only when the poll has read `.closed === true` on
 * a handle that is not `null`; a `null` or stale handle is not evidence of
 * death and must never be turned into this event (AC-4). `opened` is raised
 * when the operator's `openProjector` makes an attempt — a fresh
 * `window.open` or a reattach of an existing handle — so that an attempt
 * which never draws a first `ack` does not sit `never-opened` forever
 * (Review finding [High, blocking]: AD-29's "uncertainty resolves to lost"
 * applies here exactly as it does to a stale handle). `tick` carries no new
 * evidence — it asks the evaluator to re-check whether the freshness window
 * has elapsed since the last `ack`, or since the last open attempt if none
 * ever arrived.
 */
export type LivenessEvent =
  | { type: 'ack' }
  | { type: 'handle-closed' }
  | { type: 'opened' }
  | { type: 'tick' };

export type LivenessState = {
  verdict: LivenessVerdict;
  /** `null` until the first `ack` this session; never cleared by a tick. */
  lastAckAtMs: number | null;
  /**
   * `null` until `openProjector` first attempts to open or reattach the
   * projector; never cleared by a tick. Only consulted while `lastAckAtMs`
   * is still `null` — once any ack has ever arrived, staleness is judged
   * against it instead, exactly as before this field existed.
   */
  openedAtMs: number | null;
};

/** Where every presenter session starts: no projector has announced itself yet. */
export const INITIAL_LIVENESS_STATE: LivenessState = {
  verdict: 'never-opened',
  lastAckAtMs: null,
  openedAtMs: null,
};

/**
 * The projector's heartbeat interval and the presenter's patience for it —
 * one pair, exported once, consumed by both windows (`AD-29`), so neither
 * side can pick an honest number independently and end up disagreeing with
 * the other about what "recent" means.
 *
 * Sized against a stated assumption rather than guessed, recorded in full in
 * the Dev Agent Record and in `ARCHITECTURE-SPINE.md:448`: the projector is a
 * popup window on a second screen, ordinarily visible, so it does not suffer
 * ordinary background-tab timer throttling (which groups timers to roughly
 * once per second) — only the narrow, real cases where the operator minimises
 * or fully obscures it, or the presenter's own tab is switched away while
 * they read the run sheet. The freshness window is three heartbeats, which
 * absorbs one or two missed beats from ordinary jitter without flapping to a
 * false `lost`, while still reporting a real death in single-digit seconds —
 * "well under a second" is met separately, by the `handle-closed` fast path
 * below, which does not wait out this window at all.
 */
export const PROJECTOR_HEARTBEAT_INTERVAL_MS = 2_000;

/** Three heartbeats. See `PROJECTOR_HEARTBEAT_INTERVAL_MS` for the sizing rationale. */
export const LIVENESS_FRESHNESS_WINDOW_MS = PROJECTOR_HEARTBEAT_INTERVAL_MS * 3;

/**
 * The one predicate. Every later signal — a `pagehide`, a `visibilitychange`,
 * a second retained handle — joins as another event here or it is not part of
 * this decision (`AD-29`).
 *
 * Precedence, and it is asymmetric on purpose rather than a tuning choice:
 * an `ack` is authoritative for `live`, whatever the handle last reported —
 * including a `handle-closed` this same evaluator recorded a moment ago,
 * because a fresh handle after a reopen answers `request-sync` immediately
 * and that answer is this session's newest evidence. A `handle-closed` is
 * authoritative for `lost`, immediately, without waiting out the freshness
 * window — a clean close is the common case and belongs on the operator's
 * screen in well under a second. Neither is authoritative for the other, so
 * the two never race: whichever fact was observed most recently decides,
 * `tick` only ever *expires* stale evidence, never manufactures fresh
 * evidence of either kind. Where nothing can be certain, this resolves to
 * `lost` — a false `live` is unrecoverable within the service; a false `lost`
 * self-clears on the next `ack`. `opened` is the same rule applied to the
 * never-opened side of the boundary: an attempt with no `ack` ever following
 * is exactly as uncertain as a stale handle, and ages out to `lost` on the
 * same freshness window rather than staying silent forever.
 */
export function nextLivenessState(
  state: LivenessState,
  event: LivenessEvent,
  nowMs: number
): LivenessState {
  if (event.type === 'ack') {
    return { verdict: 'live', lastAckAtMs: nowMs, openedAtMs: state.openedAtMs };
  }

  if (event.type === 'handle-closed') {
    // Idempotent the same way an unprompted heartbeat is: a poll that keeps
    // observing the same closed handle every 200ms for the rest of a service
    // must not manufacture a new state (and a new render) on every reading.
    if (state.verdict === 'lost') return state;
    return { verdict: 'lost', lastAckAtMs: state.lastAckAtMs, openedAtMs: state.openedAtMs };
  }

  if (event.type === 'opened') {
    // Only meaningful while nothing has ever answered: once a `live` or
    // `lost` verdict exists, an ack or a handle reading already decides
    // freshness and an open attempt adds nothing. Recording it here, rather
    // than deciding anything about it directly, is what keeps this a single
    // evaluator — `openProjector` reports the fact, the `tick` branch below
    // is the only place that turns it into a verdict.
    if (state.verdict !== 'never-opened') return state;
    return { ...state, openedAtMs: nowMs };
  }

  // 'tick': re-check freshness. A `lost` verdict, however it was reached,
  // stays `lost` until the next `ack`: a tick carries no fresh evidence, so
  // it may only ever *expire* a `live` verdict (or a `never-opened` one with
  // a stale-enough open attempt), never revive one. Returning the same
  // `state` reference whenever nothing actually changes lets a caller wiring
  // this into `useState` bail out with `Object.is` instead of re-rendering
  // on every poll.
  if (state.verdict === 'lost') return state;

  if (state.lastAckAtMs !== null) {
    const stale = nowMs - state.lastAckAtMs > LIVENESS_FRESHNESS_WINDOW_MS;
    if (!stale) return state;
    return { ...state, verdict: 'lost' };
  }

  // No ack has ever arrived. Silence alone is not evidence — `never-opened`
  // stays silent until something is attempted (AD-29: "no evidence yet is a
  // distinct verdict from evidence stopped"). But once the operator *has*
  // attempted to open the projector and the freshness window elapses with
  // still no ack, the uncertainty resolves to `lost` rather than sitting
  // `never-opened` forever (Review finding [High, blocking]) — the same
  // "resolve the uncertain case to lost" rule AD-29 already applies to a
  // stale handle, applied here to a receiver that has never acknowledged at
  // all.
  if (state.openedAtMs === null) return state;
  const staleOpen = nowMs - state.openedAtMs > LIVENESS_FRESHNESS_WINDOW_MS;
  if (!staleOpen) return state;
  return { ...state, verdict: 'lost' };
}
