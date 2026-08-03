---
baseline_commit: 4424d865503c1c8e26d6846e8b1d41547ab536ec
---

# Story 17.4: Unsaved Canvas Work Is Not Lost Silently

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an administrator editing an Artifact template,
I want a dirty indicator and a navigation guard,
so that leaving the canvas editor cannot discard layout work without warning.

## Acceptance Criteria

1. **A dirty flag exists, lives only in memory, and is visible on the surface.** `ArtifactEditor` tracks whether the mounted canvas has unsaved authoring since the last successful Save (or since mount, or since the last Reset). The flag flips true on: any Fabric object mutation (`object:added`, `object:removed`, `object:modified`) on the live canvas, `insertElement`, `handleDeleteSelected`, `applyTextStyle`, and `handleTextContentChange`. It flips false on a successful Save response and a successful Reset response. **The flag is never persisted** — not to `localStorage`, not to SQLite, not anywhere — per `AD-24`, which names this exact story as the reason unsaved editor state must stay in memory (`ARCHITECTURE-SPINE.md` AD-24, fourth bullet). When dirty, the surface shows a visible, unobtrusive indicator near the Save/Reset controls (e.g. "Unsaved changes" text) so the state is not only enforced but seen.

2. **A `beforeunload` guard covers the browser-level exits.** While dirty, closing the tab, reloading, or typing a new URL triggers the native "leave site" confirmation (`event.preventDefault()` + `event.returnValue = ''`, the only cross-browser-supported shape). The listener is registered only while the editable canvas is mounted and dirty, and removed on cleanup — it must not leak past unmount or fire when nothing is dirty (an operator who has only viewed a read-only template, or has an unmodified editable one, must see nothing).

3. **Switching templates inside the editor while dirty is guarded the same way Reset already is.** Today, clicking a different row in the Templates list changes `selectedId`, which re-triggers the `mountCanvas` effect (`ArtifactEditor.tsx:422-520`) and unconditionally resets `addedElementsRef.current = new Map()` and disposes the old canvas — silently discarding every unsaved move, insert, delete, and style/content edit in the outgoing template. When dirty, clicking a different template first asks for confirmation using the same `window.confirm` pattern the file already uses for Reset (`ArtifactEditor.tsx:745`); declining leaves `selectedId` (and the mounted canvas) unchanged. Confirming proceeds exactly as today.

