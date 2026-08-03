import type Database from 'better-sqlite3';
import { narrowCreateBody } from '@/lib/services/body';
import { createService } from '@/lib/services/create-service';
import { lookupScripture } from '@/lib/scripture';

const DEMO_RUNDOWN = `SABBATH, AUGUST 15, 2026

BIBLE TALK
Opening Song: SDAH #159
Memory Verse: John 3:16
Bible Talk: Colossians 3:16
Closing Song: SDAH #163

DIVINE SERVICE
Opening Song: SDAH #83
Intercessory Prayer
Before Int. Prayer: SDAH #671
After Int. Prayer: SDAH #684
Sermon: Pastor Adam "Grace for Today"
Closing Song: SDAH #249
Closing Prayer: The Speaker`;

const DEMO_ANNOUNCEMENTS = [
  {
    image_url: 'https://example.com/demo-service-flyer.png',
    is_recurring: false,
  },
];
const DEMO_VERSE_REFERENCE = 'John 3:16';

export type DemoSeedResult =
  | { ok: true; id: number; date: string }
  | { ok: false; kind: 'not-empty'; serviceCount: number };

/**
 * Add one authored-synthetic service only to a fresh installation.
 *
 * The normal service boundary owns parsing, validation, persistence, and
 * announcement synchronisation; this function only supplies its fixture.
 */
export function seedDemoService(db: Database.Database): DemoSeedResult {
  return db.transaction((): DemoSeedResult => {
    const { count } = db
      .prepare('SELECT COUNT(*) AS count FROM services')
      .get() as { count: number };
    if (count > 0) {
      return { ok: false, kind: 'not-empty', serviceCount: count };
    }

    const verseReading = lookupScripture(DEMO_VERSE_REFERENCE, 'KJV');
    if (!verseReading) {
      throw new Error(
        `Demo seed failed: shipped KJV cannot resolve ${DEMO_VERSE_REFERENCE}`
      );
    }

    const narrowed = narrowCreateBody({
      raw_payload: DEMO_RUNDOWN,
      verseReading: {
        reference: verseReading.reference,
        text: verseReading.text,
      },
      announcements: DEMO_ANNOUNCEMENTS,
    });
    if (!narrowed.ok) {
      throw new Error(`Demo seed input is invalid: ${narrowed.message}`);
    }

    const created = createService(db, narrowed.value);
    if (!created.ok) {
      const reason =
        created.kind === 'collision'
          ? `a service already exists for ${created.date}`
          : created.message;
      throw new Error(`Demo seed failed: ${reason}`);
    }
    if (created.failedHymnNumbers.length > 0) {
      throw new Error(
        `Demo seed failed: unresolved hymns ${created.failedHymnNumbers.join(', ')}`
      );
    }

    return { ok: true, id: created.id, date: created.date };
  })();
}
