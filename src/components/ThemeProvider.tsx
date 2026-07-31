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
 */
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
