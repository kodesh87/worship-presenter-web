/**
 * Whether the presenter can tell the projector is still there (Story 17.5,
 * `AD-29`).
 *
 * `AD-29` fixes the shape this file exists to enforce: **one evaluator, one
 * predicate.** Acknowledgement staleness and the retained handle's `closed`
 * read are two *inputs* to a single reducer, never two mechanisms with two
 * verdicts — a reviewer must be able to fail an implementation in which the
 * poll keeps its own flag or renders its own message. The reducer takes every
 * time value as an argument and never reads the clock itself, which is what
 * lets a fake timeline drive it deterministically here.
 *
 * Three kinds of assertion, matching `tests/canvas-dirty-guard.test.mjs`'s
 * split: the evaluator is a plain `.ts` module with no React and no `window`,
 * so `node:test` calls it directly; the wire half (the new message type
 * resolving to `null` through both readers) lives in
 * `tests/present-channel.test.mjs`, which already owns that question; and the
 * wiring this repo cannot exercise — a real `BroadcastChannel`, a real
 * interval, a real `window.closed` — is covered by the TypeScript-AST style
 * `tests/canvas-dirty-guard.test.mjs` uses, so a second liveness state hidden
 * inside a component is a source-shape defect a scan can catch rather than a
 * behaviour only a browser could show.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readRaw = (rel) => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const srcUrl = (...parts) => pathToFileURL(path.join(repoRoot, ...parts)).href;

/**
 * The subject, imported above the first `test()` on purpose — a dynamic
 * import suspends module evaluation, and `tests/theme-chrome.test.mjs` and
 * `tests/canvas-dirty-guard.test.mjs` both record the same hazard: anything
 * declared below a bare `await import` is still in its temporal dead zone
 * when the runner starts the tests it already has.
 */
const liveness = await import(srcUrl('src', 'lib', 'projector-liveness.ts'));

// --- the AST, parsed once per file ------------------------------------------

const sources = new Map();

function ast(rel) {
  if (!sources.has(rel)) {
    sources.set(
      rel,
      ts.createSourceFile(
        rel,
        readRaw(rel),
        ts.ScriptTarget.Latest,
        true,
        rel.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      )
    );
  }
  return sources.get(rel);
}

function nodes(root, predicate) {
  const out = [];
  const visit = (node) => {
    if (predicate(node)) out.push(node);
    ts.forEachChild(node, visit);
  };
  visit(root);
  return out;
}

function callsNamed(root, name) {
  return nodes(
    root,
    (node) => ts.isCallExpression(node) && node.expression.getText() === name
  );
}

function identifiers(root, name) {
  return nodes(root, (node) => ts.isIdentifier(node) && node.text === name);
}

function importSpecifiers(root) {
  return nodes(root, ts.isImportDeclaration).map((node) =>
    node.moduleSpecifier.getText().slice(1, -1)
  );
}

function importedNames(root, moduleSpecifier) {
  const out = [];
  for (const decl of nodes(root, ts.isImportDeclaration)) {
    if (decl.moduleSpecifier.getText().slice(1, -1) !== moduleSpecifier) continue;
    const bindings = decl.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) out.push(element.name.text);
    }
    if (decl.importClause?.name) out.push(decl.importClause.name.text);
  }
  return out;
}

// --- AC-3: three states, one evaluator, framework-agnostic ------------------

test('AC-3: the evaluator module imports nothing, so node:test can call it', () => {
  assert.deepEqual(
    importSpecifiers(ast('src/lib/projector-liveness.ts')),
    [],
    'a react/window import here would put this logic back out of reach of the ' +
      'test runner, which is the whole reason it lives in `src/lib`'
  );
});

test('AC-3: a presenter session starts never-opened', () => {
  assert.equal(liveness.INITIAL_LIVENESS_STATE.verdict, 'never-opened');
});

test('AC-3/AC-6: never-opened stays silent while nothing has happened yet', () => {
  // A tick with no evidence must not manufacture a verdict — AD-29: "no
  // evidence yet is a distinct verdict from evidence stopped."
  const state = liveness.nextLivenessState(
    liveness.INITIAL_LIVENESS_STATE,
    { type: 'tick' },
    50_000
  );
  assert.equal(state.verdict, 'never-opened');
});

test('AC-3/AC-4: an acknowledgement moves never-opened straight to live', () => {
  const state = liveness.nextLivenessState(
    liveness.INITIAL_LIVENESS_STATE,
    { type: 'ack' },
    1_000
  );
  assert.equal(state.verdict, 'live');
});

