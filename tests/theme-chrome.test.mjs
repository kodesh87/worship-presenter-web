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
 * The projected surface is two routes, and each is a route shell plus a client
 * tree. Both halves are guarded, because the shell is reached at the same URL
 * whenever `buildSlidePlan` throws:
 *
 *   slideshow/page.tsx           -> SlideshowClient -> SlideView -> ArtifactSlide
 *   present/projector/page.tsx   -> ProjectorClient -> SlideView -> ArtifactSlide
 *
 * Those files import no other component (asserted below, over relative, aliased
 * and dynamic specifiers alike), so the token set cannot enter the projected
 * surface through a path this file does not read. If a further file joins that
 * tree, it belongs in PROJECTED.
 *
 * **Every scan strips comments first.** Four assertions here were satisfiable by
 * a word in a comment before 2026-07-31 — one of them by the very comment that
 * explained the code it was meant to guard. Prose about a token is not a token,
 * and a test that a doc comment can keep green is not a test.
 *
 * The token list is parsed out of `globals.css` rather than hardcoded, so a
 * token added to the palette is covered here without anyone remembering to
 * come back. AC-4 of the story is the requirement; this is its regression net.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readRaw = (rel) => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

/**
 * Comments removed so no assertion below can be satisfied by prose. Block
 * comments go whole; line comments only when the `//` opens the line, which is
 * every comment in this codebase's style and leaves `xmlns="http://…"` alone.
 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('//'))
    .join('\n');
}

const read = (rel) => stripComments(readRaw(rel));

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

// --- the palette, read from its source of truth -----------------------------

const GLOBALS_CSS = 'src/app/globals.css';

/** Every `--color-*` name exposed by the `@theme inline` block. */
function themeTokens() {
  const names = [
    ...readRaw(GLOBALS_CSS).matchAll(/^\s*--color-([a-z0-9-]+)\s*:/gm),
  ].map((m) => m[1]);
  assert.ok(
    names.length > 20,
    `expected the @theme inline block to expose the palette; found ${names.length} --color-* names`
  );
  return names;
}

/**
 * Utility prefixes that can carry a colour token. The directional and offset
 * forms are listed explicitly: `border-t-border`, `border-x-border` and
 * `ring-offset-background` are all themed colours, and a pattern of
 * `border-(?:token)` alone lets every one of them through. Longest first so the
 * alternation cannot settle for `border` when `border-t` is what is there.
 */
const UTILITY_PREFIXES = [
  'border-t', 'border-r', 'border-b', 'border-l', 'border-x', 'border-y',
  'border-s', 'border-e', 'ring-offset', 'inset-ring', 'divide-x', 'divide-y',
  'bg', 'text', 'border', 'ring', 'outline', 'divide', 'fill', 'stroke',
  'from', 'via', 'to', 'placeholder', 'caret', 'accent', 'decoration', 'shadow',
].sort((a, b) => b.length - a.length);

/**
 * Three ways a theme token can reach a file: a utility class, the `dark:`
 * variant (which resolves against whichever `.dark` ancestor exists), and a
 * raw `var(--token)` in an inline style.
 */
