/**
 * The single unit-conversion table for hydrated Artifact elements.
 *
 * `ResolvedElement.x/y/w/h` are percentages of a fixed 16:9 canvas whose
 * reference pixel size is 960x540, and `style.fontSize` is px on that same
 * reference. PPTX and the web renderer must agree on how those become inches /
 * points and CSS percentages / container units, so *every* conversion lives
 * here and nowhere else.
 *
 * Values may be negative or greater than 100 — that is deliberate clipping
 * inherited from the source deck and is never clamped.
 */
import {
  REFERENCE_CANVAS,
  type ResolvedElement,
  type ResolvedStyle,
} from './runtime-contract';

/**
 * Shrink-to-fit policy.
 *
 * Rule: **an element never paints outside its own box.** The registry's boxes
 * were auto-sized around their text in the source deck, so they hug it with no
 * slack, and a renderer that lets long text spill paints one element across its
 * neighbours — `closing-song-cue` pushes two 120px lines out of a 30%-high box
 * and over the rest of the slide.
 *
 * Text therefore scales down until its content fits, and stops at
 * `MIN_TEXT_FIT_SCALE`; past that point the box clips instead. Clipping means
 * the element's own content stays inside the element box — it never means the
 * box is clamped to the slide. Off-canvas geometry stays untouched.
 */

/** Line height both renderers lay text out at. */
export const TEXT_LINE_HEIGHT = 1.2;

/**
 * Fraction of the font size that a `TEXT_LINE_HEIGHT` line box leaves *empty*
 * above the first line and below the last, and which therefore does not count
 * as content when deciding whether text fits.
 *
 * A line box is taller than the glyphs it holds: the rest is half leading, split
 * top and bottom, and it carries no ink. Arial's content area is ~1.117em, so at
 * 1.2 the real empty band is ~0.083em; this stays well inside that for every
 * face the registry ships, which is the point — the allowance may never be so
 * large that the box clip amputates a descender on text the policy just called
 * "fitting".
 */
export const TEXT_FIT_LEADING_ALLOWANCE = 0.05;

/**
 * Floor for the fit scale: below 35% of the authored size projected text stops
 * being readable from the back of the hall, so shrinking further would only
 * trade a visible overflow for an invisible one. PowerPoint's own autofit stops
 * near 25%; we stop earlier and clip, because a clipped slide is obvious in
 * Live Preview and gets the content fixed before Sabbath.
 */
export const MIN_TEXT_FIT_SCALE = 0.35;

/**
 * Scale factors are floored to this step. Quantizing keeps the browser's
 * measured value and the PPTX estimate landing on the same number, and keeps a
 * sub-pixel measurement wobble from rewriting the font size every frame.
 */
export const TEXT_FIT_SCALE_STEP = 0.01;

export type TextFitMeasurement = {
  /** Widest painted line; `0` when the axis was not measured. */
  contentWidth: number;
  /** Full laid-out height of the text, leading included. */
  contentHeight: number;
  boxWidth: number;
  boxHeight: number;
  /**
   * One em in the same units as the measurements, at the scale that was
   * measured. `TEXT_FIT_LEADING_ALLOWANCE` of it is discounted from
   * `contentHeight`, because the registry's boxes are PowerPoint auto-sized
   * shapes that hug their glyphs while a CSS line box also carries empty
   * leading — comparing the two raw would shrink text for whitespace.
   */
  fontSizePx: number;
};

/** pptxgenjs `LAYOUT_16x9` measures 10in x 5.625in (= 720pt x 405pt). */
export const PPTX_SLIDE_WIDTH_IN = 10;
export const PPTX_SLIDE_HEIGHT_IN = 5.625;
const PPTX_SLIDE_HEIGHT_PT = 405;

/** 405pt of slide height over 540px of reference canvas height (= 0.75). */
export const PX_TO_PT = PPTX_SLIDE_HEIGHT_PT / REFERENCE_CANVAS.height;

/** Used whenever an element carries no explicit `style.fontSize`. */
export const DEFAULT_FONT_SIZE_PX = 32;
export const DEFAULT_FONT_FAMILY = 'Arial';
export const DEFAULT_OBJECT_FIT = 'contain' as const;
export const DEFAULT_TEXT_ALIGN = 'left' as const;
export const DEFAULT_VERTICAL_ALIGN = 'top' as const;

export type PptxGeometry = {
  /** Inches from the left edge; may be negative. */
  x: number;
  /** Inches from the top edge; may be negative. */
  y: number;
  /** Inches wide; may exceed the slide width. */
  w: number;
  /** Inches tall; may exceed the slide height. */
  h: number;
  /** Points. */
  fontSize: number;
};

export type CssGeometry = {
  left: string;
  top: string;
  width: string;
  height: string;
  /** Container-query height units, so text scales with the rendered stage. */
  fontSize: string;
};

const HEX6 = /^#?[0-9A-Fa-f]{6}$/;

