/**
 * Render model: the single unit-conversion table shared by PPTX and the web.
 *
 * Off-canvas geometry (negative or > 100 percent) is deliberate clipping
 * inherited from the source deck and must survive BOTH conversions unclamped.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const {
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE_PX,
  MIN_TEXT_FIT_SCALE,
  PPTX_SLIDE_HEIGHT_IN,
  PPTX_SLIDE_WIDTH_IN,
  PX_TO_PT,
  TEXT_FIT_LEADING_ALLOWANCE,
  TEXT_FIT_SCALE_STEP,
  TEXT_LINE_HEIGHT,
  estimateTextFitScale,
  largestFittingTextScale,
  quantizeTextFitScale,
  resolveTextFitScale,
  textFitRatio,
  resolveBold,
  resolveElementImage,
  resolveElementText,
  resolveFontFamily,
  resolveItalic,
  resolveObjectFit,
  resolveOpacity,
  resolveTextAlign,
  resolveVerticalAlign,
  toCssAlignItems,
  toCssColor,
  toCssGeometry,
  toCssJustifyContent,
  toPptxColor,
  toPptxGeometry,
  toPptxTransparency,
} = await import(
  pathToFileURL(
    path.join(root, 'src', 'lib', 'artifacts', 'render-model.ts')
  ).href
);

const element = (overrides = {}) => ({
  id: 'e1',
  type: 'text',
  x: 0,
  y: 0,
  w: 100,
  h: 100,
  zIndex: 1,
  style: {},
  ...overrides,
});

test('slide constants match pptxgenjs LAYOUT_16x9 and the 960x540 reference', () => {
  assert.equal(PPTX_SLIDE_WIDTH_IN, 10);
  assert.equal(PPTX_SLIDE_HEIGHT_IN, 5.625);
  assert.equal(PX_TO_PT, 0.75);
  assert.equal(DEFAULT_FONT_SIZE_PX, 32);
  assert.equal(DEFAULT_FONT_FAMILY, 'Arial');
});

test('text primitive converts to both native unit systems', () => {
  const el = element({
    type: 'text',
    x: 5.63,
    y: 55.62,
    w: 56.42,
    h: 25.47,
    text: 'Welcome to',
    style: { fontSize: 152.63, fontColor: '#FFFFFF', textAlign: 'left' },
  });

  assert.deepEqual(toPptxGeometry(el), {
    x: 0.563,
    y: 3.1286,
    w: 5.642,
    h: 1.4327,
    fontSize: 114.4725,
  });
  assert.deepEqual(toCssGeometry(el), {
    left: '5.63%',
    top: '55.62%',
    width: '56.42%',
    height: '25.47%',
    fontSize: '28.2648cqh',
  });
  assert.equal(resolveElementText(el), 'Welcome to');
  assert.equal(resolveElementImage(el), undefined);
});

test('image primitive converts and exposes its url', () => {
  const el = element({
    id: 'img1',
    type: 'image',
    x: 25,
    y: 10,
    w: 50,
    h: 80,
    imageUrl: '/assets/welcome-bg.jpg',
    style: { objectFit: 'cover' },
  });

  assert.deepEqual(toPptxGeometry(el), {
    x: 2.5,
    y: 0.5625,
    w: 5,
    h: 4.5,
    fontSize: 24,
  });
  assert.deepEqual(toCssGeometry(el), {
    left: '25%',
    top: '10%',
    width: '50%',
    height: '80%',
    fontSize: '5.9259cqh',
  });
  assert.equal(resolveElementImage(el), '/assets/welcome-bg.jpg');
  assert.equal(resolveObjectFit(el.style), 'cover');
});

test('unfilled image-placeholder resolves to nothing but still has geometry', () => {
  const el = element({ id: 'ph1', type: 'image-placeholder', x: 10, y: 20, w: 30, h: 40 });

  assert.equal(resolveElementImage(el), undefined);
  assert.equal(resolveElementText(el), undefined);
  assert.deepEqual(toPptxGeometry(el), {
    x: 1,
    y: 1.125,
    w: 3,
    h: 2.25,
    fontSize: 24,
  });
  assert.deepEqual(toCssGeometry(el), {
    left: '10%',
    top: '20%',
    width: '30%',
    height: '40%',
    fontSize: '5.9259cqh',
  });

  const filled = element({ ...el, imageUrl: '  ' });
  assert.equal(resolveElementImage(filled), undefined);
});

test('shape primitive converts geometry and fill opacity', () => {
  const el = element({
    id: 's1',
    type: 'shape',
    x: 0,
    y: 66.67,
    w: 100,
    h: 33.33,
    style: { fillColor: '#5C2E16', opacity: 0.4 },
  });

  assert.deepEqual(toPptxGeometry(el), {
    x: 0,
    y: 3.7502,
    w: 10,
    h: 1.8748,
    fontSize: 24,
  });
  assert.deepEqual(toCssGeometry(el), {
    left: '0%',
    top: '66.67%',
    width: '100%',
    height: '33.33%',
    fontSize: '5.9259cqh',
  });
  assert.equal(resolveOpacity(el.style), 0.4);
  assert.equal(toPptxTransparency(el.style), 60);
  assert.equal(toPptxColor(el.style.fillColor), '5C2E16');
});

test('negative coordinates survive unclamped in both conversions', () => {
  const el = element({ x: -14.44, y: -8.5, w: 40, h: 20 });

  const pptx = toPptxGeometry(el);
  assert.equal(pptx.x, -1.444);
  assert.equal(pptx.y, -0.4781);
  assert.ok(pptx.x < 0 && pptx.y < 0);

  const css = toCssGeometry(el);
  assert.equal(css.left, '-14.44%');
  assert.equal(css.top, '-8.5%');
});

test('coordinates above 100 survive unclamped in both conversions', () => {
  const el = element({ x: 105, y: 101.25, w: 120, h: 130 });

  assert.deepEqual(toPptxGeometry(el), {
    x: 10.5,
    y: 5.6953,
    w: 12,
    h: 7.3125,
    fontSize: 24,
  });
  assert.deepEqual(toCssGeometry(el), {
    left: '105%',
    top: '101.25%',
    width: '120%',
    height: '130%',
    fontSize: '5.9259cqh',
  });
});

test('font size converts px -> pt and px -> cqh', () => {
  const big = element({ style: { fontSize: 152.63 } });
  assert.equal(toPptxGeometry(big).fontSize, 114.4725);
  assert.equal(toCssGeometry(big).fontSize, '28.2648cqh');

  const small = element({ style: { fontSize: 24 } });
  assert.equal(toPptxGeometry(small).fontSize, 18);
  assert.equal(toCssGeometry(small).fontSize, '4.4444cqh');
});

test('missing font size falls back to the 32px default', () => {
  const el = element({ style: {} });
  assert.equal(toPptxGeometry(el).fontSize, DEFAULT_FONT_SIZE_PX * PX_TO_PT);
  assert.equal(toPptxGeometry(el).fontSize, 24);
  assert.equal(toCssGeometry(el).fontSize, '5.9259cqh');
  assert.equal(resolveFontFamily(el.style), 'Arial');
});

test('colour normalisation runs both directions and passes non-hex through', () => {
  assert.equal(toPptxColor('#D4A574'), 'D4A574');
  assert.equal(toPptxColor('d4a574'), 'D4A574');
  assert.equal(toCssColor('D4A574'), '#D4A574');
  assert.equal(toCssColor('#d4a574'), '#D4A574');
  assert.equal(toPptxColor(undefined), undefined);
  assert.equal(toCssColor(undefined), undefined);
  assert.equal(toCssColor(''), undefined);
  assert.equal(toPptxColor('transparent'), 'transparent');
  assert.equal(toCssColor('transparent'), 'transparent');
});

test('objectFit defaults to contain and honours cover', () => {
  assert.equal(resolveObjectFit({}), 'contain');
  assert.equal(resolveObjectFit({ objectFit: 'contain' }), 'contain');
  assert.equal(resolveObjectFit({ objectFit: 'cover' }), 'cover');
});

test('vertical and horizontal alignment map to both renderers', () => {
  assert.equal(resolveVerticalAlign({}), 'top');
  assert.equal(resolveVerticalAlign({ verticalAlign: 'middle' }), 'middle');
  assert.equal(resolveVerticalAlign({ verticalAlign: 'bottom' }), 'bottom');

  assert.equal(toCssJustifyContent({}), 'flex-start');
  assert.equal(toCssJustifyContent({ verticalAlign: 'middle' }), 'center');
  assert.equal(toCssJustifyContent({ verticalAlign: 'bottom' }), 'flex-end');

  assert.equal(resolveTextAlign({}), 'left');
  assert.equal(resolveTextAlign({ textAlign: 'center' }), 'center');
  assert.equal(toCssAlignItems({ textAlign: 'left' }), 'flex-start');
  assert.equal(toCssAlignItems({ textAlign: 'center' }), 'center');
  assert.equal(toCssAlignItems({ textAlign: 'right' }), 'flex-end');
});

test('opacity clamps to 0..1 and maps to PowerPoint transparency percent', () => {
  assert.equal(resolveOpacity({}), 1);
  assert.equal(toPptxTransparency({}), 0);
  assert.equal(resolveOpacity({ opacity: 0 }), 0);
  assert.equal(toPptxTransparency({ opacity: 0 }), 100);
  assert.equal(resolveOpacity({ opacity: 0.25 }), 0.25);
  assert.equal(toPptxTransparency({ opacity: 0.25 }), 75);
  assert.equal(resolveOpacity({ opacity: 2 }), 1);
  assert.equal(resolveOpacity({ opacity: -1 }), 0);
});

test('bold / italic derive from the free-form registry style strings', () => {
  assert.equal(resolveBold({}), false);
  assert.equal(resolveBold({ fontWeight: 'bold' }), true);
  assert.equal(resolveBold({ fontWeight: '700' }), true);
  assert.equal(resolveBold({ fontWeight: '400' }), false);
  assert.equal(resolveItalic({}), false);
  assert.equal(resolveItalic({ fontStyle: 'italic' }), true);
  assert.equal(resolveItalic({ fontStyle: 'normal' }), false);
});

/**
 * Shrink-to-fit policy. `resolveTextFitScale` takes what the browser measures;
 * `estimateTextFitScale` derives the same thing from the element alone for the
 * server-side PPTX renderer. Both must agree, or the deck and the projector
 * would show different sizes.
 */

