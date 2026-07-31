/**
 * Structural guard for the checksums in package-lock.json.
 *
 * On 2026-07-29 the PII remediation replaced real names with invented ones across
 * the whole tracked tree with a plain text substitution. One real name happened to
 * occur as a four-character substring inside the base64 sha512 of
 * set-function-name@2.0.2, and the five-character replacement went in with it. The
 * digest became 89 base64 characters where a sha512 is always 88, and `npm ci`
 * failed with EINTEGRITY on every machine for two days.
 *
 * It took two days because npm is the only thing in this repository that verifies a
 * checksum, and npm only speaks up when someone installs. Nothing in `npm test`
 * looked at a derived value at all. This is that missing layer.
 *
 * The check is deliberately offline and deterministic: an SRI digest has exactly one
 * legal size per algorithm, so a substitution that changes length is arithmetic, not
 * opinion. That is enough to have caught the 2026-07-29 damage on the day it landed.
 *
 * What it does NOT catch, stated plainly so nobody mistakes green for proof: a
 * substitution of EQUAL length decodes to the right byte count and passes every
 * assertion here. Only the registry or the tarball can settle that, and both need a
 * network this suite does not assume. When the question is "did something rewrite a
 * digest", the offline answer is a filter, not a verdict — the verdict is
 * `npm ci` against a clean cache, or a direct comparison with `dist.integrity`.
 *
 * Verified once, out of band, on 2026-07-31: all 819 registry-resolved entries were
 * compared to the registry's own `dist.integrity` and matched exactly.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lockPath = path.join(root, 'package-lock.json');

/**
 * Subresource Integrity digest sizes: base64 characters including padding, and the
 * raw bytes they must decode to. Both are fixed by the hash algorithm.
 */
const DIGEST_SIZES = new Map([
  ['sha512', { chars: 88, bytes: 64 }],
  ['sha384', { chars: 64, bytes: 48 }],
  ['sha256', { chars: 44, bytes: 32 }],
  ['sha1', { chars: 28, bytes: 20 }],
]);

const STRICT_BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

function readLock() {
  return JSON.parse(fs.readFileSync(lockPath, 'utf8'));
}

/** Every `integrity` string in the file, tagged with the lock path that carries it. */
function integrityEntries(lock) {
  return Object.entries(lock.packages ?? {})
    .filter(([, pkg]) => typeof pkg?.integrity === 'string')
    .map(([nodePath, pkg]) => ({ nodePath: nodePath || '(root)', integrity: pkg.integrity }));
}

test('package-lock.json has integrity values to check', () => {
  const entries = integrityEntries(readLock());
  // A guard that silently checks nothing is worse than no guard: it reports green.
  assert.ok(
    entries.length > 100,
    `expected the lockfile to carry many integrity values, found ${entries.length} — has the file moved or changed shape?`
  );
});

test('every package-lock integrity digest is structurally valid', () => {
  const entries = integrityEntries(readLock());
  const offenders = [];

  for (const { nodePath, integrity } of entries) {
    // SRI permits several space-separated digests for one resource.
    for (const digest of integrity.trim().split(/\s+/)) {
      const separator = digest.indexOf('-');
      if (separator === -1) {
        offenders.push(`${nodePath}: "${digest}" is not <algorithm>-<base64>`);
        continue;
      }
      const algorithm = digest.slice(0, separator);
      const encoded = digest.slice(separator + 1);

      const size = DIGEST_SIZES.get(algorithm);
      if (!size) {
        offenders.push(`${nodePath}: unknown digest algorithm "${algorithm}"`);
        continue;
      }
      if (!STRICT_BASE64.test(encoded)) {
        offenders.push(`${nodePath}: ${algorithm} payload has characters outside base64`);
        continue;
      }
      if (encoded.length !== size.chars) {
        offenders.push(
          `${nodePath}: ${algorithm} payload is ${encoded.length} base64 characters, must be ${size.chars}`
        );
        continue;
      }

      const decoded = Buffer.from(encoded, 'base64');
      if (decoded.length !== size.bytes) {
        offenders.push(
          `${nodePath}: ${algorithm} payload decodes to ${decoded.length} bytes, must be ${size.bytes}`
        );
        continue;
      }
      // Re-encoding normalises the trailing bits. A payload that does not survive the
      // round trip carries bits no encoder would have emitted, so something edited it.
      if (decoded.toString('base64') !== encoded) {
        offenders.push(`${nodePath}: ${algorithm} payload is not canonical base64`);
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `a checksum in package-lock.json cannot be a real digest, so something rewrote it:\n  ${offenders.join('\n  ')}`
  );
});
