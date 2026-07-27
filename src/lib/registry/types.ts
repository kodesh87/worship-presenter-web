export const ARTIFACT_BASE_TYPES = [
  'general',
  'text-placeholder',
  'fullscreen-image',
  'image-placeholder',
  'mix-placeholder',
  'song-set',
  'announcement',
] as const;

export type ArtifactBaseType = (typeof ARTIFACT_BASE_TYPES)[number];

export const READ_ONLY_BASE_TYPES: ReadonlySet<ArtifactBaseType> = new Set([
  'fullscreen-image',
  'song-set',
  'announcement',
]);

export const EDITABLE_BASE_TYPES: ReadonlySet<ArtifactBaseType> = new Set([
  'general',
  'text-placeholder',
  'image-placeholder',
  'mix-placeholder',
]);

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
