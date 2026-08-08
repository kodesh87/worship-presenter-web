/** The three slide kinds — chip vocabulary and {@link kindOf} return values. */
export const ARTIFACT_BASE_TYPES = ['general', 'song-set', 'announcement'] as const;

export type ArtifactKind = (typeof ARTIFACT_BASE_TYPES)[number];

/**
 * Legal persisted entry keys in `base_type` / `payload.baseType`.
 * Story 20.7 extends this with `songset-*` slot identities; extend this list,
 * not {@link ARTIFACT_BASE_TYPES}, when widening the entry set.
 */
export const ARTIFACT_ENTRY_KEYS = ['general', 'song-set', 'announcement'] as const;

export type ArtifactEntryKey = (typeof ARTIFACT_ENTRY_KEYS)[number];

/** Persisted entry key on a registry row (today identical to the kind set). */
export type ArtifactBaseType = ArtifactEntryKey;

/**
 * Maps a persisted entry key (`base_type` / `payload.baseType`) to its kind.
 * Today the three kind values are also the only legal entry keys; Story 20.7
 * widens the entry set with `songset-*` slot identities that still read as
 * `[song-set]` on every human surface.
 */
export function kindOf(entryKey: string): ArtifactKind {
  if (entryKey === 'general') return 'general';
  if (entryKey === 'announcement') return 'announcement';
  if (entryKey === 'song-set' || entryKey.startsWith('songset-')) return 'song-set';
  throw new Error(`Unknown artifact entry key: ${entryKey}`);
}

/** Safe at render boundaries; {@link kindOf} still throws for invalid keys. */
export function kindChipLabel(entryKey: string): ArtifactKind | 'unknown' {
  try {
    return kindOf(entryKey);
  } catch {
    return 'unknown';
  }
}

/** AD-22: free canvas is General's alone — the only canvas-authorable kind. */
export function isCanvasAuthorable(baseType: ArtifactBaseType): boolean {
  return baseType === 'general';
}

export type PlaceholderType = 'text' | 'text[]' | 'image' | 'image[]';

export type CanvasElementType =
  | 'text'
  | 'image'
  | 'image-placeholder'
  | 'shape';

export type TextStyle = {
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
};

export type ImageStyle = {
  objectFit?: 'contain' | 'cover';
};

export type ShapeStyle = {
  fillColor?: string;
  opacity?: number;
};

export type CanvasElement = {
  id: string;
  type: CanvasElementType;
  required: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  content?: string;
  placeholderKey?: string;
  imageRef?: string;
  style?: TextStyle & ImageStyle & ShapeStyle;
};

export type PlaceholderDefinition = {
  key: string;
  type: PlaceholderType;
  required: boolean;
  defaultValue?: string | string[];
};

export type ArtifactLayout = {
  aspectRatio: '16:9';
  backgroundColor: string;
  backgroundImage?: string;
  elements: CanvasElement[];
};

export type ArtifactTemplate = {
  schemaVersion: 1;
  id: string;
  label: string;
  baseType: ArtifactBaseType;
  placeholders: PlaceholderDefinition[];
  layouts: {
    default?: ArtifactLayout;
    title?: ArtifactLayout;
    lyric?: ArtifactLayout;
  };
};

export type ArtifactTemplateSummary = {
  id: string;
  label: string;
  baseType: ArtifactBaseType;
  updatedAt: string;
  editable: boolean;
};

export type StoredArtifactTemplate = ArtifactTemplate & {
  updatedAt: string;
};
