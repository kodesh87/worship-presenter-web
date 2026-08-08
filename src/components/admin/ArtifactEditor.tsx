'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ArtifactLayout,
  ArtifactTemplateSummary,
  CanvasElement,
  StoredArtifactTemplate,
} from '@/lib/registry/types';
import { isCanvasAuthorable, kindChipLabel } from '@/lib/registry/types';
import {
  beforeUnloadGuard,
  CANVAS_MUTATION_EVENTS,
  DISCARD_ON_SWITCH_CONFIRMATION,
  mayDiscard,
  nextDirtyState,
  UNSAVED_INDICATOR_LABEL,
} from '@/lib/canvas-dirty-guard';
import { useNavigationBlocker } from '@/components/navigation-blocker';

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

/**
 * Prefix for element ids authored in the editor. Shipped seed layouts only use
 * `e<n>` ids, so this prefix can never collide with one and doubles as the
 * client-side marker for "this element may be deleted".
 */
const USER_ELEMENT_PREFIX = 'usr-';

const NEW_TEXT_CONTENT = 'New text';
const NEW_SHAPE_FILL = '#5C2E16';
const NEW_TEXT_SIZE_PX = { w: 400, h: 80 };
const NEW_SHAPE_SIZE_PX = { w: 300, h: 180 };
/** Cascade offset so repeated inserts do not stack on the exact same pixel. */
const INSERT_CASCADE_PX = 18;
const INSERT_CASCADE_STEPS = 8;

/**
 * Construction defaults for text objects. They intentionally mirror the render
 * defaults in `@/lib/artifacts/render-model` so a style key we omit renders
 * identically in the PPTX and on the projector.
 */
const DEFAULT_FONT_COLOR = '#FFFFFF';
const DEFAULT_FONT_FAMILY = 'Arial';
const DEFAULT_TEXT_ALIGN = 'left' as const;
const DEFAULT_FONT_SIZE = 32;
/** Matches the `min`/`max` hints on the font-size input. */
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 200;
/**
 * The server rejects non-positive `w`/`h`, so a degenerate drag must never be
 * serialized as zero. ~1px of the 960x540 reference canvas.
 */
const MIN_ELEMENT_W_PCT = pxToPct(1, CANVAS_WIDTH);
const MIN_ELEMENT_H_PCT = pxToPct(1, CANVAS_HEIGHT);

type FabricModule = typeof import('fabric');

type EditorStatus =
  | 'idle'
  | 'loading'
  | 'saving'
  | 'resetting'
  | 'success'
  | 'error'
  | 'conflict';

function pctToPx(value: number, total: number) {
  return (value / 100) * total;
}

function pxToPct(value: number, total: number) {
  return (value / total) * 100;
}

/** Normalize Fabric fill values to strict #RRGGBB for registry validation. */
function toStrictHexColor(fill: unknown, fallback?: string): string | undefined {
  if (typeof fill !== 'string' || !fill.trim()) return fallback;

  const hexMatch = fill.match(/^#([0-9A-Fa-f]{6})$/);
  if (hexMatch) return `#${hexMatch[1].toUpperCase()}`;

  const rgbMatch = fill.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/
  );
  if (rgbMatch) {
    const channels = [rgbMatch[1], rgbMatch[2], rgbMatch[3]].map(Number);
    if (channels.every((n) => n >= 0 && n <= 255)) {
      return `#${channels
        .map((n) => n.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()}`;
    }
  }

  return fallback;
}

/** Font size typed by the admin: positive and inside the input's own bounds. */
function clampFontSize(value: number) {
  return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, value));
}

/** Font size read back off the canvas: authored sizes are trusted as-is. */
function normalizeFontSize(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : DEFAULT_FONT_SIZE;
}

function getEditableLayout(template: StoredArtifactTemplate): ArtifactLayout | null {
  if (!isCanvasAuthorable(template.baseType)) return null;
  return template.layouts.default ?? null;
}

function isFabricTextObject(
  obj: import('fabric').FabricObject
): obj is import('fabric').FabricText {
  return obj.type === 'text';
}

function getElementId(obj: import('fabric').FabricObject): string | undefined {
  return (obj.get('data') as { elementId?: string } | undefined)?.elementId;
}

function isUserAuthoredId(elementId: string) {
  return elementId.startsWith(USER_ELEMENT_PREFIX);
}

