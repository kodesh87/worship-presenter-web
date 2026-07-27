import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

type HymnRow = { number: number; title: string };

/** Default page size for `?q=` / no-param lookups. */
const DEFAULT_LIMIT = 15;
/** Hard cap; matches `filterHymnIndex`'s default client-side limit. */
const MAX_LIMIT = 40;

/** Malformed / out-of-range `limit` falls back to the default rather than 400. */
function parseLimit(raw: string | null): number {
  if (raw === null) return DEFAULT_LIMIT;
  const token = raw.trim();
  if (!/^\d+$/.test(token)) return DEFAULT_LIMIT;
  const n = Number.parseInt(token, 10);
  if (!Number.isSafeInteger(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

/**
 * Escape the LIKE metacharacters so `%` / `_` in a query match literally.
 * Without this the server answers a wildcard search the client then re-filters
 * with `String.includes`, and the dropdown reports "No hymns found" for rows
 * the server actually returned.
 */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** `numbers=1,2,3` → unique positive ints, malformed entries dropped silently. */
function parseNumbers(raw: string | null): number[] {
  if (!raw) return [];
  const seen = new Set<number>();
  const out: number[] = [];
  for (const part of raw.split(',')) {
    const token = part.trim();
    if (!/^\d+$/.test(token)) continue;
    const n = Number.parseInt(token, 10);
    if (!Number.isSafeInteger(n) || n <= 0 || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
    if (out.length >= MAX_LIMIT) break;
  }
  return out;
}

/**
 * GET /api/hymns — `{ hymns: { number, title }[] }`
 *
 * Modes, in precedence order:
 * - `?all=1|true` — full SDAH index (unpaged; kept for legacy preload callers)
 * - `?numbers=1,2,3` — batch label lookup for hymns a form already references
 * - `?q=` — number/title substring search
 * - no params — first page of the index
 *
 * `?limit=` (default 15, capped at 40) applies to the `q` and no-param modes.
 * Malformed params are ignored rather than rejected.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const all = searchParams.get('all') === '1' || searchParams.get('all') === 'true';
    const q = searchParams.get('q')?.trim() || '';
    const limit = parseLimit(searchParams.get('limit'));

    const db = getDb();
    let rows: HymnRow[];

    if (all) {
      rows = db
        .prepare(
          `SELECT number, title FROM hymns ORDER BY number ASC`
        )
        .all() as HymnRow[];
    } else if (searchParams.has('numbers')) {
      const numbers = parseNumbers(searchParams.get('numbers'));
      rows = numbers.length
        ? (db
            .prepare(
              `SELECT number, title FROM hymns
               WHERE number IN (${numbers.map(() => '?').join(', ')})
               ORDER BY number ASC`
            )
            .all(...numbers) as HymnRow[])
        : [];
    } else if (q) {
      const pattern = `%${escapeLikePattern(q)}%`;
      rows = db
        .prepare(
          `SELECT number, title FROM hymns
           WHERE CAST(number AS TEXT) LIKE ? ESCAPE '\\'
              OR title LIKE ? ESCAPE '\\'
           ORDER BY number ASC
           LIMIT ?`
        )
        .all(pattern, pattern, limit) as HymnRow[];
    } else {
      rows = db
        .prepare(
          `SELECT number, title FROM hymns ORDER BY number ASC LIMIT ?`
        )
        .all(limit) as HymnRow[];
    }

    return NextResponse.json({ hymns: rows }, { status: 200 });
  } catch (error) {
    console.error('Error searching hymns:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