test('AC-4: acks keep it live across ticks inside the freshness window', () => {
  let state = liveness.nextLivenessState(
    liveness.INITIAL_LIVENESS_STATE,
    { type: 'ack' },
    1_000
  );
  state = liveness.nextLivenessState(
    state,
    { type: 'tick' },
    1_000 + liveness.LIVENESS_FRESHNESS_WINDOW_MS - 1
  );
  assert.equal(state.verdict, 'live');
});

test('AC-4: no acks for longer than the freshness window resolves to lost', () => {
  // Route 1 into `lost`: the window elapsed, even though nothing ever
  // reported the handle closed.
  let state = liveness.nextLivenessState(
    liveness.INITIAL_LIVENESS_STATE,
    { type: 'ack' },
    1_000
  );
  state = liveness.nextLivenessState(
    state,
    { type: 'tick' },
    1_000 + liveness.LIVENESS_FRESHNESS_WINDOW_MS + 1
  );
  assert.equal(state.verdict, 'lost');
});

test('AC-4: the handle reporting closed is lost immediately, window untouched', () => {
  // Route 2 into `lost`: the handle, and it does not wait out the freshness
  // window — a clean close is reported "in well under a second."
  let state = liveness.nextLivenessState(
    liveness.INITIAL_LIVENESS_STATE,
    { type: 'ack' },
    1_000
  );
  state = liveness.nextLivenessState(state, { type: 'handle-closed' }, 1_050);
  assert.equal(state.verdict, 'lost');
});

test('AC-4: a null/absent handle is not evidence of death on its own', () => {
  // The component-level contract: a poll must never synthesize a
  // `handle-closed` event from a null ref. The evaluator side of that
  // contract is that nothing but an explicit `handle-closed` event may move
  // the verdict toward `lost` before the freshness window elapses.
  let state = liveness.nextLivenessState(
    liveness.INITIAL_LIVENESS_STATE,
    { type: 'ack' },
    1_000
  );
  state = liveness.nextLivenessState(state, { type: 'tick' }, 1_500);
  assert.equal(state.verdict, 'live');
});

test('AC-4: an ack wins for life even after the handle was seen closed', () => {
  // The asymmetry named in AD-29: the ack is authoritative for life, the
  // handle for death, and neither is authoritative for the other. A fresh
  // handle after a reopen answers `request-sync`, which is the recorded ack.
  let state = liveness.nextLivenessState(
    liveness.INITIAL_LIVENESS_STATE,
    { type: 'ack' },
    1_000
  );
  state = liveness.nextLivenessState(state, { type: 'handle-closed' }, 1_050);
  assert.equal(state.verdict, 'lost');

  state = liveness.nextLivenessState(state, { type: 'ack' }, 2_000);
  assert.equal(state.verdict, 'live', 'the new ack must override the stale closed reading');

  // And a tick shortly after must not fall back to `lost` off the closed
  // reading the ack just superseded.
  state = liveness.nextLivenessState(state, { type: 'tick' }, 2_100);
  assert.equal(state.verdict, 'live');
});

test('AC-4/AC-5: recovery from a stale-window lost also runs through a bare ack', () => {
  let state = liveness.nextLivenessState(
    liveness.INITIAL_LIVENESS_STATE,
    { type: 'ack' },
    1_000
  );
  state = liveness.nextLivenessState(
    state,
    { type: 'tick' },
    1_000 + liveness.LIVENESS_FRESHNESS_WINDOW_MS + 1
  );
  assert.equal(state.verdict, 'lost');

  state = liveness.nextLivenessState(state, { type: 'ack' }, 50_000);
  assert.equal(
    state.verdict,
    'live',
    'a bare request-sync is recorded as an ack and alone must return the verdict to live'
  );
});

test('AC-4: uncertainty resolves to lost — closed observed before any ack ever arrived', () => {
  const state = liveness.nextLivenessState(
    liveness.INITIAL_LIVENESS_STATE,
    { type: 'handle-closed' },
    10
  );
  assert.equal(state.verdict, 'lost');
});

test('Review [High, blocking 2]: an open attempt that never acks resolves to lost, not never-opened forever', () => {
  // AD-29's "uncertainty resolves to lost" clause, applied to the one case it
  // didn't previously cover: `openProjector` recording that an attempt was
  // made, with no ack ever following (a popup/tab on an older build, one
  // that crashes before its mount-time `request-sync`, or one that never
  // creates a channel at all).
  let state = liveness.nextLivenessState(
    liveness.INITIAL_LIVENESS_STATE,
    { type: 'opened' },
    1_000
  );
  assert.equal(
    state.verdict,
    'never-opened',
    'right after opening, with nothing heard yet, the verdict is still uncertain rather than an instant lost'
  );
  state = liveness.nextLivenessState(
    state,
    { type: 'tick' },
    1_000 + liveness.LIVENESS_FRESHNESS_WINDOW_MS + 1
  );
  assert.equal(
    state.verdict,
    'lost',
    'a projector that never answers past the freshness window must not stay never-opened forever'
  );
});

