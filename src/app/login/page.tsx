'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { safeNextPath } from '@/lib/auth/safe-next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || 'Invalid username or password');
      }
      router.replace(safeNextPath(searchParams.get('next')));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full border border-border/80 bg-card/60 backdrop-blur-xl p-8 rounded-2xl shadow-xl relative overflow-hidden">
      {/* Subtle top border highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Username
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-border/80 bg-background/50 px-4 py-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/30"
            required
            placeholder="Enter your username"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border/80 bg-background/50 px-4 py-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/30"
            required
            placeholder="Enter your password"
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive font-medium animate-pulse" role="alert">
            {error}
          </p>
        ) : null}
        <button 
          type="submit" 
          className="w-full py-3.5 mt-2 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-primary/10 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          disabled={busy}
        >
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic Grid Background (Adaptive for Light and Dark mode) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40 dark:opacity-100" />
      
      {/* Glowing Ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md flex flex-col items-center relative z-10">
        {/* Modern Presentation Logo Icon */}
        <div className="mb-6 flex items-center justify-center w-12 h-12 rounded-xl border border-border bg-card/80 backdrop-blur-md shadow-md text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0h.5m-.5 0h-10.5m.5 0h-1.5" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/75 bg-clip-text text-transparent">
          BIC Presenter Hub
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Sign in to manage presentation slides</p>
        
        <Suspense fallback={<p className="text-sm text-muted-foreground text-center">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
