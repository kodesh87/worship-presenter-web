'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Role } from '@/lib/auth/session';

export type AccountRow = {
  id: number;
  username: string;
  role: Role;
  created_at: string;
};

export default function AccountsManager({
  initialAccounts,
}: {
  initialAccounts: AccountRow[];
}) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('operator');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetPw, setResetPw] = useState<Record<number, string>>({});

  useEffect(() => {
    setAccounts(initialAccounts);
  }, [initialAccounts]);

  const refresh = (next: AccountRow[]) => {
    setAccounts(next);
    router.refresh();
  };

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      setUsername('');
      setPassword('');
      setRole('operator');
      refresh([...accounts, data.account]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setBusy(false);
    }
  };

  const handleRoleChange = async (id: number, nextRole: Role) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');
      refresh(
        accounts.map((a) => (a.id === id ? (data.account as AccountRow) : a))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update role');
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (id: number) => {
    const password = (resetPw[id] || '').trim();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setResetPw((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reset password');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete account “${name}”?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/accounts/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      refresh(accounts.filter((a) => a.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            Roles are admin (full) or operator (hub only).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <input
              type="password"
              placeholder="Password (min 8)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="operator">operator</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <Button onClick={handleCreate} disabled={busy}>
            Create
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>
            {accounts.length} account{accounts.length === 1 ? '' : 's'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts yet.</p>
          ) : (
            accounts.map((a) => (
              <div
                key={a.id}
                className="border-b border-border pb-4 last:border-0 last:pb-0 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{a.username}</p>
                    <p className="text-xs text-muted-foreground">
                      id {a.id} · created{' '}
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={a.role}
                      disabled={busy}
                      onChange={(e) =>
                        handleRoleChange(a.id, e.target.value as Role)
                      }
                      className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                    >
                      <option value="operator">operator</option>
                      <option value="admin">admin</option>
                    </select>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={busy}
                      onClick={() => handleDelete(a.id, a.username)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="password"
                    placeholder="New password"
                    value={resetPw[a.id] || ''}
                    onChange={(e) =>
                      setResetPw((prev) => ({
                        ...prev,
                        [a.id]: e.target.value,
                      }))
                    }
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 min-w-[12rem]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => handleResetPassword(a.id)}
                  >
                    Reset password
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
