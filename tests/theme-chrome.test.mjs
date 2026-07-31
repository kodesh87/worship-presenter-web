/**
 * The operator may choose a theme; the congregation may never see the choice.
 *
 * Story 17.1 makes the shipped `.dark` palette selectable. Its load-bearing
 * constraint is not the switch — it is that nothing an operator picks can reach
 * the projected output. That is true today by construction: the projected tree
 * paints in literal colours (`bg-black`, `bg-[#0B1220]`) or in inline styles
 * resolved out of the Artifact Registry, and never in a theme token. Nothing
 * enforced it, so a single `bg-card` added to `SlideView` during unrelated work
 * would restyle the deck the congregation sees, with a theme toggle as the
 * trigger and no test to catch it.
 *
 * **Scope, after code review round 2.** AC-4 is guaranteed on two axes and this
 * file is the net for both: *what* — the projected tree paints in literals or
 * registry-resolved inline styles; and *where* — the projected output, not the
 * operator's own preview of it (`SlidePreviewList` is hub chrome and follows the
 * theme deliberately). The *shell behind* a projected route — `layout.tsx`, a
 * `not-found.tsx`, a server-rendered first paint — is **Story 17.7's** contract,
 * not this file's. `FULL_SCREEN` below covers the two client surfaces that can
 * call a hook; it cannot cover a Server Component, and nothing here pretends to.
 *
 * The projected surface is two routes, and each is a route shell plus a client
 * tree. Both halves are guarded, because the shell is reached at the same URL
 * whenever `buildSlidePlan` throws:
 *
 *   slideshow/page.tsx           -> SlideshowClient -> SlideView -> ArtifactSlide
 *   present/projector/page.tsx   -> ProjectorClient -> SlideView -> ArtifactSlide
 *
 * The closure test walks *out of* those files transitively and requires every
 * module it reaches to be guarded or token-free — no directory is exempt by
 * name. It does not walk *upward*; that is the half Story 17.7 owns.
 *
 * **Every scan strips comments first**, with a scanner rather than a regex.
 * Four assertions here were satisfiable by a word in a comment before
 * 2026-07-31 — one of them by the very comment that explained the code it was
 * meant to guard. Prose about a token is not a token, and a test that a doc
 * comment can keep green is not a test.
 *
 * **Not everything here is a regex.** The shell claim and the theme cycle are
 * exercised as behaviour, against a document stub and by calling the function.
 * The restore path in particular is where a bug leaves the operator's whole app
 * shell pinned at literal black after they leave a projected route, and no
 * amount of source matching reaches it.
 *
 * The token list is parsed out of `globals.css` rather than hardcoded, so a
 * token added to the palette is covered here without anyone remembering to
 * come back. AC-4 of the story is the requirement; this is its regression net.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readRaw = (rel) => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const srcUrl = (...parts) => pathToFileURL(path.join(repoRoot, ...parts)).href;

// --- source hygiene ---------------------------------------------------------

/**
 * Comments removed, strings kept, so no assertion below can be satisfied by
 * prose and none can be broken by prose either.
 *
 * This is a scanner and not a pair of regexes, because both regexes were wrong
 * in opposite directions. `/\/\*[\s\S]*?\*\//g` deletes real code whenever a
 * `*&#47;` appears inside a string literal, and dropping only lines that *begin*
 * with `//` re-admitted the exact false positive the mechanism exists to remove:
 * a trailing `// use bg-card here instead` counted as a token reference. Walking
 * the source solves both at once — a `//` inside `xmlns="http://…"` is inside a
 * string, so it is passed through untouched, which is what the line-start rule
 * was a workaround for.
 *
 * Known limit: a `/*` or `//` inside a *regex literal* still reads as a comment
 * opener. No scanned file contains one, and closing it would mean deciding
 * whether `/` is division or a delimiter, which needs a real parser.
 */
