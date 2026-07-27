/**
 * Extract slide-background picture parts from the source PowerPoint deck.
 *
 * Three modes:
 *
 *   node scripts/extract-pptx-assets.mjs report
 *     Walks `p:sldIdLst` in presentation order, recurses through `p:grpSp`,
 *     resolves every `a:blipFill` found on `p:pic` and `p:sp`, and prints one
 *     row per background candidate: slide number, media part, native pixel
 *     size, cover fraction and the slide's first text runs. This is the
 *     evidence used to build (and audit) `data/asset-map.json`.
 *
 *   node scripts/extract-pptx-assets.mjs build-map
 *     Regenerates `data/asset-map.json` from `TEMPLATE_SOURCES` below. The
 *     declaration names only template -> slide -> media part; the deck itself
 *     supplies the native size, cover fraction and the slide's own text runs,
 *     which are committed alongside as the evidence for that row. A declared
 *     media part that the slide does not actually reference is a hard error,
 *     so the positional drift that caused this defect cannot silently return.
 *
 *   node scripts/extract-pptx-assets.mjs export
 *     Reads `data/asset-map.json` and copies each mapped media part out of the
 *     deck **byte-for-byte** into `public/assets/` under its mapped name.
 *     Refuses to run when the deck is absent, and fails loudly (naming slide
 *     and target) when a rels target cannot be resolved. Deterministic: the
 *     bytes written are exactly the bytes stored in the package.
 *
 * The deck is gitignored (100 MB), so neither mode runs in CI. `public/assets/`
 * is the committed result.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_DECK = '260704 - BIC Worship Presentation.pptx';
const ASSETS_DIR = path.join(ROOT, 'public', 'assets');
const ASSET_MAP_PATH = path.join(ROOT, 'data', 'asset-map.json');

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

/**
 * Template -> source slide -> media part.
 *
 * Only these three columns are hand-declared; everything else in
 * `data/asset-map.json` is read back out of the deck by `build-map`. Each
 * `slide` was confirmed against that slide's own text runs (see `evidence` in
 * the generated map), not against a render's file number.
 *
 * `exportedFile` names the *template* that uses the plate, never the picture's
 * subject, so a future mismatch shows up in review. Where two templates share
 * one plate they share one committed file.
 */