/** The shape a browser measurement pass hands `resolveTextFitScale`. */
const measured = (lines, fontSizePx, boxHeight, overrides = {}) => ({
  contentWidth: 0,
  contentHeight: lines * TEXT_LINE_HEIGHT * fontSizePx,
  boxWidth: 1000,
  boxHeight,
  fontSizePx,
  ...overrides,
});

/** `closing-song-cue` e1 — the element the whole policy exists for. */
const closingSongCue = () =>
  element({
    x: 5.63,
    y: 32.17,
    w: 35.07,
    h: 30.42,
    text: 'Closing \nSong',
    style: { fontSize: 120.56, textAlign: 'left' },
  });

test('shrink-to-fit policy constants are the shared contract', () => {
  assert.equal(TEXT_LINE_HEIGHT, 1.2);
  assert.equal(TEXT_FIT_LEADING_ALLOWANCE, 0.05);
  assert.equal(MIN_TEXT_FIT_SCALE, 0.35);
  assert.equal(TEXT_FIT_SCALE_STEP, 0.01);
});

test('text that fits its box keeps its declared size', () => {
  // Half the box: nothing to do.
  assert.equal(resolveTextFitScale(measured(1, 40, 200)), 1);

  // A one-line box snug against the ink. The CSS line box is 1.2em tall, but
  // the leading allowance is empty space, so this still counts as fitting.
  const snug = 1 * TEXT_LINE_HEIGHT * 100 - TEXT_FIT_LEADING_ALLOWANCE * 100;
  assert.equal(resolveTextFitScale(measured(1, 100, snug)), 1);
  assert.ok(resolveTextFitScale(measured(1, 100, snug - 1)) < 1);

  assert.equal(
    estimateTextFitScale(
      element({ w: 60, h: 25, text: 'Opening Prayer', style: { fontSize: 100 } })
    ),
    1
  );
});

