'use client';

import { useEffect } from 'react';

/**
 * Hold the app shell at literal black for as long as a full-screen projected
 * surface is mounted, and hand it back on unmount.
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
 * This effect lived inside `ProjectorClient` until 2026-07-31, and the slideshow
 * — the same `fixed inset-0` pattern at an equally room-facing URL — had no
 * reset at all. That was survivable while the strip was permanently white: it
 * was wrong, but it was not *variable*. Story 17.1 gives the operator a theme,
 * and next-themes syncs across same-origin windows on the `storage` event, so
 * without this the strip would follow the operator's choice live, mid-service.
 * AC-4 says the projected output cannot see that choice, which is why the reset
 * belongs to whatever surface is full-screen rather than to the one file that
 * happened to hit the symptom first.
 *
 * The colour is the literal `#000000` these surfaces already paint themselves,
 * never a theme token — `tests/theme-chrome.test.mjs` asserts that too, because
 * a token here would reintroduce exactly the leak this closes.
 */
export function useProjectedShell() {
  useEffect(() => {
    const root = document.documentElement;
    const { body } = document;
    const previous = {
      rootOverflow: root.style.overflow,
      bodyOverflow: body.style.overflow,
      rootGutter: root.style.scrollbarGutter,
      rootBackground: root.style.backgroundColor,
      bodyBackground: body.style.backgroundColor,
    };
    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    root.style.scrollbarGutter = 'auto';
    root.style.backgroundColor = '#000000';
    body.style.backgroundColor = '#000000';
    return () => {
      root.style.overflow = previous.rootOverflow;
      body.style.overflow = previous.bodyOverflow;
      root.style.scrollbarGutter = previous.rootGutter;
      root.style.backgroundColor = previous.rootBackground;
      body.style.backgroundColor = previous.bodyBackground;
    };
  }, []);
}