const TEMPLATE_SOURCES = [
  { templateId: 'welcome', layoutKey: 'default', refKind: 'backgroundImage', slide: 1, mediaPart: 'ppt/media/image1.png', exportedFile: 'welcome-bg.png' },
  { templateId: 'bible-talk-sequence', layoutKey: 'default', refKind: 'backgroundImage', slide: 2, mediaPart: 'ppt/media/image2.png', exportedFile: 'bt-seq-bg.png' },
  { templateId: 'prayer-partners', layoutKey: 'default', refKind: 'backgroundImage', slide: 3, mediaPart: 'ppt/media/image3.png', exportedFile: 'prayer-partners-bg.png' },
  { templateId: 'opening-song-cue', layoutKey: 'default', refKind: 'backgroundImage', slide: 4, mediaPart: 'ppt/media/image4.png', exportedFile: 'song-cue-bg.png' },
  { templateId: 'song-set', layoutKey: 'title', refKind: 'imageRef', elementId: 'e2', slide: 5, mediaPart: 'ppt/media/image5.jpeg', exportedFile: 'song-title-bottom.jpeg' },
  { templateId: 'song-set', layoutKey: 'lyric', refKind: 'backgroundImage', slide: 6, mediaPart: 'ppt/media/image6.jpeg', exportedFile: 'song-lyric-bg.jpeg' },
  { templateId: 'verse-reading', layoutKey: 'default', refKind: 'backgroundImage', slide: 12, mediaPart: 'ppt/media/image7.jpeg', exportedFile: 'verse-reading-bg.jpeg' },
  { templateId: 'opening-prayer', layoutKey: 'default', refKind: 'backgroundImage', slide: 13, mediaPart: 'ppt/media/image3.png', exportedFile: 'prayer-partners-bg.png' },
  { templateId: 'bible-talk', layoutKey: 'default', refKind: 'backgroundImage', slide: 14, mediaPart: 'ppt/media/image8.png', exportedFile: 'bible-talk-bg.png' },
  { templateId: 'closing-song-cue', layoutKey: 'default', refKind: 'backgroundImage', slide: 15, mediaPart: 'ppt/media/image4.png', exportedFile: 'song-cue-bg.png' },
  { templateId: 'closing-prayer', layoutKey: 'default', refKind: 'backgroundImage', slide: 23, mediaPart: 'ppt/media/image9.png', exportedFile: 'closing-prayer-bg.png' },
  { templateId: 'break-time', layoutKey: 'default', refKind: 'backgroundImage', slide: 24, mediaPart: 'ppt/media/image10.png', exportedFile: 'break-time-bg.png' },
  { templateId: 'ds-sequence', layoutKey: 'default', refKind: 'backgroundImage', slide: 25, mediaPart: 'ppt/media/image12.png', exportedFile: 'ds-seq-bg.png' },
  { templateId: 'bible-verse-contemplation', layoutKey: 'default', refKind: 'backgroundImage', slide: 26, mediaPart: 'ppt/media/image13.png', exportedFile: 'verse-contemplation-bg.png' },
  { templateId: 'intercessory-prayer', layoutKey: 'default', refKind: 'backgroundImage', slide: 35, mediaPart: 'ppt/media/image15.png', exportedFile: 'intercessory-prayer-bg.png' },
  { templateId: 'intercessory-prayer-during', layoutKey: 'default', refKind: 'backgroundImage', slide: 36, mediaPart: 'ppt/media/image16.jpeg', exportedFile: 'intercessory-during-bg.jpeg' },
  { templateId: 'special-song', layoutKey: 'default', refKind: 'backgroundImage', slide: 39, mediaPart: 'ppt/media/image21.png', exportedFile: 'special-song-bg.png' },
  { templateId: 'sermon', layoutKey: 'default', refKind: 'backgroundImage', slide: 40, mediaPart: 'ppt/media/image22.png', exportedFile: 'sermon-bg.png' },
  { templateId: 'closing-prayer-ds', layoutKey: 'default', refKind: 'backgroundImage', slide: 50, mediaPart: 'ppt/media/image24.png', exportedFile: 'closing-prayer-ds-bg.png' },
  { templateId: 'thank-you', layoutKey: 'default', refKind: 'backgroundImage', slide: 53, mediaPart: 'ppt/media/image26.png', exportedFile: 'thank-you-bg.png' },
  { templateId: 'welcome-repeat', layoutKey: 'default', refKind: 'backgroundImage', slide: 54, mediaPart: 'ppt/media/image27.png', exportedFile: 'welcome-repeat-bg.png' },
  { templateId: 'offering-tithe', layoutKey: 'default', refKind: 'backgroundImage', slide: 55, mediaPart: 'ppt/media/image28.png', exportedFile: 'offering-bg.png' },
  { templateId: 'midweek-prayer', layoutKey: 'default', refKind: 'backgroundImage', slide: 57, mediaPart: 'ppt/media/image31.png', exportedFile: 'midweek-bg.png' },
  { templateId: 'fellowship-etiquette', layoutKey: 'default', refKind: 'backgroundImage', slide: 66, mediaPart: 'ppt/media/image54.png', exportedFile: 'fellowship-bg.png' },

  // Deliberately left on their solid `backgroundColor`. Inventing a plate for
  // any of these would repeat the defect in a new coat.
  {
    templateId: 'family-youth',
    layoutKey: 'default',
    refKind: null,
    slide: 56,
    mediaPart: null,
    reason:
      'Slide 56 has no chrome plate: its only pictures are the two weekly member photos (image29.png 10.2% cover, image30.jpg 10.4%) sitting on a flat #DCD7CE fill. Those photos are weekly content, not artwork.',
  },
  {
    templateId: 'contact',
    layoutKey: 'default',
    refKind: null,
    slide: 68,
    mediaPart: null,
    reason:
      'Slide 68 has no full-bleed picture: image55.png covers 33.9% of the slide and image56.png (the QR code) 1.0%. A partial-cover picture is not a background, so the #2F3B2D fill is kept.',
  },
  {
    templateId: 'sermon-flyer',
    layoutKey: 'default',
    refKind: null,
    slide: 41,
    mediaPart: null,
    reason:
      "Slide 41's full-bleed image23.jpeg is that week's sermon flyer artwork with the sermon title and speaker baked into the pixels, not reusable chrome. The template is fullscreen-image and the weekly flyer fills the slide, so it keeps its #000000 fill.",
  },
  {
    templateId: 'announcements-header',
    layoutKey: 'default',
    refKind: null,
    slide: null,
    mediaPart: null,
    reason:
      'No source slide exists. This template was hand-added during the v1 transform and previously borrowed the Midweek Prayer render. It keeps its #2F3B2D fill.',
  },
  {
    templateId: 'announcement-flyer',
    layoutKey: 'default',
    refKind: null,
    slide: null,
    mediaPart: null,
    reason:
      'Pure placeholder: the whole slide is the operator-supplied announcement image. No background.',
  },
];

