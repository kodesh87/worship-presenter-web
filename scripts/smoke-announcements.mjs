/**
 * Smoke: empty list / add recurring / reject mp4 / resolve order.
 * Uses a temp SQLite DB; does not touch production data.db.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import os from 'os';
import path from 'path';

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|avi|mkv)$/i;
const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

function isSafeImageUrl(ref) {
  try {
    const u = new URL(ref);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function announcementPathname(ref) {
  try {
    return decodeURIComponent(new URL(ref).pathname).replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function isVideoUrl(ref) {
  const path = announcementPathname(ref);
  return path ? VIDEO_EXT.test(path) : false;
}

function assertAnnouncementImageUrl(ref) {
  if (typeof ref !== 'string' || !ref.trim()) {
    throw new Error('image_url must be a non-empty string');
  }
  const url = ref.trim();
  if (!isSafeImageUrl(url)) throw new Error('image_url must be an http(s) URL');
  if (isVideoUrl(url)) throw new Error('Video/MP4 URLs are not allowed');
  const path = announcementPathname(url);
  if (!path || !IMAGE_EXT.test(path)) {
    throw new Error(
      'image_url must end with an image extension (.jpg, .jpeg, .png, .gif, or .webp)'
    );
  }
  return url;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ann-smoke-'));
const dbPath = path.join(tmp, 'smoke.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    raw_payload TEXT NOT NULL,
    parsed_data TEXT,
    images_payload TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE announcement_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT NOT NULL,
    service_id INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
  );
`);

function resolveUrls(serviceId) {
  return db
    .prepare(
      `SELECT image_url FROM announcement_items
       WHERE service_id IS NULL OR service_id = ?
       ORDER BY sort_order ASC, id ASC`
    )
    .all(serviceId)
    .map((r) => r.image_url)
    .filter((u) => isSafeImageUrl(u) && !isVideoUrl(u));
}

let failed = 0;
function check(name, cond) {
  if (cond) {
    console.log(`PASS  ${name}`);
  } else {
    console.error(`FAIL  ${name}`);
    failed += 1;
  }
}

// Empty list
check('empty resolve ⇒ 0 URLs', resolveUrls(1).length === 0);

// Reject mp4
let mp4Rejected = false;
try {
  assertAnnouncementImageUrl('https://example.com/clip.mp4');
} catch (e) {
  mp4Rejected = /Video\/MP4/i.test(String(e.message));
}
check('reject .mp4 URL', mp4Rejected);

// Query string containing .mp4 must not false-positive
let queryOk = false;
try {
  assertAnnouncementImageUrl('https://cdn.example.com/flyer.jpg?v=clip.mp4');
  queryOk = true;
} catch {
  queryOk = false;
}
check('allow image URL with .mp4 in query', queryOk);

// Add recurring in order
const urls = [
  'https://example.com/a.jpg',
  'https://example.com/b.jpg',
];
const insert = db.prepare(
  `INSERT INTO announcement_items (image_url, service_id, sort_order) VALUES (?, NULL, ?)`
);
urls.forEach((u, i) => {
  assertAnnouncementImageUrl(u);
  insert.run(u, i);
});

const resolved = resolveUrls(99);
check('recurring resolve count = 2', resolved.length === 2);
check(
  'recurring order preserved',
  resolved[0] === urls[0] && resolved[1] === urls[1]
);

// One-off for service 5 only
db.prepare(
  `INSERT INTO services (id, date, raw_payload) VALUES (5, '2026-07-18', 'x')`
).run();
db.prepare(
  `INSERT INTO announcement_items (image_url, service_id, sort_order)
   VALUES ('https://example.com/oneoff.jpg', 5, 10)`
).run();

check('service 5 includes one-off', resolveUrls(5).length === 3);
check('other service excludes one-off', resolveUrls(1).length === 2);

// Cascade delete
db.prepare('DELETE FROM services WHERE id = 5').run();
check(
  'cascade removes one-off',
  db
    .prepare('SELECT COUNT(*) AS c FROM announcement_items WHERE service_id = 5')
    .get().c === 0
);
check('recurring survive service delete', resolveUrls(1).length === 2);

// No bible tables
const tables = db
  .prepare(`SELECT name FROM sqlite_master WHERE type='table'`)
  .all()
  .map((r) => r.name);
check(
  'no bible/kjv tables',
  !tables.some((n) => /bible|kjv|verse/i.test(n))
);

db.close();
fs.rmSync(tmp, { recursive: true, force: true });

if (failed > 0) {
  console.error(`\n${failed} smoke check(s) failed`);
  process.exit(1);
}
console.log('\nAll announcement smoke checks passed');
