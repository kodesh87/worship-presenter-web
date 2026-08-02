'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  resolveString,
  UI_LOCALE_ORDER,
  type UiLocale,
} from '@/lib/i18n';

export default function UiLocaleSettings({
  initialLocale,
}: {
  initialLocale: UiLocale;
}) {
  const router = useRouter();
  /** Persisted locale — drives card copy and matches SQLite until Save succeeds. */
  const [displayLocale, setDisplayLocale] = useState<UiLocale>(initialLocale);
  /** Pending select value — may differ from displayLocale until Save. */
  const [pendingLocale, setPendingLocale] = useState<UiLocale>(initialLocale);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const t = (key: Parameters<typeof resolveString>[0]) =>
    resolveString(key, displayLocale);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ui_locale: pendingLocale }),
      });
      if (!res.ok) throw new Error('save failed');
      const data = (await res.json()) as { ui_locale: UiLocale };
      setDisplayLocale(data.ui_locale);
      setPendingLocale(data.ui_locale);
      setMessage(
        resolveString(`admin.uiLocale.saved.${data.ui_locale}`, data.ui_locale)
      );
      // Only to re-render the root layout so `<html lang>` follows the new
      // setting. This component's own state is already correct above, which is
      // why there is no prop-sync effect: nothing else writes `ui_locale`.
      router.refresh();
    } catch {
      setMessage(t('admin.uiLocale.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t('admin.uiLocale.title')}</CardTitle>
        <CardDescription>{t('admin.uiLocale.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <div>
          <label
            className="mb-1.5 block text-sm font-medium"
            htmlFor="ui-locale"
          >
            {t('admin.uiLocale.label')}
          </label>
          <select
            id="ui-locale"
            className="w-44 rounded-lg border bg-muted px-3 py-2 text-sm"
            value={pendingLocale}
            onChange={(e) => setPendingLocale(e.target.value as UiLocale)}
            disabled={saving}
          >
            {/*
              The key is derived from the locale code, not chosen by a branch:
              a locale added to UI_LOCALE_ORDER with no catalogue entry renders
              the defect marker instead of silently wearing another locale's
              label. Story 24.2 inherits this idiom 100-150 times.
            */}
            {UI_LOCALE_ORDER.map((code) => (
              <option key={code} value={code}>
                {t(`admin.uiLocale.option.${code}`)}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? t('admin.uiLocale.saving') : t('admin.uiLocale.save')}
        </Button>
        {message && (
          <p className="w-full text-sm text-muted-foreground">{message}</p>
        )}
      </CardContent>
    </Card>
  );
}
