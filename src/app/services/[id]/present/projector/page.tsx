import { getDb } from '@/lib/db';
import { parseServiceId } from '@/lib/service-id';
import { normalizeParsedRundown } from '@/lib/parsed-fields';
import { resolveSlideMediaForService } from '@/lib/announcements';
import { buildSlidePlan, type SlidePlanItem } from '@/lib/slide-plan';
import { ArtifactHydrationError } from '@/lib/artifacts/runtime-contract';
import { getSlideTransition } from '@/lib/settings';
import { notFound } from 'next/navigation';
import ProjectorClient from './ProjectorClient';

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

export default async function ProjectorPage({
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
    // The projector is the room-facing screen: keep the same black canvas the
    // slides use and say plainly what is wrong, rather than blanking out.
    //
    // It SCROLLS, for the reason the slideshow's twin does. An
    // `ArtifactHydrationError` carries up to five `key=value` scope pairs at
    // `text-xl font-mono` (`runtime-contract.ts`), and this branch was
    // `fixed inset-0` with the content centred and no overflow handling — a
    // `fixed` element cannot be scrolled, so on a 1024x768 projector the detail
    // clipped at both ends with nothing able to reach it. The slideshow's branch
    // was rewritten for exactly this on the stated ground that "one failure at
    // two room-facing URLs should not have two names", and then only one twin was
    // fixed. `min-h-full` on the inner column keeps it centred while it fits and
    // lets it grow past the fold when it does not.
    //
    // Scope: the `html`/`body` reset behind this shell is Story 17.7's — this is
    // the branch's own element, which is the half round 2 patched inside 17.1.
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
            affected template in Admin &rarr; Artifacts, then reload this window.
          </p>
        </div>
      </div>
    );
  }

  // Read here rather than in the client: the same setting the deck is built
  // from, so the projector and the PPTX cannot disagree.
  return (
    <ProjectorClient
      serviceId={record.id}
      slides={slides}
      transition={getSlideTransition()}
    />
  );
}
