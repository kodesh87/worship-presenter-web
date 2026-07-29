/**
 * Ceilings on generated-deck size and generation time.
 *
 * NFR-2 budgets a full assemble/regenerate at ≤ 5 minutes including PPTX export,
 * and NFR-1 makes the downloaded file the offline guarantee — an operator pulls it
 * before the service, sometimes on church wifi. Neither number had an automated
 * floor under it, so a template change that quietly tripled the deck would have
 * been noticed on a Sabbath rather than in CI.
 *
 * These are regression ceilings, not targets. They are set well above the measured
 * cost so a loaded machine does not fail the build; the point is to catch an
 * order-of-magnitude change. The measured values are printed on every run, so
 * gradual drift is visible long before the assertion trips.
 *
 * Measured 2026-07-29 on the maintainer's machine: 53 slides, ~4.2 s, ~30.0 MB.
 * The 30 MB is dominated by full-bleed background images, not by slide count.
 *
 * The fixture has no hymnal corpus, so it yields 53 slides where a real service
 * yields ~68 — lyric slides are the difference. Treat these ceilings as covering
 * the fixed template cost, which is what background images make expensive.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pptx-ceiling-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');

const srcUrl = (...parts) =>
  pathToFileURL(path.join(root, 'src', ...parts)).href;

const { parseRundown } = await import(srcUrl('lib', 'parser.ts'));
const { generatePptx } = await import(srcUrl('lib', 'pptx.ts'));
const { buildSlidePlan } = await import(srcUrl('lib', 'slide-plan.ts'));

const SERVICE_DATE = '2026-07-11';

/** ~7x the measured 4.2 s. Catches an order-of-magnitude regression only. */
const MAX_GENERATION_MS = 30_000;
/** ~1.5x the measured 30.0 MB. Background images are the whole budget. */
const MAX_DECK_BYTES = 45 * 1024 * 1024;
/** The fixed skeleton plus this fixture's song blocks; guards a runaway planner. */
const MAX_PLAN_SLIDES = 120;

const parsed = parseRundown(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-rundown.txt'), 'utf8')
);

const plan = buildSlidePlan(SERVICE_DATE, parsed, []);

const startedAt = process.hrtime.bigint();
const buffer = await generatePptx(SERVICE_DATE, parsed, []);
const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

console.log(
  `[pptx-ceiling] ${plan.length} slides · ${Math.round(elapsedMs)} ms · ` +
    `${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB ` +
    `(ceilings: ${MAX_PLAN_SLIDES} · ${MAX_GENERATION_MS} ms · ` +
    `${(MAX_DECK_BYTES / 1024 / 1024).toFixed(0)} MB)`
);

test('the slide plan does not run away', () => {
  assert.ok(plan.length > 0, 'plan is empty — the fixture stopped producing slides');
  assert.ok(
    plan.length <= MAX_PLAN_SLIDES,
    `plan is ${plan.length} slides, ceiling ${MAX_PLAN_SLIDES}`
  );
});

test('generation fits well inside the NFR-2 window', () => {
  assert.ok(
    elapsedMs <= MAX_GENERATION_MS,
    `generation took ${Math.round(elapsedMs)} ms, ceiling ${MAX_GENERATION_MS} ms. ` +
      `NFR-2 budgets 5 minutes for the whole regenerate, so this is a regression ` +
      `signal rather than a breach — but something got much slower.`
  );
});

test('the deck stays downloadable on church wifi', () => {
  assert.ok(buffer.byteLength > 0, 'generated deck is empty');
  assert.ok(
    buffer.byteLength <= MAX_DECK_BYTES,
    `deck is ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB, ceiling ` +
      `${(MAX_DECK_BYTES / 1024 / 1024).toFixed(0)} MB. NFR-1 makes this file the ` +
      `offline guarantee; check whether a background image was added at full ` +
      `resolution or a media dedup path regressed.`
  );
});

test.after(() => {
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    // The SQLite handle can still hold the file on Windows; the OS reaps temp.
  }
});