test('Review [blocking 2]: an open attempt still within the freshness window stays never-opened', () => {
  let state = liveness.nextLivenessState(
    liveness.INITIAL_LIVENESS_STATE,
    { type: 'opened' },
    1_000
  );
  state = liveness.nextLivenessState(
    state,
    { type: 'tick' },
    1_000 + liveness.LIVENESS_FRESHNESS_WINDOW_MS - 1
  );
  assert.equal(state.verdict, 'never-opened');
});

test('Review [blocking 2]: an ack after an open attempt resolves to live normally', () => {
  let state = liveness.nextLivenessState(
    liveness.INITIAL_LIVENESS_STATE,
    { type: 'opened' },
    1_000
  );
  state = liveness.nextLivenessState(state, { type: 'ack' }, 1_500);
  assert.equal(state.verdict, 'live');
});

test('Review [blocking 2]: a tick with no open attempt and no ack still stays never-opened (no regression on the silent case)', () => {
  const state = liveness.nextLivenessState(
    liveness.INITIAL_LIVENESS_STATE,
    { type: 'tick' },
    50_000
  );
  assert.equal(state.verdict, 'never-opened');
});

test('AC-3: the two cadence constants are named, exported once, and sane', () => {
  assert.equal(typeof liveness.PROJECTOR_HEARTBEAT_INTERVAL_MS, 'number');
  assert.equal(typeof liveness.LIVENESS_FRESHNESS_WINDOW_MS, 'number');
  assert.ok(
    liveness.LIVENESS_FRESHNESS_WINDOW_MS > liveness.PROJECTOR_HEARTBEAT_INTERVAL_MS,
    'the freshness window must tolerate at least one missed heartbeat, or ' +
      'ordinary jitter reports a live projector dead'
  );
});

// --- AC-6: the wiring this repo cannot exercise, asserted over the AST ------

test('AC-6: ProjectorClient emits the heartbeat on an interval, inside the pinned effect', () => {
  const file = ast('src/app/services/[id]/present/projector/ProjectorClient.tsx');
  assert.ok(
    importedNames(file, '@/lib/projector-liveness').some((name) =>
      name.includes('HEARTBEAT')
    ),
    'the interval must come from the shared cadence constant, not a literal ' +
      'the projector picks on its own'
  );

  const intervalCalls = callsNamed(file, 'setInterval');
  assert.equal(intervalCalls.length, 1, 'exactly one heartbeat interval');

  // The effect pinned to `[serviceId]` alone is the one that opens the
  // channel; `ProjectorClient.tsx`'s own comment says why it must not gain a
  // new dependency, so the heartbeat interval has to live inside that same
  // effect rather than a second one with its own deps array.
  const effects = callsNamed(file, 'useEffect');
  const pinnedEffect = effects.find((call) => {
    const deps = call.arguments[1]?.getText().replace(/\s/g, '');
    return deps === '[serviceId]';
  });
  assert.ok(pinnedEffect, 'expected an effect keyed on `[serviceId]` alone');
  assert.ok(
    callsNamed(pinnedEffect, 'setInterval').length > 0,
    'the heartbeat must be registered inside the effect pinned to [serviceId]'
  );

  const cleanups = nodes(pinnedEffect, ts.isReturnStatement).filter(
    (ret) => callsNamed(ret, 'clearInterval').length > 0
  );
  assert.ok(cleanups.length > 0, 'the interval must be cleared in that effect\'s cleanup');
});

test('AC-1: ProjectorClient posts the ack as a bare, state-free message', () => {
  const file = ast('src/app/services/[id]/present/projector/ProjectorClient.tsx');
  const posts = callsNamed(file, 'ch.postMessage').filter(
    (call) => call.getStart() > callsNamed(file, 'setInterval')[0]?.getStart()
  );
  assert.ok(posts.length > 0, 'expected a postMessage inside the interval');
  for (const call of posts) {
    const text = call.arguments[0].getText();
    assert.doesNotMatch(text, /index|blank|transition/, 'the heartbeat carries no deck state');
  }
});

test('AC-3/AC-4: PresenterOperator reads liveness through the shared evaluator, not a second copy', () => {
  const file = ast('src/app/services/[id]/present/PresenterOperator.tsx');
  const imported = importedNames(file, '@/lib/projector-liveness');

  assert.ok(
    imported.includes('nextLivenessState'),
    'the verdict must come from the shared reducer'
  );

  // The negative half of the guard: no second liveness flag invented locally.
  // A hand-rolled `isLive`/`liveness` useState beside the shared reducer is
  // exactly the "poll maintains its own state" defect AC-3 forbids.
  const bannedLocalNames = ['isProjectorLive', 'projectorIsLive', 'isLive'];
  for (const name of bannedLocalNames) {
    assert.equal(
      identifiers(file, name).length,
      0,
      `${name} would be a second liveness state alongside the shared evaluator`
    );
  }
});