/** Keep emitted numbers deterministic so assertions do not chase float dust. */
function round(value: number, digits = 4): number {
  const factor = 10 ** digits;
  const out = Math.round(value * factor) / factor;
  return Object.is(out, -0) ? 0 : out;
}

function fontSizePx(style: ResolvedStyle): number {
  const size = style.fontSize;
  return typeof size === 'number' && Number.isFinite(size)
    ? size
    : DEFAULT_FONT_SIZE_PX;
}

/** Percent of the reference canvas -> inches / points on a 16:9 PPTX slide. */
export function toPptxGeometry(element: ResolvedElement): PptxGeometry {
  return {
    x: round((element.x / 100) * PPTX_SLIDE_WIDTH_IN),
    y: round((element.y / 100) * PPTX_SLIDE_HEIGHT_IN),
    w: round((element.w / 100) * PPTX_SLIDE_WIDTH_IN),
    h: round((element.h / 100) * PPTX_SLIDE_HEIGHT_IN),
    fontSize: round(fontSizePx(element.style) * PX_TO_PT),
  };
}

/** Percent of the reference canvas -> CSS box percentages / `cqh` font size. */
export function toCssGeometry(element: ResolvedElement): CssGeometry {
  return {
    left: `${round(element.x)}%`,
    top: `${round(element.y)}%`,
    width: `${round(element.w)}%`,
    height: `${round(element.h)}%`,
    fontSize: `${round((fontSizePx(element.style) / REFERENCE_CANVAS.height) * 100)}cqh`,
  };
}

/**
 * Fit ratio for one axis. `Infinity` means "this axis cannot force a shrink"
 * (nothing measurable to fit); `0` means a degenerate box that can hold nothing
 * and therefore drops straight to the floor.
 */
function axisFitRatio(needed: number, available: number): number {
  if (!Number.isFinite(needed) || needed <= 0) return Number.POSITIVE_INFINITY;
  if (!Number.isFinite(available) || available <= 0) return 0;
  return available / needed;
}

/** Raw fit ratio -> the scale the policy allows. Never throws. */
export function quantizeTextFitScale(ratio: number): number {
  // Unmeasurable: leave the authored size alone rather than guess.
  if (!Number.isFinite(ratio)) return 1;
  if (ratio >= 1) return 1;
  // Round the quotient before flooring: `0.75 / 0.01` is 74.999… in binary
  // floating point, which would otherwise step an exact ratio down a notch.
  const steps = Math.floor(round(ratio / TEXT_FIT_SCALE_STEP, 6));
  return round(Math.max(MIN_TEXT_FIT_SCALE, steps * TEXT_FIT_SCALE_STEP));
}

/**
 * How much of the box the measured content leaves: `>= 1` fits, `Infinity` when
 * there was nothing to fit. Pure and total — an unusable measurement reads as
 * `Infinity` (draw as authored) rather than throwing.
 */
export function textFitRatio(measurement: TextFitMeasurement): number {
  const em = Number.isFinite(measurement.fontSizePx)
    ? Math.max(0, measurement.fontSizePx)
    : 0;
  const inkHeight =
    measurement.contentHeight - TEXT_FIT_LEADING_ALLOWANCE * em;

  return Math.min(
    axisFitRatio(inkHeight, measurement.boxHeight),
    axisFitRatio(measurement.contentWidth, measurement.boxWidth)
  );
}

/**
 * Measured content vs its box -> the font scale to apply, in one shot.
 *
 * Accurate whenever shrinking cannot change how the text breaks. When it can —
 * a browser re-wrapping a long line at a smaller size — this is a lower bound,
 * and `largestFittingTextScale` refines it.
 */
export function resolveTextFitScale(measurement: TextFitMeasurement): number {
  return quantizeTextFitScale(textFitRatio(measurement));
}

/**
 * Largest allowed scale at which `fits` reports the content inside its box.
 *
 * Shrinking a wrapped paragraph can pull it back onto fewer lines, so a single
 * measurement at full size over-shrinks — `welcome`'s "Welcome to" wraps in two
 * on a wide stage and reads as needing 0.4, when 0.7 puts it back on one line
 * and fills the box. `fits` is monotone (a smaller font never needs more room),
 * so a bisection over the quantized scales finds that largest value in at most
 * eight probes, and exactly one when the text already fits.
 *
 * Nothing below the floor is ever probed: that range is where the box clips.
 */
export function largestFittingTextScale(
  fits: (scale: number) => boolean
): number {
  if (fits(1)) return 1;

  const scaleAt = (step: number) => round(step * TEXT_FIT_SCALE_STEP);
  const minStep = Math.round(MIN_TEXT_FIT_SCALE / TEXT_FIT_SCALE_STEP);
  let low = minStep;
  let high = Math.round(1 / TEXT_FIT_SCALE_STEP) - 1;
  let best = minStep;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (fits(scaleAt(mid))) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return scaleAt(best);
}

