import { getDb } from '@/lib/db';
import { parseServiceId } from '@/lib/service-id';
import { normalizeParsedRundown } from '@/lib/parsed-fields';
import { resolveSlideMediaForService } from '@/lib/announcements';
import { buildSlidePlan, type SlidePlanItem } from '@/lib/slide-plan';
import { ArtifactHydrationError } from '@/lib/artifacts/runtime-contract';
import { getSlideTransition } from '@/lib/settings';
import type { ParsedRundown } from '@/lib/parser';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import PresenterOperator from './PresenterOperator';

/**
 * Client-safe reason for a failed plan build.
 *
 * Hydration errors already carry an attributable, stack-free description
 * (instance / template / placeholder). Anything else stays generic so server
 * paths and stack traces never reach the browser — the full error is logged.
 */
function slidePlanFailureDetail(error: unknown): string {
  if (error instanceof ArtifactHydrationError) return error.message;
  return 'The slide registry could not be read.';
}

/**
 * This page reads no cookies and no headers, so without this it is a static
 * render candidate — and a rendered deck sitting in an edge cache is a deck
 * that can be served without the proxy gate ever running. Matches `/admin`.
 */
export const dynamic = 'force-dynamic';

export default async function PresentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const serviceId = parseServiceId(id);
  if (serviceId === null) notFound();

  const db = getDb();
  const record = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId) as
    | {
        id: number;
        date: string;
        parsed_data: string | null;
        images_payload: string | null;
      }
    | undefined;

  if (!record?.parsed_data) notFound();

  let parsed: ParsedRundown;
  try {
    parsed = normalizeParsedRundown(JSON.parse(record.parsed_data));
  } catch {
    notFound();
  }

  const media = resolveSlideMediaForService(serviceId, record.images_payload);

  let slides: SlidePlanItem[];
  try {
    slides = buildSlidePlan(record.date, parsed, media);
  } catch (error) {
    console.error(
      `Failed to build the slide plan for service ${serviceId}:`,
      error
    );
    return (
      <div className="min-h-screen bg-background text-foreground p-8 font-sans">
        <div className="max-w-2xl mx-auto pt-16">
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive">
                Presenter cannot start
              </CardTitle>
              <CardDescription>
                The artifact registry could not produce this service&apos;s
                slides, so the presenter has nothing to drive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="rounded-md bg-muted p-4 font-mono text-sm break-words">
                {slidePlanFailureDetail(error)}
              </p>
              <p className="text-sm text-muted-foreground">
                Reset the affected template in Admin &rarr; Artifacts, or fix
                the run-sheet, then reload. If the service starts now, download
                the offline PPTX from the run-sheet and present from
                PowerPoint.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  render={<Link href={`/services/${serviceId}`} />}
                >
                  Back to run-sheet
                </Button>
                <Button
                  render={
                    <a href={`/api/services/${serviceId}/pptx`} download />
                  }
                >
                  Download PPTX
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // The same setting the deck is built from and the projector starts on. The
  // Presenter may override it for a session, but it is read fresh here on every
  // render, so a new Presenter always begins from the deck's own truth.
  return (
    <PresenterOperator
      serviceId={record.id}
      serviceDate={record.date}
      slides={slides}
      runSheetItems={parsed.items}
      transition={getSlideTransition()}
    />
  );
}
