'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function RetentionSettings({
  initialDays,
}: {
  initialDays: number;
}) {
  const [days, setDays] = useState(initialDays);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pptx_retention_days: days }),
      });
      if (!res.ok) throw new Error('save failed');
      const data = (await res.json()) as {
        pptx_retention_days: number;
        cache_files_removed: number;
      };
      setDays(data.pptx_retention_days);
      setMessage(
        `Saved. Removed ${data.cache_files_removed} expired cache file(s).`
      );
    } catch {
      setMessage('Failed to save retention setting.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>PPTX retention</CardTitle>
        <CardDescription>
          Deletes only cached generated PPTX files under{' '}
          <code className="text-xs">.cache/pptx/</code>. Service data is never
          auto-deleted. Use 0 to keep cache forever.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Retention days
          </label>
          <input
            type="number"
            min={0}
            className="w-32 rounded-lg border bg-muted px-3 py-2 text-sm"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            disabled={saving}
          />
        </div>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        {message && (
          <p className="w-full text-sm text-muted-foreground">{message}</p>
        )}
      </CardContent>
    </Card>
  );
}
