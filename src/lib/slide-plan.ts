import type { ParsedRundown, ParsedScripture, ParsedSermon } from './parser';
import { INTERCESSORY_STANDING_NUMBERS, splitLyricsLabeled } from './lyrics';
import { isAnnouncementImageUrl } from './announcements';
import { isSafeImageUrl } from './images';
import { bucketHymnsBySection, type HymnItem } from './hymn-sections';
import {
  loadRegistrySnapshot,
  type RegistrySnapshot,
} from '@/lib/artifacts/registry-snapshot';
import {
  hydrateArtifactFromSnapshot,
  type PlaceholderValues,
} from '@/lib/artifacts/hydrate';
import {
  findResolvedText,
  flattenArtifactPlan,
  type ArtifactInstance,
  type ArtifactLayoutKey,
  type ArtifactLeafNode,
  type ArtifactNode,
} from '@/lib/artifacts/runtime-contract';

const INTERCESSORY_NUMBER_SET = new Set<number>(INTERCESSORY_STANDING_NUMBERS);

export type SlideKind =
  | 'text'
  | 'divider'
  | 'scripture'
  | 'song-title'
  | 'song-lyric'
  | 'sermon'
  | 'closing-prayer'
  | 'family'
  | 'image'
  | 'body';

export type SlidePlanItem = {
  id: string;
  kind: SlideKind;
  title?: string;
  subtitle?: string;
  body?: string;
  lines?: string[];
  imageUrl?: string;
  /** Second image for combined Family & Youth slide (Slide 56). */
  secondaryImageUrl?: string;
  /** When false, skip fade (e.g. flyer images). Default true. */
  fade?: boolean;
  /** Hydrated registry artifact this slide renders. */
  artifact: ArtifactInstance;
};

export type SlidePlanMedia = {
  flyers?: string[];
  sermonGraphicUrl?: string | null;
  familyPhotoUrl?: string | null;
  youthPhotoUrl?: string | null;
};

/** Legacy projection carried alongside the hydrated artifact. */
type LegacyFields = Omit<SlidePlanItem, 'id' | 'artifact'>;

type LegacyProjection = LegacyFields | ((instance: ArtifactInstance) => LegacyFields);

type SlideRequest = {
  id: string;
  templateId: string;
  layoutKey?: ArtifactLayoutKey;
  values?: PlaceholderValues;
  legacy: LegacyProjection;
};

type RequestLeaf = { kind: 'artifact'; request: SlideRequest };

type RequestGroupChild = { role: 'title' | 'lyric'; request: SlideRequest };

type RequestGroup = {
  kind: 'group';
  id: string;
  label: string;
  children: RequestGroupChild[];
};

type RequestNode = RequestLeaf | RequestGroup;

function hasScripture(s: ParsedScripture | null | undefined): boolean {
  return !!(s?.reference?.trim() || s?.text?.trim());
}

function normalizeMedia(images: string[] | SlidePlanMedia): SlidePlanMedia {
  if (Array.isArray(images)) {
    return { flyers: images };
  }
  return images;
}

function leaf(request: SlideRequest): RequestLeaf {
  return { kind: 'artifact', request };
}

/**
 * Standing body copy is registry-owned: split every text element of the hydrated
 * layout into display lines.
 *
 * Reading order is *visual* (top-to-bottom, then left-to-right), not `zIndex` /
 * source order — the source deck authored these boxes in arbitrary order, so
 * z-order put e.g. the bank account number above its own bank name. The line
 * that merely repeats the slide title is dropped: the legacy projection already
 * carries it in `title`, and consumers render it separately.
 */
function derivedLines(instance: ArtifactInstance, title: string): string[] {
  const normalizedTitle = title.trim();
  return instance.layout.elements
    .flatMap((element) =>
      element.type === 'text' && typeof element.text === 'string'
        ? [{ x: element.x, y: element.y, text: element.text }]
        : []
    )
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .flatMap((box) => box.text.split('\n'))
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line !== normalizedTitle);
}

function optional(value: string | null | undefined): string | undefined {
  return value ?? undefined;
}

/**
 * One SongSet group: a title slide (SDAH number + song title) followed by its
 * lyric slides. The title-suppression option this used to carry is gone
 * (AD-20, AC-4) — every group built this way always carries a title, so the
 * three previously-suppressed songs (#671, #684, "We Have This Hope") no
 * longer go through this path at all; they are fixed General rows in the
 * registry seed instead (AC-5).
 */