4. **Leaving `/admin/artifacts` via an in-app link while dirty is guarded, without moving the client boundary to the root layout.** `Header`'s five `next/link` `Link` elements (logo, Dashboard, Announcements, Artifacts, Settings — `Header.tsx:58,81,87,95,101`) are the operator's normal way off this page. Per Next 16's documented `onNavigate`-blocking pattern (`node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md` → *Blocking navigation*), add a small React Context (`isBlocked`/`setIsBlocked`) and a `CustomLink` wrapper that calls `event.preventDefault()` in `onNavigate` when blocked and the operator declines a `window.confirm`. **The Provider mounts around `<Header />` and `<ArtifactEditor />` inside `AdminArtifactsPage` (`src/app/admin/artifacts/page.tsx`) — never around `src/app/layout.tsx`.** This is `AD-24`'s own rule applied, not a new one: *"the client boundary mounts at the narrowest layout that covers its consumers, and never on `layout.tsx` itself"* — the only writer (`ArtifactEditor`) and the only readers (`Header`'s links) both live inside this one page, so root-mounting would violate the very decision that already names this story. `Header` must accept the guard through **context**, not a new prop, so every other page that renders `Header` is unaffected (context default `isBlocked: false` there). **Out of scope, and must not be attempted:** `LogoutButton` (`src/components/LogoutButton.tsx`) navigates via `router.replace()` inside a button `onClick`, not a `Link`/`onNavigate` — guarding it is a different mechanism and belongs, if ever, to `EXPERIENCE.md` Open Item 5 ("Session revocation has no mid-edit warning"), not this story.

5. **Regression coverage is fail-first and, where the runtime allows it, executes real logic rather than only matching source text.** The project convention (`project-context.md`: *"Logic worth testing lives in a `.ts` module, never inside a `.tsx` component"*) applies directly here: extract the dirty-state transition rules (which events set it, which clear it, what the `beforeunload` handler must do) into a plain `.ts` module under `src/lib/` so `node:test` can call the functions directly — the `nextTheme`/`theme-cycle.ts` precedent, and the same shape `tests/theme-chrome.test.mjs` already uses for `useProjectedShell`'s claim/restore behavior (calling the function, not just grepping for it). Fabric canvas mutation and real `beforeunload`/`Link` click behavior cannot be exercised under `node:test` (no DOM, no jsdom in this repo — verified: `jsdom`/`@testing-library/*` are not in `package.json`), so those wiring points are covered by static source assertions in the same style `tests/theme-chrome.test.mjs` already uses for JSX/hook wiring (TypeScript-AST-based checks over `ts-morph`/the `typescript` compiler API already imported there, or scoped regex over comment-stripped source) — never a new UI test runner. **A new test file is registered in `package.json`'s `scripts.test` list in the same change set** — an unregistered file never runs, in CI or locally, and nothing detects the omission (`project-context.md`, the single highest-cost omission in this repo).

6. **`EXPERIENCE.md`'s two open items this story owns are closed with evidence, and nothing else in that file changes.** Open Item 3 (*"Unsaved canvas changes are silent," owner: Story 17.4*, `EXPERIENCE.md` line 316) and the `/admin/artifacts` per-surface state row's "⚠ Unsaved canvas" entry (`EXPERIENCE.md` line 143) are both marked closed, following the closure convention already used elsewhere in the same file (state what was true before, what changed, and the evidence — commit/test reference). **`DESIGN.md` is not touched** — this story owns no `DESIGN.md` Open Item (none of DESIGN.md's six open items name Story 17.4) and introduces no new token or component visual identity; the `window.confirm`/`beforeunload` browser-native dialogs carry no themeable surface. No architecture spine amendment is needed: `AD-24` already anticipates and names this exact story as its "live instance" of the persisted-local-vs-ephemeral distinction, so nothing in the spine is stale once this ships.

7. **Repository verification is clean in the supported environment.** On Node.js 22.x (`>=22.12`): the new/extended test file(s), `npx tsc --noEmit`, the public-repository guard, and the full registered suite (`npm test`) all pass. `npm run lint` introduces no new problem relative to a freshly measured baseline (32 problems measured in-worktree on 2026-08-03 with `git status` clean before edits — re-confirm at implementation time rather than trusting this number, since a worktree can wildly inflate the count if not measured carefully per `project-context.md`).

## Tasks / Subtasks

- [ ] Establish fail-first regression coverage (AC: 5)
  - [ ] Create `src/lib/canvas-dirty-guard.ts` (or similarly named `.ts` module) exporting the pure dirty-state transition logic — e.g. a function that, given the current dirty flag and an event kind (`'mutated' | 'saved' | 'reset' | 'template-changed'`), returns the next flag value, plus the `beforeunload` handler factory and the confirmation copy as named exports. Keep it framework-agnostic (no React, no Fabric imports) so `node:test` can call it directly.
  - [ ] Write/extend a registered test file (new `tests/canvas-dirty-guard.test.mjs` is the cleanest home — `theme-chrome.test.mjs` is about the theme/room-facing closure, not this concern) that: (a) calls the pure module's functions directly for the dirty-transition rules, (b) uses the `typescript`-compiler-API/comment-stripped-source approach already established in `tests/theme-chrome.test.mjs` to assert `ArtifactEditor.tsx` wires the module in (canvas event listeners registered, `beforeunload` attached/detached, no dirty state written to `localStorage`/`fetch` outside Save), and (c) asserts `Header.tsx`'s Links are wrapped through the blocking `CustomLink`/context on `/admin/artifacts` without a `'use client'` directive appearing on `src/app/layout.tsx`.
  - [ ] Add the new file to the `scripts.test` list in `package.json` in the same change set.
  - [ ] Run the new test(s) before implementing and confirm they fail (fail-first evidence for the Dev Agent Record).

- [ ] Implement the in-memory dirty flag and visible indicator (AC: 1)
  - [ ] Add `isDirty` state to `ArtifactEditor`, driven by the pure module from the task above.
  - [ ] Wire canvas listeners (`canvas.on('object:added' | 'object:removed' | 'object:modified', ...)`) alongside the existing `selection:*` listeners (`ArtifactEditor.tsx:490-500`), and flip dirty on `insertElement`, `handleDeleteSelected`, `applyTextStyle`, `handleTextContentChange`.
  - [ ] Clear dirty on successful Save (`handleSave`, after `setTemplate(data)`) and successful Reset (`handleReset`, after `setTemplate(data)`); also reset it to `false` whenever a fresh template mounts (start of `mountCanvas`).
  - [ ] Render a small "Unsaved changes" indicator near the Save/Reset button row, visible only when `isDirty && isEditable`.

- [ ] Implement the `beforeunload` guard (AC: 2)
  - [ ] Register/deregister a `beforeunload` listener in an effect keyed on `isDirty` (and on the editable-canvas lifecycle), calling `event.preventDefault(); event.returnValue = '';` only while dirty.

- [ ] Guard the in-editor template switch (AC: 3)
  - [ ] Before calling `setSelectedId` from the Templates list `onClick` (`ArtifactEditor.tsx:796`), check `isDirty`; if dirty, `window.confirm` using the same tone as the existing Reset confirmation; only proceed on confirm.

- [ ] Implement the Link-level navigation guard scoped to this page (AC: 4)
  - [ ] Add a small navigation-blocker context module (e.g. `src/components/admin/navigation-blocker.tsx`), following the Next 16 documented shape: `NavigationBlockerContext`/`NavigationBlockerProvider`/`useNavigationBlocker`.
  - [ ] Add a `CustomLink` wrapping `next/link`'s `Link`, calling `window.confirm` and `event.preventDefault()` in `onNavigate` when blocked and declined.
  - [ ] Change `Header.tsx`'s five `Link` usages to the blocking `CustomLink` (behind the context; default `isBlocked: false` elsewhere, so every other page is unaffected).
  - [ ] Mount `NavigationBlockerProvider` inside `AdminArtifactsPage` (`src/app/admin/artifacts/page.tsx`), wrapping `<Header />` and `<ArtifactEditor />` — **not** `src/app/layout.tsx`.
  - [ ] Wire `ArtifactEditor`'s `isDirty` into `setIsBlocked` via the context.
  - [ ] Confirm `LogoutButton` is untouched and out of scope (per AC-4).

- [ ] Run the new/extended tests and confirm they pass (AC: 5)

- [ ] Synchronize `EXPERIENCE.md` (AC: 6)
  - [ ] Close Open Item 3 (line 316) with the shipped mechanism and evidence, following this file's own closure convention (see how Open Items 1/2 in `DESIGN.md` and this file's own closed items are written).
  - [ ] Update the `/admin/artifacts` per-surface state row (line 143) to describe what ships instead of "⚠ Unsaved canvas — designed, not shipped."
  - [ ] Update `epics.md` Story 17.4 label and the Epic 17 summary line, keeping other story statuses in that line unchanged. **Do not touch `DESIGN.md`** — no Open Item there names this story.

- [ ] Run supported verification and complete the record (AC: 7)
  - [ ] Run the new/extended focused test file(s) with `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/<file>.test.mjs`.
  - [ ] Run `npx tsc --noEmit`.
  - [ ] Run `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs`.
  - [ ] Run `npm test` on Node 22 (use `npm ci` then `npm run build` first if the native dependency ABI/build state is stale — `tests/auth-http.test.mjs` spawns the built server and needs `.next` to exist).
  - [ ] Run `npm run lint` and compare against a freshly measured baseline (do not copy the number in this file without re-measuring) — introduce zero new findings.
  - [ ] Inspect the final diff for anything outside the expected file list below. Update Dev Agent Record and File List.

## Dev Notes

### Scope and architecture authority

- **This is the one story in Epic 17 whose home is `EXPERIENCE.md`, not `DESIGN.md`.** The epic preamble frames Epic 17 broadly as `DESIGN.md`-governed operator-chrome identity, but `EXPERIENCE.md`'s own Open Items list (line 316) and per-surface state table (line 143) both explicitly name *"Owner: Story 17.4"* for the unsaved-canvas gap — that is a behavioral/IA concern, which is `EXPERIENCE.md`'s territory per `AGENTS.md`'s authority map. Do not add or touch a `DESIGN.md` Open Item for this story; none names it.
- **`AD-24` already anticipates this exact story and settles the one design question that matters most: where does the dirty flag live?** Quoting `ARCHITECTURE-SPINE.md` directly: *"Persisted-local holds a view preference and nothing else. No registry payload, no service data, no unsaved domain draft ... Story 17.4's canvas dirty-state guard is the live instance: an `ArtifactLayout` parked in `localStorage` would pass every word of the tier test while escaping the entire registry write contract. Unsaved editor state stays in memory, per AD-13."* Do **not** put the dirty layout, the added-elements map, or any serialized canvas snapshot into `localStorage` "to survive a reload" — that is the one move this spine passage exists to forbid. A `beforeunload`/`window.confirm`/`onNavigate` guard that merely *warns before discarding* is the entire scope; a save-to-localStorage recovery feature is not being asked for and is explicitly out of bounds.
- **No architecture spine amendment (`bmad-architecture` Update run) is required.** This story changes no structural invariant that isn't already named: `AD-13` (Fabric owns canvas state, React reads only on save) is unchanged — the dirty flag is a boolean side-observation of canvas mutation events, not a new read path, and does not call `serializeCanvas` outside of Save. `AD-24`'s ephemeral-in-memory tier already names this story by number, so citing it is enough.
- **No new route or IA-table row.** Nothing here adds a URL, so `EXPERIENCE.md`'s IA table is untouched — only the two entries this story already owns (Open Item 3, the per-surface state row) close.

### The four leaks this story must close, and only these four

Verified against `src/` during context creation (2026-08-03) — there is no dirty tracking, no `beforeunload`, and no navigation-blocking of any kind in this codebase today (`grep -rn "beforeunload\|isDirty\|dirty" src/ -i` returns only `ArtifactEditor.tsx`'s doc comments, none of which implement it):

1. **Browser-level exit** (tab close, reload, address-bar navigation) — nothing intercepts this today. Fixed by AC-2's `beforeunload`.
2. **In-editor template switch** — `mountCanvas`'s effect (`ArtifactEditor.tsx:422-520`) unconditionally does `addedElementsRef.current = new Map()` and disposes/remounts the canvas the instant `selectedId` (or `template`) changes; nothing gates the `onClick` at `ArtifactEditor.tsx:796` that sets it. Fixed by AC-3, reusing the exact `window.confirm` idiom already at `ArtifactEditor.tsx:745` (Reset's confirmation).
3. **In-app `Link` navigation away from the route** — `Header`'s five `next/link` usages (logo + 4 nav pills) are the only nav surface visible on this admin page (per `EXPERIENCE.md` line 51: *"Navigation exposes only three of these ... plus the profile dropdown"*). Fixed by AC-4, using Next 16's own documented `onNavigate`-blocking pattern — do not invent a different mechanism (e.g. intercepting `popstate`/`router.push` manually); the framework ships the supported hook for exactly this.
4. **Logout** — deliberately **not** fixed by this story. `LogoutButton.tsx` calls `router.replace('/login')` after a `fetch`, inside a plain button handler, not a `Link` click — the `onNavigate` mechanism does not apply to it, and inventing a second mechanism just for this one button is scope creep the epic text does not ask for. `EXPERIENCE.md` Open Item 5 ("Session revocation has no mid-edit warning") already owns the general mid-edit-interruption question and has no owner yet — leave it there.

### Why the `NavigationBlockerProvider` mounts on the page, not the layout

`src/app/layout.tsx` stays a Server Component today, reaching the client through exactly one child, `ThemeProvider` (`AD-24`, root-mount rule). A second root-mounted provider is not automatically consistent with that precedent — the test `AD-24` gives is *"enumerate its consumers and mount at the narrowest layout that contains all of them."* Here: the only writer is `ArtifactEditor` (rendered only inside `AdminArtifactsPage`), and the only readers are `Header`'s links **as rendered inside that same page** — `Header` itself is instantiated fresh per page (each `page.tsx` renders its own `<Header />`; there is no shared layout wrapping it), so the narrowest layout containing both is `AdminArtifactsPage` itself. Wrap there:

```tsx
// src/app/admin/artifacts/page.tsx — illustrative shape, not a diff
<NavigationBlockerProvider>
  <Header isAdmin={true} username={username} />
  {/* ...header text... */}
  <ArtifactEditor />
</NavigationBlockerProvider>
```

`Header` picks up the context via `useNavigationBlocker()` unconditionally — on every other page it renders, no `NavigationBlockerProvider` is in the tree, so `useContext` returns the module's default value (`{ isBlocked: false, setIsBlocked: () => {} }`), and its `Link`s behave exactly as they do today. This is why the context needs a real default rather than `undefined` + a "must be inside provider" throw: `Header` is shared across every gated page and must not break on the ones with no provider.

### Implementation guardrails (existing file: `src/components/admin/ArtifactEditor.tsx`, 972 lines — read in full during context creation)

- **`mountCanvas` (`:422-520`) is the reset point.** It already runs on every `[template, syncSelection]` change, i.e. every template switch and every reload-after-409. Dirty must reset to `false` at the top of this effect (a freshly mounted canvas is never dirty), and any listeners this story adds inside it (`object:added`/`object:removed`/`object:modified`) must be torn down in the same cleanup function that already removes the `selection:*` listeners (`removeSelectionListeners`) — follow that existing pattern rather than adding a second ad hoc cleanup path.
- **Registration order is a hazard, not a formality: attach the mutation listener *after* the initial per-element paint loop, never before or during it.** `mountCanvas` populates the fresh canvas by iterating `layout.elements` and calling `canvas.add(...)` in a loop (`:483-488`) before the `selection:*` listeners are attached (`:490-500`). `canvas.add()` fires `object:added`. If the new `object:added`/`object:removed`/`object:modified` listener is wired any earlier than that existing `selection:*` block — e.g. inside or above the paint loop — every fresh template mount will register its own seed elements as a dirty edit and the guard will fire (`beforeunload`, the template-switch confirm, the Link guard) on a canvas the operator never touched. Attach it in the same place and after the same loop as `selection:*` is attached today.
- **`handleSave` (`:677-741`) and `handleReset` (`:743-773`) already have a 409 branch that reloads the server copy and explicitly explains what was discarded** (`:719-731`, `:756-763`). Do not touch that messaging or control flow — only add "clear dirty" on the success path (`setTemplate(data); setStatus('success')`) of each. The 409 path already remounts via `loadTemplate`, which re-enters `mountCanvas` and resets dirty to `false` on its own — no separate handling needed there.
- **`insertElement`, `handleDeleteSelected`, `applyTextStyle`, `handleTextContentChange`** are the four explicit-edit call sites (`:522-585`, `:587-638`, `:640-651`, `:658-666`) that mutate the canvas outside a raw Fabric event (e.g. `applyTextStyle` calls `obj.set(...)` directly, which Fabric v6 may or may not fire a mutation event for depending on the call — verify empirically rather than assuming `object:modified` fires for every one of these, and set dirty explicitly in the four handlers rather than relying solely on canvas events to catch every path).
- **`READ_ONLY_BASE_TYPES` templates never mount an editable canvas** (`getEditableLayout` returns `null`, `mountCanvas` disposes and returns early at `:432-436`) — the dirty flag, its indicator, and the `beforeunload`/navigation guard must all be inert when `!isEditable`, matching the existing pattern: `isEditable` is computed at `:775` and the render branches on it at `:858` (`{!isEditable ? (` read-only notice `) : ( ...editing toolbar... )}`).
- **The Templates list `onClick`** is currently `onClick={() => setSelectedId(item.id)}` (`:796`) with no guard of any kind, including no check for whether `item.id === selectedId` (re-clicking the active template). Guard only the *actual* switch (different id); clicking the already-selected template should not prompt.

### Previous story intelligence (Story 17.3, `app-metadata`, `ready-for-dev`)

- 17.3 established (and 17.2 before it) the discipline of **scoping a diff to exactly what the AC names** and calling that out explicitly in Dev Notes — this story is larger in surface area (five files vs. one), so the same discipline matters more, not less: do not touch `LogoutButton`, `ThemeToggle`, or any other `Header` internals beyond the five `Link` elements.
- 17.3 flagged the project-context rule about re-measuring the lint baseline fresh rather than trusting a number carried over from a previous story — this story's own baseline (32, above) is subject to the same caveat.
- 17.3's closure convention for a `DESIGN.md`/`EXPERIENCE.md` Open Item (state what was true before, what changed, cite the evidence/test) is the template to follow for this story's `EXPERIENCE.md` closures, even though 17.3 itself closed a `DESIGN.md` item and this story closes `EXPERIENCE.md` ones.
- Neither 17.1, 17.2, nor 17.3 touched `Header.tsx` or added a React Context — this story is the first in the epic to modify a component shared across every gated page. Re-run the full suite (not just the focused test) before considering this done, since `Header` regressions would be silent on every other route otherwise.

### Testing Standards

- Supported runtime: Node.js 22.x (`>=22.12`). `node:test` + `node:assert/strict` only — never Jest/Vitest, and this repo has no `jsdom`/`@testing-library` dependency, so a component-level "render and click" test is not available; use the pure-module-plus-static-assertion split described in AC-5/Tasks.
- Required focused test command(s) (adjust filename to whatever is actually created):
  `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/canvas-dirty-guard.test.mjs`
- Required public-repository guard command:
  `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs`
- Full suite: `npm test`. TypeScript: `npx tsc --noEmit`. Lint: `npm run lint`.
- **A new test file must be appended to the `scripts.test` command string in `package.json` in the same change set** — per `project-context.md`, this is the single highest-cost, structurally undetectable omission in this repository; nothing else will catch it.
- **When you write the wiring guard (the static-assertion half), prove it reacts**: temporarily break the thing it claims to catch (e.g. remove the `beforeunload` cleanup, or drop the `CustomLink` wrap on one `Header` link) and confirm the suite goes red, per `project-context.md`'s guard-hardening rule, before trusting the green result.

### Project Structure Notes

- Expected implementation files:
  - `src/components/admin/ArtifactEditor.tsx` — UPDATE: dirty state, canvas mutation listeners, `beforeunload` effect, template-switch confirm, indicator UI, context consumption.
  - `src/lib/canvas-dirty-guard.ts` (or similar name) — NEW: pure dirty-transition logic, framework-agnostic, importable by `node:test`.
  - `src/components/admin/navigation-blocker.tsx` (or similar name) — NEW: `NavigationBlockerContext`/`Provider`/`useNavigationBlocker` + `CustomLink`, colocated under `admin/` since its only consumers are this page's `Header` instance and `ArtifactEditor`.
  - `src/components/Header.tsx` — UPDATE: five `Link` → `CustomLink` swaps only; no other change.
  - `src/app/admin/artifacts/page.tsx` — UPDATE: wrap `<Header />`/`<ArtifactEditor />` in `NavigationBlockerProvider`.
  - `tests/canvas-dirty-guard.test.mjs` (or similar) — NEW, registered in `package.json`.
  - `package.json` — UPDATE: `scripts.test` gains the new file.
  - `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md` — UPDATE: close Open Item 3 (line 316) and the per-surface row (line 143). **`DESIGN.md` is NOT in this list — do not edit it.**
  - `_bmad-output/planning-artifacts/epics.md` — Story 17.4 label / Epic 17 summary line sync.
  - this story file and `_bmad-output/implementation-artifacts/sprint-status.yaml` — normal tracking updates.
- `src/app/layout.tsx` is explicitly **not** in this list — it must not gain a `'use client'` directive or a second root provider; see *Why the `NavigationBlockerProvider` mounts on the page, not the layout* above.
- No database/schema change, no new API route, no new settings key. This is a pure client-side (browser tab) concern, consistent with `AD-24`'s in-memory tier.

### Latest technical/library notes

- **Next.js 16.2.10, `<Link>`'s `onNavigate` prop** (added `v15.3.0`, still current in 16.2): fires on client-side navigation attempts and exposes `event.preventDefault()` to cancel. This is the officially documented mechanism for exactly this problem — see `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md`, section *Blocking navigation* (~line 1090), which gives the full Context+`CustomLink`+Provider shape this story's AC-4/Tasks follow. Per this repo's own rule ("Next 16 differs from common training data — read `node_modules/next/dist/docs/` before changing any Next/React API usage"), that section was read in full during context creation; do not assume Pages-Router-era `router.events` or a `beforeRouteChange` hook exists — they do not, in the App Router.
- **Fabric.js 6.6.1 event names**: `object:added`, `object:removed`, `object:modified` are the canvas-level events already available on the `Canvas` instance this file constructs (`ArtifactEditor.tsx:442`); `elementToFabricObject`/`applyTextStyle`/etc. do not currently attach any listener beyond `selection:*` — this story is additive there, following the exact `canvas.on(...)`/`canvas.off(...)` pairing pattern already at `:493-500`.
- **`window.confirm` / native `beforeunload`**: both are plain browser APIs already used once each in this file (`window.confirm` at `:745` for Reset) — no new dependency, no new UI library. Do not add a custom modal/dialog component for this; the epic and `EXPERIENCE.md`'s own dialog convention (*"Confirmations (delete) and lookups (hymn search). Never carry primary workflow"*) both point at reusing the plain, already-established idiom.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md:280,284,303,306`] — Epic 17 preamble (DESIGN.md-governed operator chrome, congregation-never-sees-chrome constraint) and Story 17.4's own statement.
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md:109,143,316`] — `admin/ArtifactEditor` component-pattern row (AD-13 consequence), the `/admin/artifacts` per-surface "⚠ Unsaved canvas" state row, and Open Item 3 — both explicitly owned by Story 17.4.
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md:49-55`] — IA table entry for `/admin/artifacts` and the "navigation exposes only three... plus profile dropdown" scoping of what a Header actually offers to click away to.
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md:136-139`] — AD-13, Canvas State Boundary (Fabric owns state, React reads only on save, via `serializeCanvas`, never `canvas.toJSON()`).
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md:204-219`] — AD-24 in full, including the sentence naming this story by number (*"Story 17.4's canvas dirty-state guard is the live instance"*) and the root-layout narrowest-mount rule this story's Task 4 must follow.
- [Source: `src/components/admin/ArtifactEditor.tsx:1-972`] — full current file; cited line numbers throughout this story (mountCanvas `:422-520`, handleSave `:677-741`, handleReset `:743-773`, Reset confirm `:745`, 409 handling `:719-731,756-763`, Templates list onClick `:796`, insertElement `:522-585`, handleDeleteSelected `:587-638`, applyTextStyle `:640-651`, handleTextContentChange `:658-666`, isEditable computed `:775` / gated in render `:858`) are read from this source, not inferred.
- [Source: `src/components/Header.tsx:1-218`] — full current file; five `Link` usages at `:58,81,87,95,101`; `usePathname`-based active-state styling that a `CustomLink` wrap must preserve unchanged.
- [Source: `src/components/LogoutButton.tsx:1-53`] — confirms logout is a `router.replace()` call inside a button handler, not a `Link`, and is therefore out of this story's mechanism and scope.
- [Source: `src/app/admin/artifacts/page.tsx:1-40`] — current page shell; `Header` and `ArtifactEditor` are both rendered directly inside this Server Component, confirming it is the narrowest layout containing both.
- [Source: `src/lib/registry/types.ts:13,19,28,53,75,103`] — `READ_ONLY_BASE_TYPES`/`EDITABLE_BASE_TYPES`, `CanvasElementType`, `CanvasElement`, `ArtifactLayout`, `StoredArtifactTemplate` type locations, for accurate citation of what `getEditableLayout` and `serializeCanvas` operate over.
- [Source: `tests/theme-chrome.test.mjs:1-60`] — precedent for this repo's test shape: TypeScript-compiler-API/comment-stripped-source static assertions plus direct function calls for pure behavior (`useProjectedShell`'s claim/restore), the model this story's own test file follows for the parts that cannot run under `node:test` without a DOM.
- [Source: `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md:1090-1364`] — Next 16's documented `onNavigate`-blocking pattern (Context + `CustomLink` + Provider), read in full during context creation; this story's AC-4 and Tasks follow it directly rather than inventing an alternative mechanism.
- [Source: `_bmad-output/project-context.md:56-57,79-87,97`] — "logic worth testing lives in a `.ts` module" rule (with the `theme-cycle.ts`/`nextTheme` precedent), the untrusted-browser-storage rule (why the dirty flag/added-elements map may never reach `localStorage`), the unregistered-test-file hazard, and the lint-baseline re-measurement caveat.
- [Source: `_bmad-output/implementation-artifacts/stories/17-3-app-metadata.md`] — previous story in this epic: closure convention, scope discipline, fresh-baseline measurement practice, all carried forward here.
- [Source: `package.json`] — `scripts.test` file list (authoritative registration point for any new test file) and current dependency set (confirms no `jsdom`/`@testing-library/*`, no state-management library beyond React's own Context — nothing new to add for this story).

## Dev Agent Record

### Story Context Completion

Ultimate context engine analysis completed — comprehensive developer guide created. Verified against Epic 17 text, both `EXPERIENCE.md` Open Items this story owns (confirmed `DESIGN.md` owns none of them), the architecture spine's `AD-13`/`AD-24` (the latter names this story explicitly), the full current source of `ArtifactEditor.tsx`, `Header.tsx`, `LogoutButton.tsx` and `src/app/admin/artifacts/page.tsx`, the previous story (17.3) for continuity, git history (no prior work on this concern), a repo-wide grep confirming no dirty/beforeunload/navigation-guard code exists today, the freshly measured lint baseline, and Next.js 16's own documentation for the `<Link onNavigate>` blocking pattern (read in full, since this codebase explicitly warns against assuming Pages-Router-era APIs).

### Agent Model Used

claude-sonnet-5-thinking-high (bmad-create-story)

### Debug Log References

### Completion Notes List

### File List
