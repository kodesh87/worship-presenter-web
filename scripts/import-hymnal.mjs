import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const sourcePath = path.join(root, '.work', 'lirik-lagu.json');
const outPath = path.join(root, 'data', 'hymns.json');

const LABEL_RE = /^(Verse(?:\s+\d+)?|Chorus|Reff|Refrain)\s*$/i;

function cleanTitle(raw) {
  return String(raw || '')
    .replace(/[,;:\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Derive title from first non-empty lyric line after a Verse header.
 * Fallback: first non-label lyric line, then `SDAH {n}`.
 */
function deriveTitle(lyrics, number) {
  const lines = String(lyrics || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim());

  let afterVerse = false;
  for (const line of lines) {
    if (!line) continue;
    if (/^Verse(?:\s+\d+)?\s*$/i.test(line)) {
      afterVerse = true;
      continue;
    }
    if (LABEL_RE.test(line)) {
      afterVerse = false;
      continue;
    }
    if (afterVerse) {
      const title = cleanTitle(line);
      if (title) return title;
    }
  }

  for (const line of lines) {
    if (line && !LABEL_RE.test(line)) {
      const title = cleanTitle(line);
      if (title) return title;
    }
  }

  return `SDAH ${number}`;
}

function extractRows(dump) {
  if (Array.isArray(dump)) return dump;
  if (dump && typeof dump === 'object') {
    const values = Object.values(dump);
    const first = values.find((v) => Array.isArray(v));
    if (first) return first;
  }
  throw new Error('Unexpected lirik-lagu.json shape: expected array or SQL-key object');
}

function main() {
  if (!fs.existsSync(sourcePath)) {
    console.error(`Missing source hymnal: ${sourcePath}`);
    process.exit(1);
  }

  let dump;
  try {
    dump = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  } catch (err) {
    console.error(`Unreadable source hymnal: ${sourcePath}`);
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const rows = extractRows(dump);
  const hymns = [];
  const seen = new Set();
  let skipped = 0;

  for (const row of rows) {
    if (!row || typeof row !== 'object') {
      skipped += 1;
      continue;
    }
    const number = parseInt(String(row.nomor_lagu ?? row.number ?? '').trim(), 10);
    const lyrics = String(row.full_lirik ?? row.lyrics ?? '').trim();
    if (!Number.isInteger(number) || number <= 0 || !lyrics) {
      skipped += 1;
      continue;
    }
    if (seen.has(number)) {
      skipped += 1;
      continue;
    }
    seen.add(number);
    hymns.push({
      number,
      title: deriveTitle(lyrics, number),
      lyrics,
    });
  }

  if (hymns.length === 0) {
    console.error('No valid hymns parsed from source; refusing to overwrite corpus');
    process.exit(1);
  }

  hymns.sort((a, b) => a.number - b.number);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(hymns, null, 2)}\n`, 'utf8');
  console.log(
    `Wrote ${hymns.length} hymns → ${path.relative(root, outPath)} (skipped ${skipped})`
  );
}

main();
