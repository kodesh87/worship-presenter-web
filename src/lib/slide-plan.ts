import type { ParsedRundown, ParsedScripture } from './parser';
import {
  INTERCESSORY_STANDING_NUMBERS,
  resolveIntercessoryStandingHymns,
  resolveWeHaveThisHope,
  splitLyricsLabeled,
  splitWeHaveThisHopeSlides,
} from './lyrics';
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

function pushSongGroup(
  nodes: RequestNode[],
  hymn: HymnItem,
  idPrefix: string,
  options?: {
    skipTitle?: boolean;
    /** CAP-4: fixed 2-slide poetic layout for standing We Have This Hope. */
    weHaveThisHopeFixed?: boolean;
    preserveLineBreaks?: boolean;
  }
) {
  const children: RequestGroupChild[] = [];

  if (!options?.skipTitle) {
    const subtitle = hymn.incomplete
      ? `SDAH ${hymn.number} (incomplete)`
      : `SDAH ${hymn.number}`;
    children.push({
      role: 'title',
      request: {
        id: `${idPrefix}-title`,
        templateId: 'song-set',
        layoutKey: 'title',
        values: { hymnNumber: subtitle, songTitle: hymn.title },
        legacy: { kind: 'song-title', title: hymn.title, subtitle },
      },
    });
  }

  if (!hymn.incomplete && hymn.lyrics?.trim()) {
    const lyricSlides = options?.weHaveThisHopeFixed
      ? splitWeHaveThisHopeSlides(hymn.lyrics)
      : splitLyricsLabeled(hymn.lyrics, 4, {
          preserveLineBreaks: options?.preserveLineBreaks,
        });

    let i = 0;
    for (const lyric of lyricSlides) {
      i += 1;
      children.push({
        role: 'lyric',
        request: {
          id: `${idPrefix}-lyric-${i}`,
          templateId: 'song-set',
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

  if (children.length === 0) return;
  nodes.push({ kind: 'group', id: idPrefix, label: hymn.title, children });
}

/**
 * Ordered artifact requests — the single slide-order authority.
 * Never performs a KJV corpus lookup — theme/verse text comes from the rundown
 * or from the registry template defaults.
 */
function buildRequestPlan(
  serviceDate: string,
  parsedData: ParsedRundown,
  images: string[] | SlidePlanMedia
): RequestNode[] {
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

  const nodes: RequestNode[] = [];

  // ── PART A — Bible Talk ──────────────────────────────────────────
  nodes.push(
    leaf({
      id: 'welcome',
      templateId: 'welcome',
      values: { date: serviceDate },
      legacy: {
        kind: 'text',
        title: 'Welcome',
        subtitle: 'Bandung International Community',
        body: serviceDate,
      },
    })
  );
  nodes.push(
    leaf({
      id: 'bible-talk-sequence',
      templateId: 'bible-talk-sequence',
      legacy: {
        kind: 'text',
        title: 'Bible Talk Sequence',
        subtitle: 'Sabbath School',
      },
    })
  );
  nodes.push(
    leaf({
      id: 'prayer-partners',
      templateId: 'prayer-partners',
      legacy: { kind: 'divider', title: 'Prayer Partners' },
    })
  );

  if (bibleTalkHymns[0]) {
    nodes.push(
      leaf({
        id: 'bt-opening-song-cue',
        templateId: 'opening-song-cue',
        legacy: {
          kind: 'divider',
          title: 'Opening Song',
          subtitle: 'Congregation, please stand',
        },
      })
    );
    pushSongGroup(nodes, bibleTalkHymns[0], 'bt-opening');
  }

  if (verseReading) {
    nodes.push(
      leaf({
        id: 'verse-reading',
        templateId: 'verse-reading',
        values: {
          reference: verseReading.reference ?? '',
          text: verseReading.text ?? '',
        },
        legacy: {
          kind: 'scripture',
          title: 'Verse Reading',
          subtitle: verseReading.reference || undefined,
          body: verseReading.text || undefined,
        },
      })
    );
  }

  nodes.push(
    leaf({
      id: 'bt-opening-prayer',
      templateId: 'opening-prayer',
      legacy: { kind: 'divider', title: 'Opening Prayer' },
    })
  );
  nodes.push(
    leaf({
      id: 'bible-talk',
      templateId: 'bible-talk',
      legacy: { kind: 'divider', title: 'Bible Talk' },
    })
  );

  if (bibleTalkHymns[1]) {
    nodes.push(
      leaf({
        id: 'bt-closing-song-cue',
        templateId: 'closing-song-cue',
        legacy: {
          kind: 'divider',
          title: 'Closing Song',
          subtitle: 'Congregation, please stand',
        },
      })
    );
    pushSongGroup(nodes, bibleTalkHymns[1], 'bt-closing');
  }

  nodes.push(
    leaf({
      id: 'bt-closing-prayer',
      templateId: 'closing-prayer',
      legacy: { kind: 'divider', title: 'Closing Prayer' },
    })
  );
  nodes.push(
    leaf({
      id: 'break-time',
      templateId: 'break-time',
      legacy: { kind: 'text', title: 'Break Time', subtitle: 'Offering' },
    })
  );

  // ── PART B — Divine Service ──────────────────────────────────────
  nodes.push(
    leaf({
      id: 'ds-sequence',
      templateId: 'ds-sequence',
      legacy: {
        kind: 'text',
        title: 'Divine Service Sequence',
        subtitle: 'Worship Service',
      },
    })
  );
  nodes.push(
    leaf({
      id: 'theme-verse',
      templateId: 'bible-verse-contemplation',
      // Absent weekly verse → the registry template defaults supply the
      // standing theme verse (no second copy lives in this module).
      values: themeVerse
        ? { reference: themeVerse.reference ?? '', text: themeVerse.text ?? '' }
        : {},
      legacy: (instance) => ({
        kind: 'scripture',
        subtitle: findResolvedText(instance, 'reference') || undefined,
        body: findResolvedText(instance, 'text') || undefined,
      }),
    })
  );

  const dsOpening = divineServiceHymns[0];
  const dsClosing =
    divineServiceHymns.length > 1
      ? divineServiceHymns[divineServiceHymns.length - 1]
      : undefined;
  const dsMiddle =
    divineServiceHymns.length > 2 ? divineServiceHymns.slice(1, -1) : [];

  if (dsOpening) {
    nodes.push(
      leaf({
        id: 'ds-opening-song-cue',
        templateId: 'opening-song-cue',
        legacy: {
          kind: 'divider',
          title: 'Opening Song',
          subtitle: 'Congregation, please stand',
        },
      })
    );
    pushSongGroup(nodes, dsOpening, 'ds-opening');
  }

  {
    const { before, during } = resolveIntercessoryStandingHymns();
    nodes.push(
      leaf({
        id: 'intercessory-prayer',
        templateId: 'intercessory-prayer',
        legacy: {
          kind: 'divider',
          title: 'Intercessory Prayer',
          subtitle: 'Participant to podium',
        },
      })
    );
    pushSongGroup(
      nodes,
      {
        type: 'hymn',
        number: before.number,
        title: before.title,
        lyrics: before.lyrics,
      },
      'intercessory-671',
      { skipTitle: true }
    );
    nodes.push(
      leaf({
        id: 'intercessory-prayer-during',
        templateId: 'intercessory-prayer-during',
        legacy: {
          kind: 'divider',
          title: 'Intercessory Prayer',
          subtitle: 'While participant prays',
        },
      })
    );
    pushSongGroup(
      nodes,
      {
        type: 'hymn',
        number: during.number,
        title: during.title,
        lyrics: during.lyrics,
      },
      'intercessory-684',
      { skipTitle: true }
    );
  }

  dsMiddle.forEach((hymn, idx) => {
    pushSongGroup(nodes, hymn, `ds-middle-${idx}`);
  });

  if (specialSong) {
    nodes.push(
      leaf({
        id: 'special-song',
        templateId: 'special-song',
        values: { performer: specialSong },
        legacy: {
          kind: 'divider',
          title: 'Special Song',
          subtitle: specialSong,
        },
      })
    );
  }

  if (sermon) {
    nodes.push(
      leaf({
        id: 'sermon',
        templateId: 'sermon',
        values: { title: sermon.title ?? '', speaker: sermon.speaker ?? '' },
        legacy: {
          kind: 'sermon',
          title: sermon.title || undefined,
          subtitle: sermon.speaker,
        },
      })
    );
  }

  if (sermonGraphic) {
    nodes.push(
      leaf({
        id: 'sermon-graphic',
        templateId: 'sermon-flyer',
        values: { imageUrl: sermonGraphic },
        legacy: { kind: 'image', imageUrl: sermonGraphic, fade: false },
      })
    );
  }

  if (dsClosing) {
    nodes.push(
      leaf({
        id: 'ds-closing-song-cue',
        templateId: 'closing-song-cue',
        legacy: {
          kind: 'divider',
          title: 'Closing Song',
          subtitle: 'Congregation, please stand',
        },
      })
    );
    pushSongGroup(nodes, dsClosing, 'ds-closing');
  }

  if (closingPrayer) {
    nodes.push(
      leaf({
        id: 'ds-closing-prayer',
        templateId: 'closing-prayer-ds',
        values: { person: closingPrayer },
        legacy: {
          kind: 'closing-prayer',
          title: 'Closing Prayer',
          subtitle: closingPrayer,
        },
      })
    );
  }

  {
    const hope = resolveWeHaveThisHope();
    pushSongGroup(
      nodes,
      {
        type: 'hymn',
        number: hope.number,
        title: hope.title,
        lyrics: hope.lyrics,
      },
      'hope',
      { skipTitle: true, weHaveThisHopeFixed: true }
    );
  }

  // ── PART C — Announcements & standing slides ─────────────────────
  if (flyers.length > 0) {
    nodes.push(
      leaf({
        id: 'announcements',
        templateId: 'announcements-header',
        legacy: { kind: 'text', title: 'Announcements', subtitle: 'Part C' },
      })
    );
  }
  nodes.push(
    leaf({
      id: 'welcome-repeat',
      templateId: 'welcome-repeat',
      legacy: {
        kind: 'text',
        title: 'Welcome',
        subtitle: 'Bandung International Community',
      },
    })
  );
  nodes.push(
    leaf({
      id: 'offering-tithe',
      templateId: 'offering-tithe',
      legacy: (instance) => ({
        kind: 'body',
        title: 'Offering & Tithe',
        lines: derivedLines(instance, 'Offering & Tithe'),
      }),
    })
  );
  nodes.push(
    leaf({
      id: 'midweek-prayer',
      templateId: 'midweek-prayer',
      legacy: (instance) => ({
        kind: 'body',
        title: 'Midweek Prayer Meeting',
        lines: derivedLines(instance, 'Midweek Prayer Meeting'),
      }),
    })
  );
  nodes.push(
    leaf({
      id: 'fellowship-etiquette',
      templateId: 'fellowship-etiquette',
      legacy: (instance) => ({
        kind: 'body',
        title: 'Fellowship Etiquette',
        lines: derivedLines(instance, 'Fellowship Etiquette'),
      }),
    })
  );
  nodes.push(
    leaf({
      id: 'contact',
      templateId: 'contact',
      legacy: (instance) => ({
        kind: 'body',
        title: 'Contact',
        lines: derivedLines(instance, 'Contact'),
      }),
    })
  );

  // Slide 56 — combined Family & Youth (text + both photos)
  if (familyBody || familyPhoto || youthPhoto) {
    nodes.push(
      leaf({
        id: 'family-youth',
        templateId: 'family-youth',
        values: {
          familyText: optional(familyPrayer ?? legacyCombined),
          youthText: optional(youthPrayer),
          familyPhoto: optional(familyPhoto),
          youthPhoto: optional(youthPhoto),
        },
        legacy: {
          kind: 'family',
          title: 'Family & Youth of the Week',
          body: familyBody || undefined,
          imageUrl: familyPhoto || undefined,
          secondaryImageUrl: youthPhoto || undefined,
          fade: false,
        },
      })
    );
  }

  flyers.forEach((imageUrl, idx) => {
    nodes.push(
      leaf({
        id: `flyer-${idx}`,
        templateId: 'announcement-flyer',
        values: { imageUrl: [imageUrl] },
        legacy: { kind: 'image', imageUrl, fade: false },
      })
    );
  });

  nodes.push(
    leaf({
      id: 'thank-you',
      templateId: 'thank-you',
      legacy: {
        kind: 'text',
        title: 'Thank You',
        subtitle: 'Bandung International Community',
      },
    })
  );

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

function hydrateRequestPlan(requests: RequestNode[]): {
  plan: ArtifactNode[];
  legacyById: Map<string, LegacyFields>;
} {
  // One registry read per plan build — never per slide.
  const snapshot = loadRegistrySnapshot();
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
      const children = node.children.map((child) => {
        const hydrated = hydrateLeaf(snapshot, child.request, {
          id: node.id,
          label: node.label,
          role: child.role,
        });
        record(child.request, hydrated.instance);
        return hydrated;
      });
      plan.push({ kind: 'group', id: node.id, label: node.label, children });
      continue;
    }

    const hydrated = hydrateLeaf(snapshot, node.request);
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
  return hydrateRequestPlan(buildRequestPlan(serviceDate, parsedData, images))
    .plan;
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
  const { plan, legacyById } = hydrateRequestPlan(
    buildRequestPlan(serviceDate, parsedData, images)
  );

  return flattenArtifactPlan(plan).map((instance) => {
    const legacy = legacyById.get(instance.instanceId);
    if (!legacy) {
      throw new Error(`Missing legacy projection for slide ${instance.instanceId}`);
    }
    return { id: instance.instanceId, ...legacy, artifact: instance };
  });
}
