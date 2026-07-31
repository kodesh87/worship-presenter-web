'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * `text-red-600` was picked against a white dropdown. On the dark `--card` this
 * dropdown paints in once the operator can choose a theme, it measures 3.76:1
 * and fails AA. `red-400` is `oklch(0.704 0.191 22.216)` — byte for byte the
 * `.dark` block's own `--destructive` — and measures 6.21:1 here, 5.72:1 over
 * the `bg-red-500/10` hover. So the dark half is not a new shade choice; it is
 * the token this affordance would have used had it been written against one.
 */
const LOGOUT_CLASS =
  'w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50';

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
