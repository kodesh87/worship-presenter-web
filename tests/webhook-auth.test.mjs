/**
 * Webhook secret gate: 401 wrong/missing, 503 unset env.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const { assertWebhookSecretValue, readWebhookSecretFromHeaders } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'webhook-auth.ts')).href
);

test('WEBHOOK_SECRET missing → 503', () => {
  const r = assertWebhookSecretValue(undefined, 'anything');
  assert.equal(r?.status, 503);
});

test('wrong secret → 401', () => {
  const r = assertWebhookSecretValue('correct', 'wrong');
  assert.equal(r?.status, 401);
});

test('missing provided secret → 401', () => {
  const r = assertWebhookSecretValue('correct', null);
  assert.equal(r?.status, 401);
});

test('matching secret → allow', () => {
  assert.equal(assertWebhookSecretValue('correct', 'correct'), null);
});

test('reads x-webhook-secret and Bearer', () => {
  assert.equal(
    readWebhookSecretFromHeaders({
      get: (n) => (n === 'x-webhook-secret' ? 'abc' : null),
    }),
    'abc'
  );
  assert.equal(
    readWebhookSecretFromHeaders({
      get: (n) => (n === 'authorization' ? 'Bearer xyz' : null),
    }),
    'xyz'
  );
});
