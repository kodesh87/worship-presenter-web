# Review — lens: version/reality-check | target: ARCHITECTURE-SPINE.md | run date: 2026-07-30

**Verdict:** The spine's Stack table matches `package.json` and the lockfile exactly with zero drift, and every spot-checked file/function/constant/line citation resolves to real, matching code, except one structural-seed path claim (`src/components/artifacts/` as the canvas editor's home) that is off by a directory.

## Versions — spine claim vs package.json / lockfile reality

| Name | Spine claim | package.json | package-lock.json resolved | Match |
| --- | --- | --- | --- | --- |
| Node.js | v20+ | no `engines` field; `@types/node: ^20` (dev env is actually v22.20.0) | n/a | Not independently verifiable from package.json alone — inferred from `@types/node`. No `.nvmrc`/`.node-version` file exists to cross-check. LOW confidence claim, not contradicted. |
| Next.js | 16.2.10 | `16.2.10` | `16.2.10` | Match |
| React / React DOM | 19.2.4 | `19.2.4` / `19.2.4` | `19.2.4` / `19.2.4` | Match |
| TypeScript | ^5 (strict) | `^5` | `5.9.3` | Match (range) |
| Tailwind CSS | ^4 | `^4` | `4.3.3` | Match (range) |
| better-sqlite3 | ^12.11.1 | `^12.11.1` | `12.11.1` | Match |
| pptxgenjs | ^4.0.1 | `^4.0.1` | `4.0.1` | Match |
| jszip | ^3.10.1 | `^3.10.1` | `3.10.1` | Match |
| fabric | ^6.6.1 | `^6.6.1` | `6.6.1` | Match |
| @base-ui/react | ^1.6.0 | `^1.6.0` | `1.6.0` | Match |
| ESLint / eslint-config-next | ^9 / 16.2.10 | `^9` / `16.2.10` | `9.39.5` / `16.2.10` | Match |

No version drift found anywhere in the table. The spine's own footnote ("re-verified row by row against it on 2026-07-30 with no drift found") checks out against both the manifest and the resolved lockfile, which is a stronger check than the manifest alone (a caret range could have drifted at install time; it did not).

