import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { validateSessionToken } from '@/lib/auth/require';
import Header from '@/components/Header';
import ArtifactEditor from '@/components/admin/ArtifactEditor';
import { NavigationBlockerProvider } from '@/components/navigation-blocker';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminArtifactsPage() {
  const cookieStore = await cookies();
  // DB-checked, not signature-only — see `validateSessionToken`.
  const session = await validateSessionToken(
    cookieStore.get(SESSION_COOKIE)?.value,
    'admin'
  );

  const db = getDb();
  const account = session
    ? (db
        .prepare('SELECT username FROM accounts WHERE id = ?')
        .get(session.uid) as { username: string } | undefined)
    : null;
  const username = account?.username || 'Admin';

  return (
    <div className="min-h-screen bg-background p-8 font-sans text-foreground">
      <div className="relative z-10 mx-auto max-w-6xl">
        {/* The editor writes the blocked flag and the header's links read it, so
            the provider has to contain both. It mounts here and not on
            `src/app/layout.tsx`: AD-24 puts a client boundary at the narrowest
            layout covering its consumers, and every consumer of this one is on
            this page. Passing `children` through it does not make them client
            components — they arrive already server-rendered. */}
        <NavigationBlockerProvider>
          <Header isAdmin={true} username={username} />
          <header className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight">Artifact Registry</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Edit global slide templates. Changes persist in SQLite; explicit Save required.
            </p>
          </header>
          <ArtifactEditor />
        </NavigationBlockerProvider>
      </div>
    </div>
  );
}
