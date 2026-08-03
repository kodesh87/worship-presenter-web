import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-seed-test-'));
const dbPath = path.join(tmp, 'demo.db');
const previousDbPath = process.env.DB_PATH;
process.env.DB_PATH = dbPath;
const npmCli =
  process.env.npm_execpath ||
  path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');

const { getDb } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'db', 'index.ts')).href
);
const { resolveSlideMediaForService } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'announcements.ts')).href
);
const { buildSlidePlan } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'slide-plan.ts')).href
);

function runDemoSeed() {
  const { IMAGE_URL_ALLOWLIST: _ignored, ...parentEnv } = process.env;
  return spawnSync(process.execPath, [npmCli, 'run', 'seed:demo'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...parentEnv, DB_PATH: dbPath },
    shell: false,
  });
}

before(() => {
  getDb();
});

after(() => {
  getDb().close();
  if (previousDbPath === undefined) delete process.env.DB_PATH;
  else process.env.DB_PATH = previousDbPath;
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('seed:demo creates one deck-ready synthetic service and then refuses without mutation', () => {
  const db = getDb();
  assert.equal(
    db.prepare('SELECT COUNT(*) AS count FROM services').get().count,
    0,
    'database initialization must not create a demo service'
  );

  const first = runDemoSeed();
  assert.equal(first.error, undefined);
  assert.equal(first.status, 0, `${first.stdout}\n${first.stderr}`);
  assert.match(first.stdout, /Demo service created:/);

  const services = db
    .prepare(
      `SELECT id, date, parsed_data, images_payload
       FROM services ORDER BY id`
    )
    .all();
  assert.equal(services.length, 1);

  const [service] = services;
  const announcements = db
    .prepare(
      `SELECT image_url, service_id, sort_order
       FROM announcement_items ORDER BY sort_order, id`
    )
    .all();
  assert.equal(announcements.length, 1);

  const parsed = JSON.parse(service.parsed_data);
  assert.equal(parsed.failedHymnNumbers.length, 0);
  assert.ok(parsed.items.some((item) => item.type === 'section'));
  assert.equal(parsed.verseReading.reference, 'John 3:16');
  assert.ok(parsed.verseReading.text.length > 0);

  const media = resolveSlideMediaForService(service.id, service.images_payload);
  const plan = buildSlidePlan(service.date, parsed, media);
  assert.ok(plan.some((slide) => slide.id === 'verse-reading'));
  assert.ok(plan.some((slide) => slide.id === 'announcements'));
  assert.ok(plan.some((slide) => slide.id === 'flyer-0'));

  const beforeSecondRun = {
    services,
    announcements,
  };
  const second = runDemoSeed();
  assert.equal(second.error, undefined);
  assert.notEqual(second.status, 0, `${second.stdout}\n${second.stderr}`);
  assert.match(second.stderr, /empty installation/i);

  assert.deepEqual(
    db
      .prepare(
        `SELECT id, date, parsed_data, images_payload
         FROM services ORDER BY id`
      )
      .all(),
    beforeSecondRun.services
  );
  assert.deepEqual(
    db
      .prepare(
        `SELECT image_url, service_id, sort_order
         FROM announcement_items ORDER BY sort_order, id`
      )
      .all(),
    beforeSecondRun.announcements
  );
});
