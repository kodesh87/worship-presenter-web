---
lens: 'finalize_reviewers[0] — was every committed decision web-researched or reality-checked rather than asserted from training data?'
target: ARCHITECTURE-SPINE.md (AD-1..AD-22, post-trim)
run: 2026-07-30, Reviewer Gate under the Update intent
mode: sequential (subagents unauthorized this session)
---

# Version & reality check — post-trim spine

**Verdict: passes, with one honest gap and two deltas worth naming.** Nothing in this pass was
asserted from training data. Every factual claim added or changed today was grounded in the
repository before it was written, and two owner statements were checked against source rather than
taken at face value.

## Versions

The Stack table was re-verified **row by row** against `package.json` this run — all ten rows exact,
no drift:

| Spine | `package.json` |
| --- | --- |
| Next.js 16.2.10 | `next: 16.2.10` ✓ |
| React / React DOM 19.2.4 | `react` / `react-dom: 19.2.4` ✓ |
| TypeScript ^5 | `typescript: ^5` ✓ |
| Tailwind ^4 | `tailwindcss: ^4` ✓ |
| better-sqlite3 ^12.11.1 | ✓ |
| pptxgenjs ^4.0.1 | ✓ |
| jszip ^3.10.1 | ✓ |
| fabric ^6.6.1 | ✓ |
| @base-ui/react ^1.6.0 | ✓ |
| ESLint ^9 / eslint-config-next 16.2.10 | ✓ |

The note that read *"synced to it on 2026-07-29"* while the file said `updated: '2026-07-30'` has
been corrected to say what was actually done today.

**Gap, stated rather than hidden:** no *web* check was run this session — currency was confirmed
against the existing project, which is one of the three sanctioned sources for a brownfield spine.
No version is load-bearing for `AD-20`, `AD-21` or `AD-22`: none of the three names a library,
and `AD-21` explicitly declines a framework. So the residual risk is that a pinned version is
current-in-repo but stale-in-the-world, which this lens cannot settle without a web pass and which
no decision added today depends on.

## Reality checks run before writing

1. **`AD-21`'s mechanism.** The owner said layout position would be *"set di coding."* Rather than
   ask a third time, the claim was checked: the coordinates live in `data/default-registry.json`
   (`x`, `y`, `w`, `h` per element), **not** in TypeScript, and `AD-12` requires the plan to hydrate
   them from the registry. So *"in code"* means a developer authors the seed. Had it meant
   coordinates held by a renderer, the Design Paradigm, `AD-12` and `AD-20` would each have needed
   conscious amendment — recorded because the cheap reading would have contradicted three decisions
   silently.
2. **The SongSet layout description.** The owner described a verse marker above lyrics filling the
   top two-thirds. Verified against source: `src/lib/lyrics.ts` emits the label
   (`n/total` at line 384, `Reff` 386, `Chorus` 388) and the seed's `lyric` layout binds `label` at
   `y=3.33` with `lyrics` at `y=20.37, h=52.36`. The description is what already ships. Two facts it
   omitted were recorded for the seed author: `Chorus` exists alongside `Reff`, and header-less
   lyrics yield an **empty** label (413) or `1/1` (452), so the label element must tolerate empty and
   must stay `required: false`.
3. **Startup DDL idempotence**, before claiming schema needs no compaction rule:
   `src/lib/db/index.ts` is `CREATE TABLE IF NOT EXISTS` throughout with per-column guarded
   `ALTER TABLE`. Confirmed — compaction is a data-channel concern only.
4. **The seed's current shape**, before recording the closed six-key set: `data/default-registry.json`
   holds **one** `song-set` row (`baseType: song-set`, placeholders `hymnNumber`, `songTitle`,
   `label`, `lyrics`, layouts `title` and `lyric`). The four slot keys are a real restructure of that
   single row, not a rename.

## Two deltas between the spine and shipped code

Both are forward decisions, not contradictions — but a reader should not assume the code already
matches.

### V1 — MEDIUM · `AD-21`'s counter does not exist, and nothing names its owner

The shipped mechanism is still the boolean `artifact_seed_hash_backfilled`
(`src/lib/db/index.ts:13`) — the very shape `AD-21` supersedes. No story, `Deferred` item or action
item names *introduce the version counter and retire the boolean*. `AD-18`'s "until first deploy"
clause implies the compaction into version 1 but does not assign it. The `Deferred` entry about
`seed_hash` is a different mechanism and does not cover this.

**Fix:** a `Deferred` entry naming the work and the story that owns it, in the form the section
already uses for `reseedArtifactTemplateIfUntouched`.

### V2 — INFO · `AD-22` ratifies shipped behaviour for one half and loosens it for the other

Verified in source: `song-set` and `announcement` are both in `READ_ONLY_BASE_TYPES`
(`src/lib/registry/types.ts:13`), and the editor honours it — `ArtifactEditor.tsx:104` returns null,
`:775` sets `isEditable = false`, and `store.ts:226` refuses a write unless `allowReadOnly`.

So `AD-22`'s *"not free canvas"* half **ratifies what ships**, which is what a brownfield spine
should do. Its *bounded configuration surface* half **extends** it: today a `song-set` row admits no
administrator edit at all. Those three sites are where the loosening lands, and the spine should not
be read as describing current behaviour there. Recorded, not raised as a defect — `AD-22` is a
decision about Epic 20, and Epic 20 has not shipped.