function songGroupNodes(
  hymn: HymnItem,
  idPrefix: string,
  templateId: string
): RequestNode[] {
  const children: RequestGroupChild[] = [];

  const subtitle = hymn.incomplete
    ? `SDAH ${hymn.number} (incomplete)`
    : `SDAH ${hymn.number}`;
  children.push({
    role: 'title',
    request: {
      id: `${idPrefix}-title`,
      templateId,
      layoutKey: 'title',
      values: { hymnNumber: subtitle, songTitle: hymn.title },
      legacy: { kind: 'song-title', title: hymn.title, subtitle },
    },
  });

  if (!hymn.incomplete && hymn.lyrics?.trim()) {
    const lyricSlides = splitLyricsLabeled(hymn.lyrics, 4);
    let i = 0;
    for (const lyric of lyricSlides) {
      i += 1;
      children.push({
        role: 'lyric',
        request: {
          id: `${idPrefix}-lyric-${i}`,
          templateId,
          layoutKey: 'lyric',
          values: { label: lyric.label || undefined, lyrics: lyric.text },
          legacy: {
            kind: 'song-lyric',
            title: lyric.label || undefined,
            body: lyric.text,
          },
        },
      });
    }
  }

  if (children.length === 0) return [];
  return [{ kind: 'group', id: idPrefix, label: hymn.title, children }];
}

/** A fixed-content General row (AC-5): no placeholders, no values, no title element. */
function fixedLyricLeaf(id: string): RequestLeaf {
  return leaf({
    id,
    templateId: id,
    legacy: (instance) => ({ kind: 'body', lines: derivedLines(instance, '') }),
  });
}

/** Everything `buildRequestPlan` needs, computed once and handed to every row handler. */
type PlanContext = {
  serviceDate: string;
  flyers: string[];
  sermonGraphic: string | null;
  familyPhoto: string | null;
  youthPhoto: string | null;
  bibleTalkHymns: HymnItem[];
  dsOpening?: HymnItem;
  dsClosing?: HymnItem;
  dsMiddle: HymnItem[];
  specialSong: string | null;
  sermon: ParsedSermon | null | undefined;
  closingPrayer: string | null;
  themeVerse: ParsedScripture | null;
  verseReading: ParsedScripture | null;
  familyPrayer: string | null;
  youthPrayer: string | null;
  legacyCombined: string | null;
  familyBody: string | null;
};

function computePlanContext(
  serviceDate: string,
  parsedData: ParsedRundown,
  images: string[] | SlidePlanMedia
): PlanContext {
  const media = normalizeMedia(images);
  const flyers = (media.flyers || []).filter((u) => isAnnouncementImageUrl(u));
  const sermonGraphic =
    media.sermonGraphicUrl && isSafeImageUrl(media.sermonGraphicUrl)
      ? media.sermonGraphicUrl
      : null;
  const familyPhoto =
    media.familyPhotoUrl && isSafeImageUrl(media.familyPhotoUrl)
      ? media.familyPhotoUrl
      : null;
  const youthPhoto =
    media.youthPhotoUrl && isSafeImageUrl(media.youthPhotoUrl)
      ? media.youthPhotoUrl
      : null;

  const items = Array.isArray(parsedData.items) ? parsedData.items : [];
  const buckets = bucketHymnsBySection(items);
  const bibleTalkHymns = buckets.bibleTalkHymns.filter(
    (h) => !INTERCESSORY_NUMBER_SET.has(h.number)
  );
  const divineServiceHymns = buckets.divineServiceHymns.filter(
    (h) => !INTERCESSORY_NUMBER_SET.has(h.number)
  );
  const specialSong = parsedData.specialSong?.trim() || null;
  const sermon = parsedData.sermon;
  const closingPrayer = parsedData.closingPrayerPerson?.trim() || null;
  const themeVerse = hasScripture(parsedData.themeVerse)
    ? parsedData.themeVerse!
    : null;
  const verseReading = hasScripture(parsedData.verseReading)
    ? parsedData.verseReading!
    : null;
  const familyPrayer = parsedData.familyPrayerRequest?.trim() || null;
  const youthPrayer = parsedData.youthPrayerRequest?.trim() || null;
  const legacyCombined =
    !familyPrayer && !youthPrayer
      ? parsedData.familyYouth?.trim() || null
      : null;
  const familyBodyParts = [
    familyPrayer ? `Family: ${familyPrayer}` : null,
    youthPrayer ? `Youth: ${youthPrayer}` : null,
  ].filter(Boolean) as string[];
  const familyBody =
    familyBodyParts.length > 0 ? familyBodyParts.join('\n\n') : legacyCombined;

  const dsOpening = divineServiceHymns[0];
  const dsClosing =
    divineServiceHymns.length > 1
      ? divineServiceHymns[divineServiceHymns.length - 1]
      : undefined;
  const dsMiddle =
    divineServiceHymns.length > 2 ? divineServiceHymns.slice(1, -1) : [];

  return {
    serviceDate,
    flyers,
    sermonGraphic,
    familyPhoto,
    youthPhoto,
    bibleTalkHymns,
    dsOpening,
    dsClosing,
    dsMiddle,
    specialSong,
    sermon,
    closingPrayer,
    themeVerse,
    verseReading,
    familyPrayer,
    youthPrayer,
    legacyCombined,
    familyBody,
  };
}