function nextElementId(usedIds: Set<string>, counter: number) {
  let candidate = `${USER_ELEMENT_PREFIX}${Date.now().toString(36)}-${counter.toString(36)}`;
  let salt = 0;
  while (usedIds.has(candidate)) {
    salt += 1;
    candidate = `${USER_ELEMENT_PREFIX}${Date.now().toString(36)}-${counter.toString(36)}-${salt}`;
  }
  return candidate;
}

function elementToFabricObject(
  fabric: FabricModule,
  element: CanvasElement,
  editable: boolean
) {
  const left = pctToPx(element.x, CANVAS_WIDTH);
  const top = pctToPx(element.y, CANVAS_HEIGHT);
  const width = pctToPx(element.w, CANVAS_WIDTH);
  const height = pctToPx(element.h, CANVAS_HEIGHT);
  const common = {
    left,
    top,
    width,
    height,
    selectable: editable,
    evented: editable,
    hasControls: editable,
    lockRotation: true,
    data: { elementId: element.id },
  };

  if (element.type === 'text') {
    const style = element.style;
    return new fabric.FabricText(element.content ?? '', {
      ...common,
      fill: style?.fontColor ?? DEFAULT_FONT_COLOR,
      fontSize: normalizeFontSize(style?.fontSize),
      fontFamily: style?.fontFamily ?? DEFAULT_FONT_FAMILY,
      // Fabric v6 assigns an explicit `undefined` straight over its own class
      // default and then dies in `Cache.getFontCache` (`fontStyle.toLowerCase`
      // of undefined), so an unset key must be omitted, not passed as
      // undefined. Every shipped text element omits fontStyle.
      ...(style?.fontWeight !== undefined ? { fontWeight: style.fontWeight } : {}),
      ...(style?.fontStyle !== undefined ? { fontStyle: style.fontStyle } : {}),
      textAlign: style?.textAlign ?? DEFAULT_TEXT_ALIGN,
    });
  }

  if (element.type === 'shape') {
    return new fabric.Rect({
      ...common,
      fill: element.style?.fillColor ?? '#5C2E16',
      opacity: element.style?.opacity ?? 1,
    });
  }

  if (element.type === 'image' && element.imageRef) {
    return new fabric.Rect({
      ...common,
      fill: '#333333',
      stroke: '#888888',
      strokeWidth: 1,
      data: { elementId: element.id, imageRef: element.imageRef },
    });
  }

  return new fabric.Rect({
    ...common,
    fill: 'rgba(255,255,255,0.08)',
    stroke: '#cccccc',
    strokeDashArray: [6, 4],
    data: { elementId: element.id, placeholderKey: element.placeholderKey },
  });
}

/**
 * Reads the text style back off a Fabric object without inventing keys.
 *
 * `elementToFabricObject` fills every unset style key with a construction
 * default, so a naive read-back would bake `fontFamily`/`fontWeight` into
 * layouts that never declared them. A key is written only when the source
 * already carried it or the admin actually moved it off the default, which
 * keeps an untouched template byte-identical across a save.
 */
function serializeTextStyle(
  source: CanvasElement,
  textObj: import('fabric').FabricText
): CanvasElement['style'] | undefined {
  const style: NonNullable<CanvasElement['style']> = { ...source.style };

  const setIfMeaningful = <K extends keyof NonNullable<CanvasElement['style']>>(
    key: K,
    current: NonNullable<CanvasElement['style']>[K] | undefined,
    constructionDefault: NonNullable<CanvasElement['style']>[K]
  ) => {
    if (current === undefined) return;
    if (source.style?.[key] === undefined && current === constructionDefault) return;
    style[key] = current;
  };

  setIfMeaningful(
    'fontColor',
    toStrictHexColor(textObj.fill, source.style?.fontColor),
    DEFAULT_FONT_COLOR
  );
  setIfMeaningful(
    'fontSize',
    typeof textObj.fontSize === 'number' ? textObj.fontSize : undefined,
    DEFAULT_FONT_SIZE
  );
  setIfMeaningful('fontFamily', textObj.fontFamily, DEFAULT_FONT_FAMILY);
  setIfMeaningful(
    'fontWeight',
    textObj.fontWeight === undefined ? undefined : String(textObj.fontWeight),
    'normal'
  );
  setIfMeaningful('fontStyle', textObj.fontStyle, 'normal');
  setIfMeaningful(
    'textAlign',
    textObj.textAlign === 'left' ||
      textObj.textAlign === 'center' ||
      textObj.textAlign === 'right'
      ? textObj.textAlign
      : undefined,
    DEFAULT_TEXT_ALIGN
  );

  return Object.keys(style).length > 0 ? style : undefined;
}

