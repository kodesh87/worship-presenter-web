import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_TRANSLATION,
  discoverBibleTranslationFiles,
} from '@/lib/corpus';
import { listBibleTranslations } from '@/lib/db';
import {
  isBibleTranslationEmpty,
  lookupScripture,
} from '@/lib/scripture';

function corpusPathForError(translationCode: string): string {
  const match = discoverBibleTranslationFiles().find(
    (d) => d.code === translationCode
  );
  if (match) {
    return match.corpusPath
      .replace(process.cwd(), '')
      .replace(/^[/\\]/, '')
      .replace(/\\/g, '/');
  }
  return `data/*/bible-translation/${translationCode.toLowerCase()}.json`;
}

/**
 * GET /api/scripture?ref=John+4:23&translation=KJV — scripture lookup for
 * Presenter Mode / web Resolve. Never used for deck theme/verse slides. Session
 * required (proxy gate).
 */
export async function GET(request: NextRequest) {
  try {
    const ref = request.nextUrl.searchParams.get('ref')?.trim();
    if (!ref) {
      return NextResponse.json(
        { error: 'Missing ref query parameter' },
        { status: 400 }
      );
    }

    const installed = listBibleTranslations();
    const translationParam = request.nextUrl.searchParams.get('translation');
    let translationCode: string;

    if (translationParam?.trim()) {
      const normalized = translationParam.trim().toUpperCase();
      const known = installed.some((t) => t.code === normalized);
      if (!known) {
        return NextResponse.json(
          { error: `Unknown bible translation "${normalized}"` },
          { status: 400 }
        );
      }
      translationCode = normalized;
    } else {
      // Story 21.3 replaces this fallback with default_bible_translation.
      // AD-28's matcher scope is a separate required parameter — do not cite
      // this fallback as precedent for defaulting matcher scope.
      translationCode = DEFAULT_TRANSLATION;
    }

    if (isBibleTranslationEmpty(translationCode)) {
      const corpusPath = corpusPathForError(translationCode);
      return NextResponse.json(
        {
          error:
            `${translationCode} corpus is empty. It ships at ${corpusPath} and ` +
            'is reconciled from that file on boot; check it with npm run corpus:verify.',
        },
        { status: 503 }
      );
    }

    const passage = lookupScripture(ref, translationCode);
    if (!passage) {
      return NextResponse.json(
        { error: 'Scripture reference not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(passage);
  } catch (error) {
    console.error('Error looking up scripture:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