/**
 * One handler per registry row id. `buildRequestPlan` walks the ordered
 * registry snapshot and looks each row up here — the handler decides whether
 * the row is present this week and what it expands to, but never *where* in
 * the sequence it lands; that is the registry's `position` column (AC-1, AC-2).
 *
 * Four ids remain planner-owned expansions of a single row rather than a
 * fixed 1:1 leaf: the four transitional SongSet position rows (each expands to
 * a title+lyric group, or to nothing when that week has no hymn there) and the
 * `song-set` ds-middle row (expands to zero or many groups, unbounded — see
 * *Dev Notes → Five transitional SongSet entries*).
 */
const ROW_HANDLERS: Readonly<Record<string, (ctx: PlanContext) => RequestNode[]>> = {
  welcome: (ctx) => [
    leaf({
      id: 'welcome',
      templateId: 'welcome',
      values: { date: ctx.serviceDate },
      legacy: {
        kind: 'text',
        title: 'Welcome',
        subtitle: 'Bandung International Community',
        body: ctx.serviceDate,
      },
    }),
  ],

  'bible-talk-sequence': () => [
    leaf({
      id: 'bible-talk-sequence',
      templateId: 'bible-talk-sequence',
      legacy: {
        kind: 'text',
        title: 'Bible Talk Sequence',
        subtitle: 'Sabbath School',
      },
    }),
  ],

  'prayer-partners': () => [
    leaf({
      id: 'prayer-partners',
      templateId: 'prayer-partners',
      legacy: { kind: 'divider', title: 'Prayer Partners' },
    }),
  ],

  'bt-opening-song-cue': (ctx) =>
    ctx.bibleTalkHymns[0]
      ? [
          leaf({
            id: 'bt-opening-song-cue',
            templateId: 'bt-opening-song-cue',
            legacy: {
              kind: 'divider',
              title: 'Opening Song',
              subtitle: 'Congregation, please stand',
            },
          }),
        ]
      : [],

  'bt-opening-song': (ctx) =>
    ctx.bibleTalkHymns[0]
      ? songGroupNodes(ctx.bibleTalkHymns[0], 'bt-opening', 'bt-opening-song')
      : [],

  'verse-reading': (ctx) =>
    ctx.verseReading
      ? [
          leaf({
            id: 'verse-reading',
            templateId: 'verse-reading',
            values: {
              reference: ctx.verseReading.reference ?? '',
              text: ctx.verseReading.text ?? '',
            },
            legacy: {
              kind: 'scripture',
              title: 'Verse Reading',
              subtitle: ctx.verseReading.reference || undefined,
              body: ctx.verseReading.text || undefined,
            },
          }),
        ]
      : [],

  'opening-prayer': () => [
    leaf({
      id: 'bt-opening-prayer',
      templateId: 'opening-prayer',
      legacy: { kind: 'divider', title: 'Opening Prayer' },
    }),
  ],

  'bible-talk': () => [
    leaf({
      id: 'bible-talk',
      templateId: 'bible-talk',
      legacy: { kind: 'divider', title: 'Bible Talk' },
    }),
  ],

  'bt-closing-song-cue': (ctx) =>
    ctx.bibleTalkHymns[1]
      ? [
          leaf({
            id: 'bt-closing-song-cue',
            templateId: 'bt-closing-song-cue',
            legacy: {
              kind: 'divider',
              title: 'Closing Song',
              subtitle: 'Congregation, please stand',
            },
          }),
        ]
      : [],

  'bt-closing-song': (ctx) =>
    ctx.bibleTalkHymns[1]
      ? songGroupNodes(ctx.bibleTalkHymns[1], 'bt-closing', 'bt-closing-song')
      : [],

  'closing-prayer': () => [
    leaf({
      id: 'bt-closing-prayer',
      templateId: 'closing-prayer',
      legacy: { kind: 'divider', title: 'Closing Prayer' },
    }),
  ],

  'break-time': () => [
    leaf({
      id: 'break-time',
      templateId: 'break-time',
      legacy: { kind: 'text', title: 'Break Time', subtitle: 'Offering' },
    }),
  ],

  'ds-sequence': () => [
    leaf({
      id: 'ds-sequence',
      templateId: 'ds-sequence',
      legacy: {
        kind: 'text',
        title: 'Divine Service Sequence',
        subtitle: 'Worship Service',
      },
    }),
  ],

  'bible-verse-contemplation': (ctx) => [
    leaf({
      id: 'theme-verse',
      templateId: 'bible-verse-contemplation',
      // Absent weekly verse → the registry template defaults supply the
      // standing theme verse (no second copy lives in this module).
      values: ctx.themeVerse
        ? { reference: ctx.themeVerse.reference ?? '', text: ctx.themeVerse.text ?? '' }
        : {},
      legacy: (instance) => ({
        kind: 'scripture',
        subtitle: findResolvedText(instance, 'reference') || undefined,
        body: findResolvedText(instance, 'text') || undefined,
      }),
    }),
  ],

  'ds-opening-song-cue': (ctx) =>
    ctx.dsOpening
      ? [
          leaf({
            id: 'ds-opening-song-cue',
            templateId: 'ds-opening-song-cue',
            legacy: {
              kind: 'divider',
              title: 'Opening Song',
              subtitle: 'Congregation, please stand',
            },
          }),
        ]
      : [],

  'ds-opening-song': (ctx) =>
    ctx.dsOpening
      ? songGroupNodes(ctx.dsOpening, 'ds-opening', 'ds-opening-song')
      : [],

  'intercessory-prayer': () => [
    leaf({
      id: 'intercessory-prayer',
      templateId: 'intercessory-prayer',
      legacy: {
        kind: 'divider',
        title: 'Intercessory Prayer',
        subtitle: 'Participant to podium',
      },
    }),
  ],

  'intercessory-671-lyric-1': () => [fixedLyricLeaf('intercessory-671-lyric-1')],

  'intercessory-prayer-during': () => [
    leaf({
      id: 'intercessory-prayer-during',
      templateId: 'intercessory-prayer-during',
      legacy: {
        kind: 'divider',
        title: 'Intercessory Prayer',
        subtitle: 'While participant prays',
      },
    }),
  ],

  'intercessory-684-lyric-1': () => [fixedLyricLeaf('intercessory-684-lyric-1')],

  // The unbounded ds-middle expansion (Dev Notes → Five transitional SongSet
  // entries): every Divine Service hymn that is neither the opening nor the
  // closing song, and is not the #671/#684 standing pair.
  'song-set': (ctx) =>
    ctx.dsMiddle.flatMap((hymn, idx) =>
      songGroupNodes(hymn, `ds-middle-${idx}`, 'song-set')
    ),

  'special-song': (ctx) =>
    ctx.specialSong
      ? [
          leaf({
            id: 'special-song',
            templateId: 'special-song',
            values: { performer: ctx.specialSong },
            legacy: {
              kind: 'divider',
              title: 'Special Song',
              subtitle: ctx.specialSong,
            },
          }),
        ]
      : [],

  sermon: (ctx) =>
    ctx.sermon
      ? [
          leaf({
            id: 'sermon',
            templateId: 'sermon',
            values: { title: ctx.sermon.title ?? '', speaker: ctx.sermon.speaker ?? '' },
            legacy: {
              kind: 'sermon',
              title: ctx.sermon.title || undefined,
              subtitle: ctx.sermon.speaker,
            },
          }),
        ]
      : [],

  'sermon-flyer': (ctx) =>
    ctx.sermonGraphic
      ? [
          leaf({
            id: 'sermon-graphic',
            templateId: 'sermon-flyer',
            values: { imageUrl: ctx.sermonGraphic },
            legacy: { kind: 'image', imageUrl: ctx.sermonGraphic, fade: false },
          }),
        ]
      : [],

  'ds-closing-song-cue': (ctx) =>
    ctx.dsClosing
      ? [
          leaf({
            id: 'ds-closing-song-cue',
            templateId: 'ds-closing-song-cue',
            legacy: {
              kind: 'divider',
              title: 'Closing Song',
              subtitle: 'Congregation, please stand',
            },
          }),
        ]
      : [],

  'ds-closing-song': (ctx) =>
    ctx.dsClosing
      ? songGroupNodes(ctx.dsClosing, 'ds-closing', 'ds-closing-song')
      : [],

  'closing-prayer-ds': (ctx) =>
    ctx.closingPrayer
      ? [
          leaf({
            id: 'ds-closing-prayer',
            templateId: 'closing-prayer-ds',
            values: { person: ctx.closingPrayer },
            legacy: {
              kind: 'closing-prayer',
              title: 'Closing Prayer',
              subtitle: ctx.closingPrayer,
            },
          }),
        ]
      : [],

  'hope-lyric-1': () => [fixedLyricLeaf('hope-lyric-1')],
  'hope-lyric-2': () => [fixedLyricLeaf('hope-lyric-2')],

  'announcements-header': (ctx) =>
    ctx.flyers.length > 0
      ? [
          leaf({
            id: 'announcements',
            templateId: 'announcements-header',
            legacy: { kind: 'text', title: 'Announcements', subtitle: 'Part C' },
          }),
        ]
      : [],

  'welcome-repeat': () => [
    leaf({
      id: 'welcome-repeat',
      templateId: 'welcome-repeat',
      legacy: {
        kind: 'text',
        title: 'Welcome',
        subtitle: 'Bandung International Community',
      },
    }),
  ],

  'offering-tithe': () => [
    leaf({
      id: 'offering-tithe',
      templateId: 'offering-tithe',
      legacy: (instance) => ({
        kind: 'body',
        title: 'Offering & Tithe',
        lines: derivedLines(instance, 'Offering & Tithe'),
      }),
    }),
  ],

  'midweek-prayer': () => [
    leaf({
      id: 'midweek-prayer',
      templateId: 'midweek-prayer',
      legacy: (instance) => ({
        kind: 'body',
        title: 'Midweek Prayer Meeting',
        lines: derivedLines(instance, 'Midweek Prayer Meeting'),
      }),
    }),
  ],

  'fellowship-etiquette': () => [
    leaf({
      id: 'fellowship-etiquette',
      templateId: 'fellowship-etiquette',
      legacy: (instance) => ({
        kind: 'body',
        title: 'Fellowship Etiquette',
        lines: derivedLines(instance, 'Fellowship Etiquette'),
      }),
    }),
  ],

  contact: () => [
    leaf({
      id: 'contact',
      templateId: 'contact',
      legacy: (instance) => ({
        kind: 'body',
        title: 'Contact',
        lines: derivedLines(instance, 'Contact'),
      }),
    }),
  ],

  // Slide 56 — combined Family & Youth (text + both photos)
  'family-youth': (ctx) =>
    ctx.familyBody || ctx.familyPhoto || ctx.youthPhoto
      ? [
          leaf({
            id: 'family-youth',
            templateId: 'family-youth',
            values: {
              familyText: optional(ctx.familyPrayer ?? ctx.legacyCombined),
              youthText: optional(ctx.youthPrayer),
              familyPhoto: optional(ctx.familyPhoto),
              youthPhoto: optional(ctx.youthPhoto),
            },
            legacy: {
              kind: 'family',
              title: 'Family & Youth of the Week',
              body: ctx.familyBody || undefined,
              imageUrl: ctx.familyPhoto || undefined,
              secondaryImageUrl: ctx.youthPhoto || undefined,
              fade: false,
            },
          }),
        ]
      : [],

  'announcement-flyer': (ctx) =>
    ctx.flyers.map((imageUrl, idx) =>
      leaf({
        id: `flyer-${idx}`,
        templateId: 'announcement-flyer',
        values: { imageUrl: [imageUrl] },
        legacy: { kind: 'image', imageUrl, fade: false },
      })
    ),

  'thank-you': () => [
    leaf({
      id: 'thank-you',
      templateId: 'thank-you',
      legacy: {
        kind: 'text',
        title: 'Thank You',
        subtitle: 'Bandung International Community',
      },
    }),
  ],
};