Real-world plausibility check (web search, since these versions are dated after this assistant's training cutoff):
- Next.js 16.2.10 is a real, current release (per `github.com/vercel/next.js/releases/tag/v16.2.10` and the Next.js blog) — described as a republish of `@next/swc-wasm-web` with no functional changes since 16.2.4. Consistent with a "current stable patch" pin.
- React 19.2.4 is real, released 2026-01-26. Newer 19.2.x patches exist as of the review date (19.2.5 March, 19.2.6 May, 19.2.7 June 2026) that the caret range `^19.2.4` would admit — but the lockfile shows `19.2.4` is what's actually resolved and installed, so this is an intentional/dormant pin rather than drift. Worth a note for the team (see Deltas), not a defect in the spine.
- No named technology in the Stack table is fictitious, abandoned, or a mismatched fit for the stated architecture (Next.js App Router monolith, SQLite via better-sqlite3, PptxGenJS for offline decks, Fabric.js for an uncontrolled canvas editor, @base-ui/react/shadcn for UI). All are live, appropriate choices for this design paradigm.

## Reality checks run (file/function/line-level claims vs actual source)

| Claim in spine | Location cited | Verified against | Result |
| --- | --- | --- | --- |
| `expectedUpdatedAt` / `RegistryStaleError` shape (AD-6) | `src/lib/registry/store.ts` | Lines 20, 207, 223-224, 254-272 | Confirmed: `RegistryStaleError` class exists; `updateArtifactTemplate` takes `expectedUpdatedAt` and throws `RegistryStaleError` on mismatch. |
| `buildSlidePlan` is the single order/layout source (AD-7, AD-12) | implied `slide-plan.ts` | `src/lib/slide-plan.ts` | Confirmed: this is the only file exporting `buildSlidePlan`. |
| `READ_ONLY_BASE_TYPES` / `EDITABLE_BASE_TYPES` (AD-18, deferred note) | `src/lib/registry/types.ts` | Lines 13-24 | Confirmed verbatim: `READ_ONLY_BASE_TYPES = {fullscreen-image, song-set, announcement}`, `EDITABLE_BASE_TYPES = {general, text-placeholder, image-placeholder, mix-placeholder}`. |
| Seven-`base_type` vocabulary not yet collapsed to three kinds (AD-18/AD-19, deferred note) | `src/lib/registry/types.ts` | Lines 1-9 (`ARTIFACT_BASE_TYPES`) | Confirmed: all seven original base types (`general`, `text-placeholder`, `fullscreen-image`, `image-placeholder`, `mix-placeholder`, `song-set`, `announcement`) are still live in code. The spine is correct to describe the three-kind vocabulary as a **future/decided-but-unshipped** state, and its Deferred section says so explicitly — this is consistent, not a contradiction. |
| `ArtifactEditor.tsx:104` refuses edits to read-only base types | `src/components/admin/ArtifactEditor.tsx` | Line 104: `if (READ_ONLY_BASE_TYPES.has(template.baseType)) return null;` | Confirmed exact line match. |
| `registry/store.ts:226` refuses read-only writes | `src/lib/registry/store.ts` | Line 226: `if (!options?.allowReadOnly && READ_ONLY_BASE_TYPES.has(existing.baseType))` | Confirmed exact line match. |
| `artifact_seed_hash_backfilled` boolean marker (AD-21 supersession note, deferred note) | `src/lib/db/index.ts` | Line 13: `const SEED_HASH_BACKFILL_KEY = 'artifact_seed_hash_backfilled';` | Confirmed. Also confirmed (via `settings` table grep) that only this boolean marker exists in `settings` today — no monotonic version counter yet, matching the spine's explicit claim that "AD-21's counter does not exist yet." |
| `reseedArtifactTemplateIfUntouched` self-healing reseed path, and the test that must be inverted (deferred note) | `src/lib/registry/seed.ts`, `tests/registry-reseed.test.mjs` | Function found in `seed.ts`; test file line 337 (`'a missing row is inserted with its seed hash recorded'`, asserting `report.inserted` contains the missing template) | Confirmed: the function and the test both currently implement/assert *reinsertion of a missing row* — exactly the behavior AD-17 says must eventually be forbidden and the test inverted. Spine's characterization of this as a **not-yet-landed** consequence of AD-17 is accurate. |
| AD-5 request-gate specifics: `Cache-Control: private, no-store`, `Vary: Cookie`, `WEBHOOK_SECRET`-only gate on `/api/webhook`, `safeNextPath` | `src/proxy.ts` | Lines 34-35 (headers), 44 (`safeNextPath` import/use), 112 (webhook comment) | Confirmed all four details present as described. |
| `src/proxy.ts` is a real file, not `middleware.ts` | repo root/src | `src/proxy.ts` exists; no `middleware.ts` found | Confirmed. |
| `data/default-registry.json` (shipped seed) exists | `data/` | File exists | Confirmed. |
| `src/lib/announcements.ts` (CAP-7) exists | `src/lib/` | File exists | Confirmed. |
| Registry module set matches "Boundaries" convention (`src/lib/registry/*`) | `src/lib/registry/` | Directory listing: `asset-safety.ts`, `seed.ts`, `store.ts`, `types.ts`, `validate.ts` | Confirmed — registry logic is contained there, not in route handlers, per the stated convention. |

## Deltas between spine and shipped code

- **LOW — Structural Seed path for the canvas editor is stale.** The spine's ASCII tree (`src/components/    # Header ... + artifacts/ + ui/ shadcn`) and the Capability→Architecture table (CAP-3 "Lives in `src/components/artifacts/`, canvas editor") both point at `src/components/artifacts/` as where the canvas editor lives. In the actual tree, `src/components/artifacts/` contains only `ArtifactSlide.tsx` (a render-side slide component); the canvas editor itself (`ArtifactEditor.tsx`, the file the spine's own Deferred section correctly cites at `ArtifactEditor.tsx:104`) lives in `src/components/admin/`. This is an internal inconsistency inside the spine itself, not just a code/doc drift — the Deferred section cites the right path while the Structural Seed and Capability table cite the wrong directory for the same file. Low severity because it doesn't change any invariant, only a "lives in" pointer, but worth a one-line fix so a future reader doesn't go looking in the wrong folder.

- **INFO — React patch pin is intentionally behind latest available minor patches.** `react`/`react-dom` are pinned to `19.2.4` (exact version, not a caret range) and the lockfile confirms `19.2.4` is what's resolved, even though `19.2.5`/`19.2.6`/`19.2.7` exist upstream as of the review date. This is fine as a deliberate pin, but the Stack table doesn't flag it as intentional (unlike, say, the caret-range entries elsewhere) — worth a one-line note in the spine or `package.json` comment if the exact pin (vs. an unpinned `^19.2.4`) was a deliberate stability choice, so a future contributor doesn't "helpfully" bump it without knowing why.

- **INFO — `Node.js v20+` claim in Stack table is unverified by any manifest artifact.** No `engines` field in `package.json`, no `.nvmrc`/`.node-version`. The claim is a reasonable inference from `@types/node: ^20`, and the actual dev environment observed here runs Node v22.20.0 (compatible with "v20+"), but there's no enforced floor. Not a contradiction — just an unenforced claim; adding an `engines.node` field would make this row verifiable rather than asserted.

- **INFO (expected, not a defect) — Several AD-18/AD-19/AD-21/AD-22 claims describe intended-but-unshipped state, and the spine says so explicitly.** The seven-value `base_type` vocabulary, the `READ_ONLY_BASE_TYPES` gate on `song-set`/`announcement` rows, the boolean seed-hash marker (not yet a version counter), and the self-healing reseed test (not yet inverted) are all still live in the code exactly as the spine's own "Deferred" section says. These are forward-looking architecture decisions correctly labeled as not-yet-landed, not stale documentation — flagged here only for completeness of the reality check, matching the task's instruction to call these out explicitly rather than let them read as shipped.
