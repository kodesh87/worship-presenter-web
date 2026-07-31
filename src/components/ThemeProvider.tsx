'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * The client boundary for theming, kept in its own file so `layout.tsx` stays a
 * Server Component. `attribute="class"` is not a preference: the palette in
 * `globals.css` is keyed on `.dark` via `@custom-variant dark (&:is(.dark *))`,
 * so the class is what the tokens already respond to.
 *
 * This provider governs operator chrome only. The presenter and slide-grid
 * surfaces pin `.dark` on their own wrappers and keep winning for their own
 * subtree; the projected output paints in literal colours and never reads a
 * theme token at all (pinned by `tests/theme-chrome.test.mjs`).
 *
 * `disableTransitionOnChange` because this shell is full of `transition-all`:
 * every nav pill from `header-chrome`, the profile button, the logo tile, the
 * dropdown items and every `buttonVariants` control. Without the flag a theme
 * flip animates all of them at once and the shell smears through an
 * intermediate palette instead of repainting — on the one control whose job is
 * to make the change read as deliberate. next-themes ships the flag for exactly
 * this: it injects a `* { transition: none }` rule for one frame.
 */
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
