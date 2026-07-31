'use client';

import { useEffect, useRef, useState } from 'react';
import type { SlidePlanItem } from '@/lib/slide-plan';
import SlideView from '@/components/SlideView';
import {
  blankStateOf,
  liveTransitionOf,
  openPresentChannel,
  type PresentMessage,
} from '@/lib/present-channel';
import { transitionLayerStyle, type SlideTransition } from '@/lib/transitions';
import { useProjectedShell } from '@/lib/use-projected-shell';
import { useSlideTransition } from '@/lib/use-slide-transition';

export default function ProjectorClient({
  serviceId,
  slides,
  transition: configuredTransition,
}: {
  serviceId: number;
  slides: SlidePlanItem[];
  /**
   * The deck's configured style, read server-side. It is where this window
   * starts and what it falls back to; the Presenter may override it live for
   * the length of a session, and that override is never stored anywhere.
   */
  transition: SlideTransition;
}) {
  // Seeded from the configured style rather than mirroring it, so a reload of
  // *this* window alone does not throw away an override the Presenter is still
  // holding — the `request-sync` answer below puts it back.
  const [transition, setTransition] = useState<SlideTransition>(
    configuredTransition
  );
  const { index, outgoing, phase, goTo } = useSlideTransition(
    transition,
    slides.length
  );
  const [blank, setBlank] = useState(false);
  const [overlay, setOverlay] = useState<{
    reference: string;
    text: string;
  } | null>(null);

  // `goTo` is re-created whenever the live transition changes, and the channel
  // effect must not be: tearing the channel down and re-opening it on a style
  // change would drop whatever the Presenter sent in that gap. The listener
  // reaches the current `goTo` through this ref instead, which keeps the
  // subscription pinned to `serviceId` alone.
  const goToRef = useRef(goTo);
  useEffect(() => {
    goToRef.current = goTo;
  }, [goTo]);

  useEffect(() => {
    const ch = openPresentChannel(serviceId);
    if (!ch) return;

    const onMessage = (ev: MessageEvent<PresentMessage>) => {
      const msg = ev.data;
      if (!msg || typeof msg !== 'object') return;
      // Read first and for every message that carries them, so the
      // `request-sync` answer is as authoritative as a deliberate blank or a
      // deliberate style change: a projector opened or reloaded mid-session
      // comes up black, and on the live style, off its own mount handshake —
      // with no second round trip and no frame of the wrong thing leaking out.
      const nextBlank = blankStateOf(msg);
      if (nextBlank !== null) setBlank(nextBlank);
      const nextTransition = liveTransitionOf(msg);
      if (nextTransition !== null) setTransition(nextTransition);
      if (msg.type === 'sync') {
        goToRef.current(msg.index);
        setOverlay(null);
      } else if (msg.type === 'scripture') {
        setOverlay({ reference: msg.reference, text: msg.text });
      } else if (msg.type === 'clear-scripture') {
        setOverlay(null);
      }
    };

    ch.addEventListener('message', onMessage);
    ch.postMessage({ type: 'request-sync' });
    return () => {
      ch.removeEventListener('message', onMessage);
      ch.close();
    };
  }, [serviceId]);

  // The projector is a full-screen surface that must never scroll, over an app
  // shell that paints `body` with the theme background and reserves a scrollbar
  // gutter. `useProjectedShell` holds both at literal black for as long as this
  // window is mounted and releases them on unmount; the slideshow uses the same
  // hook, because it is the same `fixed inset-0` pattern at an equally
  // room-facing URL. See that file for what the strip down the edge looked like.
  useProjectedShell();

  const slide = slides[index];
  const outgoingSlide = outgoing === null ? undefined : slides[outgoing];

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* The slide being left behind, kept mounted underneath for exactly as
          long as the run lasts. A cross-fade needs it to fade *over* something,
          and a push needs something to push; `overflow-hidden` above is what
          keeps the pushed slide off the edges of the screen. */}
      {outgoingSlide ? (
        <div
          key="outgoing"
          className="absolute inset-0"
          style={transitionLayerStyle(transition, 'outgoing', phase)}
        >
          <SlideView slide={outgoingSlide} />
        </div>
      ) : null}
      <div
        key="incoming"
        className="absolute inset-0"
        style={transitionLayerStyle(transition, 'incoming', phase)}
      >
        {overlay ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[#0B1220] px-12 text-center text-white">
            <p className="mb-4 text-lg text-[#D4A574]">{overlay.reference}</p>
            <p className="max-w-4xl text-3xl italic leading-relaxed">
              {overlay.text}
            </p>
          </div>
        ) : slide ? (
          <SlideView slide={slide} />
        ) : null}
      </div>
      {/* Outside the transition wrapper on purpose. Blanking has to preserve
          whatever is underneath — slide index and scripture overlay both — so
          it covers rather than replaces, and it must not inherit the wrapper's
          opacity or it would fade away with the next slide change. No
          animation either: "get this off the screen" is a cut, not an effect.
          `z-50` keeps it above any layered slide the transition mounts. */}
      {blank ? (
        <div aria-hidden="true" className="absolute inset-0 z-50 bg-black" />
      ) : null}
    </div>
  );
}
