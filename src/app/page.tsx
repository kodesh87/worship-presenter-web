import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { validateSessionToken } from '@/lib/auth/require';
import Header from '@/components/Header';
import ServicesList from './ServicesList';

export default async function Dashboard() {
  const cookieStore = await cookies();
  // DB-checked, not signature-only: the proxy gate already refuses a revoked
  // or demoted cookie, but this page is the second layer if that ever
  // regresses — and `session.role` here is the account row, not the claim.
  const session = await validateSessionToken(
    cookieStore.get(SESSION_COOKIE)?.value
  );
  const isAdmin = session?.role === 'admin';

  const db = getDb();
  const account = session
    ? (db.prepare('SELECT username FROM accounts WHERE id = ?').get(session.uid) as { username: string } | undefined)
    : null;
  const username = account?.username || 'Operator';

  const services = db
    .prepare(
      'SELECT id, date, parsed_data, created_at FROM services ORDER BY date DESC, created_at DESC'
    )
    .all() as {
    id: number;
    date: string;
    parsed_data: string | null;
    created_at: string;
  }[];

  return (
    <div className="min-h-screen bg-background text-foreground p-8 relative overflow-hidden font-sans">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40 dark:opacity-100" />
      
      {/* Glowing Ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <Header isAdmin={isAdmin} username={username} />

        <ServicesList services={services} />
      </div>
    </div>
  );
}
