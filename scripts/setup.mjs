/**
 * First-run setup.
 *
 * `npm install && npm run setup && npm run dev` should be the whole story. This
 * script does the parts a newcomer would otherwise have to infer: generate the
 * secrets, create the database, seed the slide registry, and say what is still
 * missing.
 *
 * It is safe to re-run. Nothing here overwrites an existing `.env` or an
 * existing database.
 */
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function say(message) {
  console.log(message);
}

function secret() {
  return randomBytes(32).toString('hex');
}

/** Write `.env` from the example, filling in the values nobody can guess. */
function ensureEnv() {
  const envPath = path.join(root, '.env');
  if (fs.existsSync(envPath)) {
    say('  .env already exists — left untouched');
    return false;
  }

  const examplePath = path.join(root, '.env.example');
  if (!fs.existsSync(examplePath)) {
    throw new Error('Missing .env.example — cannot generate .env');
  }

  const password = randomBytes(9).toString('base64url');
  const filled = fs
    .readFileSync(examplePath, 'utf8')
    .replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET=${secret()}`)
    .replace(/^WEBHOOK_SECRET=.*$/m, `WEBHOOK_SECRET=${secret()}`)
    .replace(/^AUTH_BOOTSTRAP_USER=.*$/m, 'AUTH_BOOTSTRAP_USER=admin')
    .replace(/^AUTH_BOOTSTRAP_PASSWORD=.*$/m, `AUTH_BOOTSTRAP_PASSWORD=${password}`);

  fs.writeFileSync(envPath, filled, 'utf8');
  say('  .env created with freshly generated secrets');
  say('');
  say('  ┌─────────────────────────────────────────────');
  say('  │  Sign in with');
  say('  │    username  admin');
  say(`  │    password  ${password}`);
  say('  │');
  say('  │  Change it from the profile menu after the first sign-in.');
  say('  │  It is also stored in .env, which is git-ignored.');
  say('  └─────────────────────────────────────────────');
  say('');
  return true;
}

/** Report on the hymn corpus rather than failing: the app explains it too. */
function checkHymnCorpus() {
  const corpus = path.join(root, 'data', 'hymns.json');
  if (!fs.existsSync(corpus)) {
    say('  data/hymns.json is missing — run `npm run import:hymnal` before starting');
    return false;
  }
  try {
    const hymns = JSON.parse(fs.readFileSync(corpus, 'utf8'));
    say(`  hymn corpus present (${hymns.length} hymns)`);
  } catch {
    say('  data/hymns.json is present but unreadable — check the file');
    return false;
  }
  return true;
}

/** Touching the database runs the startup DDL, the seed and the admin bootstrap. */
function initialiseDatabase() {
  const script =
    "const { getDb } = await import('./src/lib/db/index.ts'); " +
    'const db = getDb(); ' +
    "const n = db.prepare('SELECT COUNT(*) c FROM artifact_templates').get().c; " +
    "console.log('  slide registry seeded (' + n + ' templates)');";

  execFileSync(
    process.execPath,
    [
      '--import',
      './tests/register-ts-resolve.mjs',
      '--experimental-strip-types',
      '--input-type=module',
      '-e',
      script,
    ],
    { cwd: root, stdio: 'inherit' }
  );
}

function reportPrivateOverride() {
  const local = path.join(root, 'data', 'local', 'default-registry.json');
  if (fs.existsSync(local)) {
    say('  private registry override found at data/local/ — it will be used instead of the shipped seed');
  } else {
    say('  no private override — using the shipped example registry');
    say('    (see docs/PRIVATE-DATA.md to point this at your own congregation)');
  }
}

say('');
say('Setting up worship-presenter-web');
say('');
ensureEnv();
checkHymnCorpus();
reportPrivateOverride();
initialiseDatabase();
say('');
say('Done. Start it with:  npm run dev');
say('');
