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
  const [locale, setLocale] = useState<UiLocale>(initialLocale);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const t = (key: Parameters<typeof resolveString>[0]) =>
    resolveString(key, locale);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ui_locale: locale }),
      });
      if (!res.ok) throw new Error('save failed');
      const data = (await res.json()) as { ui_locale: UiLocale };
      setLocale(data.ui_locale);
      setMessage(
        resolveString(
          data.ui_locale === 'en'
            ? 'admin.uiLocale.saved.en'
            : 'admin.uiLocale.saved.id',
          data.ui_locale
        )
      );
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
            value={locale}
            onChange={(e) => setLocale(e.target.value as UiLocale)}
            disabled={saving}
          >
            {UI_LOCALE_ORDER.map((code) => (
              <option key={code} value={code}>
                {code === 'en'
                  ? t('admin.uiLocale.option.en')
                  : t('admin.uiLocale.option.id')}
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