/**
 * Ordered artifact requests — the single slide-order authority.
 *
 * Sequence comes from `orderedTemplateIds` (the registry snapshot's own row
 * order, i.e. `artifact_templates.position` — AC-1, AC-2), not from source
 * order: swapping two positions in the database changes this walk with no
 * TypeScript edit. `ROW_HANDLERS` decides presence/content per row; it never
 * decides placement.
 *
 * Never performs a KJV corpus lookup — theme/verse text comes from the rundown
 * or from the registry template defaults.
 */
function buildRequestPlan(
  orderedTemplateIds: readonly string[],
  ctx: PlanContext
): RequestNode[] {
  const nodes: RequestNode[] = [];
  for (const id of orderedTemplateIds) {
    const handler = ROW_HANDLERS[id];
    if (!handler) continue;
    nodes.push(...handler(ctx));
  }
  return nodes;
}

function hydrateLeaf(
  snapshot: RegistrySnapshot,
  request: SlideRequest,
  group?: { id: string; label: string; role: 'title' | 'lyric' }
): ArtifactLeafNode {
  return {
    kind: 'artifact',
    instance: hydrateArtifactFromSnapshot(snapshot, {
      instanceId: request.id,
      templateId: request.templateId,
      layoutKey: request.layoutKey,
      values: request.values,
      group,
    }),
  };
}

