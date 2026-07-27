import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

delete process.env.IMAGE_URL_ALLOWLIST;
const { isSafeImageUrl } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'images.ts')).href
);
const { fetchRemoteImage } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'remote-image.ts')).href
);

test('blocks private and localhost when allowlist unset', () => {
  assert.equal(isSafeImageUrl('https://cdn.example.com/x.png'), true);
  assert.equal(isSafeImageUrl('http://127.0.0.1/x.png'), false);
  assert.equal(isSafeImageUrl('http://169.254.169.254/x'), false);
});

test('IMAGE_URL_ALLOWLIST enforces hosts', () => {
  process.env.IMAGE_URL_ALLOWLIST = 'cdn.example.com';
  assert.equal(isSafeImageUrl('https://cdn.example.com/x.png'), true);
  assert.equal(isSafeImageUrl('https://other.example.com/x.png'), false);
  delete process.env.IMAGE_URL_ALLOWLIST;
});

test('allows hub-local upload refs even when allowlist is set', () => {
  process.env.IMAGE_URL_ALLOWLIST = 'cdn.example.com';
  assert.equal(
    isSafeImageUrl('/api/uploads/0123456789abcdef0123456789abcdef.jpg'),
    true
  );
  assert.equal(isSafeImageUrl('/api/uploads/../etc/passwd'), false);
  delete process.env.IMAGE_URL_ALLOWLIST;
});

/**
 * The shared fetcher (`src/lib/remote-image.ts`) was extracted out of
 * `pptx.ts` so that deck generation and the download-from-a-link route cannot
 * drift apart. This pins the extraction: whatever `isSafeImageUrl` refuses, the
 * fetcher must refuse too, before it makes any network call. Widening the
 * fetcher's own idea of an acceptable URL — even by accident — fails here.
 */
const REFUSED_BY_THE_GATE = [
  'http://127.0.0.1/x.png',
  'http://127.255.255.254/x.png',
  'http://169.254.169.254/x',
  'http://10.1.2.3/x.png',
  'http://172.31.255.1/x.png',
  'http://192.168.0.1/x.png',
  'http://0.0.0.0/x.png',
  'https://localhost/x.png',
  'https://api.localhost/x.png',
  'http://[::1]/x.png',
  'http://[fd00::1]/x.png',
  'http://[fe80::1]/x.png',
  'http://metadata/x.png',
  'http://metadata.google.internal/x.png',
  'http://box.internal/x.png',
  'http://printer.local/x.png',
  'ftp://cdn.example.com/x.png',
  'javascript:alert(1)',
  'not a url',
  '',
];

test('the shared fetcher refuses everything isSafeImageUrl refuses', async () => {
  delete process.env.IMAGE_URL_ALLOWLIST;
  for (const ref of REFUSED_BY_THE_GATE) {
    assert.equal(isSafeImageUrl(ref), false, `gate should refuse ${ref}`);
    const result = await fetchRemoteImage(ref);
    assert.equal(result.ok, false, `fetcher should refuse ${ref}`);
    assert.ok(
      result.reason === 'blocked-url' || result.reason === 'malformed-url',
      `${ref} should be refused before any network call, got ${result.reason}`
    );
  }
});

test('the shared fetcher honours IMAGE_URL_ALLOWLIST', async () => {
  process.env.IMAGE_URL_ALLOWLIST = 'cdn.example.com';
  assert.equal(isSafeImageUrl('https://other.example.com/x.png'), false);
  const remote = await fetchRemoteImage('https://other.example.com/x.png');
  assert.equal(remote.ok, false);
  assert.equal(remote.reason, 'blocked-url');

  // A hub-local ref is safe but is read from disk, never fetched.
  const local = await fetchRemoteImage(
    '/api/uploads/0123456789abcdef0123456789abcdef.jpg'
  );
  assert.equal(local.ok, false);
  assert.equal(local.reason, 'malformed-url');
  delete process.env.IMAGE_URL_ALLOWLIST;
});
