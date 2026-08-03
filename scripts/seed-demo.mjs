/** Opt-in synthetic service seed for evaluating a fresh installation. */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = `
  const { getDb } = await import('./src/lib/db/index.ts');
  const { seedDemoService } = await import('./src/lib/demo-seed.ts');
  try {
    const result = seedDemoService(getDb());
    if (!result.ok) {
      console.error('Demo seed refused: demo seeding is only for an empty installation.');
      process.exitCode = 1;
    } else {
      console.log('Demo service created: #' + result.id + ' for ' + result.date);
      console.log('Open it at: /services/' + result.id);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Demo seed failed: ' + message);
    process.exitCode = 1;
  }
`;

try {
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
} catch (error) {
  process.exitCode =
    typeof error === 'object' && error && 'status' in error && error.status
      ? Number(error.status)
      : 1;
}