function themeReferences(source) {
  const tokens = themeTokens()
    .slice()
    // longest first, so `card-foreground` is reported instead of `card`
    .sort((a, b) => b.length - a.length)
    .join('|');

  const utility = new RegExp(
    `\\b(?:${UTILITY_PREFIXES.join('|')})-(?:${tokens})\\b`,
    'g'
  );
  const cssVar = new RegExp(`var\\(\\s*--(?:${tokens})\\s*[),]`, 'g');
  const darkVariant = /\bdark:[a-z[]/g;

  return [
    ...source.matchAll(utility),
    ...source.matchAll(cssVar),
    ...source.matchAll(darkVariant),
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
 * `#e5e5e5` light against `oklch(1 0 0 / 10%)` dark. It paints nothing today
 * only because Tailwind's preflight leaves `border-width: 0`, which was
 * confirmed node by node on `/services/[id]/slideshow`: 14 of 14 elements at
 * `0px` on all four sides, no outline.
 *
 * So the token guard above is necessary but not sufficient. The class that
 * would turn that inert colour into a painted, theme-varying edge is a *width*
 * utility, which contains no token name and sails straight past a token scan.
 * A projected element that genuinely wants an edge has to state its own colour,
 * the way `ProjectorClient` states `bg-[#0B1220]`, or draw it from
 * registry-resolved inline style.
 *
 * The width vocabulary is larger than it looks, and the first version of this
 * guard missed most of it — including `ring-1`, which its own comment named as
 * the hazard. Directional widths (`border-t-2`, `border-x-2`, `border-s-2`),
 * arbitrary values (`border-[3px]`, `border-t-[2px]`), odd ring and outline
 * widths (`ring-1`, `ring-3`, `outline-1`) and divider widths (`divide-y-2`)
 * are all painted edges; only `border`, `border-2/4/8`, `ring`, `ring-2`,
 * `outline`, `outline-2`, `border-t`, `border-b`, `divide-y` were caught. A
 * colour-only utility (`border-white/25`) is deliberately NOT matched: it paints
 * nothing without a width, and stating a literal colour is the sanctioned way
 * out of this guard.
 *
 * `body { @apply text-foreground }` is the same shape of hazard for TEXT, and
 * it was checked the same way, on `/services/[id]/present/projector`: five of
 * eleven nodes there compute a theme-dependent `color`, and none of them paints
 * it — every text-bearing node inherits an explicit inline colour from its
 * Artifact wrapper instead, identical under both themes. That holds because
 * `ArtifactSlide.tsx:128` emits `toCssColor(style.fontColor) ?? '#FFFFFF'`, a
 * literal fallback rather than a token, so registry text can never fall through
 * to the theme. No guard is added for it here: the invariant lives in that
 * expression, and this note exists so the next reader does not have to re-derive
 * it from a blank projector.
 */
const EDGE_WIDTH = String.raw`(?:\d+|\[[^\]\s"'\`]+\])`;
const EDGE_SIDE = String.raw`(?:[trblxy]|s|e)`;
const EDGE_END = String.raw`(?=["'\s\`}]|$)`;
const EDGE_UTILITY = new RegExp(
  [
    String.raw`\b(?:border|divide)(?:-${EDGE_SIDE})?(?:-${EDGE_WIDTH})?${EDGE_END}`,
    String.raw`\b(?:ring|outline|ring-offset|outline-offset)(?:-${EDGE_WIDTH})?${EDGE_END}`,
  ].join('|'),
  'g'
);

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

/**
 * Every module specifier a projected file pulls in, however it is written.
 * `@/lib/*` is data, helpers and hooks — not markup — and bare packages are
 * outside this repository; everything else must already be guarded.
 */
function componentImports(file) {
  const source = read(file);
  const specifiers = [
    ...[...source.matchAll(/\bfrom\s+["']([^"']+)["']/g)].map((m) => m[1]),
    ...[...source.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]),
  ];
  return specifiers
    .filter((s) => s.startsWith('.') || s.startsWith('@/'))
    .filter((s) => !s.startsWith('@/lib/'))
    .map((s) => ({
      specifier: s,
      resolved: s.startsWith('@/')
        ? `src/${s.slice('@/'.length)}.tsx`
        : `${path.posix.normalize(path.posix.join(path.posix.dirname(file), s))}.tsx`,
    }));
}

test('AC-4: the projected tree stays closed to the guarded files', () => {
  // The per-file guards above are only sufficient while these files import no
  // further component. The first version of this test read `@/components/…`
  // imports only, so a relative `./Sibling`, an `@/app/…` component and a
  // `dynamic(() => import('./Lazy'))` each joined the tree unguarded.
  for (const file of PROJECTED) {
    for (const { specifier, resolved } of componentImports(file)) {
      assert.ok(
        PROJECTED.includes(resolved),
        `${file} imports ${specifier} (${resolved}), which is not in ` +
          `PROJECTED — the theme guard no longer covers the whole projected ` +
          `tree. Add it, or keep the import inside \`@/lib\`.`
      );
    }
  }
});

test('AC-4: no caller can style the projected wrapper from outside', () => {
  // `ArtifactSlide` splices a `className` onto the wrapper it puts around
  // projected output, and `SlideView` used to forward one straight through. No
  // call site ever passed it — which is what made it cheap to close: a caller
  // outside PROJECTED passing `bg-card` was a path into the projected surface
  // that none of the guards above can see, because none of them reads that
  // caller. `SlideView` no longer accepts one; this covers the other entry.
  const offenders = [];
  for (const file of allTsxFiles()) {
    const source = read(file);
    for (const m of source.matchAll(/<(SlideView|ArtifactSlide)\b([^>]*)>/g)) {
      if (/\bclassName\s*=/.test(m[2])) offenders.push(`${file}: ${m[0].trim()}`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `a className passed here lands on the wrapper the congregation sees, so a ` +
      `theme token in it defeats AC-4 without touching any guarded file. ` +
      `Found: ${offenders.join(' | ')}`
  );
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

test('AC-4: the shell reset paints a literal, never a token', () => {
  const hook = read('src/lib/use-projected-shell.ts');
  assert.match(hook, /scrollbarGutter\s*=\s*'auto'/, 'the reserved gutter is the mechanism');
  assert.match(hook, /backgroundColor\s*=\s*'#000000'/, 'literal black, not `--background`');
  assert.deepEqual(
    themeReferences(hook),
    [],
    'the reset exists to take the theme off the projected shell; reading a ' +
      'theme token to do it would put it straight back'
  );
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

for (const file of [
  'src/app/services/[id]/present/PresenterOperator.tsx',
  'src/app/services/[id]/present/SlideGridDialog.tsx',
]) {
  test(`AC-3: ${file} still pins its own dark surface`, () => {
    // Checked as a class token on the OUTERMOST classed element of the exported
    // surface, not as a string anywhere in the file. The previous form matched
    // `/className="dark[\s"]/`, which failed on `className="flex dark …"` and on
    // `cn('dark', …)` — two spellings that render identically — while passing
    // for a stray `dark` on any element at all.
    const source = read(file);
    const body = source.slice(source.indexOf('export default function'));
    const [outermost] = classNameValues(body);

    assert.ok(outermost !== undefined, `${file} renders no classed element`);
    assert.ok(
      carriesDark(outermost),
      `${file} renders dark regardless of the operator's chosen theme, and the ` +
        `surface's own root is where that is declared. Story 17.1 does not ` +
        `remove either wrapper; the presenter is used in a dim sanctuary and ` +
        `does not participate in the choice. Outermost className: ${outermost}`
    );
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

test('AC-5: sonner reads the theme, and the provider sits above it', () => {
  // The claim is not "sonner calls useTheme" — it did that before this story and
  // the call resolved to nothing. It is that mounting the provider ABOVE it is
  // what gives the call a value, so sonner needed no edit. Asserting only the
  // first half passed with `ThemeProvider` deleted from the layout, which is the
  // entire content of the claim.
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

/** The pre-mount branch, as code. */
function mountGuardBranch() {
  const toggle = read('src/components/ThemeToggle.tsx');
  const match = toggle.match(/if \(!mounted\) \{[\s\S]*?\n {2}\}/);
  assert.ok(
    match,
    'guard the theme-dependent render behind a mounted flag. The previous form ' +
      'of this assertion matched the word `mounted` anywhere in the file, and ' +
      'the word sat in the comment explaining the guard — so it could not fail ' +
      'while that comment survived.'
  );
  return match[0];
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

test('AC-1: the pre-mount placeholder is focusable and claims no state', () => {
  const guard = mountGuardBranch();

  assert.match(
    guard,
    /focusableWhenDisabled/,
    'a natively `disabled` placeholder leaves the tab order until hydration — ' +
      'so focus order shifts, the opposite of what the guard is for — and ' +
      '`disabled:opacity-50` steps the box from 50% to 100% as it lands. Base ' +
      "UI's `focusableWhenDisabled` emits `aria-disabled` and keeps tabIndex 0."
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

// --- AC-6: shades chosen against white, now reachable on a dark surface -----

test('AC-6: the chromatic preview badges carry a dark half', () => {
  // `SlidePreviewList` is hub chrome — it renders in both forms' Live Slide
  // Preview — and its `-600` shades were chosen against white. Measured on the
  // dark `--card`: emerald-600 4.23:1, indigo-600 2.54:1 (below even the 3:1
  // large-text floor). The `dark:` halves are ported from `PRESENTER_TONE_CLASS`,
  // which exists because that surface has always been dark.
  const list = read('src/components/SlidePreviewList.tsx');
  const table = list.slice(list.indexOf('const TONE_CLASS'), list.indexOf('const BADGE_CLASS'));

  for (const hue of ['emerald', 'amber', 'indigo']) {
    assert.match(
      table,
      new RegExp(`dark:text-${hue}-`),
      `\`text-${hue}-600\` was picked against a white surface; this list is ` +
        `dark-switchable since Story 17.1, so the ${hue} tone needs a shade ` +
        `that survives the dark card. \`PRESENTER_TONE_CLASS\` already holds one.`
    );
  }
});
