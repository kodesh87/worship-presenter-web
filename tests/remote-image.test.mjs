/**
 * The shared hardened remote-image fetch (`src/lib/remote-image.ts`).
 *
 * Both the deck generator and `POST /api/upload/from-url` fetch caller-supplied
 * URLs through this one module, so every row of the spec's fetch matrix is
 * pinned here against a real local server: a refusal that quietly turns into a
 * success is an SSRF hole, and a refusal that loses its reason is an operator
 * staring at "something went wrong".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import net from 'net';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

delete process.env.IMAGE_URL_ALLOWLIST;
const { fetchRemoteImage, MAX_IMAGE_BYTES } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'remote-image.ts')).href
);

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Loopback is exactly what `isBlockedImageHost` refuses, so the only way to
 * exercise the fetch against a real server is to allowlist it — which is also
 * the deployment shape where a hub is pointed at a host on its own network.
 */
function allowLoopback() {
  process.env.IMAGE_URL_ALLOWLIST = '127.0.0.1';
}

function resetAllowlist() {
  delete process.env.IMAGE_URL_ALLOWLIST;
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

/** An http server covering every response shape the matrix needs. */
function makeServer() {
  return http.createServer((req, res) => {
    const url = req.url.split('?', 1)[0];
    if (url === '/redirect.png') {
      res.writeHead(302, { location: 'http://127.0.0.1/elsewhere.png' });
      res.end();
      return;
    }
    if (url === '/page.html') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end('<!doctype html><p>not an image</p>');
      return;
    }
    if (url === '/vector.svg') {
      res.writeHead(200, { 'content-type': 'image/svg+xml' });
      res.end('<svg xmlns="http://www.w3.org/2000/svg"/>');
      return;
    }
    if (url === '/missing.png') {
      res.writeHead(404, { 'content-type': 'image/png' });
      res.end('nope');
      return;
    }
    if (url === '/empty.png') {
      res.writeHead(200, { 'content-type': 'image/png' });
      res.end();
      return;
    }
    if (url === '/untyped.jpg') {
      // No content-type at all: the URL extension is the only fallback.
      res.writeHead(200);
      res.end(PNG);
      return;
    }
    if (url === '/untyped.bin') {
      res.writeHead(200);
      res.end(PNG);
      return;
    }
    if (url === '/huge.png') {
      // Chunked, so no content-length is declared: only the streaming cap can
      // stop this, which is the point of the test.
      res.writeHead(200, { 'content-type': 'image/png' });
      const chunk = Buffer.alloc(1024 * 1024);
      let sent = 0;
      const pump = () => {
        while (sent <= MAX_IMAGE_BYTES) {
          sent += chunk.length;
          if (!res.write(chunk)) {
            res.once('drain', pump);
            return;
          }
        }
        res.end();
      };
      res.on('error', () => {});
      pump();
      return;
    }
    if (url === '/photo.jpeg') {
      res.writeHead(200, { 'content-type': 'image/jpeg' });
      res.end(PNG);
      return;
    }
    res.writeHead(200, { 'content-type': 'image/png' });
    res.end(PNG);
  });
}

test('fetches a real image into bytes and a content-type extension', async () => {
  allowLoopback();
  const server = makeServer();
  const port = await listen(server);
  try {
    const png = await fetchRemoteImage(`http://127.0.0.1:${port}/ok.png`);
    assert.equal(png.ok, true);
    assert.equal(png.extension, '.png');
    assert.deepEqual(png.bytes, PNG);

    // The extension follows the declared type, not the URL.
    const jpeg = await fetchRemoteImage(`http://127.0.0.1:${port}/photo.jpeg`);
    assert.equal(jpeg.ok, true);
    assert.equal(jpeg.extension, '.jpeg');
  } finally {
    await close(server);
    resetAllowlist();
  }
});

test('falls back to the URL extension only when no content-type is sent', async () => {
  allowLoopback();
  const server = makeServer();
  const port = await listen(server);
  try {
    const ok = await fetchRemoteImage(`http://127.0.0.1:${port}/untyped.jpg`);
    assert.equal(ok.ok, true);
    assert.equal(ok.extension, '.jpg');

    const refused = await fetchRemoteImage(`http://127.0.0.1:${port}/untyped.bin`);
    assert.equal(refused.ok, false);
    assert.equal(refused.reason, 'not-an-image');
  } finally {
    await close(server);
    resetAllowlist();
  }
});

test('refuses a non-image response', async () => {
  allowLoopback();
  const server = makeServer();
  const port = await listen(server);
  try {
    const html = await fetchRemoteImage(`http://127.0.0.1:${port}/page.html`);
    assert.equal(html.ok, false);
    assert.equal(html.reason, 'not-an-image');

    // SVG is an image type the hub does not accept: it is scriptable.
    const svg = await fetchRemoteImage(`http://127.0.0.1:${port}/vector.svg`);
    assert.equal(svg.ok, false);
    assert.equal(svg.reason, 'not-an-image');
  } finally {
    await close(server);
    resetAllowlist();
  }
});

