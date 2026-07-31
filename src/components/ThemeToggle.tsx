'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon, MonitorIcon, SunMoonIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HEADER_CONTROL_BOX } from './header-chrome';
import {
  asThemeChoice,
  nextTheme,
  THEME_LABEL,
  type ThemeChoice,
} from '@/lib/theme-cycle';

/**
 * One control cycling system -> light -> dark -> system.
 *
 * A cycle rather than a dropdown because the header has no menu primitive and
 * three states do not earn one; `popover` is installed but is used for lookups,
 * not for settings. `system` stays in the cycle deliberately — it is the default
 * an operator gets on a first visit, and a two-way switch would make it
 * unreachable again the moment they touched the control once.
 *
 * Nothing theme-dependent renders before mount. next-themes cannot know the
 * resolved theme during SSR, so a control that rendered its state anyway would
 * flip after hydration — on the one control whose whole job is to report state.
 *
 * **The placeholder shows a state that does not exist**, deliberately. It used
 * to show `MonitorIcon`, which *is* the `system` icon, so every operator who had
 * ever picked light or dark watched their control claim `system` for a frame and
 * then correct itself — next-themes seeds `theme` from `localStorage` inside
 * `useState`, so the choice is already known on the hydration render while
 * `mounted` is still the server's `false`. `SunMoonIcon` belongs to none of the
 * three states, so the one substitution that remains is placeholder → state, and
 * never state → different state.
 *
 * Like every other control in this header, it needs hydration to work: the
 * profile dropdown and logout are equally client-side. What it must not do is
 * *look* interactive while inert, which is why the placeholder is focusable and
 * `aria-disabled` rather than natively disabled.
 */

/**
 * Hydration detection without `setState` in an effect, which
 * `react-hooks/set-state-in-effect` rejects under React 19. React uses the
 * server snapshot for the hydration render and the client snapshot after it, so
 * `mounted` flips exactly once, at the moment the resolved theme is knowable.
 * The three callbacks live at module scope so they stay referentially stable.
 */
const neverChanges = () => () => {};
const hydrated = () => true;
const notYetHydrated = () => false;

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(neverChanges, hydrated, notYetHydrated);

  // Order, wrap-around and labels come from `@/lib/theme-cycle`. They used to
  // live here, where the modulo could only be checked by a regex over this
  // file's own text — which is where an off-by-one ships green.
  const current: ThemeChoice = asThemeChoice(theme);
  const next = nextTheme(current);

  // The box comes from `header-chrome` rather than being restated here, so a
  // restyle of the nav pills carries the toggle with it. It used to reproduce
  // those seven classes by hand, which is the drift this control specifically
  // cannot have — matching its siblings is the whole point of the shape.
  //
  // The `dark:` half stays local, because it is a `Button` problem the `<Link>`
  // pills do not have. `outline` carries
  // `dark:border-input dark:bg-input/30 dark:hover:bg-input/50` (`ui/button.tsx`),
  // and `tailwind-merge` does not treat a `dark:`-prefixed class as conflicting
  // with an unprefixed one, so an unprefixed override cannot displace them and
  // `:is(.dark *)` out-specifies it. Without these the toggle renders its box at
  // `input/30` (#151515 over `--background`) while the pills stay at `card/50`
  // (#111111). Matching in light and drifting in dark is the one failure this
  // control cannot have: dark is the mode it exists to enable.
  const shell = `size-[2.375rem] ${HEADER_CONTROL_BOX} dark:border-border dark:bg-card/50 dark:hover:bg-card`;

  // Before mount the button is present, sized, focusable and inert. Base UI's
  // `focusableWhenDisabled` emits `aria-disabled` and keeps `tabIndex=0` instead
  // of the native `disabled` attribute, so focus order does not shift on
  // hydration and `disabled:opacity-50` never fires — the box does not step from
  // 50% to 100% opacity either.
  //
  // That same absence of a native `disabled` is why the hover has to be killed
  // by hand: Tailwind's `disabled:` variant compiles to `:disabled`, so NEITHER
  // `disabled:opacity-50` nor `disabled:pointer-events-none` from
  // `buttonVariants` reaches an `aria-disabled` element — and the placeholder
  // kept `hover:bg-card hover:text-foreground` from the shared box and lit up
  // under the cursor while inert. `aria-disabled:pointer-events-none` is the
  // `aria` twin of the class that was meant to do this. It also means a click
  // here passes through to the header row rather than being swallowed, which is
  // the same nothing from the operator's side.
  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className={`${shell} aria-disabled:pointer-events-none`}
        aria-label="Theme"
        disabled
        focusableWhenDisabled
      >
        <SunMoonIcon aria-hidden="true" />
      </Button>
    );
  }

  const Icon =
    current === 'light' ? SunIcon : current === 'dark' ? MoonIcon : MonitorIcon;

  return (
    <Button
      variant="outline"
      size="icon"
      className={shell}
      onClick={() => setTheme(next)}
      aria-label={`${THEME_LABEL[current]}. Switch to: ${THEME_LABEL[
        next
      ].toLowerCase()}`}
      title={THEME_LABEL[current]}
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}