/**
 * Hydrate one request, or omit it: a template the snapshot has no valid
 * layout for (AC-8 — the persisted row failed validation and, per
 * `loadRegistrySnapshot`, was not substituted from the seed) contributes no
 * layout to the plan rather than throwing. The omission is not silent —
 * `loadRegistrySnapshot` already logged the id when it rejected the row.
 */
function hydrateLeafOrOmit(
  snapshot: RegistrySnapshot,
  request: SlideRequest,
  group?: { id: string; label: string; role: 'title' | 'lyric' }
): ArtifactLeafNode | null {
  if (!snapshot.has(request.templateId)) return null;
  return hydrateLeaf(snapshot, request, group);
}

function hydrateRequestPlan(
  requests: RequestNode[],
  snapshot: RegistrySnapshot
): {
  plan: ArtifactNode[];
  legacyById: Map<string, LegacyFields>;
} {
  const plan: ArtifactNode[] = [];
  const legacyById = new Map<string, LegacyFields>();

  const record = (request: SlideRequest, instance: ArtifactInstance) => {
    legacyById.set(
      request.id,
      typeof request.legacy === 'function'
        ? request.legacy(instance)
        : request.legacy
    );
  };

  for (const node of requests) {
    if (node.kind === 'group') {
      const children: ArtifactLeafNode[] = [];
      for (const child of node.children) {
        const hydrated = hydrateLeafOrOmit(snapshot, child.request, {
          id: node.id,
          label: node.label,
          role: child.role,
        });
        if (!hydrated) continue;
        record(child.request, hydrated.instance);
        children.push(hydrated);
      }
      if (children.length === 0) continue;
      plan.push({ kind: 'group', id: node.id, label: node.label, children });
      continue;
    }

    const hydrated = hydrateLeafOrOmit(snapshot, node.request);
    if (!hydrated) continue;
    record(node.request, hydrated.instance);
    plan.push(hydrated);
  }

  return { plan, legacyById };
}

