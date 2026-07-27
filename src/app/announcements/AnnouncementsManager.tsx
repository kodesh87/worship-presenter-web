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

export type AnnouncementRow = {
  id: number;
  image_url: string;
  service_id: number | null;
  sort_order: number;
  created_at: string;
};

export default function AnnouncementsManager({
  initialItems,
}: {
  initialItems: AnnouncementRow[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [url, setUrl] = useState('');
  const [scope, setScope] = useState<'recurring' | 'one_off'>('recurring');
  const [serviceId, setServiceId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const refresh = (next: AnnouncementRow[]) => {
    setItems(next);
    router.refresh();
  };

  const handleAdd = async () => {
    setBusy(true);
    setError(null);
    try {
      const body: {
        image_url: string;
        service_id?: number | null;
      } = { image_url: url.trim() };

      if (scope === 'one_off') {
        const sid = Number(serviceId);
        if (!Number.isInteger(sid) || sid <= 0) {
          throw new Error('Enter a valid service id for one-off items');
        }
        body.service_id = sid;
      } else {
        body.service_id = null;
      }

      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add');
      }
      setUrl('');
      refresh([...items, data.item]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this announcement?')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete');
      }
      refresh(items.filter((i) => i.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setBusy(false);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const next = [...items];
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row);

    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: next.map((item, sort_order) => ({
            image_url: item.image_url,
            service_id: item.service_id,
            sort_order,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reorder');
      }
      refresh(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reorder');
    } finally {
      setBusy(false);
    }
  };

  const handleReplaceAll = async () => {
    const text = prompt(
      'Paste image URLs (one per line) to replace the entire list.\nLeave blank to clear.',
      items.map((i) => i.image_url).join('\n')
    );
    if (text === null) return;

    const urls = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: urls.map((image_url, sort_order) => ({
            image_url,
            // Preserve scope when URL still matches prior row at same index.
            service_id:
              items[sort_order]?.image_url === image_url
                ? items[sort_order].service_id
                : null,
            sort_order,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to replace');
      }
      refresh(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to replace');
    } finally {
      setBusy(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <Card className="border-border/80 shadow-md bg-card/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Add announcement</CardTitle>
          <CardDescription>
            Recurring items appear every week. One-offs attach to a single service. Support direct image file upload or pasting public HTTP/S URLs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold mb-2 block text-muted-foreground">Image URL</label>
              <input
                className="w-full p-3 font-mono text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/40 text-foreground"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/flyer.jpg or auto-filled from upload"
                disabled={busy}
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block text-muted-foreground">Or Upload Local Image</label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-xs text-muted-foreground bg-background border border-border/80 rounded-xl file:mr-3 file:py-2 file:px-3 file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary file:hover:bg-primary/20 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                onChange={handleFileUpload}
                disabled={busy}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-end pt-2">
            <div>
              <label className="text-sm font-semibold mb-2 block text-muted-foreground">Scope</label>
              <select
                className="p-2.5 text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground cursor-pointer"
                value={scope}
                onChange={(e) =>
                  setScope(e.target.value as 'recurring' | 'one_off')
                }
                disabled={busy}
              >
                <option value="recurring">Recurring (Weekly)</option>
                <option value="one_off">One-off (Service Specific)</option>
              </select>
            </div>
            {scope === 'one_off' && (
              <div>
                <label className="text-sm font-semibold mb-2 block text-muted-foreground">
                  Service ID
                </label>
                <input
                  className="w-28 p-2.5 font-mono text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  placeholder="e.g. 5"
                  disabled={busy}
                />
              </div>
            )}
            <div className="flex gap-2">
              <button 
                onClick={handleAdd} 
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-all duration-200 shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                disabled={busy || !url.trim()}
              >
                {busy ? 'Working…' : 'Add to List'}
              </button>
              <button
                onClick={handleReplaceAll}
                className="px-4 py-2.5 rounded-xl border border-border bg-card/50 hover:bg-card text-foreground font-semibold text-sm transition-all duration-200 shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                disabled={busy}
              >
                Replace All…
              </button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive font-medium animate-pulse" role="alert">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-md bg-card/60 backdrop-blur-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-bold">Announcement List</CardTitle>
            <CardDescription>
              {items.length === 0
                ? 'Empty list — PPTX uses legacy per-service images only when present; otherwise no flyer slides.'
                : `${items.length} item${items.length === 1 ? '' : 's'} in order.`}
            </CardDescription>
          </div>
          {items.length > 1 && (
            <span className="text-xs text-muted-foreground bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-lg font-medium">
              💡 Tip: Use the ↑ / ↓ buttons to dynamically reorder slides.
            </span>
          )}
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground italic text-sm text-center py-6">No items yet.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
                >
                  <div className="flex gap-4 items-center min-w-0 flex-1">
                    <a
                      href={item.image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 block h-20 w-28 border border-border/80 rounded-xl overflow-hidden shadow-sm hover:border-primary/50 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image_url}
                        alt={`Announcement ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </a>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs break-all text-muted-foreground bg-background/50 border border-border/50 rounded-lg p-2 max-h-16 overflow-y-auto">
                        {item.image_url}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          item.service_id == null
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}>
                          {item.service_id == null ? 'Recurring' : `One-off (Service #${item.service_id})`}
                        </span>
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          Order: {item.sort_order}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0 justify-end">
                    <button
                      disabled={busy || index === 0}
                      onClick={() => move(index, -1)}
                      className="p-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-all disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                      </svg>
                    </button>
                    <button
                      disabled={busy || index === items.length - 1}
                      onClick={() => move(index, 1)}
                      className="p-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-all disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                      </svg>
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-600 transition-all text-xs font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
