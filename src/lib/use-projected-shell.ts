'use client';

import { useEffect } from 'react';
import { claimProjectedShell } from './projected-shell';

/**
 * React binding for `claimProjectedShell` — see that file for what the strip
 * down the edge of the projected screen looked like, and for why the claim is
 * reference-counted rather than a plain snapshot/restore pair.
 *
 * The hook is deliberately this thin. The DOM half has no React in it, which is
 * what lets `tests/theme-chrome.test.mjs` drive the set *and* the restore path
 * against a document stub: the restore path is where a bug leaves the operator's
 * whole app shell pinned at literal black after they leave a projected route,
 * and it is not reachable from a regex over source text.
 */
export function useProjectedShell() {
  useEffect(() => claimProjectedShell(document), []);
}
