/**
 * Clear the login throttle ledger (`login_attempts`).
 *
 * The limiter in `src/lib/auth/rate-limit.ts` refuses a (username, address)
 * pair after 5 failures and an address after 20, both inside a 15-minute
 * window. Everything expires on its own, but "wait fifteen minutes" is not an
 * answer at 08:55 on a Sabbath morning, and before this script the only way to
 * undo a lock was to open the SQLite file by hand. This is that unlock path.
 *
 * Usage (needs the same DB_PATH the app uses):
 *   npm run auth:unlock -- --list
 *   npm run auth:unlock -- --username kodesh
 *   npm run auth:unlock -- --ip 203.0.113.7
 *   npm run auth:unlock -- --username kodesh --ip 203.0.113.7
 *   npm run auth:unlock -- --all
 *
 * `--username` clears that account at every address (plus any legacy
 * per-username rows). `--ip` clears that address and every pair recorded for
 * it. Both together clear only that one pair. `--all` empties the table.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

/** Must match PAIR_SEPARATOR in src/lib/auth/rate-limit.ts. */
const PAIR_SEPARATOR = String.fromCharCode(0x1f);
/** Must match RATE_LIMIT_WINDOW_SECONDS in src/lib/auth/rate-limit.ts. */
const WINDOW_SECONDS = 15 * 60;

/** SQL for the username half / address half of a `user-ip` key. */
const KEY_USER = `substr(key, 1, instr(key, char(31)) - 1)`;
const KEY_IP = `substr(key, instr(key, char(31)) + 1)`;

const USAGE = `Usage:
  node scripts/auth-unlock.mjs --list
  node scripts/auth-unlock.mjs --username <name>
  node scripts/auth-unlock.mjs --ip <address>
  node scripts/auth-unlock.mjs --username <name> --ip <address>
  node scripts/auth-unlock.mjs --all

Reads DB_PATH (default: <repo>/data.db).`;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const opts = { username: null, ip: null, all: false, list: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--username':
      case '-u':
        opts.username = argv[++i] ?? '';
        break;
      case '--ip':
        opts.ip = argv[++i] ?? '';
        break;
      case '--all':
        opts.all = true;
        break;
      case '--list':
      case '-l':
        opts.list = true;
        break;
      case '--help':
      case '-h':
        console.log(USAGE);
        process.exit(0);
        break;
      default:
        fail(`Unknown argument: ${arg}\n\n${USAGE}`);
    }
  }
  return opts;
}

/** Mirrors usernameKey() in src/lib/auth/rate-limit.ts. */
function normalizeUsername(value) {
  return value.trim().toLowerCase().split(PAIR_SEPARATOR).join('').slice(0, 128);
}

function openDb() {
  const dbPath = process.env.DB_PATH || path.join(root, 'data.db');
  if (!fs.existsSync(dbPath)) {
    fail(`No database at ${dbPath}. Set DB_PATH to the file the app uses.`);
  }
  const db = new Database(dbPath);
  db.pragma('busy_timeout = 5000');
  const table = db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .get('login_attempts');
  if (!table) {
    console.log(`No login_attempts table in ${dbPath} — nothing to clear.`);
    process.exit(0);
  }
  console.log(`DB: ${dbPath}`);
  return db;
}

function list(db) {
  const cutoff = Math.floor(Date.now() / 1000) - WINDOW_SECONDS;
  const rows = db
    .prepare(
      `SELECT scope,
              CASE WHEN scope = 'user-ip'
                   THEN ${KEY_USER} || ' @ ' || ${KEY_IP}
                   ELSE key END AS label,
              COUNT(*) AS n,
              MAX(attempted_at) AS newest
         FROM login_attempts
        WHERE attempted_at >= ?
        GROUP BY scope, key
        ORDER BY n DESC, newest DESC
        LIMIT 50`
    )
    .all(cutoff);

  if (rows.length === 0) {
    console.log('No failures inside the current window.');
    return;
  }
  console.log(`Live buckets (last ${WINDOW_SECONDS}s), worst first:`);
  for (const row of rows) {
    console.log(`  ${String(row.n).padStart(4)}  ${row.scope}  ${row.label}`);
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const selectors = [opts.all, opts.username !== null, opts.ip !== null].filter(
    Boolean
  ).length;

  if (!opts.list && selectors === 0) fail(USAGE);
  if (opts.all && (opts.username !== null || opts.ip !== null)) {
    fail(`--all cannot be combined with --username / --ip\n\n${USAGE}`);
  }

  const db = openDb();

  if (opts.list) {
    list(db);
    if (selectors === 0) return;
  }

  let deleted = 0;
  let what = '';

  if (opts.all) {
    deleted = db.prepare(`DELETE FROM login_attempts`).run().changes;
    what = 'every bucket';
  } else if (opts.username !== null && opts.ip !== null) {
    const username = normalizeUsername(opts.username);
    if (!username) fail('--username cannot be empty');
    if (!opts.ip.trim()) fail('--ip cannot be empty');
    deleted = db
      .prepare(`DELETE FROM login_attempts WHERE scope = 'user-ip' AND key = ?`)
      .run(`${username}${PAIR_SEPARATOR}${opts.ip.trim()}`).changes;
    what = `${username} @ ${opts.ip.trim()}`;
  } else if (opts.username !== null) {
    const username = normalizeUsername(opts.username);
    if (!username) fail('--username cannot be empty');
    const tx = db.transaction((name) => {
      let n = db
        .prepare(
          `DELETE FROM login_attempts WHERE scope = 'user-ip' AND ${KEY_USER} = ?`
        )
        .run(name).changes;
      // Rows written by the pre-pair-scoping build, if this DB predates it.
      n += db
        .prepare(
          `DELETE FROM login_attempts WHERE scope = 'username' AND key = ?`
        )
        .run(name).changes;
      return n;
    });
    deleted = tx(username);
    what = `${username} at every address`;
  } else {
    const ip = (opts.ip ?? '').trim();
    if (!ip) fail('--ip cannot be empty');
    const tx = db.transaction((address) => {
      let n = db
        .prepare(`DELETE FROM login_attempts WHERE scope = 'ip' AND key = ?`)
        .run(address).changes;
      n += db
        .prepare(
          `DELETE FROM login_attempts WHERE scope = 'user-ip' AND ${KEY_IP} = ?`
        )
        .run(address).changes;
      return n;
    });
    deleted = tx(ip);
    what = `address ${ip}`;
  }

  console.log(`Cleared ${deleted} attempt row(s) for ${what}.`);
}

main();