test('text that overflows its box is reported as needing a smaller size', () => {
  const el = closingSongCue();
  const boxHeight = (el.h / 100) * 540;
  const scale = estimateTextFitScale(el);

  assert.ok(scale < 1, 'two 120px lines cannot fit a 30% tall box');
  assert.equal(scale, 0.57);

  // The browser measures the same element and must land on the same number.
  assert.equal(resolveTextFitScale(measured(2, el.style.fontSize, boxHeight)), scale);

  // And the scale it reports genuinely fits.
  const ink =
    2 * TEXT_LINE_HEIGHT * el.style.fontSize -
    TEXT_FIT_LEADING_ALLOWANCE * el.style.fontSize;
  assert.ok(ink > boxHeight, 'precondition: the declared size overflows');
  assert.ok(ink * scale <= boxHeight, 'the shrunken text fits its box');
});

test('the floor is respected and never crossed', () => {
  // A lyric verse far longer than its box: shrink to the floor, then clip.
  const verse = element({
    w: 88,
    h: 9.09,
    text: Array.from({ length: 12 }, (_, i) => `line ${i}`).join('\n'),
    style: { fontSize: 54.86 },
  });
  assert.equal(estimateTextFitScale(verse), MIN_TEXT_FIT_SCALE);

  assert.equal(resolveTextFitScale(measured(1, 100, 5.4)), MIN_TEXT_FIT_SCALE);
  assert.equal(resolveTextFitScale(measured(1, 100, 40)), MIN_TEXT_FIT_SCALE);
  assert.equal(quantizeTextFitScale(0.0001), MIN_TEXT_FIT_SCALE);
  assert.equal(quantizeTextFitScale(0), MIN_TEXT_FIT_SCALE);
  assert.equal(quantizeTextFitScale(-4), MIN_TEXT_FIT_SCALE);

  // A degenerate box holds nothing, but still yields a drawable scale.
  assert.equal(resolveTextFitScale(measured(1, 100, 0)), MIN_TEXT_FIT_SCALE);
});

