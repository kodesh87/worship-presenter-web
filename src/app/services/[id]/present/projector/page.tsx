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
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black px-12 text-center text-white">
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
