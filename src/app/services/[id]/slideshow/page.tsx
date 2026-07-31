import { getDb } from '@/lib/db';
import { parseServiceId } from '@/lib/service-id';
import { normalizeParsedRundown } from '@/lib/parsed-fields';
import { resolveSlideMediaForService } from '@/lib/announcements';
import { buildSlidePlan, type SlidePlanItem } from '@/lib/slide-plan';
import { ArtifactHydrationError } from '@/lib/artifacts/runtime-contract';
import { getSlideTransition } from '@/lib/settings';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SlideshowClient from './SlideshowClient';

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

export default async function SlideshowPage({
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

  let parsed;
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
    // This URL is projected. It used to render a token-painted `Card` —
    // `bg-background`, `text-destructive`, `bg-muted` — so a registry failure
    // put a theme-following surface on the room-facing screen, and an operator
    // flipping their theme restyled it live. It paints in literals now, for the
    // reason the projector's own failure branch always has.
    //
    // It is NOT otherwise the projector's twin, and claiming so was a false
    // comment beside code that had none. Same headline and same explanation,
    // deliberately. Different in two ways that are both intentional: this page
    // runs in the operator's own tab, so it offers navigation the projector
    // window has nowhere to send, and it SCROLLS. An `ArtifactHydrationError`
    // carries up to five `key=value` scope pairs at `text-xl font-mono`
    // (`runtime-contract.ts`), and the first version of this branch was
    // `overflow-hidden` with the content centred — on a short viewport the
    // detail clipped at both ends and the recovery links went off-screen with
    // nothing able to reach them, on the one screen whose whole job is telling
    // the operator how to recover. `min-h-full` on the inner column keeps it
    // centred while it fits and lets it grow past the fold when it does not.
    return (
      <div className="fixed inset-0 overflow-y-auto bg-black text-white">
        <div className="flex min-h-full flex-col items-center justify-center px-12 py-16 text-center">
          <p className="mb-6 text-4xl font-bold tracking-tight">
            Slides unavailable
          </p>
          <p className="max-w-4xl font-mono text-xl break-words text-white/80">
            {slidePlanFailureDetail(error)}
          </p>
          <p className="mt-8 max-w-3xl text-lg text-white/60">
            The artifact registry could not build this service. Reset the
            affected template in Admin &rarr; Artifacts, or fix the run-sheet,
            then reload. The offline PPTX download is unaffected by this page.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-8 text-base text-white/70">
            <Link
              href={`/services/${serviceId}`}
              className="underline hover:text-white focus-visible:outline-white"
            >
              Back to run-sheet
            </Link>
            <Link
              href="/admin/artifacts"
              className="underline hover:text-white focus-visible:outline-white"
            >
              Admin &rarr; Artifacts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SlideshowClient
      serviceId={record.id}
      serviceDate={record.date}
      slides={slides}
      transition={getSlideTransition()}
    />
  );
}