/**
 * Reads the canvas back into registry elements. The returned list is the
 * complete element set for the layout: objects removed from the canvas are
 * absent (deletion) and objects added in this session are present (authoring).
 */
function serializeCanvas(
  canvas: import('fabric').Canvas,
  layout: ArtifactLayout,
  added: Map<string, CanvasElement>
): CanvasElement[] {
  // Persisted definitions win over the in-session copy after a save/reload.
  const byId = new Map<string, CanvasElement>([
    ...added,
    ...layout.elements.map((e) => [e.id, e] as const),
  ]);
  // Canvas order is zIndex order; the stored array keeps template order so that
  // `hydrate`'s source-order tie-break — and diffs against the seed — stay put.
  const sourceRank = new Map(layout.elements.map((e, i) => [e.id, i] as const));

  const serialized = canvas.getObjects().flatMap((obj, canvasIndex) => {
    const elementId = getElementId(obj);
    if (!elementId) return [];
    const source = byId.get(elementId);
    if (!source) return [];

    const left = obj.left ?? 0;
    const top = obj.top ?? 0;
    const scaleX = Math.abs(obj.scaleX ?? 1);
    const scaleY = Math.abs(obj.scaleY ?? 1);
    const isText = source.type === 'text' && isFabricTextObject(obj);

    // Percent -> px -> percent is not bit-exact, so an object that was never
    // touched would still be written back with float dust. Keep the authored
    // value unless Fabric actually reports something else.
    const authoredLeft = pctToPx(source.x, CANVAS_WIDTH);
    const authoredTop = pctToPx(source.y, CANVAS_HEIGHT);
    const authoredWidth = pctToPx(source.w, CANVAS_WIDTH);
    const authoredHeight = pctToPx(source.h, CANVAS_HEIGHT);
    const measuredWidth = Math.abs(obj.width ?? 0) * scaleX;
    const measuredHeight = Math.abs(obj.height ?? 0) * scaleY;

    // Fabric v6's `Text.initDimensions()` overwrites `width`/`height` with
    // measured glyph metrics and discards whatever we constructed the object
    // with, so `obj.width` is NOT the authored box for text. Scale the authored
    // percentages instead: an untouched object round-trips unchanged (scale is
    // exactly 1) while a genuinely resized one still records its new size.
    // Shapes and image boxes keep the measured path — Fabric leaves their
    // dimensions alone, so it reports the truth for them.
    const w = isText
      ? source.w * scaleX
      : measuredWidth === authoredWidth
        ? source.w
        : pxToPct(measuredWidth, CANVAS_WIDTH);
    const h = isText
      ? source.h * scaleY
      : measuredHeight === authoredHeight
        ? source.h
        : pxToPct(measuredHeight, CANVAS_HEIGHT);

    const next: CanvasElement = {
      ...source,
      x: left === authoredLeft ? source.x : pxToPct(left, CANVAS_WIDTH),
      y: top === authoredTop ? source.y : pxToPct(top, CANVAS_HEIGHT),
      // A degenerate drag can collapse an object to zero; the server rejects
      // the whole save for that, losing every unsaved addition with it.
      w: Math.max(w, MIN_ELEMENT_W_PCT),
      h: Math.max(h, MIN_ELEMENT_H_PCT),
    };

    if (isText) {
      const text = obj.text ?? '';
      // Keep `content` absent on placeholder-driven elements that never had it.
      if (source.content !== undefined || text !== '') {
        next.content = text;
      }
      const style = serializeTextStyle(source, obj);
      if (style) {
        next.style = style;
      } else {
        delete next.style;
      }
    }

    // Elements authored in this session have no template rank; they land after
    // the shipped ones, in canvas order.
    const rank =
      sourceRank.get(elementId) ?? layout.elements.length + canvasIndex;
    return [{ rank, next }];
  });

  return serialized
    .map((entry, index) => ({ ...entry, index }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.next);
}

export default function ArtifactEditor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<import('fabric').Canvas | null>(null);
  const [templates, setTemplates] = useState<ArtifactTemplateSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [template, setTemplate] = useState<StoredArtifactTemplate | null>(null);
  const [status, setStatus] = useState<EditorStatus>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [fontColor, setFontColor] = useState(DEFAULT_FONT_COLOR);
  /** Committed font size: always finite and positive, safe for the server. */
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  /** Raw input text, so the admin can clear the field without writing a 0. */
  const [fontSizeInput, setFontSizeInput] = useState(String(DEFAULT_FONT_SIZE));
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [selectedTextCount, setSelectedTextCount] = useState(0);
  const [textContent, setTextContent] = useState('');
  /** Elements authored in this session, not yet persisted. */
  const addedElementsRef = useRef<Map<string, CanvasElement>>(new Map());
  const insertCounterRef = useRef(0);
  /**
   * Whether the mounted canvas carries authoring the server has not seen.
   *
   * In memory and nowhere else, per `AD-24`, which names this story as its live
   * instance: a layout parked in `localStorage` would escape the whole registry
   * write contract. This is a warning mechanism, not a recovery one.
   */
  const [isDirty, setIsDirty] = useState(false);
  const { setIsBlocked } = useNavigationBlocker();

  const markDirty = useCallback(() => {
    setIsDirty((current) => nextDirtyState(current, 'mutated'));
  }, []);

  /** Mirrors Fabric's active selection into React (uncontrolled canvas stays the source). */
  const syncSelection = useCallback((canvas: import('fabric').Canvas) => {
    const active = canvas.getActiveObjects();
    setSelectedElementIds(
      active
        .map(getElementId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    );
    const texts = active.filter(isFabricTextObject);
    setSelectedTextCount(texts.length);
    // The content field edits one box at a time; anything else clears it.
    setTextContent(texts.length === 1 ? (texts[0].text ?? '') : '');
    const selectedText = texts[0];
    if (!selectedText) return;
    setFontColor(
      toStrictHexColor(selectedText.fill, DEFAULT_FONT_COLOR) ?? DEFAULT_FONT_COLOR
    );
    const size = normalizeFontSize(selectedText.fontSize);
    setFontSize(size);
    setFontSizeInput(String(size));
  }, []);

  const loadList = useCallback(async () => {
    const res = await fetch('/api/admin/artifacts');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load templates');
    setTemplates(data.templates ?? []);
  }, []);

  const loadTemplate = useCallback(async (id: string) => {
    setStatus('loading');
    setMessage(null);
    const res = await fetch(`/api/admin/artifacts/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load template');
    setTemplate(data);
    // A new server copy remounts the canvas, and a freshly mounted canvas is
    // never dirty. This is the one place every remount comes through — the
    // first load, a template switch, and the reload behind a 409 — so it clears
    // here rather than in the mount effect. It is also the more accurate spot:
    // a *failed* load leaves the previous canvas mounted with its unsaved work
    // still on it, and that flag must survive.
    setIsDirty((current) => nextDirtyState(current, 'template-changed'));
    setStatus('idle');
  }, []);

  useEffect(() => {
    loadList().catch((err) => {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to load');
    });
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) return;
    loadTemplate(selectedId).catch((err) => {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to load template');
    });
  }, [selectedId, loadTemplate]);

  useEffect(() => {
    let disposed = false;
    let removeCanvasListeners: (() => void) | undefined;

    async function mountCanvas() {
      if (!canvasRef.current || !template) return;
      // A fresh canvas means a fresh authoring session: anything added before is
      // either persisted (and back in layout.elements) or discarded.
      addedElementsRef.current = new Map();
      const layout = getEditableLayout(template);
      if (!layout) {
        fabricCanvasRef.current?.dispose();
        fabricCanvasRef.current = null;
        return;
      }

      const fabric = await import('fabric');
      if (disposed) return;

      fabricCanvasRef.current?.dispose();
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        selection: true,
        backgroundColor: layout.backgroundColor,
      });
      fabricCanvasRef.current = canvas;

      const disposeCanvasIfAborted = () => {
        if (!disposed) return false;
        removeCanvasListeners?.();
        removeCanvasListeners = undefined;
        if (fabricCanvasRef.current === canvas) {
          canvas.dispose();
          fabricCanvasRef.current = null;
        }
        return true;
      };

      if (layout.backgroundImage) {
        const bg = await fabric.FabricImage.fromURL(layout.backgroundImage, {
          crossOrigin: 'anonymous',
        });
        if (disposeCanvasIfAborted()) return;

        bg.set({
          left: 0,
          top: 0,
          scaleX: CANVAS_WIDTH / (bg.width || CANVAS_WIDTH),
          scaleY: CANVAS_HEIGHT / (bg.height || CANVAS_HEIGHT),
          selectable: false,
          evented: false,
        });
        canvas.backgroundImage = bg;
      }

      if (disposeCanvasIfAborted()) return;

      // The PPTX exporter and the web slideshow both paint in `zIndex` order,
      // so the canvas must stack the same way or the admin edits an overlap
      // that does not match the real output. Source order breaks ties.
      const painted = layout.elements
        .map((element, index) => ({ element, index }))
        .sort((a, b) => a.element.zIndex - b.element.zIndex || a.index - b.index);
      for (const { element } of painted) {
        canvas.add(elementToFabricObject(fabric, element, true));
      }

      const onSelectionChange = () => {
        syncSelection(canvas);
      };
      canvas.on('selection:created', onSelectionChange);
      canvas.on('selection:updated', onSelectionChange);
      canvas.on('selection:cleared', onSelectionChange);
      // Registered here and not one line earlier: the paint loop above calls
      // `canvas.add()` for every seed element, and `canvas.add()` fires
      // `object:added`. Attached any sooner, a fresh mount would mark itself
      // dirty and the guard would fire on a canvas nobody has touched.
      for (const event of CANVAS_MUTATION_EVENTS) {
        canvas.on(event, markDirty);
      }
      removeCanvasListeners = () => {
        canvas.off('selection:created', onSelectionChange);
        canvas.off('selection:updated', onSelectionChange);
        canvas.off('selection:cleared', onSelectionChange);
        for (const event of CANVAS_MUTATION_EVENTS) {
          canvas.off(event, markDirty);
        }
      };

      if (disposeCanvasIfAborted()) return;

      canvas.requestRenderAll();
    }

    mountCanvas().catch((err) => {
      if (disposed) return;
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Canvas failed to load');
    });

    return () => {
      disposed = true;
      // Before `dispose()`, which is the existing order and now load-bearing
      // twice over: a mutation listener still attached while the canvas tears
      // itself down would mark the outgoing template dirty on its way out.
      removeCanvasListeners?.();
      removeCanvasListeners = undefined;
      fabricCanvasRef.current?.dispose();
      fabricCanvasRef.current = null;
    };
  }, [template, syncSelection, markDirty]);

  const insertElement = useCallback(
    async (kind: 'text' | 'shape') => {
      const canvas = fabricCanvasRef.current;
      const layout = template ? getEditableLayout(template) : null;
      if (!canvas || !layout) return;

      const usedIds = new Set<string>([
        ...layout.elements.map((e) => e.id),
        ...addedElementsRef.current.keys(),
        ...canvas
          .getObjects()
          .map(getElementId)
          .filter((id): id is string => typeof id === 'string'),
      ]);
      const id = nextElementId(usedIds, insertCounterRef.current);
      const step = insertCounterRef.current % INSERT_CASCADE_STEPS;
      insertCounterRef.current += 1;

      const size = kind === 'text' ? NEW_TEXT_SIZE_PX : NEW_SHAPE_SIZE_PX;
      const offset = step * INSERT_CASCADE_PX;
      const leftPx = (CANVAS_WIDTH - size.w) / 2 + offset;
      const topPx = (CANVAS_HEIGHT - size.h) / 2 + offset;
      const maxZ = [
        ...layout.elements,
        ...addedElementsRef.current.values(),
      ].reduce((acc, e) => Math.max(acc, e.zIndex), -1);

      const element: CanvasElement = {
        id,
        type: kind,
        required: false,
        x: pxToPct(leftPx, CANVAS_WIDTH),
        y: pxToPct(topPx, CANVAS_HEIGHT),
        w: pxToPct(size.w, CANVAS_WIDTH),
        h: pxToPct(size.h, CANVAS_HEIGHT),
        zIndex: maxZ + 1,
        ...(kind === 'text'
          ? {
              content: NEW_TEXT_CONTENT,
              style: {
                fontFamily: 'Arial',
                fontSize,
                fontColor,
                fontWeight: 'normal',
                textAlign: 'left' as const,
              },
            }
          : { style: { fillColor: NEW_SHAPE_FILL, opacity: 1 } }),
      };

      const fabric = await import('fabric');
      if (fabricCanvasRef.current !== canvas) return;

      addedElementsRef.current.set(id, element);
      const obj = elementToFabricObject(fabric, element, true);
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
      syncSelection(canvas);
      // Redundant on paper — `canvas.add` above fires `object:added`, which the
      // mutation listener already turns into this same call — and kept on
      // purpose. `markDirty` is idempotent, and the four explicit-edit handlers
      // are required to raise the flag themselves rather than inherit it from a
      // listener registered elsewhere in the file: two of the four
      // (`applyTextStyle`, `handleTextContentChange`) raise no Fabric event at
      // all, so the set only reads consistently if all four are explicit. Not
      // dead code; deleting it makes this handler depend on a registration two
      // hundred lines away.
      markDirty();
      setStatus('idle');
      setMessage(null);
    },
    [template, fontColor, fontSize, syncSelection, markDirty]
  );

  const handleDeleteSelected = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const layout = template ? getEditableLayout(template) : null;
    if (!canvas || !layout) return;

    const byId = new Map<string, CanvasElement>([
      ...addedElementsRef.current,
      ...layout.elements.map((e) => [e.id, e] as const),
    ]);
    const active = canvas.getActiveObjects();
    if (active.length === 0) {
      setStatus('error');
      setMessage('Select an element on the canvas first.');
      return;
    }

    const removable: import('fabric').FabricObject[] = [];
    const refused: string[] = [];
    for (const obj of active) {
      const elementId = getElementId(obj);
      if (!elementId) continue;
      const source = byId.get(elementId);
      if (!isUserAuthoredId(elementId) || source?.required) {
        refused.push(elementId);
        continue;
      }
      removable.push(obj);
    }

    if (removable.length > 0) {
      canvas.discardActiveObject();
      canvas.remove(...removable);
      for (const obj of removable) {
        const elementId = getElementId(obj);
        if (elementId) addedElementsRef.current.delete(elementId);
      }
      canvas.requestRenderAll();
      syncSelection(canvas);
      // Same reason as `insertElement`: `canvas.remove` already fires
      // `object:removed`, and this stays anyway so all four explicit-edit
      // handlers raise the flag the same way.
      markDirty();
    }

    if (refused.length > 0) {
      setStatus('error');
      setMessage(
        `Cannot delete ${refused.join(', ')} — shipped and required elements are part of the template.`
      );
      return;
    }
    setStatus('idle');
    setMessage(
      `Removed ${removable.length} element${removable.length === 1 ? '' : 's'}. Save to persist.`
    );
  }, [template, syncSelection, markDirty]);

  const applyTextStyle = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    let updated = false;
    for (const obj of canvas.getActiveObjects()) {
      if (!isFabricTextObject(obj)) continue;
      obj.set({ fill: fontColor, fontSize });
      updated = true;
    }
    // `obj.set(...)` raises no canvas event, so the mutation listeners never see
    // this; and pressing Apply with nothing selected changed nothing, so it must
    // not claim otherwise.
    if (updated) {
      canvas.requestRenderAll();
      markDirty();
    }
  };

  /**
   * Writes the words of the selected text box straight through to Fabric, so
   * the next Save picks them up. Deliberately limited to a single selected text
   * element: applying one string to a multi-selection would wipe the others.
   */
  const handleTextContentChange = (value: string) => {
    setTextContent(value);
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const texts = canvas.getActiveObjects().filter(isFabricTextObject);
    if (texts.length !== 1) return;
    texts[0].set({ text: value });
    canvas.requestRenderAll();
    // Same reason as `applyTextStyle`: a direct `set` is invisible to Fabric's
    // canvas-level events.
    markDirty();
  };

  const handleFontSizeInput = (raw: string) => {
    setFontSizeInput(raw);
    const parsed = Number(raw);
    // An empty field is `Number('') === 0`; never commit that — the server
    // rejects the entire save with an opaque `style.fontSize must be positive`.
    if (!raw.trim() || !Number.isFinite(parsed) || parsed <= 0) return;
    setFontSize(clampFontSize(parsed));
  };

  const handleSave = async () => {
    if (!template) return;
    const layout = getEditableLayout(template);
    const canvas = fabricCanvasRef.current;
    if (!layout || !canvas) return;

    setStatus('saving');
    setMessage(null);
    try {
      // Fabric reports group-relative left/top while an ActiveSelection is
      // live; discard it first so serialization always reads canvas coords.
      canvas.discardActiveObject();
      // The selection is gone, so the toolbar must not keep offering actions
      // (Delete, content edit) against an object that is no longer active.
      syncSelection(canvas);
      // The canvas is authoritative for the element set: additions appear here
      // and deletions are simply absent. Server-side stability rules still
      // reject removal of any seeded or required element.
      const updatedElements = serializeCanvas(
        canvas,
        layout,
        addedElementsRef.current
      );
      const { updatedAt, ...templateBody } = template;
      const payload = {
        ...templateBody,
        layouts: {
          ...templateBody.layouts,
          default: {
            ...layout,
            elements: updatedElements,
          },
        },
        updatedAt,
      };

      const res = await fetch(`/api/admin/artifacts/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 409) {
        // Reload first: `loadTemplate` clears the banner, so the explanation
        // has to be written after it or the admin sees nothing at all.
        await loadTemplate(template.id);
        setStatus('conflict');
        // Reloading remounts the canvas from the server copy, which throws away
        // every element added or deleted since the last successful save. Say so
        // plainly instead of leaving the admin to discover it.
        setMessage(
          `${data.error || 'Template was modified elsewhere'}. Nothing was saved: the editor reloaded the version that is on the server, so any elements you added or deleted in this session — and any unsaved moves — have been discarded. Re-apply them on the reloaded template.`
        );
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setTemplate(data);
      setIsDirty((current) => nextDirtyState(current, 'saved'));
      setStatus('success');
      setMessage('Template saved');
      await loadList();
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleReset = async () => {
    if (!template) return;
    if (!window.confirm(`Reset "${template.label}" to shipped seed?`)) return;

    setStatus('resetting');
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/artifacts/${template.id}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updatedAt: template.updatedAt }),
      });
      const data = await res.json();
      if (res.status === 409) {
        await loadTemplate(template.id);
        setStatus('conflict');
        setMessage(
          `${data.error || 'Template was modified elsewhere'}. Nothing was reset: the editor reloaded the version that is on the server, so unsaved canvas changes were discarded.`
        );
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setTemplate(data);
      setIsDirty((current) => nextDirtyState(current, 'reset'));
      setStatus('success');
      setMessage('Template reset from seed');
      await loadList();
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Reset failed');
    }
  };

  const isEditable = template ? isCanvasAuthorable(template.baseType) : false;

  const kindChipClass =
    'inline-flex rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground';

  // The browser-level exits: closing the tab, reloading, typing a new URL. The
  // listener is the registration itself — armed only while an editable canvas
  // has something to lose, and removed on cleanup, so an operator who has only
  // read a template meets nothing.
  useEffect(() => {
    if (!isDirty || !isEditable) return;
    window.addEventListener('beforeunload', beforeUnloadGuard);
    return () => {
      window.removeEventListener('beforeunload', beforeUnloadGuard);
    };
  }, [isDirty, isEditable]);

  // `beforeunload` cannot see a client-side route change, so the same state is
  // published to the page's navigation blocker, which is what `Header`'s links
  // read. Cleared on unmount: a blocked flag outliving this editor would put a
  // confirmation in front of every link on the page it left behind.
  useEffect(() => {
    setIsBlocked(isDirty && isEditable);
    return () => {
      setIsBlocked(false);
    };
  }, [isDirty, isEditable, setIsBlocked]);

  const busy = status === 'loading' || status === 'saving' || status === 'resetting';

  // The canvas stops accepting input while a request is in flight, the way the
  // toolbar buttons already do.
  //
  // Without this there is a window with no good outcome. `handleSave` reads the
  // canvas once, then awaits; a drag landing in that gap fires `object:modified`
  // and sets the flag, but the edit is not in the payload, and the success path
  // replaces `template` — which remounts the canvas from the server copy and
  // throws that edit away. Clearing the flag then reports clean over work that
  // was silently discarded, which is the exact failure this story exists to
  // prevent. Discarding the active object closes the toolbar paths in the same
  // move: with no selection, `applyTextStyle` changes nothing and the text field
  // disables itself.
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    if (busy) canvas.discardActiveObject();
    canvas.selection = !busy;
    for (const object of canvas.getObjects()) {
      object.selectable = !busy;
      object.evented = !busy;
    }
    canvas.requestRenderAll();
  }, [busy]);
  const requiredElementIds = new Set(
    (template ? (getEditableLayout(template)?.elements ?? []) : [])
      .filter((element) => element.required)
      .map((element) => element.id)
  );
  const canDeleteSelection =
    selectedElementIds.length > 0 &&
    selectedElementIds.every(
      (id) => isUserAuthoredId(id) && !requiredElementIds.has(id)
    );

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Templates</h2>
        <ul className="max-h-[70vh] space-y-1 overflow-y-auto">
          {templates.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  // Re-clicking the row that is already open is not a switch,
                  // and must not prompt. A different row re-enters mountCanvas,
                  // which throws the added-element map away and disposes the
                  // canvas — every unsaved edit goes with it.
                  if (item.id === selectedId) return;
                  const proceed = mayDiscard(
                    isDirty && isEditable,
                    DISCARD_ON_SWITCH_CONFIRMATION,
                    (message) => window.confirm(message)
                  );
                  if (!proceed) return;
                  setSelectedId(item.id);
                }}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  selectedId === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="font-medium">{item.label}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs opacity-80">
                  <span className={kindChipClass}>[{kindChipLabel(item.baseType)}]</span>
                  {!item.editable ? <span>read-only</span> : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="space-y-4">
        {!template ? (
          <p className="text-sm text-muted-foreground">Select a template to edit.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{template.label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className={kindChipClass}>[{kindChipLabel(template.baseType)}]</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isDirty && isEditable ? (
                  <span
                    role="status"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    {UNSAVED_INDICATOR_LABEL}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isEditable || busy}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={busy}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Reset
                </button>
              </div>
            </div>

            {message ? (
              <p
                role="alert"
                className={`text-sm ${
                  status === 'error' || status === 'conflict'
                    ? 'text-destructive'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {message}
              </p>
            ) : null}

            {!isEditable ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                This template is read-only (
                <span className={kindChipClass}>[{kindChipLabel(template.baseType)}]</span>
                ). Its layout cannot be edited and elements cannot be added or deleted; use
                Reset to restore the shipped seed.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/40 p-4">
                  <span className="mr-1 text-sm font-medium">Elements</span>
                  <button
                    type="button"
                    onClick={() => {
                      void insertElement('text');
                    }}
                    disabled={busy}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Add text
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void insertElement('shape');
                    }}
                    disabled={busy}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Add rectangle
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    disabled={busy || !canDeleteSelection}
                    title={
                      selectedElementIds.length === 0
                        ? 'Select an element you added on the canvas'
                        : canDeleteSelection
                          ? 'Delete the selected element(s)'
                          : 'Shipped and required elements cannot be deleted'
                    }
                    className="rounded-lg border border-destructive/60 px-3 py-1.5 text-sm text-destructive disabled:opacity-50"
                  >
                    Delete selected
                  </button>
                  <span className="text-xs text-muted-foreground">
                    Only elements you add here can be deleted. Save to persist.
                  </span>
                </div>
                <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card/40 p-4">
                  <label className="text-sm">
                    Text
                    <input
                      type="text"
                      value={textContent}
                      disabled={selectedTextCount !== 1}
                      onChange={(e) => handleTextContentChange(e.target.value)}
                      placeholder={
                        selectedTextCount === 1
                          ? 'Text shown on the slide'
                          : 'Select one text element'
                      }
                      title={
                        selectedTextCount === 1
                          ? 'Applies to the selected text element as you type. Save to persist.'
                          : 'Select exactly one text element on the canvas to edit its words'
                      }
                      className="ml-2 w-64 rounded border border-border px-2 py-1 disabled:opacity-50"
                    />
                  </label>
                  <label className="text-sm">
                    Font color
                    <input
                      type="color"
                      value={fontColor}
                      onChange={(e) => setFontColor(e.target.value)}
                      className="ml-2 align-middle"
                    />
                  </label>
                  <label className="text-sm">
                    Font size
                    <input
                      type="number"
                      min={MIN_FONT_SIZE}
                      max={MAX_FONT_SIZE}
                      value={fontSizeInput}
                      onChange={(e) => handleFontSizeInput(e.target.value)}
                      onBlur={() => setFontSizeInput(String(fontSize))}
                      className="ml-2 w-20 rounded border border-border px-2 py-1"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={applyTextStyle}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm"
                  >
                    Apply to selection
                  </button>
                  <span className="text-xs text-muted-foreground">
                    Colour and size need “Apply to selection”; text applies as
                    you type. Nothing is stored until you Save.
                  </span>
                </div>
                <div className="overflow-auto rounded-2xl border border-border bg-black/90 p-4">
                  <canvas ref={canvasRef} />
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