test('AC-4: the closed poll never treats a null handle as evidence of death', () => {
  const file = ast('src/app/services/[id]/present/PresenterOperator.tsx');
  const dispatches = callsNamed(file, 'dispatchLiveness').filter((call) =>
    call.arguments.some((arg) => arg.getText().includes('handle-closed'))
  );
  assert.ok(dispatches.length > 0, 'expected the handle-closed event to be raised somewhere');
  for (const call of dispatches) {
    // Walk up to the nearest enclosing if-statement guarding the dispatch.
    let node = call.parent;
    let guard = null;
    while (node && !ts.isArrowFunction(node) && !ts.isFunctionDeclaration(node)) {
      if (ts.isIfStatement(node)) {
        guard = node.expression;
        break;
      }
      node = node.parent;
    }
    assert.ok(
      guard,
      'a handle-closed dispatch must be reached through an enclosing if-statement'
    );
    // A loose "does the text mention the ref" check would pass an inverted
    // guard like `!projectorRef.current || projectorRef.current.closed` —
    // which fires on exactly the null/absent handle AC-4 forbids treating as
    // evidence of death. The guard must be a logical AND whose left side is
    // a bare, non-negated truthy check of the ref, so only a genuinely
    // non-null handle ever reaches the `.closed` read on the right.
    assert.ok(
      ts.isBinaryExpression(guard) &&
        guard.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken,
      'the guard must be a logical AND — an OR would let a null/absent handle ' +
        'satisfy the branch'
    );
    assert.equal(
      guard.left.getText().replace(/\s/g, ''),
      'projectorRef.current',
      'the left side of the AND must be a bare, non-negated truthy check of the ref'
    );
  }
});

test('Review [High, blocking 1]: PresenterOperator gates the ack dispatch through the shared isProjectorMessage predicate', () => {
  const file = ast('src/app/services/[id]/present/PresenterOperator.tsx');
  assert.ok(
    importedNames(file, '@/lib/present-channel').includes('isProjectorMessage'),
    'the listener must classify inbound messages through the one predicate present-channel.ts ' +
      'owns, not its own inline msg.type check that can drift from it'
  );

  const dispatches = callsNamed(file, 'dispatchLiveness').filter((call) =>
    call.arguments.some((arg) => arg.getText().includes(`'ack'`))
  );
  assert.ok(dispatches.length > 0, 'expected an ack dispatch inside the message listener');
  for (const call of dispatches) {
    let node = call.parent;
    let guard = null;
    while (node && !ts.isArrowFunction(node) && !ts.isFunctionDeclaration(node)) {
      if (ts.isIfStatement(node)) {
        guard = node.expression;
        break;
      }
      node = node.parent;
    }
    assert.ok(
      guard,
      'the ack dispatch must be reached through an enclosing if-statement, not fire ' +
        'unconditionally for every inbound object'
    );
    assert.match(
      guard.getText(),
      /isProjectorMessage/,
      'the guard must be the shared isProjectorMessage predicate — a second Presenter tab\'s ' +
        'own broadcast state must never be recorded as evidence the projector is alive'
    );
  }
});

test('Review [High, blocking 3]: Open projector reattaches a frozen (open-but-silent) handle instead of only focusing it', () => {
  const file = ast('src/app/services/[id]/present/PresenterOperator.tsx');
  const openProjectorDecl = nodes(
    file,
    (node) => ts.isVariableDeclaration(node) && node.name.getText() === 'openProjector'
  )[0];
  assert.ok(openProjectorDecl, 'expected an openProjector declaration');
  const body = openProjectorDecl.getText();

  assert.match(
    body,
    /verdict\s*===\s*['"]lost['"]/,
    'the early-return-on-an-open-handle branch must consult the liveness verdict — a handle ' +
      'that is open but not answering (AC-4\'s crashed/frozen/navigated-away case) is exactly ' +
      'the one `existing.closed === false` cannot distinguish from a healthy one'
  );
  assert.match(
    body,
    /existing\.location/,
    'a frozen handle must be navigated back to the projector route, not merely focus()ed — ' +
      'focus() cannot make a crashed or navigated-away window answer again'
  );
});

// --- AC-6: this suite runs -----------------------------------------------

test('AC-6: this suite is registered in package.json', () => {
  const pkg = JSON.parse(readRaw('package.json'));
  assert.match(pkg.scripts.test, /\btests\/projector-liveness\.test\.mjs\b/);
});
