/**
 * Announcement image URL hardening: image pathname extension required.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

delete process.env.IMAGE_URL_ALLOWLIST;

const { assertAnnouncementImageUrl } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'announcements.ts')).href
);

test('accepts image pathname with query that looks like video', () => {
  const url = 'https://cdn.example.com/f.jpg?v=1.mp4';
  assert.equal(assertAnnouncementImageUrl(url), url);
});

test('rejects extensionless URL', () => {
  assert.throws(
    () => assertAnnouncementImageUrl('https://cdn.example.com/clip'),
    /image extension/i
  );
});

test('rejects video pathname extension', () => {
  assert.throws(
    () => assertAnnouncementImageUrl('https://cdn.example.com/a.mp4'),
    /Video|MP4/i
  );
});

test('accepts common image extensions', () => {
  assert.equal(
    assertAnnouncementImageUrl('https://cdn.example.com/a.jpeg'),
    'https://cdn.example.com/a.jpeg'
  );
  assert.equal(
    assertAnnouncementImageUrl('https://cdn.example.com/a.PNG'),
    'https://cdn.example.com/a.PNG'
  );
  assert.equal(
    assertAnnouncementImageUrl('https://cdn.example.com/a.webp'),
    'https://cdn.example.com/a.webp'
  );
});

test('accepts image pathname with trailing slash', () => {
  const url = 'https://cdn.example.com/a.jpg/';
  assert.equal(assertAnnouncementImageUrl(url), url);
});

test('accepts percent-encoded image extension', () => {
  const url = 'https://cdn.example.com/a%2Ejpg';
  assert.equal(assertAnnouncementImageUrl(url), url);
});

test('accepts hub-local upload path', () => {
  const url =
    '/api/uploads/0123456789abcdef0123456789abcdef.png';
  assert.equal(assertAnnouncementImageUrl(url), url);
});

test('rejects unsafe local upload path shapes', () => {
  assert.throws(
    () => assertAnnouncementImageUrl('/api/uploads/../secret.png'),
    /http\(s\)|local \/api\/uploads/i
  );
  assert.throws(
    () => assertAnnouncementImageUrl('/api/uploads/not-hex.png'),
    /http\(s\)|local \/api\/uploads|image extension/i
  );
  assert.throws(
    () =>
      assertAnnouncementImageUrl(
        '/api/uploads/0123456789abcdef0123456789abcdef.svg'
      ),
    /http\(s\)|local \/api\/uploads|image extension/i
  );
});
