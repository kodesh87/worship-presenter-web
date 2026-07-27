'use client';

/**
 * The browser half of a slide transition, shared by the projector and the
 * slideshow so the two surfaces cannot drift from each other or from the deck.
 * Every visual parameter comes from the table in `./transitions`; this hook
 * only owns the timing.
 *
 * The mechanism it replaces was not a cross-fade at all: one slide was mounted
 * and the index swapped on the frame *after* the opacity started dropping, so
 * a "fade" read as a cut into a fade-in. Here the outgoing slide stays mounted
 * underneath the incoming one for the run's duration, which is what makes a
 * cross-fade cross and gives a push something to push.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SLIDE_TRANSITION_SPECS,
  type SlideTransition,
  type TransitionPhase,
} from './transitions';

export type SlideTransitionRun = {
  /** The slide on top — the one the deck is on. */
  index: number;
  /** The slide still mounted underneath, or `null` between runs. */
  outgoing: number | null;
  phase: TransitionPhase;
  /** Move to a slide (clamped), running the configured transition. */
  goTo: (target: number) => void;
  /**
   * Step relative to where the deck actually is. Reads the live position, not
   * a rendered one, so two arrow presses inside a single frame move two slides
   * instead of collapsing into one.
   */
  goBy: (delta: number) => void;
};

export function useSlideTransition(
  transition: SlideTransition,
  slideCount: number
): SlideTransitionRun {
  const spec = SLIDE_TRANSITION_SPECS[transition];
  const [index, setIndex] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [phase, setPhase] = useState<TransitionPhase>('active');
  // The deck position is read inside a callback that must not re-create itself
  // on every slide change — the projector's channel listener depends on it.
  const indexRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelRun = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => cancelRun, [cancelRun]);

  const goTo = useCallback(
    (target: number) => {
      const next = Math.min(Math.max(target, 0), Math.max(slideCount - 1, 0));
      if (next === indexRef.current) return;
      const current = indexRef.current;
      indexRef.current = next;

      cancelRun();

      const { durationMs, outgoing: outgoingKeyframes } = spec.browser;
      if (durationMs <= 0) {
        setOutgoing(null);
        setPhase('active');
        setIndex(next);
        return;
      }

      // One render mounts both layers at their `from` styles with transitions
      // switched off, so a run restarted mid-flight snaps back rather than
      // playing itself in reverse. Two frames later the `to` styles give the
      // browser something to animate towards — one frame is not reliably
      // enough for the freshly mounted layer to have been laid out.
      setOutgoing(outgoingKeyframes ? current : null);
      setPhase('initial');
      setIndex(next);

      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = requestAnimationFrame(() => {
          frameRef.current = null;
          setPhase('active');
        });
      });
      // Ending the run also settles the phase, which matters only when the two
      // frames above never arrive: a browser stops serving rAF to a window it
      // considers hidden (Windows occlusion tracking will do that to a
      // projector sitting behind another window), and without this the
      // incoming slide would sit at `from` — invisible, or off to the side —
      // until that window came back. Timers are merely throttled, not stopped,
      // so this settles it either way. In the ordinary visible case the phase
      // is already `active` and React bails out of the re-render.
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setOutgoing(null);
        setPhase('active');
      }, durationMs);
    },
    [cancelRun, slideCount, spec]
  );

  const goBy = useCallback(
    (delta: number) => goTo(indexRef.current + delta),
    [goTo]
  );

  return { index, outgoing, phase, goTo, goBy };
}