function deckPath() {
  return path.join(ROOT, process.env.SOURCE_PPTX || DEFAULT_DECK);
}

function asArray(node) {
  if (node === undefined || node === null) return [];
  return Array.isArray(node) ? node : [node];
}

/* ------------------------------------------------------------------ *
 * Native pixel size sniffing (headers only; we never decode a picture)
 * ------------------------------------------------------------------ */

function pngSize(buf) {
  if (buf.length < 24) return null;
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function jpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = buf.readUInt16BE(i + 2);
    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isSof) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

function gifSize(buf) {
  if (buf.length < 10 || buf.toString('latin1', 0, 3) !== 'GIF') return null;
  return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
}

function webpSize(buf) {
  if (buf.length < 30) return null;
  if (buf.toString('latin1', 0, 4) !== 'RIFF' || buf.toString('latin1', 8, 12) !== 'WEBP') return null;
  const fourcc = buf.toString('latin1', 12, 16);
  if (fourcc === 'VP8 ') {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (fourcc === 'VP8L') {
    const bits = buf.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (fourcc === 'VP8X') {
    const w = buf[24] | (buf[25] << 8) | (buf[26] << 16);
    const h = buf[27] | (buf[28] << 8) | (buf[29] << 16);
    return { width: w + 1, height: h + 1 };
  }
  return null;
}

export function imageSize(buf) {
  return pngSize(buf) || jpegSize(buf) || gifSize(buf) || webpSize(buf) || null;
}

/* ------------------------------------------------------------------ *
 * Deck traversal
 * ------------------------------------------------------------------ */

function relsPathFor(partPath) {
  const dir = path.posix.dirname(partPath);
  const base = path.posix.basename(partPath);
  return `${dir}/_rels/${base}.rels`;
}

/** Resolve a relationship target ("../media/image4.png") against its owning part. */
function resolveTarget(ownerPart, target) {
  const dir = path.posix.dirname(ownerPart);
  return path.posix.normalize(path.posix.join(dir, target));
}

async function readRels(zip, partPath) {
  const relsFile = zip.file(relsPathFor(partPath));
  if (!relsFile) return new Map();
  const xml = await relsFile.async('string');
  const parsed = parser.parse(xml);
  const map = new Map();
  for (const rel of asArray(parsed?.Relationships?.Relationship)) {
    map.set(rel['@_Id'], { target: rel['@_Target'], mode: rel['@_TargetMode'], type: rel['@_Type'] });
  }
  return map;
}

/** Slide part paths in true presentation (`p:sldIdLst`) order. */
async function slideOrder(zip) {
  const presXml = await zip.file('ppt/presentation.xml').async('string');
  const pres = parser.parse(presXml);
  const rels = await readRels(zip, 'ppt/presentation.xml');
  const sldSz = pres?.['p:presentation']?.['p:sldSz'] ?? {};
  const slideW = Number(sldSz['@_cx'] || 0);
  const slideH = Number(sldSz['@_cy'] || 0);
  const ids = asArray(pres?.['p:presentation']?.['p:sldIdLst']?.['p:sldId']);
  const parts = ids.map((sldId) => {
    const rid = sldId['@_r:id'];
    const rel = rels.get(rid);
    if (!rel) throw new Error(`presentation.xml references missing relationship ${rid}`);
    return resolveTarget('ppt/presentation.xml', rel.target);
  });
  return { parts, slideW, slideH };
}

/** Compose a group's child-space transform onto the parent transform. */
function composeGroupTransform(parent, grpSpPr) {
  const xfrm = grpSpPr?.['a:xfrm'];
  if (!xfrm) return parent;
  const off = xfrm['a:off'] ?? {};
  const ext = xfrm['a:ext'] ?? {};
  const chOff = xfrm['a:chOff'] ?? {};
  const chExt = xfrm['a:chExt'] ?? {};
  const cx = Number(ext['@_cx'] || 0);
  const cy = Number(ext['@_cy'] || 0);
  const chCx = Number(chExt['@_cx'] || 0);
  const chCy = Number(chExt['@_cy'] || 0);
  const sx = chCx ? cx / chCx : 1;
  const sy = chCy ? cy / chCy : 1;
  return {
    sx: parent.sx * sx,
    sy: parent.sy * sy,
    tx: parent.tx + (Number(off['@_x'] || 0) - Number(chOff['@_x'] || 0) * sx) * parent.sx,
    ty: parent.ty + (Number(off['@_y'] || 0) - Number(chOff['@_y'] || 0) * sy) * parent.sy,
  };
}

function absoluteBox(spPr, tf) {
  const xfrm = spPr?.['a:xfrm'];
  if (!xfrm) return null;
  const off = xfrm['a:off'] ?? {};
  const ext = xfrm['a:ext'] ?? {};
  return {
    x: tf.tx + Number(off['@_x'] || 0) * tf.sx,
    y: tf.ty + Number(off['@_y'] || 0) * tf.sy,
    w: Number(ext['@_cx'] || 0) * tf.sx,
    h: Number(ext['@_cy'] || 0) * tf.sy,
  };
}

/** Fraction of the slide rectangle this box covers (intersection / slide area). */
function coverFraction(box, slideW, slideH) {
  if (!box || !slideW || !slideH) return 0;
  const x0 = Math.max(0, box.x);
  const y0 = Math.max(0, box.y);
  const x1 = Math.min(slideW, box.x + box.w);
  const y1 = Math.min(slideH, box.y + box.h);
  if (x1 <= x0 || y1 <= y0) return 0;
  return ((x1 - x0) * (y1 - y0)) / (slideW * slideH);
}

function embedId(blipFill) {
  const blip = blipFill?.['a:blip'];
  if (!blip) return null;
  // `@_r:embed` on a:blip is the raster part. Vector alternates live under
  // a:extLst/a:ext/asvg:svgBlip and are deliberately ignored.
  return blip['@_r:embed'] ?? null;
}

function textRuns(txBody) {
  const out = [];
  for (const p of asArray(txBody?.['a:p'])) {
    let line = '';
    for (const r of asArray(p?.['a:r'])) {
      const t = r?.['a:t'];
      if (typeof t === 'string' || typeof t === 'number') line += String(t);
    }
    const trimmed = line.trim();
    if (trimmed) out.push(trimmed);
  }
  return out;
}

/**
 * Walk a spTree (recursing into p:grpSp) collecting every blipFill reference
 * and every text run.
 */
function walkTree(tree, tf, acc) {
  for (const sp of asArray(tree?.['p:sp'])) {
    acc.text.push(...textRuns(sp?.['p:txBody']));
    const fill = sp?.['p:spPr']?.['a:blipFill'] ?? sp?.['p:blipFill'];
    const rid = embedId(fill);
    if (rid) acc.fills.push({ kind: 'sp', rid, box: absoluteBox(sp?.['p:spPr'], tf) });
  }
  for (const pic of asArray(tree?.['p:pic'])) {
    const fill = pic?.['p:blipFill'] ?? pic?.['p:spPr']?.['a:blipFill'];
    const rid = embedId(fill);
    if (rid) acc.fills.push({ kind: 'pic', rid, box: absoluteBox(pic?.['p:spPr'], tf) });
  }
  for (const gf of asArray(tree?.['p:graphicFrame'])) {
    acc.text.push(...textRuns(gf?.['p:txBody']));
  }
  for (const grp of asArray(tree?.['p:grpSp'])) {
    walkTree(grp, composeGroupTransform(tf, grp?.['p:grpSpPr']), acc);
  }
}

/** Parse every slide and return its background candidates + text evidence. */
export async function surveyDeck(zip) {
  const { parts, slideW, slideH } = await slideOrder(zip);
  const mediaCache = new Map();

  async function mediaInfo(part) {
    if (mediaCache.has(part)) return mediaCache.get(part);
    const file = zip.file(part);
    const info = file
      ? { bytes: (await file.async('nodebuffer')).length, size: imageSize(await file.async('nodebuffer')) }
      : null;
    mediaCache.set(part, info);
    return info;
  }

  const slides = [];
  for (let i = 0; i < parts.length; i += 1) {
    const slideNumber = i + 1;
    const partPath = parts[i];
    const file = zip.file(partPath);
    if (!file) throw new Error(`slide ${slideNumber}: missing slide part ${partPath}`);
    const parsed = parser.parse(await file.async('string'));
    const tree = parsed?.['p:sld']?.['p:cSld']?.['p:spTree'];
    const rels = await readRels(zip, partPath);
    const acc = { fills: [], text: [] };
    if (tree) walkTree(tree, { sx: 1, sy: 1, tx: 0, ty: 0 }, acc);

    const pictures = [];
    for (const fill of acc.fills) {
      const rel = rels.get(fill.rid);
      if (!rel) {
        throw new Error(`slide ${slideNumber} (${partPath}): unresolved relationship ${fill.rid}`);
      }
      if (rel.mode === 'External') continue;
      const target = resolveTarget(partPath, rel.target);
      const info = await mediaInfo(target);
      if (!info) {
        throw new Error(`slide ${slideNumber} (${partPath}): rels target ${target} is absent from the package`);
      }
      pictures.push({
        kind: fill.kind,
        mediaPart: target,
        width: info.size?.width ?? null,
        height: info.size?.height ?? null,
        bytes: info.bytes,
        cover: coverFraction(fill.box, slideW, slideH),
      });
    }

    slides.push({ slide: slideNumber, part: partPath, pictures, text: acc.text });
  }
  return { slides, slideW, slideH };
}

async function openDeck() {
  const file = deckPath();
  if (!fs.existsSync(file)) {
    throw new Error(
      `Source deck not found: ${file}\n` +
        'It is gitignored (100 MB). Place it at the repo root, or set SOURCE_PPTX to its name.'
    );
  }
  return JSZip.loadAsync(fs.readFileSync(file));
}

/* ------------------------------------------------------------------ *
 * Modes
 * ------------------------------------------------------------------ */

async function report() {
  const zip = await openDeck();
  const { slides, slideW, slideH } = await surveyDeck(zip);
  console.log(`deck: ${deckPath()}`);
  console.log(`slides: ${slides.length}  sldSz: ${slideW}x${slideH} EMU`);
  console.log('');
  console.log('slide | media part            | native      | cover | kind | first text runs');
  console.log('------+-----------------------+-------------+-------+------+----------------');
  for (const s of slides) {
    const evidence = s.text.slice(0, 3).join(' / ').replace(/\s+/g, ' ').slice(0, 90) || '(no text)';
    if (s.pictures.length === 0) {
      console.log(`${String(s.slide).padStart(5)} | ${'(none)'.padEnd(21)} | ${''.padEnd(11)} |       |      | ${evidence}`);
      continue;
    }
    s.pictures.forEach((p, idx) => {
      const part = p.mediaPart.replace('ppt/media/', '').padEnd(21);
      const native = `${p.width ?? '?'}x${p.height ?? '?'}`.padEnd(11);
      const cover = `${(p.cover * 100).toFixed(1)}%`.padStart(6);
      console.log(
        `${String(s.slide).padStart(5)} | ${part} | ${native} |${cover} | ${p.kind.padEnd(4)} | ${idx === 0 ? evidence : ''}`
      );
    });
  }
}

const MAX_EVIDENCE_RUNS = 6;
const MAX_EVIDENCE_CHARS = 140;

function evidenceFor(slide) {
  return slide.text
    .slice(0, MAX_EVIDENCE_RUNS)
    .map((line) => line.replace(/\s+/g, ' ').slice(0, MAX_EVIDENCE_CHARS));
}

async function buildMap() {
  const zip = await openDeck();
  const { slides } = await surveyDeck(zip);
  const bySlide = new Map(slides.map((s) => [s.slide, s]));

  const fileToPart = new Map();
  const entries = TEMPLATE_SOURCES.map((src) => {
    const slide = src.slide === null ? null : bySlide.get(src.slide);
    if (src.slide !== null && !slide) {
      throw new Error(`${src.templateId}: declared slide ${src.slide} is not in the deck`);
    }

    const base = {
      templateId: src.templateId,
      layoutKey: src.layoutKey,
      refKind: src.refKind,
      ...(src.elementId ? { elementId: src.elementId } : {}),
      sourceSlide: src.slide,
      mediaPart: src.mediaPart,
      exportedFile: src.exportedFile ?? null,
      assetRef: src.exportedFile ? `/assets/${src.exportedFile}` : null,
    };

    if (!src.mediaPart) {
      return { ...base, reason: src.reason, evidence: slide ? evidenceFor(slide) : [] };
    }

    const picture = slide.pictures.find((p) => p.mediaPart === src.mediaPart);
    if (!picture) {
      const seen = slide.pictures.map((p) => p.mediaPart).join(', ') || '(none)';
      throw new Error(
        `${src.templateId}: slide ${src.slide} does not reference ${src.mediaPart}. It references: ${seen}`
      );
    }
    const prior = fileToPart.get(src.exportedFile);
    if (prior && prior !== src.mediaPart) {
      throw new Error(
        `${src.exportedFile} is claimed by two different media parts (${prior} and ${src.mediaPart})`
      );
    }
    fileToPart.set(src.exportedFile, src.mediaPart);

    return {
      ...base,
      nativeSize: { width: picture.width, height: picture.height },
      bytes: picture.bytes,
      coverFraction: Number(picture.cover.toFixed(4)),
      evidence: evidenceFor(slide),
    };
  });

  const map = {
    schemaVersion: 1,
    generatedBy: 'scripts/extract-pptx-assets.mjs build-map',
    sourceDeck: process.env.SOURCE_PPTX || DEFAULT_DECK,
    sourceDeckSlides: slides.length,
    note:
      'Template -> source slide -> media part -> exported filename. Generated from the deck; ' +
      '`evidence` is the source slide\'s own text runs, which is how each row was confirmed. ' +
      'Rows with a null mediaPart are deliberately left on their solid backgroundColor; see `reason`. ' +
      'Files are copied byte-for-byte out of ppt/media — never rendered, resized or re-encoded.',
    entries,
  };

  fs.writeFileSync(ASSET_MAP_PATH, `${JSON.stringify(map, null, 2)}\n`);
  const mapped = entries.filter((e) => e.mediaPart).length;
  console.log(
    `Wrote ${ASSET_MAP_PATH}: ${entries.length} rows, ${mapped} mapped to ${fileToPart.size} distinct file(s), ` +
      `${entries.length - mapped} intentionally without a background.`
  );
}

async function exportAssets() {
  if (!fs.existsSync(ASSET_MAP_PATH)) {
    throw new Error(`Missing asset map: ${ASSET_MAP_PATH}`);
  }
  const zip = await openDeck();
  const map = JSON.parse(fs.readFileSync(ASSET_MAP_PATH, 'utf8'));
  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  const written = new Map();
  for (const entry of map.entries) {
    if (!entry.mediaPart) continue;
    const file = zip.file(entry.mediaPart);
    if (!file) {
      throw new Error(
        `slide ${entry.sourceSlide} (${entry.templateId}): media part ${entry.mediaPart} is absent from the deck`
      );
    }
    const target = path.join(ASSETS_DIR, entry.exportedFile);
    const bytes = await file.async('nodebuffer');
    const prior = written.get(entry.exportedFile);
    if (prior && prior !== entry.mediaPart) {
      throw new Error(
        `${entry.exportedFile} is claimed by two different media parts (${prior} and ${entry.mediaPart})`
      );
    }
    if (!prior) {
      fs.writeFileSync(target, bytes);
      written.set(entry.exportedFile, entry.mediaPart);
    }
  }

  const keep = new Set(written.keys());
  const removed = [];
  for (const name of fs.readdirSync(ASSETS_DIR)) {
    if (keep.has(name)) continue;
    if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(name)) {
      console.warn(`skipped public/assets/${name}: not a bundled image, leaving it alone`);
      continue;
    }
    fs.unlinkSync(path.join(ASSETS_DIR, name));
    removed.push(name);
  }

  for (const [name, part] of [...written].sort()) {
    console.log(`wrote  public/assets/${name}  <- ${part}`);
  }
  for (const name of removed.sort()) console.log(`removed public/assets/${name} (no longer referenced)`);
  console.log(`\n${written.size} asset(s) written, ${removed.length} removed.`);
}

const MODES = { report, 'build-map': buildMap, export: exportAssets };
const mode = process.argv[2] || 'report';
const run = MODES[mode];
if (!run) {
  console.error(`Unknown mode "${mode}". Use one of: ${Object.keys(MODES).join(', ')}.`);
  process.exit(1);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
