import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/require';
import { isUiLocale, UI_LOCALE_ORDER, type UiLocale } from '@/lib/i18n';
import {
  getPptxRetentionDays,
  getSlideTransition,
  getUiLocale,
  setPptxRetentionDays,
  setSlideTransition,
  setUiLocale,
} from '@/lib/settings';
import { cleanupExpiredPptxCache } from '@/lib/pptx-cache';
import {
  isSlideTransition,
  SLIDE_TRANSITIONS,
  type SlideTransition,
} from '@/lib/transitions';

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    pptx_retention_days: getPptxRetentionDays(),
    slide_transition: getSlideTransition(),
    ui_locale: getUiLocale(),
  });
}

export async function PUT(request: NextRequest) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const fields = body as {
      pptx_retention_days?: unknown;
      slide_transition?: unknown;
      ui_locale?: unknown;
    };
    const hasDays = 'pptx_retention_days' in fields;
    const hasTransition = 'slide_transition' in fields;
    const hasLocale = 'ui_locale' in fields;
    if (!hasDays && !hasTransition && !hasLocale) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    // Everything is validated before anything is written, so a body that mixes
    // an acceptable field with a rejected one leaves *both* stored settings
    // exactly as they were.
    let days: number | null = null;
    if (hasDays) {
      const value = fields.pptx_retention_days;
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
        return NextResponse.json(
          { error: 'pptx_retention_days must be a non-negative integer' },
          { status: 400 }
        );
      }
      days = value;
    }

    let transition: SlideTransition | null = null;
    if (hasTransition) {
      const value = fields.slide_transition;
      if (!isSlideTransition(value)) {
        return NextResponse.json(
          {
            error: `slide_transition must be one of: ${SLIDE_TRANSITIONS.join(', ')}`,
          },
          { status: 400 }
        );
      }
      transition = value;
    }

    let uiLocale: UiLocale | null = null;
    if (hasLocale) {
      const value = fields.ui_locale;
      if (!isUiLocale(value)) {
        return NextResponse.json(
          {
            error: `ui_locale must be one of: ${UI_LOCALE_ORDER.join(', ')}`,
          },
          { status: 400 }
        );
      }
      uiLocale = value;
    }

    let removed = 0;
    if (days !== null) {
      setPptxRetentionDays(days);
      removed = cleanupExpiredPptxCache();
    }
    if (transition !== null) {
      setSlideTransition(transition);
    }
    if (uiLocale !== null) {
      setUiLocale(uiLocale);
    }

    return NextResponse.json({
      pptx_retention_days: getPptxRetentionDays(),
      slide_transition: getSlideTransition(),
      ui_locale: getUiLocale(),
      cache_files_removed: removed,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
