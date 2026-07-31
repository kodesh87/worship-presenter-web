'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * `text-destructive`, not a hand-rolled `red-600`/`red-400` pair, because the
 * two are the same colour: Tailwind's `--color-red-600` is
 * `oklch(57.7% 0.245 27.325)` and `:root --destructive` is
 * `oklch(0.577 0.245 27.325)`; `--color-red-400` is
 * `oklch(70.4% 0.191 22.216)` and `.dark --destructive` is
 * `oklch(0.704 0.191 22.216)`. Byte-identical on both halves, so the token
 * reproduces the whole shipped effect (6.21:1 on the dark card, 5.72:1 over the
 * `bg-red-500/10` hover) and cannot drift when the destructive identity is
 * retuned. The pair was written against a white dropdown, before the operator
 * could choose a theme; naming the token is what it meant all along.
 */
const LOGOUT_CLASS =
  'w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-red-500/10 text-destructive transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50';

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      router.replace('/login');
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className={LOGOUT_CLASS}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
      </svg>
      {busy ? 'Signing out…' : 'Log out'}
    </button>
  );
}
