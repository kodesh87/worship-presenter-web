'use client';

import ArtifactSlide from '@/components/artifacts/ArtifactSlide';
import type { SlidePlanItem } from '@/lib/slide-plan';

/**
 * Thin adapter kept for the slideshow / presenter / projector call sites: every
 * plan item carries its hydrated artifact, so all rendering lives in
 * `ArtifactSlide` and no per-`SlideKind` styling remains here.
 */
export default function SlideView({
  slide,
  className = '',
}: {
  slide: SlidePlanItem;
  className?: string;
}) {
  return <ArtifactSlide instance={slide.artifact} className={className} />;
}