test('refuses a redirect rather than following it', async () => {
  allowLoopback();
  const server = makeServer();
  const port = await listen(server);
  try {
    const result = await fetchRemoteImage(`http://127.0.0.1:${port}/redirect.png`);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'redirect');
  } finally {
    await close(server);
    resetAllowlist();
  }
});

test('refuses an HTTP error and an empty body', async () => {
  allowLoopback();
  const server = makeServer();
  const port = await listen(server);
  try {
    const missing = await fetchRemoteImage(`http://127.0.0.1:${port}/missing.png`);
    assert.equal(missing.ok, false);
    assert.equal(missing.reason, 'http-error');

    const empty = await fetchRemoteImage(`http://127.0.0.1:${port}/empty.png`);
    assert.equal(empty.ok, false);
    assert.equal(empty.reason, 'empty');
  } finally {
    await close(server);
    resetAllowlist();
  }
});

test('the streaming cap stops a body with no declared length', async () => {
  allowLoopback();
  const server = makeServer();
  const port = await listen(server);
  try {
    const result = await fetchRemoteImage(`http://127.0.0.1:${port}/huge.png`);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'too-large');
  } finally {
    await close(server);
    resetAllowlist();
  }
});

test('a lying content-length is refused before the body is read', async () => {
  allowLoopback();
  // Raw sockets, because a declared length that the body never reaches is
  // exactly what the header pre-check exists for and what `http` refuses to
  // send. Only 1 KiB is ever written; the header claims 99 MB.
  const server = net.createServer((socket) => {
    socket.on('error', () => {});
    socket.once('data', () => {
      socket.write(
        'HTTP/1.1 200 OK\r\n' +
          'Content-Type: image/png\r\n' +
          'Content-Length: 99999999\r\n' +
          'Connection: close\r\n\r\n'
      );
      socket.write(Buffer.alloc(1024));
    });
  });
  const port = await listen(server);
  try {
    const result = await fetchRemoteImage(`http://127.0.0.1:${port}/big.png`);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'too-large');
  } finally {
    await close(server);
    resetAllowlist();
  }
});

test('reports an unreachable host', async () => {
  allowLoopback();
  // Bind then release, so the port is certain to be closed and nothing else
  // has had a chance to claim it.
  const server = makeServer();
  const port = await listen(server);
  await close(server);
  try {
    const result = await fetchRemoteImage(`http://127.0.0.1:${port}/ok.png`);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'unreachable');
  } finally {
    resetAllowlist();
  }
});

test('refuses a malformed URL before any network call', async () => {
  resetAllowlist();
  for (const bad of [
    'not a url',
    '',
    '   ',
    'example.com/x.png',
    'ftp://cdn.example.com/x.png',
    'file:///etc/passwd',
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
    // A hub-local ref passes `isSafeImageUrl` but is read from disk, never
    // fetched; the module must not treat it as something to request.
    '/api/uploads/0123456789abcdef0123456789abcdef.png',
  ]) {
    const result = await fetchRemoteImage(bad);
    assert.equal(result.ok, false, `expected refusal for ${JSON.stringify(bad)}`);
    assert.equal(
      result.reason,
      'malformed-url',
      `wrong reason for ${JSON.stringify(bad)}`
    );
  }
});

test('refuses a blocked address without saying why', async () => {
  resetAllowlist();
  for (const blocked of [
    'http://127.0.0.1/x.png',
    'http://127.0.0.1:8080/x.png',
    'https://localhost/x.png',
    'http://169.254.169.254/latest/meta-data/x.png',
    'http://10.0.0.5/x.png',
    'http://192.168.1.10/x.png',
    'http://172.16.0.9/x.png',
    'http://[::1]/x.png',
    'http://metadata.google.internal/x.png',
    'http://0.0.0.0/x.png',
  ]) {
    const result = await fetchRemoteImage(blocked);
    assert.equal(result.ok, false, `expected refusal for ${blocked}`);
    assert.equal(result.reason, 'blocked-url', `wrong reason for ${blocked}`);
    // The refusal carries no detail, so a caller cannot leak *why* the host is
    // out of bounds and turn this into a network probe.
    assert.equal(result.detail, undefined);
  }
});

test('an allowlist narrows the fetch to the listed hosts', async () => {
  process.env.IMAGE_URL_ALLOWLIST = 'cdn.example.com';
  try {
    const result = await fetchRemoteImage('https://other.example.com/x.png');
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'blocked-url');
  } finally {
    resetAllowlist();
  }
});
