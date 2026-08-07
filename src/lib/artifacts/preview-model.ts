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
import type { ArtifactBaseType } from '@/lib/registry/types';
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

/**
 * Template id → operator vocabulary. Ids not listed fall back to a humanized
 * form of the template label, so a newly seeded template still reads sensibly.
 */
const TEMPLATE_LABELS: Readonly<Record<string, string>> = {
  welcome: 'Welcome',
  'welcome-repeat': 'Welcome',
  'bible-talk-sequence': 'Bible Talk Sequence',
  'prayer-partners': 'Prayer Partners',
  'bt-opening-song-cue': 'Opening Song',
  'ds-opening-song-cue': 'Opening Song',
  'bt-closing-song-cue': 'Closing Song',
  'ds-closing-song-cue': 'Closing Song',
  'verse-reading': 'Verse Reading',
  'opening-prayer': 'Opening Prayer',
  'bible-talk': 'Bible Talk',
  'closing-prayer': 'Closing Prayer',
  'closing-prayer-ds': 'Closing Prayer',
  'break-time': 'Break Time',
  'ds-sequence': 'Divine Service Sequence',
  'bible-verse-contemplation': 'Theme Verse',
  'intercessory-prayer': 'Intercessory Prayer',
  'intercessory-671-lyric-1': 'Intercessory Song (#671)',
  'intercessory-prayer-during': 'Intercessory Prayer',
  'intercessory-684-lyric-1': 'Intercessory Song (#684)',
  'special-song': 'Special Song',
  sermon: 'Sermon',
  'sermon-flyer': 'Sermon Flyer',
  'hope-lyric-1': 'We Have This Hope',
  'hope-lyric-2': 'We Have This Hope',
  'announcements-header': 'Announcements',
  'announcement-flyer': 'Announcement Flyer',
  'offering-tithe': 'Offering & Tithe',
  'midweek-prayer': 'Midweek Prayer',
  'fellowship-etiquette': 'Fellowship Etiquette',
  contact: 'Contact',
  'family-youth': 'Family & Youth',
  'thank-you': 'Thank You',
};

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

/** Base types that put a picture on screen rather than words. */
const IMAGE_BASE_TYPES: ReadonlySet<ArtifactBaseType> = new Set([
  'fullscreen-image',
  'announcement',
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
  // Story 20.1 (AC-6) split the shared `song-set` template into five rows —
  // the ds-middle row plus four transitional per-position clones — so this
  // checks `baseType` rather than one hardcoded id; every SongSet template
  // still speaks by layout key ("Song Title" / "Song Lyric"), never by id.
  if (instance.baseType === 'song-set') {
    return SONG_SET_LABELS[instance.layoutKey] ?? SONG_SET_LABELS.default;
  }
  const mapped = TEMPLATE_LABELS[instance.templateId];
  if (mapped) return mapped;
  return humanize(instance.label || instance.templateId);
}

/**
 * Stable tone key both forms map to their own class table, so the two preview
 * panes cannot drift into different colours for the same kind of slide.
 */
export function previewBadgeTone(entry: PreviewEntry): PreviewBadgeTone {
  if (entry.role === 'title') return 'song-title';
  if (entry.role === 'lyric') return 'song-lyric';
  if (SCRIPTURE_TEMPLATE_IDS.has(entry.templateId)) return 'scripture';
  if (IMAGE_BASE_TYPES.has(entry.baseType)) return 'image';
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