function stripComments(source) {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];
    if (c === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end === -1 ? source.length : end + 2;
      continue;
    }
    if (c === '/' && next === '/') {
      const end = source.indexOf('\n', i);
      i = end === -1 ? source.length : end;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const start = i;
      i += 1;
      while (i < source.length) {
        if (source[i] === '\\') {
          i += 2;
          continue;
        }
        if (source[i] === c) {
          i += 1;
          break;
        }
        i += 1;
      }
      out += source.slice(start, i);
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

const read = (rel) => stripComments(readRaw(rel));

/**
 * The `{ … }` block opening at or after `from`, brace-balanced and string-aware.
 *
 * Two guards used to be anchored to source layout instead: the badge table was
 * sliced between `indexOf('const TONE_CLASS')` and `indexOf('const
 * BADGE_CLASS')`, so hoisting one above the other yielded an empty slice and
 * three opaque failures; the mount guard matched a literal two-space closing
 * brace, so re-indenting the file broke the test rather than the code.
 */
function balancedBlock(source, from) {
  const open = source.indexOf('{', from);
  assert.ok(open !== -1, 'expected a block to open');
  let depth = 0;
  let i = open;
  while (i < source.length) {
    const c = source[i];
    if (c === '"' || c === "'" || c === '`') {
      i += 1;
      while (i < source.length) {
        if (source[i] === '\\') {
          i += 2;
          continue;
        }
        if (source[i] === c) break;
        i += 1;
      }
      i += 1;
      continue;
    }
    if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
    i += 1;
  }
  assert.fail('unbalanced block');
}

/** Every `.tsx` under `src/`, for the checks that must not trust a file list. */
function allTsxFiles(dir = 'src') {
  const out = [];
  for (const entry of fs.readdirSync(path.join(repoRoot, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...allTsxFiles(rel));
    else if (entry.name.endsWith('.tsx')) out.push(rel);
  }
  return out;
}

// --- the palette, read from its source of truth, parsed once ----------------

const GLOBALS_CSS = 'src/app/globals.css';

/**
 * Every `--color-*` name exposed by the `@theme inline` block, longest first so
 * `card-foreground` is reported rather than `card`.
 *
 * Parsed at module scope. `themeReferences()` used to call this on every
 * invocation, so one run read the same immutable file about nine times and
 * rebuilt three regexes and a 30-token alternation each time.
 */
const THEME_TOKENS = (() => {
  const names = [
    ...readRaw(GLOBALS_CSS).matchAll(/^\s*--color-([a-z0-9-]+)\s*:/gm),
  ].map((m) => m[1]);
  assert.ok(
    names.length > 20,
    `expected the @theme inline block to expose the palette; found ${names.length} --color-* names`
  );
  return names.sort((a, b) => b.length - a.length);
})();

const TOKEN_ALTERNATION = THEME_TOKENS.join('|');

/**
 * Utility prefixes that can carry a colour token. The directional and offset
 * forms are listed explicitly: `border-t-border`, `border-x-border` and
 * `ring-offset-background` are all themed colours, and a pattern of
 * `border-(?:token)` alone lets every one of them through. `inset-shadow` and
 * `text-shadow` are Tailwind 4 colour utilities in their own right and were
 * caught only incidentally, by the bare `shadow`. Longest first so the
 * alternation cannot settle for `border` when `border-t` is what is there.
 */
const UTILITY_PREFIXES = [
  'border-t', 'border-r', 'border-b', 'border-l', 'border-x', 'border-y',
  'border-s', 'border-e', 'ring-offset', 'inset-ring', 'inset-shadow',
  'text-shadow', 'divide-x', 'divide-y',
  'bg', 'text', 'border', 'ring', 'outline', 'divide', 'fill', 'stroke',
  'from', 'via', 'to', 'placeholder', 'caret', 'accent', 'decoration', 'shadow',
].sort((a, b) => b.length - a.length);

const PREFIX_ALTERNATION = UTILITY_PREFIXES.join('|');

/** `bg-card`, `text-muted-foreground`. */
const TOKEN_UTILITY = new RegExp(
  `(?<![-\\w])(?:${PREFIX_ALTERNATION})-(?:${TOKEN_ALTERNATION})\\b`,
  'g'
);

/**
 * Tailwind 4's colour-variable shorthand: `bg-(--card)`, `bg-(--card)/50`,
 * `text-(--foreground)`, `border-(--border)`, `shadow-(--ring)`.
 *
 * No colour token is spelled this way in `src/` today, so this is latent rather
 * than a live leak — but the `-(--var)` form is already idiomatic here for
 * non-colour variables (`ui/card.tsx` uses `--card-spacing`, `ui/popover.tsx`
 * `--transform-origin`), which makes it the plausible next spelling rather than
 * a hypothetical. Same class of hole this guard already had for `border-t-border`
 * and `ring-1`.
 */
const TOKEN_SHORTHAND = new RegExp(
  `(?<![-\\w])(?:${PREFIX_ALTERNATION})-\\(\\s*--(?:color-)?(?:${TOKEN_ALTERNATION})\\s*\\)`,
  'g'
);

/** A raw `var(--token)` in an inline style. */
const TOKEN_CSS_VAR = new RegExp(
  `var\\(\\s*--(?:color-)?(?:${TOKEN_ALTERNATION})\\s*[),]`,
  'g'
);

/**
 * The `dark:` variant, which resolves against whichever `.dark` ancestor
 * exists. The character class carries `-` because negative-value variants
 * (`dark:-mt-1`) are `dark:` rules too, and the doc above advertises `dark:` as
 * one of exactly three routes in.
 */
const DARK_VARIANT = /(?<![\w:])dark:[a-z[-]/g;

function themeReferences(source) {
  return [
    ...source.matchAll(TOKEN_UTILITY),
    ...source.matchAll(TOKEN_SHORTHAND),
    ...source.matchAll(TOKEN_CSS_VAR),
    ...source.matchAll(DARK_VARIANT),
  ].map((m) => m[0]);
}

// --- AC-4: the projected output cannot see the operator's theme -------------

const PROJECTED = [
  'src/components/SlideView.tsx',
  'src/components/artifacts/ArtifactSlide.tsx',
  'src/app/services/[id]/present/projector/ProjectorClient.tsx',
  'src/app/services/[id]/slideshow/SlideshowClient.tsx',
  // The route shells. Reached at the same projected URL whenever
  // `buildSlidePlan` throws, which a registry failure is enough to cause — so a
  // token-painted error card here lands on the room-facing screen and follows
  // the operator's theme while it is there.
  'src/app/services/[id]/present/projector/page.tsx',
  'src/app/services/[id]/slideshow/page.tsx',
];

/**
 * A second way the theme reaches the projected tree, found while verifying AC-4
 * in the browser rather than by reading the source.
 *
 * `globals.css` applies `border-border` through a universal selector
 * (`@layer base { * { @apply border-border outline-ring/50 } }`), so EVERY node
 * in the projected tree already computes a theme-dependent `border-color` —
 * `#e5e5e5` light against `oklch(1 0 0 / 10%)` dark. It paints nothing while
 * Tailwind's preflight leaves `border-width: 0`, which was confirmed node by
 * node on `/services/[id]/slideshow`: 14 of 14 elements at `0px` on all four
 * sides, **with nothing focused**. That last clause matters and was missing:
 * the same universal rule sets `outline-color` from `--ring`, and the UA
 * supplies the width on `:focus-visible`, so a focused link on a projected
 * surface paints a ring in the operator's theme. The three projected focusables
 * now state `focus-visible:outline-white`, asserted below.
 *
 * So the token guard above is necessary but not sufficient. The class that
 * would turn that inert colour into a painted, theme-varying edge is a *width*,
 * which contains no token name and sails straight past a token scan. A projected
 * element that genuinely wants an edge has to state its own colour, the way
 * `ProjectorClient` states `bg-[#0B1220]`, or draw it from registry-resolved
 * inline style.
 *
 * The width vocabulary is larger than it looks and the first version of this
 * guard missed most of it — including `ring-1`, the exact hazard its own comment
 * named. Directional widths, arbitrary values, odd ring and outline widths,
 * divider widths, the arbitrary-property form (`[border-width:2px]`) and the
 * inline-style form (`style={{ borderWidth: 1 }}`) are all painted edges. A
 * colour-only utility (`border-white/25`) is deliberately NOT matched: it paints
 * nothing without a width, and stating a literal colour is the sanctioned way
 * out of this guard.
 *
 * `body { @apply text-foreground }` is the same shape of hazard for TEXT. Both
 * full-screen surfaces now state `text-white` on their own root, so it is closed
 * structurally rather than resting on `ArtifactSlide.tsx`'s literal `#FFFFFF`
 * fallback for registry text — which still holds, and still matters for any node
 * the wrapper does not reach.
 */
const EDGE_WIDTH = String.raw`(?:\d+|\[[^\]\s"'\`]+\])`;
const EDGE_SIDE = String.raw`(?:[trblxy]|s|e)`;
const EDGE_END = String.raw`(?=["'\s\`}]|$)`;
const EDGE_PATTERNS = [
  // `border`, `border-2`, `border-t`, `border-t-2`, `border-[3px]`, `divide-y-4`
  String.raw`(?<![-\w])(?:border|divide)(?:-${EDGE_SIDE})?(?:-${EDGE_WIDTH})?${EDGE_END}`,
  // `ring`, `ring-1`, `outline-1`, `ring-offset-2`
  String.raw`(?<![-\w])(?:ring|outline|ring-offset|outline-offset)(?:-${EDGE_WIDTH})?${EDGE_END}`,
  // `[border-width:2px]`, `[border-top-width:1px]`, `[outline-width:3px]`
  String.raw`\[(?:border|outline|ring)(?:-[a-z]+)*-width\s*:[^\]]*\]`,
  // `style={{ borderWidth: 1 }}`, `borderTopWidth`, `outlineWidth`
  String.raw`\b(?:border|outline)[A-Za-z]*Width\s*:`,
];
const EDGE_UTILITY = new RegExp(EDGE_PATTERNS.join('|'), 'g');

for (const file of PROJECTED) {
  test(`AC-4: ${file} paints no theme-coloured edge`, () => {
    const found = [...read(file).matchAll(EDGE_UTILITY)].map((m) => m[0]);
    assert.deepEqual(
      found,
      [],
      `${file} is projected output. A border/ring/outline width here inherits ` +
        `its colour from the universal \`border-border\` in globals.css, which ` +
        `differs between themes — so the edge would change with the operator's ` +
        `choice. Give it an explicit literal colour and widen this guard ` +
        `deliberately. Found: ${found.join(', ')}`
    );
  });
}

for (const file of PROJECTED) {
  test(`AC-4: ${file} carries no theme token`, () => {
    const found = themeReferences(read(file));
    assert.deepEqual(
      found,
      [],
      `${file} is projected output and must paint in literal colours or ` +
        `registry-resolved inline styles, never in a theme token. Found: ` +
        `${found.join(', ')}`
    );
  });
}

test('AC-4: the projected focusables state a literal outline colour', () => {
  // `* { @apply outline-ring/50 }` gives every node a theme-dependent
  // `outline-color`, and the UA supplies the width on `:focus-visible` — so a
  // focused link on a projected surface rings in the operator's theme. The edge
  // guard above matches width utilities and structurally cannot see this.
  const focusables = [
    'src/app/services/[id]/slideshow/SlideshowClient.tsx',
    'src/app/services/[id]/slideshow/page.tsx',
  ];
  for (const file of focusables) {
    const source = read(file);
    const links = [...source.matchAll(/<Link\b[\s\S]*?>/g)].map((m) => m[0]);
    assert.ok(links.length > 0, `${file} is listed as carrying a projected focusable`);
    for (const link of links) {
      assert.match(
        link,
        /focus-visible:outline-\w/,
        `a focusable on a projected surface must state its own outline colour, ` +
          `or the focus ring paints from \`--ring\` — 0.708 light against 0.556 ` +
          `dark. State a literal (\`focus-visible:outline-white\`); do NOT add a ` +
          `width utility, which the edge guard will reject and should. In: ${link}`
      );
    }
  }
});

/**
 * Every module a projected file pulls in, however the specifier is written, with
 * `import type` dropped because types erase and can contribute no markup.
 */
function moduleImports(file) {
  const source = read(file);
  const specifiers = [
    ...[...source.matchAll(/\bimport\s+(?!type\b)[\s\S]*?\bfrom\s+["']([^"']+)["']/g)].map(
      (m) => m[1]
    ),
    ...[...source.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]),
  ];
  const inRepo = specifiers.filter((s) => s.startsWith('.') || s.startsWith('@/'));
  return inRepo.flatMap((specifier) => {
    const base = specifier.startsWith('@/')
      ? `src/${specifier.slice('@/'.length)}`
      : path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
    const resolved = ['.tsx', '.ts', '/index.tsx', '/index.ts']
      .map((ext) => `${base}${ext}`)
      .find((candidate) => fs.existsSync(path.join(repoRoot, candidate)));
    return resolved ? [{ specifier, resolved }] : [];
  });
}

test('AC-4: the projected tree stays closed, transitively and with no exempt directory', () => {
  // Two earlier versions of this were narrower than they read. The first walked
  // `@/components/…` imports only, so a relative `./Sibling`, an `@/app/…`
  // component and a `dynamic(() => import('./Lazy'))` each joined the tree
  // unguarded. The second filtered `@/lib/*` out wholesale, on the true but
  // unenforced ground that it holds "data, helpers and hooks — not markup" — in
  // a change set that had just made `@/lib` the home of projected-surface logic.
  // A class-name constant or a JSX helper put there reached the projected
  // surface unscanned. Nothing is exempt by directory now: a module is fine
  // because its own `themeReferences()` is empty, and that is checked.
  //
  // It walks DOWNWARD only. What renders ABOVE a projected route — the root
  // layout, a `not-found.tsx`, a `template.tsx` at the same URL — is Story
  // 17.7's contract, and is deliberately not asserted here.
  const seen = new Set(PROJECTED);
  const queue = [...PROJECTED];
  const offenders = [];

  while (queue.length > 0) {
    const file = queue.shift();
    for (const { specifier, resolved } of moduleImports(file)) {
      if (PROJECTED.includes(resolved)) continue;
      const found = themeReferences(read(resolved));
      if (found.length > 0) {
        offenders.push(
          `${file} -> ${specifier} (${resolved}) carries ${found.join(', ')}`
        );
      }
      if (resolved.endsWith('.tsx') && !seen.has(resolved)) {
        seen.add(resolved);
        queue.push(resolved);
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `a module reachable from the projected tree carries a theme token. Either ` +
      `it is markup and belongs in PROJECTED, or the token does not belong in ` +
      `it. Found: ${offenders.join(' | ')}`
  );
});

test('AC-4: no caller can style the projected wrapper from outside', () => {
  // `ArtifactSlide` used to splice a caller's `className` onto the wrapper the
  // congregation sees, and `SlideView` forwarded one straight through. Neither
  // accepts one now, so TypeScript rejects the call — this is the belt to that
  // braces, and it also covers the shapes `tsc` would not flag at a glance.
  const offenders = [];
  for (const file of allTsxFiles()) {
    const source = read(file);
    for (const m of source.matchAll(/<(SlideView|ArtifactSlide)\b([^>]*)>/g)) {
      if (/\bclassName\s*=|\{\s*\.\.\./.test(m[2])) offenders.push(`${file}: ${m[0].trim()}`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `a className passed here lands on the wrapper the congregation sees, so a ` +
      `theme token in it defeats AC-4 without touching any guarded file. A ` +
      `spread is flagged for the same reason: it can carry one invisibly. ` +
      `Found: ${offenders.join(' | ')}`
  );
});

/** The parameter list of the file's default-exported function, as source. */
function exportedProps(source) {
  const at = source.indexOf('export default function');
  assert.ok(at !== -1, 'expected a default-exported function');
  const open = source.indexOf('(', at);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '(') depth += 1;
    else if (source[i] === ')') {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  assert.fail('unbalanced parameter list');
}

test('AC-4: neither projected component accepts a className at all', () => {
  // The invariant above as a type signature rather than a regex, which is what
  // makes a `{...props}` spread, a `React.createElement(ArtifactSlide, …)`, a
  // renamed default import and a `.ts` call site fail to compile instead of
  // slipping past a scan of `.tsx` files. Only the PROPS are checked — both
  // files legitimately set `className` on their own elements; what they must not
  // do is let a caller supply one.
  for (const file of ['src/components/SlideView.tsx', 'src/components/artifacts/ArtifactSlide.tsx']) {
    assert.doesNotMatch(
      exportedProps(read(file)),
      /\bclassName\b/,
      `${file} must not accept a className. It lands on the wrapper the ` +
        `congregation sees, so styling a projected slide from the outside is ` +
        `not a thing to make possible, let alone convenient.`
    );
  }
});

// --- AC-4: the themed app shell under the full-screen surfaces --------------

const FULL_SCREEN = [
  'src/app/services/[id]/present/projector/ProjectorClient.tsx',
  'src/app/services/[id]/slideshow/SlideshowClient.tsx',
];

for (const file of FULL_SCREEN) {
  test(`AC-4: ${file} neutralises the themed html/body shell`, () => {
    assert.match(read(file), /\bfixed inset-0\b/, 'this is a full-screen surface');
    assert.match(
      read(file),
      /useProjectedShell\(\)/,
      `${file} covers the viewport with \`fixed inset-0\`, but \`body\` carries ` +
        `\`bg-background\` and \`html\` reserves a scrollbar gutter — so the ` +
        `theme paints a strip down the edge that this surface never covers. ` +
        `The projector neutralised that for itself and the slideshow did not, ` +
        `which is how AC-4 was falsified once already. Call ` +
        `\`useProjectedShell()\`.`
    );
  });
}

for (const file of FULL_SCREEN) {
  test(`AC-4: ${file} sets its own text colour on the full-screen root`, () => {
    // Checked on the ROOT element, not anywhere in the file. Both of these
    // surfaces carry `text-white/70` and `hover:text-white` on inner chrome, so
    // a file-wide `/\btext-white\b/` was green with the root stripped bare —
    // negative-testing caught it, which is the same substring-satisfiable defect
    // this file was rewritten to remove.
    const [root] = classNameValues(jsxReturnBranches(read(file))[0] ?? '');
    assert.ok(root !== undefined, `${file} renders no classed root`);
    assert.match(
      root,
      /(?:^|\s)text-white(?:$|\s)/,
      `\`body { @apply text-foreground }\` reaches any projected node that sets ` +
        `no colour. Stating \`text-white\` on the full-screen root closes it ` +
        `here rather than relying on ArtifactSlide's literal fallback. Root ` +
        `className: ${root}`
    );
  });
}

test('AC-4: the shell claim paints a literal, never a token', () => {
  const claim = read('src/lib/projected-shell.ts');
  assert.match(claim, /'scrollbarGutter',\s*'auto'/, 'the reserved gutter is the mechanism');
  assert.match(claim, /'backgroundColor',\s*'#000000'/, 'literal black, not `--background`');
  assert.deepEqual(
    themeReferences(claim),
    [],
    'the claim exists to take the theme off the projected shell; reading a ' +
      'theme token to do it would put it straight back'
  );
});

// --- AC-4: the shell claim as behaviour, not as source text -----------------

const { claimProjectedShell, resetProjectedShellForTest } = await import(
  srcUrl('src', 'lib', 'projected-shell.ts')
);

/** The five properties, and nothing else, as a plain object. */
function documentStub(initial = {}) {
  return {
    documentElement: { style: { ...(initial.root ?? {}) } },
    body: { style: { ...(initial.body ?? {}) } },
  };
}

test('AC-4 behaviour: a claim blacks out the shell and a release hands it back', () => {
  resetProjectedShellForTest();
  const doc = documentStub({
    root: { overflow: 'visible', scrollbarGutter: 'stable', backgroundColor: 'rebeccapurple' },
    body: { overflow: 'auto', backgroundColor: 'white' },
  });

  const release = claimProjectedShell(doc);
  assert.equal(doc.documentElement.style.overflow, 'hidden');
  assert.equal(doc.body.style.overflow, 'hidden');
  assert.equal(doc.documentElement.style.scrollbarGutter, 'auto');
  assert.equal(doc.documentElement.style.backgroundColor, '#000000');
  assert.equal(doc.body.style.backgroundColor, '#000000');

  release();
  // The restore path is the one that matters and the one no regex reaches: a bug
  // here leaves the operator's whole app shell pinned at literal black after
  // they leave a projected route.
  assert.equal(doc.documentElement.style.overflow, 'visible');
  assert.equal(doc.body.style.overflow, 'auto');
  assert.equal(doc.documentElement.style.scrollbarGutter, 'stable');
  assert.equal(doc.documentElement.style.backgroundColor, 'rebeccapurple');
  assert.equal(doc.body.style.backgroundColor, 'white');
});

test('AC-4 behaviour: two concurrent claims do not strand the shell at black', () => {
  // Without reference counting the second claim snapshots the first claim's
  // `#000000`, and the first release then restores black permanently. Story 17.1
  // took the callers from one to two; 17.7 adds a third over the same URLs.
  resetProjectedShellForTest();
  const doc = documentStub({ root: { backgroundColor: 'white' }, body: { backgroundColor: 'white' } });

  const releaseFirst = claimProjectedShell(doc);
  const releaseSecond = claimProjectedShell(doc);

  releaseFirst();
  assert.equal(
    doc.body.style.backgroundColor,
    '#000000',
    'a surface is still on screen, so the shell must stay black'
  );

  releaseSecond();
  assert.equal(doc.body.style.backgroundColor, 'white', 'the last release restores');
  assert.equal(doc.documentElement.style.backgroundColor, 'white');
});

test('AC-4 behaviour: releasing twice is a no-op, not a double decrement', () => {
  resetProjectedShellForTest();
  const doc = documentStub({ body: { backgroundColor: 'white' } });

  const release = claimProjectedShell(doc);
  const other = claimProjectedShell(doc);
  release();
  release();
  assert.equal(
    doc.body.style.backgroundColor,
    '#000000',
    'a stale release must not restore while another surface holds the claim'
  );
  other();
  assert.equal(doc.body.style.backgroundColor, 'white');
});

// --- AC-3: the two deliberate opt-outs keep their own dark wrapper ----------

/**
 * `className` values as written, including the `{…}` expression forms, so a
 * `cn('dark', …)` or a template literal is read rather than missed.
 */
function classNameValues(source) {
  return [
    ...source.matchAll(
      /className=(?:"([^"]*)"|'([^']*)'|\{((?:[^{}]|\{[^{}]*\})*)\})/g
    ),
  ].map((m) => m[1] ?? m[2] ?? m[3]);
}

/** `dark` as a class token — not as a substring of `dark:` or `darkroom`. */
const carriesDark = (value) => /(?:^|[\s'"`])dark(?:[\s'"`]|$)/.test(value);

/**
 * Each JSX-returning branch of the exported surface, as source.
 *
 * The previous form took `classNameValues(body)[0]` — the first `className` in
 * source order — while its own failure message called that "the OUTERMOST
 * classed element". Any early return carrying a className (loading, empty,
 * error) silently became the checked element, so a stray `dark` on such a branch
 * satisfied the assertion after the real surface root had lost it. Every branch
 * is checked now. `return (` with a `(`-arrow after it (an effect cleanup) is
 * not a render branch and is excluded by requiring a `<` next.
 */
function jsxReturnBranches(source) {
  const body = source.slice(source.indexOf('export default function'));
  const starts = [...body.matchAll(/return\s*\(\s*(?=<)/g)].map((m) => m.index);
  return starts.map((start, i) =>
    body.slice(start, i + 1 < starts.length ? starts[i + 1] : body.length)
  );
}

for (const file of [
  'src/app/services/[id]/present/PresenterOperator.tsx',
  'src/app/services/[id]/present/SlideGridDialog.tsx',
]) {
  test(`AC-3: ${file} pins its own dark surface on every branch it renders`, () => {
    const branches = jsxReturnBranches(read(file));
    assert.ok(branches.length > 0, `${file} renders no JSX branch`);

    for (const branch of branches) {
      const [outermost] = classNameValues(branch);
      assert.ok(outermost !== undefined, `${file} has a render branch with no classed element`);
      assert.ok(
        carriesDark(outermost),
        `${file} renders dark regardless of the operator's chosen theme, and ` +
          `the root of each branch it renders is where that is declared. Story ` +
          `17.1 does not remove either wrapper; the presenter is used in a dim ` +
          `sanctuary and does not participate in the choice. Branch root ` +
          `className: ${outermost}`
      );
    }
  });
}

// --- AC-1, AC-2, AC-5: the choice is mounted, and mounted in one place ------

test('AC-1/AC-2: the root layout mounts the theme provider and suppresses the html mismatch', () => {
  const layout = read('src/app/layout.tsx');

  assert.match(
    layout,
    /<ThemeProvider>[\s\S]*\{children\}[\s\S]*<\/ThemeProvider>/,
    'children must render inside ThemeProvider, or useTheme() resolves to nothing'
  );
  assert.match(
    layout,
    /suppressHydrationWarning/,
    'next-themes writes the class onto <html> before React hydrates; without ' +
      'suppressHydrationWarning the expected attribute mismatch logs an error'
  );
  assert.doesNotMatch(
    layout,
    /^\s*'use client'/m,
    'the root layout stays a Server Component — the provider is the client boundary'
  );
});

test('AC-1/AC-2: the provider is a client component with system default', () => {
  const provider = read('src/components/ThemeProvider.tsx');

  assert.match(provider, /^'use client';/m, 'next-themes needs the client');
  assert.match(provider, /attribute="class"/, 'the palette is keyed on `.dark`');
  assert.match(provider, /defaultTheme="system"/, 'AC-2: first visit follows the OS');
  assert.match(provider, /enableSystem/, 'AC-2: first visit follows the OS');
});

test('AC-1: the choice persists, because nothing switches persistence off', () => {
  // AC-1's "survives a reload and a new tab" is next-themes writing
  // `localStorage.theme` and syncing on the `storage` event; that was verified
  // in the browser and is recorded in the story's Debug Log. What a source test
  // can hold is that this app still uses the API which provides it — the clause
  // had no net of any kind before.
  const provider = read('src/components/ThemeProvider.tsx');
  assert.doesNotMatch(
    provider,
    /forcedTheme/,
    '`forcedTheme` pins the theme and makes the control inert — AC-1 requires ' +
      'the operator choice to be the thing that wins'
  );
  assert.doesNotMatch(
    provider,
    /storageKey\s*=\s*\{?(?:undefined|null|""|'')/,
    'clearing the storage key is how the choice stops surviving a reload'
  );
  assert.match(
    read('src/components/ThemeToggle.tsx'),
    /setTheme\(/,
    'the control must write through next-themes (which persists), not toggle ' +
      'the `.dark` class by hand'
  );
});

test('AC-1: the theme flip does not animate the whole shell', () => {
  // `header-chrome` puts `transition-all` on every nav pill, and the profile
  // button, logo tile, dropdown items and every `buttonVariants` control carry
  // it too. Without the flag a flip smears the shell through an intermediate
  // palette instead of repainting.
  assert.match(
    read('src/components/ThemeProvider.tsx'),
    /disableTransitionOnChange/,
    'next-themes ships this for exactly the transition-all shell this app has'
  );
});

test('AC-5: sonner reads the theme, and the provider sits above it', () => {
  // The claim is not "sonner calls useTheme" — it did that before this story and
  // the call resolved to nothing. It is that mounting the provider ABOVE it is
  // what gives the call a value, so sonner needed no edit. Asserting only the
  // first half passed with `ThemeProvider` deleted from the layout, which is the
  // entire content of the claim.
  //
  // AC-5 is structural on purpose: `<Toaster />` is mounted nowhere and `toast(`
  // is called nowhere, at the owner's direction. That is filed as EXPERIENCE.md
  // Open Item 4 under Story 17.6, which owns the decision.
  assert.match(
    read('src/components/ui/sonner.tsx'),
    /useTheme\(\)/,
    'sonner already reads the theme; the provider is what gives it a value'
  );
  assert.doesNotMatch(
    read('src/components/ui/sonner.tsx'),
    /ThemeProvider/,
    'sonner must not mount its own provider — one provider, at the root'
  );
  assert.match(
    read('src/app/layout.tsx'),
    /<ThemeProvider>/,
    'the provider is above sonner because it is above everything'
  );
});

// --- AC-1: the control is reachable, labelled, and adds no dependency -------

test('AC-1: the theme control lives in the shared header', () => {
  const header = read('src/components/Header.tsx');
  assert.match(
    header,
    /^import ThemeToggle from '\.\/ThemeToggle';$/m,
    'the control belongs in Epic 13.2 shared chrome'
  );
  assert.match(
    header,
    /<ThemeToggle\s*\/>/,
    'imported and not rendered is the same as absent — and a commented-out ' +
      'import satisfied the previous form of this assertion'
  );
});

test('AC-1: the control is a labelled button and introduces no new dependency', () => {
  const toggle = read('src/components/ThemeToggle.tsx');

  assert.match(toggle, /aria-label=|<span className="sr-only">/, 'the control must be labelled');
  assert.match(
    toggle,
    /useTheme\(\)/,
    'the control reads and writes the theme through next-themes'
  );

  // Both quote styles, and scoped packages. The previous character class
  // excluded `@`, so `import x from '@radix-ui/react-dropdown-menu'` — a
  // dropdown primitive, in the one file where one would plausibly be added —
  // was invisible to it, as was any double-quoted import.
  const external = [...toggle.matchAll(/\bfrom\s+["']([^"']+)["']/g)]
    .map((m) => m[1])
    .filter((s) => !s.startsWith('.') && !s.startsWith('@/'))
    .filter((s) => !['react', 'next-themes', 'lucide-react'].includes(s));
  assert.deepEqual(
    external,
    [],
    `no new theming dependency: unexpected imports ${external.join(', ')}`
  );
});

test('AC-1: the control wears the shared header box rather than a copy of it', () => {
  // It used to restate the seven classes of `getLinkClass`'s inactive branch.
  // The test pinned two of them, so a restyle of the pills drifted the toggle
  // silently — the precise failure the control cannot have, since matching its
  // siblings is the point of the shape. Both now read the same constant.
  const toggle = read('src/components/ThemeToggle.tsx');
  const header = read('src/components/Header.tsx');
  const chrome = read('src/components/header-chrome.ts');

  assert.match(toggle, /HEADER_CONTROL_BOX/, 'the toggle takes the shared box');
  assert.match(header, /header-chrome/, 'the pills take it too, or there is nothing shared');
  assert.match(chrome, /cursor-pointer/, 'the toggle was the only control in the row without one');
});

test('AC-1: the theme control is not inside the navigation landmark', () => {
  // A settings control in `<nav>` is announced as navigation. The row also had
  // no `flex-wrap` while carrying six controls for an admin.
  const header = read('src/components/Header.tsx');
  const nav = header.slice(header.indexOf('<nav'), header.indexOf('</nav>'));
  assert.doesNotMatch(nav, /<ThemeToggle/, 'the toggle belongs beside the nav, not in it');
  assert.match(nav, /flex-wrap/, 'the header row must be able to wrap');
});

/** The pre-mount branch, as code. */
function mountGuardBranch() {
  const toggle = read('src/components/ThemeToggle.tsx');
  const at = toggle.search(/if \(!\s*mounted\s*\)\s*\{/);
  assert.ok(
    at !== -1,
    'guard the theme-dependent render behind a mounted flag. The previous form ' +
      'of this assertion matched the word `mounted` anywhere in the file, and ' +
      'the word sat in the comment explaining the guard — so it could not fail ' +
      'while that comment survived.'
  );
  return balancedBlock(toggle, at);
}

test('AC-1: the control renders nothing theme-dependent before mount', () => {
  // next-themes cannot know the resolved theme during SSR. A control that
  // renders its state anyway flips after hydration, which reads as a bug on
  // the one surface whose whole job is to report state.
  const toggle = read('src/components/ThemeToggle.tsx');
  assert.match(
    toggle,
    /useSyncExternalStore\(/,
    'the flag comes from a store with a server snapshot, not from setState in ' +
      'an effect (which React 19 rejects here)'
  );
  mountGuardBranch();
});

test('AC-1: the pre-mount placeholder is focusable, inert and claims no state', () => {
  const guard = mountGuardBranch();

  assert.match(
    guard,
    /focusableWhenDisabled/,
    'a natively `disabled` placeholder leaves the tab order until hydration — ' +
      'so focus order shifts, the opposite of what the guard is for — and ' +
      '`disabled:opacity-50` steps the box from 50% to 100% as it lands. Base ' +
      "UI's `focusableWhenDisabled` emits `aria-disabled` and keeps tabIndex 0."
  );
  assert.match(
    guard,
    /aria-disabled:pointer-events-none/,
    'the same missing native `disabled` means Tailwind\'s `disabled:` variant ' +
      'never fires, so `disabled:pointer-events-none` from buttonVariants does ' +
      'not apply and the placeholder keeps `hover:bg-card` — lighting up under ' +
      'the cursor while inert. Its own comment: it must not LOOK interactive.'
  );
  for (const stateIcon of ['SunIcon', 'MoonIcon', 'MonitorIcon']) {
    assert.doesNotMatch(
      guard,
      new RegExp(`<${stateIcon}\\b`),
      `the placeholder must not render a state icon. \`MonitorIcon\` IS the ` +
        `\`system\` icon, and next-themes seeds \`theme\` from localStorage ` +
        `inside \`useState\` — so on the hydration render the choice is already ` +
        `known while \`mounted\` is still the server's \`false\`. Every operator ` +
        `who had picked light or dark watched the control claim \`system\` and ` +
        `then correct itself: the guard caused the flip it exists to prevent.`
    );
  }
  assert.match(guard, /<[A-Z][A-Za-z]*Icon\b/, 'the placeholder still shows something');
});

test('AC-1: the control resolves to the same box as its sibling header controls', () => {
  const outlineVariant = read('src/components/ui/button.tsx');
  const toggle = read('src/components/ThemeToggle.tsx');

  // `outline` carries `dark:border-input dark:bg-input/30 dark:hover:bg-input/50`.
  // `tailwind-merge` does not treat a `dark:`-prefixed class as conflicting with
  // an unprefixed one, so an unprefixed call-site override does not displace
  // them, and `:is(.dark *)` out-specifies it. Header's nav pills carry no
  // `dark:` variants at all, so without an explicit dark half the toggle drifts
  // from its siblings in exactly the mode this story exists to enable —
  // `input/30` (#151515 over `--background`) against `card/50` (#111111).
  if (/dark:bg-input/.test(outlineVariant)) {
    assert.match(
      toggle,
      /dark:bg-card\/50/,
      'the outline variant still ships a dark box override, so the call site ' +
        'must still neutralise it'
    );
    assert.match(toggle, /dark:border-border/, 'same for the border');
  }
});

// --- AC-1: the cycle, as behaviour ------------------------------------------

const { THEME_ORDER, nextTheme, asThemeChoice } = await import(
  srcUrl('src', 'lib', 'theme-cycle.ts')
);

test('AC-1 behaviour: the cycle visits all three states and wraps', () => {
  // The modulo is where an off-by-one lives, and it shipped with no coverage of
  // any kind — it was inside a `.tsx` component, reachable only by a regex over
  // that component's own text.
  assert.deepEqual([...THEME_ORDER], ['system', 'light', 'dark']);
  assert.equal(nextTheme('system'), 'light');
  assert.equal(nextTheme('light'), 'dark');
  assert.equal(nextTheme('dark'), 'system', 'the cycle must return to system');

  const visited = new Set();
  let current = 'system';
  for (let i = 0; i < THEME_ORDER.length; i += 1) {
    visited.add(current);
    current = nextTheme(current);
  }
  assert.equal(visited.size, THEME_ORDER.length, 'every state is reachable by pressing');
  assert.equal(current, 'system', 'and the walk closes');
});

test('AC-1 behaviour: an unrecognised stored value reads as system', () => {
  // next-themes applies a hand-edited `localStorage.theme` as the class without
  // validating it. The control must not then claim a state that does not exist.
  assert.equal(asThemeChoice('blue'), 'system');
  assert.equal(asThemeChoice(undefined), 'system');
  assert.equal(asThemeChoice('dark'), 'dark');
});

// --- AC-6: the measurements, and the shades that needed them ----------------

const DESIGN_MD =
  '_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md';

test('AC-6: the four load-bearing dark pairs are recorded in DESIGN.md as measurements', () => {
  // The test that carried this label asserted only that `dark:text-{hue}-`
  // appeared in `TONE_CLASS` — badge shades DESIGN.md itself classifies as "not
  // a palette token pair". Nothing pinned the four pairs AC-6 names, and nothing
  // pinned the recording, which is the half of AC-6 that says "as a measurement,
  // not an estimate".
  // Scoped to the DARK table. Matching the whole document passed with the dark
  // figure deleted, because the light table carries the same four pair names —
  // negative-testing caught that, and AC-6 is specifically about the palette
  // that had never been measured on any pair.
  const whole = readRaw(DESIGN_MD);
  const from = whole.indexOf('The same four pairs in the dark palette');
  assert.notEqual(from, -1, 'DESIGN.md must carry the dark-palette measurement table');
  const nextHeading = whole.slice(from).search(/\n#{1,4} /);
  const design = whole.slice(from, nextHeading === -1 ? whole.length : from + nextHeading);

  const pairs = [
    ['foreground', 'background'],
    ['primary-foreground', 'primary'],
    ['muted-foreground', 'background'],
    ['muted-foreground', 'muted'],
  ];
  for (const [fg, bg] of pairs) {
    const row = new RegExp(
      `\`(?:--)?${fg}\`[^\\n]*\`(?:--)?${bg}\`[^\\n]*\\d+\\.\\d+\\s*:\\s*1`,
      'i'
    );
    assert.match(
      design,
      row,
      `AC-6 requires \`${fg}\` on \`${bg}\` measured and recorded in DESIGN.md ` +
        `with its ratio. A pair with no number beside it is the estimate AC-6 ` +
        `exists to replace.`
    );
  }
});

test('AC-6: every chromatic badge shade reachable on a dark surface has a dark half', () => {
  // `-600` shades were chosen against white. Round 1 fixed the two files it
  // found and stopped four sites short of its own rule — "shades with no dark
  // half in files that became dark-switchable underneath them" — in two files
  // that contained no `dark:` utility at all. At `text-[10px]` the 4.5:1
  // small-text floor applies and emerald measured 4.23:1 on the dark card.
  const surfaces = [
    ['src/components/SlidePreviewList.tsx', ['emerald', 'amber', 'indigo']],
    ['src/app/announcements/AnnouncementsManager.tsx', ['emerald', 'amber']],
    ['src/components/Header.tsx', ['emerald']],
    ['src/components/admin/ArtifactEditor.tsx', ['emerald']],
  ];
  for (const [file, hues] of surfaces) {
    const source = read(file);
    for (const hue of hues) {
      const light = new RegExp(`text-${hue}-[5-9]00`);
      if (!light.test(source)) continue;
      assert.match(
        source,
        new RegExp(`dark:text-${hue}-`),
        `${file} paints \`text-${hue}-600\`, a shade picked against a white ` +
          `surface, and this file is dark-switchable since Story 17.1. ` +
          `\`PRESENTER_TONE_CLASS\` already holds shades proven on a dark card.`
      );
    }
  }
});

test('AC-6: the hand-rolled red pair is the destructive token, so it says so', () => {
  // `--color-red-600` is `oklch(57.7% 0.245 27.325)` and `:root --destructive`
  // is `oklch(0.577 0.245 27.325)`; `--color-red-400` and `.dark --destructive`
  // match the same way. A hand-rolled pair reproduces the token and then drifts
  // from it the moment the identity is retuned.
  for (const file of [
    'src/components/LogoutButton.tsx',
    'src/app/announcements/AnnouncementsManager.tsx',
  ]) {
    const source = read(file);
    assert.doesNotMatch(
      source,
      /text-red-600/,
      `${file} should name \`text-destructive\`, which is the same colour in ` +
        `both themes and cannot drift from the destructive identity`
    );
  }
});
