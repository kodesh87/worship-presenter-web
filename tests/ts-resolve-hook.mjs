import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

function tryFile(base) {
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  for (const ext of ['.ts', '.tsx', '.mts', '.js', '.mjs']) {
    const p = base + ext;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  const idx = path.join(base, 'index.ts');
  if (fs.existsSync(idx)) return idx;
  const idxJs = path.join(base, 'index.js');
  if (fs.existsSync(idxJs)) return idxJs;
  return null;
}

/** Mirrors the `@/*` -> `src/*` mapping in tsconfig.json paths. */
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function resolve(specifier, context, nextResolve) {
  const isAlias = specifier.startsWith('@/');

  if (
    !isAlias &&
    (specifier.startsWith('node:') ||
      specifier.startsWith('data:') ||
      (!specifier.startsWith('.') && !specifier.startsWith('file:')))
  ) {
    return nextResolve(specifier, context);
  }

  const parent = context.parentURL
    ? fileURLToPath(context.parentURL)
    : process.cwd();
  const parentDir = fs.existsSync(parent) && fs.statSync(parent).isDirectory()
    ? parent
    : path.dirname(parent);

  let abs;
  if (isAlias) {
    abs = path.resolve(projectRoot, 'src', specifier.slice(2));
  } else if (specifier.startsWith('file:')) {
    abs = fileURLToPath(specifier);
  } else {
    abs = path.resolve(parentDir, specifier);
  }

  const resolved = tryFile(abs);
  if (resolved) {
    return nextResolve(pathToFileURL(resolved).href, context);
  }
  return nextResolve(specifier, context);
}
