import { getDb } from '@/lib/db';
import { ParsedRundown } from '@/lib/parser';
import { parseServiceId } from '@/lib/service-id';
import { parseImagesPayloadJson } from '@/lib/images';
import {
  resolveAnnouncementUrls,
  resolveImagesForService,
} from '@/lib/announcements';
import { normalizeParsedRundown } from '@/lib/parsed-fields';
import {
  songNumbersFromParsed,
  type HymnIndexEntry,
} from '@/lib/worship-form-fields';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import DeleteButton from './DeleteButton';
import EditForm from './EditForm';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { validateSessionToken } from '@/lib/auth/require';
import Header from '@/components/Header';

export default async function ServiceRunSheet({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const serviceId = parseServiceId(id);

  if (serviceId === null) {
    notFound();
  }

  const db = getDb();
  const record = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId) as
    | {
        id: number;
        date: string;
        parsed_data: string | null;
        raw_payload: string;
        images_payload: string | null;
        participants_payload: string | null;
        created_at: string;
        updated_at: string | null;
      }
    | undefined;

  if (!record) {
    notFound();
  }

  let parsedData: ParsedRundown | null = null;
  let parseError = false;
  if (record.parsed_data) {
    try {
      const parsed = JSON.parse(record.parsed_data) as ParsedRundown;
      if (!parsed || !Array.isArray(parsed.items)) {
        parseError = true;
      } else {
        parsedData = normalizeParsedRundown({
          date: parsed.date ?? null,
          items: parsed.items,
          unmappedLines: Array.isArray(parsed.unmappedLines)
            ? parsed.unmappedLines
            : [],
          failedHymnNumbers: Array.isArray(parsed.failedHymnNumbers)
            ? parsed.failedHymnNumbers
            : [],
          sermon: parsed.sermon ?? null,
          specialSong: parsed.specialSong ?? null,
          closingPrayerPerson: parsed.closingPrayerPerson ?? null,
          themeVerse: parsed.themeVerse ?? null,
          verseReading: parsed.verseReading ?? null,
          familyYouth: parsed.familyYouth ?? null,
          familyPrayerRequest: parsed.familyPrayerRequest ?? null,
          youthPrayerRequest: parsed.youthPrayerRequest ?? null,
        });
      }
    } catch {
      parseError = true;
    }
  }

  const mediaExtras = parseImagesPayloadJson(record.images_payload);
  const legacyImages = mediaExtras.urls;

  const announcementsList = db
    .prepare(
      `SELECT id, image_url, service_id
       FROM announcement_items
       WHERE service_id IS NULL OR service_id = ?
       ORDER BY sort_order ASC, id ASC`
    )
    .all(serviceId) as {
    id: number;
    image_url: string;
    service_id: number | null;
  }[];

  const listUrls = resolveAnnouncementUrls(serviceId);
  const images = resolveImagesForService(serviceId, record.images_payload);
  const usingLegacyFallback = listUrls.length === 0 && legacyImages.length > 0;

  // Seed only the hymns the edit form's initial values reference, so each hymn
  // input renders its `number - title` label on first paint without a client
  // fetch — the rest of the index is looked up on demand via GET /api/hymns.
  const seedNumbers = [
    ...new Set(
      Object.values(songNumbersFromParsed(parsedData))
        .map((value) => Number.parseInt(value, 10))
        .filter((n) => Number.isSafeInteger(n) && n > 0)
    ),
  ];
  const hymnIndex: HymnIndexEntry[] = seedNumbers.length
    ? (db
        .prepare(
          `SELECT number, title FROM hymns
           WHERE number IN (${seedNumbers.map(() => '?').join(', ')})
           ORDER BY number ASC`
        )
        .all(...seedNumbers) as HymnIndexEntry[])
    : [];

  const cookieStore = await cookies();
  // DB-checked, not signature-only — see `validateSessionToken`. `isAdmin`
  // must not come from the cookie's `role` claim.
  const session = await validateSessionToken(
    cookieStore.get(SESSION_COOKIE)?.value
  );
  const isAdmin = session?.role === 'admin';

  const account = session
    ? (db
        .prepare('SELECT username FROM accounts WHERE id = ?')
        .get(session.uid) as { username: string } | undefined)
    : null;
  const username = account?.username || 'Operator';

  return (
    <div className="min-h-screen bg-background text-foreground p-8 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40 dark:opacity-100" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <Header isAdmin={isAdmin} username={username} />

        <div className="mb-6">
          <Button variant="link" render={<Link href="/" />}>
            &larr; Back to Dashboard
          </Button>
        </div>

        <header className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-border/80 pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Run-Sheet: {record.date}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Service ID: {record.id}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              render={<Link href={`/services/${record.id}/slideshow`} />}
            >
              Preview
            </Button>
            <Button
              variant="outline"
              render={<Link href={`/services/${record.id}/present`} />}
            >
              Present
            </Button>
            <DeleteButton id={record.id} />
            <Button
              render={<a href={`/api/services/${record.id}/pptx`} download />}
            >
              Download PPTX
            </Button>
          </div>
        </header>

        {parseError && (
          <Card className="mb-8 border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive">
                Corrupt parsed data
              </CardTitle>
              <CardDescription>
                Edit and save the raw payload to re-parse this service.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {parsedData && parsedData.unmappedLines.length > 0 && (
          <div className="mb-8">
            <Card className="border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-amber-700 dark:text-amber-500">
                  Input issues
                </CardTitle>
                <CardDescription>
                  The parser could not confidently map the following lines.
                  The service can still be edited and saved; fix these before
                  presenting if they matter for this week.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <pre className="bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto">
                  {parsedData.unmappedLines.join('\n')}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}

        <EditForm
          id={record.id}
          initialPayload={record.raw_payload}
          initialParsed={parsedData}
          initialSermonGraphicUrl={mediaExtras.sermonGraphicUrl || ''}
          initialFamilyPhotoUrl={mediaExtras.familyPhotoUrl || ''}
          initialYouthPhotoUrl={mediaExtras.youthPhotoUrl || ''}
          initialAnnouncements={announcementsList}
          flyerImages={images}
          usingLegacyFallback={usingLegacyFallback}
          initialParticipantsRaw={record.participants_payload || ''}
          initialUpdatedAt={record.updated_at || record.created_at}
          hymnIndex={hymnIndex}
        />
      </div>
    </div>
  );
}
