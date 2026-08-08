/**
 * Live Preview projection of a hydrated artifact plan.
 *
 * Operators read the preview list to sanity-check a rundown before generating,
 * so it must speak their vocabulary ("Song Lyric", "Theme Verse") rather than
 * the registry's PascalCase template labels or the planner's internal slide
 * kinds. That translation lives here and nowhere else — the forms only pick a
 * CSS class for the tone this module returns.
 *
 * Entries stay a flat, linearly indexed list: `index` is the presentation
 * position of the slide, identical to its position in `buildSlidePlan` output.
 * SongSet grouping is expressed *on the children* (`groupId` / `groupLabel` /
 * `role`) instead of as a node of its own, so nesting the UI can never reorder
 * or renumber slides.
 */
import { kindChipLabel, type ArtifactBaseType } from '@/lib/registry/types';
import {
  flattenArtifactPlan,
  type ArtifactInstance,
  type ArtifactNode,
} from './runtime-contract';

export type PreviewEntry = {
  /** Stable 0-based linear presentation index across the whole plan. */
  index: number;
  instanceId: string;
  templateId: string;
  /** Operator-recognizable label; never a raw PascalCase template label. */
  label: string;
  baseType: ArtifactBaseType;
  /** Present only on members of a group (currently SongSets). */
  groupId?: string;
  groupLabel?: string;
  role?: 'title' | 'lyric';
};

export type PreviewBadgeTone =
  | 'song-title'
  | 'song-lyric'
  | 'scripture'
  | 'image'
  | 'default';

/** SongSet reuses one template across three layouts; the layout names the slide. */
const SONG_SET_LABELS: Readonly<Record<string, string>> = {
  title: 'Song Title',
  lyric: 'Song Lyric',
  default: 'Song',
};

/** Templates whose content is scripture, regardless of their base type. */
const SCRIPTURE_TEMPLATE_IDS: ReadonlySet<string> = new Set([
  'verse-reading',
  'bible-verse-contemplation',
]);

/**
 * Templates whose slide is primarily a picture. Story 20.5 may replace this
 * id-list with a Placeholder Catalog key check.
 */
const IMAGE_TEMPLATE_IDS: ReadonlySet<string> = new Set([
  'sermon-flyer',
]);

/** `ClosingPrayer_DS` → `Closing Prayer DS`; `family-youth` → `Family Youth`. */
function humanize(raw: string): string {
  const spaced = raw
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  if (!spaced) return raw;
  return spaced
    .split(' ')
    .map((word) => (/[A-Z]/.test(word) ? word : word[0].toUpperCase() + word.slice(1)))
    .join(' ');
}

/** The label an operator should see for one hydrated slide. */
export function previewLabel(instance: ArtifactInstance): string {
  // Non-throwing on purpose: this is reached from the Presenter render and from
  // /api/services/preview, and an unrecognised key must fall through to the
  // label rather than 500 the preview or crash the page.
  if (instance.baseType && kindChipLabel(instance.baseType) === 'song-set') {
    return SONG_SET_LABELS[instance.layoutKey] ?? SONG_SET_LABELS.default;
  }
  const trimmed = instance.label?.trim();
  if (trimmed) {
    return trimmed;
  }
  return humanize(instance.templateId);
}

/**
 * Stable tone key both forms map to their own class table, so the two preview
 * panes cannot drift into different colours for the same kind of slide.
 */
export function previewBadgeTone(entry: PreviewEntry): PreviewBadgeTone {
  if (entry.role === 'title') return 'song-title';
  if (entry.role === 'lyric') return 'song-lyric';
  if (SCRIPTURE_TEMPLATE_IDS.has(entry.templateId)) return 'scripture';
  // `kindChipLabel`, not `kindOf`: this runs inside SlidePreviewList's render and
  // there is no ErrorBoundary in src/, so an unrecognised key must degrade to a
  // tone rather than take the whole preview list down. The old `IMAGE_BASE_TYPES`
  // lookup could not throw; this keeps that property.
  if (
    kindChipLabel(entry.baseType) === 'announcement' ||
    IMAGE_TEMPLATE_IDS.has(entry.templateId)
  ) {
    return 'image';
  }
  return 'default';
}

function toEntry(instance: ArtifactInstance, index: number): PreviewEntry {
  const entry: PreviewEntry = {
    index,
    instanceId: instance.instanceId,
    templateId: instance.templateId,
    label: previewLabel(instance),
    baseType: instance.baseType,
  };
  if (instance.group) {
    entry.groupId = instance.group.id;
    entry.groupLabel = instance.group.label;
    entry.role = instance.group.role;
  }
  return entry;
}

/**
 * Flat preview entries in presentation order. Group nodes contribute their
 * children only — a group never occupies an index of its own.
 */
export function buildPreviewEntries(plan: ArtifactNode[]): PreviewEntry[] {
  return flattenArtifactPlan(plan).map(toEntry);
}