/**
 * The same policy for renderers that cannot measure glyphs — PPTX generation
 * runs on the server with no layout engine.
 *
 * Only the element's own line breaks are counted, so the estimate never sees
 * wrapping and is therefore an *upper* bound on the scale: PowerPoint's own
 * "shrink text on overflow" (enabled alongside it) covers the remainder.
 */
export function estimateTextFitScale(element: ResolvedElement): number {
  const text = resolveElementText(element);
  if (text === undefined) return 1;

  const em = fontSizePx(element.style);
  const lines = text.split('\n').length;

  return resolveTextFitScale({
    // Wrapping is unknowable without glyph metrics; the height axis decides.
    contentWidth: 0,
    contentHeight: lines * TEXT_LINE_HEIGHT * em,
    boxWidth: (element.w / 100) * REFERENCE_CANVAS.width,
    boxHeight: (element.h / 100) * REFERENCE_CANVAS.height,
    fontSizePx: em,
  });
}

/** pptxgenjs wants bare `RRGGBB`; anything non-hex passes through untouched. */
export function toPptxColor(color: string | undefined): string | undefined {
  if (typeof color !== 'string' || !color) return undefined;
  if (!HEX6.test(color)) return color;
  return color.replace('#', '').toUpperCase();
}

/** CSS wants `#RRGGBB`; anything non-hex passes through untouched. */
export function toCssColor(color: string | undefined): string | undefined {
  if (typeof color !== 'string' || !color) return undefined;
  if (!HEX6.test(color)) return color;
  return `#${color.replace('#', '').toUpperCase()}`;
}

export function resolveFontFamily(style: ResolvedStyle): string {
  const family = style.fontFamily;
  return typeof family === 'string' && family.trim()
    ? family
    : DEFAULT_FONT_FAMILY;
}

export function resolveObjectFit(style: ResolvedStyle): 'contain' | 'cover' {
  return style.objectFit === 'cover' ? 'cover' : DEFAULT_OBJECT_FIT;
}

export function resolveTextAlign(
  style: ResolvedStyle
): 'left' | 'center' | 'right' {
  if (style.textAlign === 'center' || style.textAlign === 'right') {
    return style.textAlign;
  }
  return DEFAULT_TEXT_ALIGN;
}

export function resolveVerticalAlign(
  style: ResolvedStyle
): 'top' | 'middle' | 'bottom' {
  if (style.verticalAlign === 'middle' || style.verticalAlign === 'bottom') {
    return style.verticalAlign;
  }
  return DEFAULT_VERTICAL_ALIGN;
}

/** `fontWeight` is free-form in the registry: accept `bold` and 600+ numerics. */
export function resolveBold(style: ResolvedStyle): boolean {
  const weight = style.fontWeight;
  if (typeof weight !== 'string') return false;
  const normalized = weight.trim().toLowerCase();
  if (normalized === 'bold' || normalized === 'bolder') return true;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) && numeric >= 600;
}

export function resolveItalic(style: ResolvedStyle): boolean {
  const fontStyle = style.fontStyle;
  if (typeof fontStyle !== 'string') return false;
  const normalized = fontStyle.trim().toLowerCase();
  return normalized === 'italic' || normalized === 'oblique';
}

/** Always 0..1; out-of-range or missing values fall back to fully opaque. */
export function resolveOpacity(style: ResolvedStyle): number {
  const opacity = style.opacity;
  if (typeof opacity !== 'number' || !Number.isFinite(opacity)) return 1;
  if (opacity < 0) return 0;
  if (opacity > 1) return 1;
  return round(opacity);
}

/** PowerPoint expresses fill opacity as transparency percent (0 = opaque). */
export function toPptxTransparency(style: ResolvedStyle): number {
  return round((1 - resolveOpacity(style)) * 100, 2);
}

/** Column-flex mapping for `verticalAlign`. */
export function toCssJustifyContent(
  style: ResolvedStyle
): 'flex-start' | 'center' | 'flex-end' {
  const vertical = resolveVerticalAlign(style);
  if (vertical === 'middle') return 'center';
  if (vertical === 'bottom') return 'flex-end';
  return 'flex-start';
}

/** Column-flex cross-axis mapping for `textAlign`. */
export function toCssAlignItems(
  style: ResolvedStyle
): 'flex-start' | 'center' | 'flex-end' {
  const horizontal = resolveTextAlign(style);
  if (horizontal === 'center') return 'center';
  if (horizontal === 'right') return 'flex-end';
  return 'flex-start';
}

/** Renderable text, or `undefined` when the element draws nothing. */
export function resolveElementText(
  element: ResolvedElement
): string | undefined {
  if (element.type !== 'text') return undefined;
  const text = element.text;
  if (typeof text !== 'string' || !text.trim()) return undefined;
  return text;
}

/** Renderable image reference, or `undefined` for an unfilled placeholder. */
export function resolveElementImage(
  element: ResolvedElement
): string | undefined {
  if (element.type !== 'image' && element.type !== 'image-placeholder') {
    return undefined;
  }
  const url = element.imageUrl;
  if (typeof url !== 'string' || !url.trim()) return undefined;
  return url;
}
