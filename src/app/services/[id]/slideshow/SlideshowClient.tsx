'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import type { SlidePlanItem } from '@/lib/slide-plan';
import SlideView from '@/components/SlideView';
import { transitionLayerStyle, type SlideTransition } from '@/lib/transitions';
import { useProjectedShell } from '@/lib/use-projected-shell';
import { useSlideTransition } from '@/lib/use-slide-transition';

export default function SlideshowClient({
  serviceId,
  serviceDate,
  slides,
  transition,
}: {
  serviceId: number;
  serviceDate: string;
  slides: SlidePlanItem[];
  transition: SlideTransition;
}) {
  const { index, outgoing, phase, goTo, goBy } = useSlideTransition(
    transition,
    slides.length
  );

  // `bg-black` below covers this surface, but not the shell behind it: `body`
  // carries `bg-background` and `html` reserves a scrollbar gutter, so the theme
  // paints a strip down the edge that `fixed inset-0` never reaches. The
  // projector neutralised that for itself from the start; this surface did not,
  // and once an operator can pick a theme the strip follows the pick — live,
  // because next-themes syncs across same-origin windows. AC-4.
  useProjectedShell();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        goBy(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goBy(-1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        // Home/End used to jump with no transition at all. They go through the
        // same run as every other move now.
        goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(slides.length - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goBy, goTo, slides.length]);

  const slide = slides[index];
  const outgoingSlide = outgoing === null ? undefined : slides[outgoing];

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white">
      <div className="absolute left-3 top-3 z-10 flex gap-3 text-xs text-white/70">
        <Link href={`/services/${serviceId}`} className="hover:text-white">
          Exit
        </Link>
        <span>
          {serviceDate} · {index + 1}/{slides.length}
        </span>
      </div>
      {/* The slide being left behind, kept mounted underneath for exactly as
          long as the run lasts — see `useSlideTransition`. */}
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
        {slide ? <SlideView slide={slide} /> : null}
      </div>
    </div>
  );
}
