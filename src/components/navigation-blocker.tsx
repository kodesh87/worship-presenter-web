'use client';

import Link from 'next/link';
import { createContext, useContext, useMemo, useState } from 'react';
import {
  DISCARD_ON_LEAVE_CONFIRMATION,
  mayDiscard,
} from '@/lib/canvas-dirty-guard';

/**
 * A page-scoped way for one surface to refuse to be navigated away from, and
 * for the shared header's links to honour that refusal.
 *
 * This is Next 16's own documented shape for the problem
 * (`node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md`
 * → *Blocking navigation*): a context, a `CustomLink` that calls
 * `event.preventDefault()` from `onNavigate`, and a provider. The App Router has
 * no `router.events` and no `beforeRouteChange`; `onNavigate` is the supported
 * hook and inventing a `popstate` interception instead would be a second
 * mechanism to keep working.
 *
 * **Two deliberate departures from that snippet, both load-bearing.**
 *
 * The documentation mounts the provider in the root layout. `AD-24` says a
 * client boundary mounts at the narrowest layout covering its consumers and
 * never on `layout.tsx` itself, and here the only writer (`ArtifactEditor`) and
 * the only readers (`Header`'s links, as rendered on that same page) both live
 * inside `AdminArtifactsPage` — so it mounts there. Every other gated page
 * renders `Header` with no provider above it, reads the module default
 * (`isBlocked: false`) and behaves exactly as before. That is why the default is
 * a real value and not `undefined` guarded by a throwing hook: a hook that
 * insisted on a provider would break every page that legitimately has none.
 *
 * The snippet also writes `onNavigate` *before* `{...props}`, which lets a
 * caller pass their own and silently switch the guard off. The spread goes
 * first here, and `onNavigate` is removed from the public prop type, so the
 * attempt is a compile error rather than a quiet hole.
 *
 * It sits at `src/components/` rather than under `admin/` because `Header` is
 * shared chrome on every gated page: the import graph is app-wide even though
 * the only provider is on one route.
 */

type NavigationBlockerContextValue = {
  isBlocked: boolean;
  setIsBlocked: (isBlocked: boolean) => void;
};

export const NavigationBlockerContext =
  createContext<NavigationBlockerContextValue>({
    isBlocked: false,
    setIsBlocked: () => {},
  });

export function NavigationBlockerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isBlocked, setIsBlocked] = useState(false);
  // `setIsBlocked` is a stable `useState` setter, so the identity of the value
  // object is the only thing that would churn — and it is a dependency of the
  // effect in `ArtifactEditor` that writes to it.
  const value = useMemo(() => ({ isBlocked, setIsBlocked }), [isBlocked]);

  return (
    <NavigationBlockerContext.Provider value={value}>
      {children}
    </NavigationBlockerContext.Provider>
  );
}

export function useNavigationBlocker() {
  return useContext(NavigationBlockerContext);
}

type CustomLinkProps = Omit<React.ComponentProps<typeof Link>, 'onNavigate'>;

/**
 * `next/link`'s `Link`, with one added behaviour: while something on the page is
 * blocked, following it asks first and stays put if the operator declines.
 *
 * Unblocked — which is every page with no provider above it — this asks nothing
 * and renders an ordinary `Link`.
 */
export function CustomLink({ children, ...props }: CustomLinkProps) {
  const { isBlocked } = useNavigationBlocker();

  return (
    <Link
      {...props}
      onNavigate={(event) => {
        const proceed = mayDiscard(
          isBlocked,
          DISCARD_ON_LEAVE_CONFIRMATION,
          (message) => window.confirm(message)
        );
        if (!proceed) event.preventDefault();
      }}
    >
      {children}
    </Link>
  );
}
