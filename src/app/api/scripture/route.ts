import { NextRequest, NextResponse } from 'next/server';
import { isKjvCorpusEmpty, lookupScripture } from '@/lib/scripture';

/**
 * GET /api/scripture?ref=John+4:23 — KJV lookup for Presenter Mode / web Resolve.
 * Never used for deck theme/verse slides. Session required (proxy gate).
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

    if (isKjvCorpusEmpty()) {
      return NextResponse.json(
        {
          error:
            'KJV database is empty. Run npm run import:kjv (requires .work/tp_bible_*.json).',
        },
        { status: 503 }
      );
    }

    const passage = lookupScripture(ref);
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
