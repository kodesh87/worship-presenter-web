import { listAccounts } from '@/lib/auth/accounts';
import { getPptxRetentionDays, getSlideTransition } from '@/lib/settings';
import Header from '@/components/Header';
import AccountsManager from './AccountsManager';
import RetentionSettings from './RetentionSettings';
import TransitionSettings from './TransitionSettings';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { validateSessionToken } from '@/lib/auth/require';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieStore = await cookies();
  // DB-checked, not signature-only — see `validateSessionToken`. The proxy
  // gate already enforces the admin role on `/admin`; this is the second layer.
  const session = await validateSessionToken(
    cookieStore.get(SESSION_COOKIE)?.value,
    'admin'
  );

  const db = getDb();
  const account = session
    ? (db.prepare('SELECT username FROM accounts WHERE id = ?').get(session.uid) as { username: string } | undefined)
    : null;
  const username = account?.username || 'Admin';

  const accounts = listAccounts();
  const retentionDays = getPptxRetentionDays();
  const slideTransition = getSlideTransition();

  return (
    <div className="min-h-screen bg-background text-foreground p-8 relative overflow-hidden font-sans">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40 dark:opacity-100" />
      
      {/* Glowing Ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <Header isAdmin={true} username={username} />

        <header className="mb-8 pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage Admin and Operator accounts, the slide transition and PPTX
            retention.
          </p>
        </header>

        <TransitionSettings initialTransition={slideTransition} />
        <RetentionSettings initialDays={retentionDays} />
        <AccountsManager initialAccounts={accounts} />
      </div>
    </div>
  );
}