/**
 * Canonical hierarchical plan: SongSets are one group node with ordered
 * title/lyric children; every other slide is a leaf artifact node.
 */
export function buildArtifactPlan(
  serviceDate: string,
  parsedData: ParsedRundown,
  images: string[] | SlidePlanMedia = []
): ArtifactNode[] {
  // One registry read per plan build — never per slide. The snapshot's own
  // key order (position-sorted) is the sequence `buildRequestPlan` walks.
  const snapshot = loadRegistrySnapshot();
  const orderedIds = [...snapshot.keys()];
  const ctx = computePlanContext(serviceDate, parsedData, images);
  const requests = buildRequestPlan(orderedIds, ctx);
  return hydrateRequestPlan(requests, snapshot).plan;
}

/**
 * Flat slide plan shared by PPTX generation, the web slideshow and the
 * presenter. Order, ids and legacy fields are the flattened projection of
 * {@link buildArtifactPlan}.
 */
export function buildSlidePlan(
  serviceDate: string,
  parsedData: ParsedRundown,
  images: string[] | SlidePlanMedia = []
): SlidePlanItem[] {
  const snapshot = loadRegistrySnapshot();
  const orderedIds = [...snapshot.keys()];
  const ctx = computePlanContext(serviceDate, parsedData, images);
  const requests = buildRequestPlan(orderedIds, ctx);
  const { plan, legacyById } = hydrateRequestPlan(requests, snapshot);

  return flattenArtifactPlan(plan).map((instance) => {
    const legacy = legacyById.get(instance.instanceId);
    if (!legacy) {
      throw new Error(`Missing legacy projection for slide ${instance.instanceId}`);
    }
    return { id: instance.instanceId, ...legacy, artifact: instance };
  });
}
