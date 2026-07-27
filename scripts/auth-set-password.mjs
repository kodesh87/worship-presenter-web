/**
 * Set an account's password directly in the database.
 *
 * The recovery path when nobody can sign in. Bootstrap
 * (`AUTH_BOOTSTRAP_USER` / `AUTH_BOOTSTRAP_PASSWORD`) only runs while the
 * `accounts` table is empty, so editing `.env` cannot rescue an account that
 * already exists — this can.
 *
 * The new password is read from the terminal with the echo suppressed, never
 * from an argument, so it does not land in shell history or the process list.
 *
 * Changing a password revokes every session for that account, exactly as the
 * in-app change does: `accounts.token_version` is bumped and the request gate
 * (`src/proxy.ts` via `src/lib/auth/require.ts`) rejects any cookie carrying
 * the old value. Both writes share one transaction.
 *
 * Usage (needs the same DB_PATH the app uses):
 *   node scripts/auth-set-password.mjs <username>
 *   npm run auth:set-password -- <username>
 */
import Database from 'better-sqlite3';
import { randomBytes, scryptSync } from 'crypto';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

/** Must match KEYLEN in src/lib/auth/password.ts. */
const KEYLEN = 64;
/** Must match assertPassword() in src/lib/auth/accounts.ts. */
const MIN_PASSWORD_LEN = 8;
const MAX_PASSWORD_LEN = 128;

/** Store format: `<saltHex>$<hashHex>` — must match src/lib/auth/password.ts. */
function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN);
  return `${salt.toString('hex')}$${hash.toString('hex')}`;
}

/** Must match normalizeUsername() in src/lib/auth/accounts.ts. */
function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function resolveDbPath() {
  const fromEnv = process.env.DB_PATH?.trim();
  return fromEnv ? path.resolve(fromEnv) : path.join(root, 'data.db');
}

/** Read a line from the terminal without echoing it back. */
function askHidden(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    process.stdout.write(prompt);
    // Suppress echo only after the prompt itself has been written.
    rl._writeToOutput = () => {};
    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

/** Read piped stdin to the end, for `echo <pw> | node scripts/...`. */
function readPipedStdin() {
  return new Promise((resolve) => {
    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      buf += chunk;
    });
    process.stdin.on('end', () => resolve(buf));
    process.stdin.on('error', () => resolve(buf));
  });
}

/**
 * Obtain the new password.
 *
 * A terminal is the only source that keeps the value out of shell history and
 * the process list, so it is preferred and is the only mode that asks twice.
 * The other two exist because this script is a recovery path: refusing to run
 * without a TTY is exactly the wrong behaviour when someone is locked out and
 * running it from a task runner, a CI shell, or a chat "run" button.
 */
async function resolveNewPassword() {
  const fromEnv = process.env.AUTH_NEW_PASSWORD;
  if (fromEnv) {
    console.warn(
      'Reading AUTH_NEW_PASSWORD from the environment. Clear it afterwards — it is visible to other processes.'
    );
    return { password: fromEnv, confirmed: true };
  }

  if (process.stdin.isTTY) {
    const password = await askHidden('New password: ');
    const confirm = await askHidden('Confirm password: ');
    return { password, confirmed: password === confirm };
  }

  const piped = (await readPipedStdin()).split(/\r?\n/)[0] ?? '';
  if (piped) {
    console.warn(
      'Read the password from piped input. It may be recorded in your shell history.'
    );
    return { password: piped, confirmed: true };
  }

  throw new Error(
    [
      'No password source. This shell has no terminal, so nothing could be prompted.',
      'Run it from an interactive terminal for a hidden prompt:',
      '  npm run auth:set-password -- ' + (process.argv[2] ?? '<username>'),
      'Or supply the password non-interactively:',
      '  AUTH_NEW_PASSWORD=<password> npm run auth:set-password -- ' +
        (process.argv[2] ?? '<username>'),
    ].join('\n')
  );
}

async function main() {
  const [rawUsername, ...rest] = process.argv.slice(2);
  if (!rawUsername || rest.length > 0 || rawUsername.startsWith('-')) {
    console.error('Usage: node scripts/auth-set-password.mjs <username>');
    process.exitCode = 1;
    return;
  }

  const dbPath = resolveDbPath();
  if (!fs.existsSync(dbPath)) {
    console.error(`Database not found: ${dbPath}`);
    console.error('Set DB_PATH if the app uses a different file.');
    process.exitCode = 1;
    return;
  }

  const username = normalizeUsername(rawUsername);
  const db = new Database(dbPath);
  db.pragma('busy_timeout = 5000');

  try {
    const account = db
      .prepare('SELECT id, username, role FROM accounts WHERE username = ?')
      .get(username);

    if (!account) {
      const known = db
        .prepare('SELECT username FROM accounts ORDER BY id')
        .all()
        .map((r) => r.username);
      console.error(`No account named "${username}".`);
      console.error(
        known.length
          ? `Existing accounts: ${known.join(', ')}`
          : 'The accounts table is empty — set AUTH_BOOTSTRAP_USER / AUTH_BOOTSTRAP_PASSWORD and restart the app instead.'
      );
      process.exitCode = 1;
      return;
    }

    console.log(`Account: ${account.username} (${account.role})`);
    const { password, confirmed } = await resolveNewPassword();
    if (!confirmed) {
      console.error('Passwords do not match. Nothing was changed.');
      process.exitCode = 1;
      return;
    }
    if (password.length < MIN_PASSWORD_LEN) {
      console.error(`Password must be at least ${MIN_PASSWORD_LEN} characters.`);
      process.exitCode = 1;
      return;
    }
    if (password.length > MAX_PASSWORD_LEN) {
      console.error(`Password must be at most ${MAX_PASSWORD_LEN} characters.`);
      process.exitCode = 1;
      return;
    }

    const passwordHash = hashPassword(password);
    const tokenVersion = db.transaction(() => {
      db.prepare('UPDATE accounts SET password_hash = ? WHERE id = ?').run(
        passwordHash,
        account.id
      );
      db.prepare(
        'UPDATE accounts SET token_version = token_version + 1 WHERE id = ?'
      ).run(account.id);
      return db
        .prepare('SELECT token_version FROM accounts WHERE id = ?')
        .get(account.id).token_version;
    })();

    // A forgotten password usually means failed sign-in attempts are on record.
    const cleared = db
      .prepare(
        `DELETE FROM login_attempts
          WHERE (scope = 'user-ip' AND substr(key, 1, instr(key, char(31)) - 1) = ?)
             OR (scope = 'username' AND key = ?)`
      )
      .run(username, username).changes;

    console.log(`Password updated. token_version is now ${tokenVersion}.`);
    console.log('Every existing session for this account has been revoked.');
    if (cleared > 0) {
      console.log(`Cleared ${cleared} throttle record(s) for this account.`);
    }
  } finally {
    db.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