test('the width axis shrinks content that cannot wrap', () => {
  assert.equal(
    resolveTextFitScale(
      measured(1, 40, 400, { contentWidth: 400, boxWidth: 200 })
    ),
    0.5
  );
  // The tighter axis wins.
  assert.equal(
    resolveTextFitScale(measured(2, 100, 100, { contentWidth: 400, boxWidth: 200 })),
    0.42
  );
});

test('an unmeasurable fit degrades to the declared size instead of throwing', () => {
  assert.equal(resolveTextFitScale(measured(0, 0, 0)), 1);
  assert.equal(
    resolveTextFitScale({
      contentWidth: Number.NaN,
      contentHeight: Number.NaN,
      boxWidth: Number.NaN,
      boxHeight: Number.NaN,
      fontSizePx: Number.NaN,
    }),
    1
  );
  assert.equal(quantizeTextFitScale(Number.NaN), 1);
  assert.equal(quantizeTextFitScale(Number.POSITIVE_INFINITY), 1);
});

test('quantizing floors to the step and never scales text up', () => {
  assert.equal(quantizeTextFitScale(1), 1);
  assert.equal(quantizeTextFitScale(2.5), 1);
  assert.equal(quantizeTextFitScale(0.999), 0.99);
  assert.equal(quantizeTextFitScale(0.6193346), 0.61);
  assert.equal(quantizeTextFitScale(0.75), 0.75);
});

test('the fit ratio reports slack without quantizing it', () => {
  // 115px of ink (a 120px line box less the 5px leading allowance) in a 230px
  // box has exactly twice the room it needs.
  assert.equal(textFitRatio(measured(1, 100, 230)), 2);
  assert.equal(textFitRatio(measured(0, 0, 500)), Number.POSITIVE_INFINITY);
  assert.ok(textFitRatio(measured(2, 100, 100)) < 1);
});

test('the browser search returns the largest scale that still fits', () => {
  // Text that already fits is probed once and left alone.
  let probes = 0;
  assert.equal(
    largestFittingTextScale(() => {
      probes += 1;
      return true;
    }),
    1
  );
  assert.equal(probes, 1);

  // A line that re-wraps once it shrinks: measuring at full size alone would
  // report 0.4, the search recovers the 0.7 that actually fits.
  probes = 0;
  assert.equal(
    largestFittingTextScale((scale) => {
      probes += 1;
      return scale <= 0.7;
    }),
    0.7
  );
  assert.ok(probes <= 8, `bounded probe count, got ${probes}`);

  // Nothing fits: the floor is applied and clipping takes over.
  assert.equal(
    largestFittingTextScale(() => false),
    MIN_TEXT_FIT_SCALE
  );

  // The search never returns a scale below the floor, even if smaller ones fit.
  assert.equal(
    largestFittingTextScale((scale) => scale <= 0.1),
    MIN_TEXT_FIT_SCALE
  );
});

test('the PPTX estimate leaves elements that draw no text alone', () => {
  assert.equal(estimateTextFitScale(element({ text: '   ', h: 1 })), 1);
  assert.equal(estimateTextFitScale(element({ text: undefined, h: 1 })), 1);
  assert.equal(
    estimateTextFitScale(element({ type: 'image', h: 1, imageUrl: '/assets/a.jpg' })),
    1
  );
});

test('blank text renders nothing while newline content is preserved verbatim', () => {
  assert.equal(resolveElementText(element({ text: '   ' })), undefined);
  assert.equal(resolveElementText(element({ text: undefined })), undefined);
  assert.equal(
    resolveElementText(element({ text: 'Bank Mandiri\n1234567890' })),
    'Bank Mandiri\n1234567890'
  );
});
