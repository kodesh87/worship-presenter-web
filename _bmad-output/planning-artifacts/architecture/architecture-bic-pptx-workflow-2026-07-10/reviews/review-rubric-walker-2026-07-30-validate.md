lens: rubric-walker (good-spine checklist, independent fresh read) | target: `ARCHITECTURE-SPINE.md` (architecture-bic-pptx-workflow-2026-07-10) | run date: 2026-07-30

## Verdict

The spine is unusually rigorous and mostly self-consistent — the AD-11..AD-19 fold-in is clean, the Stack table and most file/line citations verify exactly against the real repository — but it ships one live, dated cross-artifact contradiction (`EXPERIENCE.md` still asserts the rule AD-16 reversed) that its own Deferred section fails to name, plus a wrong directory citation for the canvas editor, so it is **not yet a pass**.

## Checklist walk

| # | Criterion | Verdict |
| - | --- | --- |
| 1 | Fixes the real divergence points, misses none | Pass, with the gap in #8 |
| 2 | Every AD's Rule is enforceable, no permissive loopholes | Pass |
| 3 | Nothing under Deferred lets two units diverge | Pass |
| 4 | Named tech is verified-current | Pass |
| 5 | Ratifies rather than contradicts the codebase | Partial — see Finding 2 |
| 6 | Covers the driving spec's CAP-1..CAP-8 | Pass |
| 7 | Every structural dimension is decided/deferred/open | Partial — see Finding 4 |
| 8 | Internal cross-references are consistent | Fail — see Finding 1 |

## Findings

### 1. CRITICAL — `EXPERIENCE.md` still states the rule AD-16 reversed, and the spine's Deferred section doesn't name it

`AD-16` (Service-Bound Registry Snapshot) supersedes the "global across services" clause of `AD-14`, and the spine's own header says it was `updated: 2026-07-30` — today. But `EXPERIENCE.md` → *Venue & Projection Constraints* (line 153) still reads, as current design fact:

> "Registry edits are global and immediate. An administrator changing a template on Friday changes every service, including ones already reviewed. There is no per-service override, by design (AD-14). **Scheduled to reverse:** Epic 20 CAP-6 clones the registry per service and refreshes it only on Sync, which supersedes AD-4; this bullet and Flow 5's climax change with that amendment."

Two problems compound here: the reversal is framed as future ("Scheduled to reverse") even though AD-16 is already decided and dated the same day as this spine's last update, and the citation itself is wrong — it says AD-16 "supersedes AD-4" when AD-4 is LiveServer durable paths, an unrelated decision; the actual superseded clause belongs to AD-14. `epics.md` (Story 20.8 section, line 374) independently confirms this is a known, still-open gap: *"`EXPERIENCE.md` → Venue & Projection Constraints states the global-and-immediate rule, and Flow 5's climax turns on it. **Still outstanding** — this is what remains of Story 20.8's block."*

`AGENTS.md`'s own BMad gate requires exactly this kind of fix travel together: *"Change a structural invariant (auth gate, storage target, slide-order source, sync channel, schema path) → amend the architecture spine... never leave docs lying."* AD-16 is precisely such a change, and the companion document was not amended in the same change set. The spine's `Deferred` list has an entry that looks like it covers this — *"Whether a stale snapshot is surfaced to the operator, and how, is a UX concern owned by `EXPERIENCE.md`"* — but that entry is about a different, narrower question (staleness affordance for an existing service), not about the fact that `EXPERIENCE.md` currently contradicts the spine's core clone/sync behavior for **every** service, past and future.

A UX implementer who opens only `EXPERIENCE.md` (the authoritative source for flows, per `AGENTS.md`'s own Authority Map) will build Flow 5's climax around a rule the architecture spine has already reversed.

**Fix:** Add a `Deferred` (or better, a same-change-set) line item naming this exact contradiction — that `EXPERIENCE.md` line 153 and Flow 5 still encode the pre-AD-16 behavior — and correct `EXPERIENCE.md`'s citation from AD-4 to AD-16 while at it, since that citation is independently wrong regardless of timing.

### 2. HIGH — Canvas editor's directory is mis-cited; the Structural Seed tree omits it entirely

The `Capability → Architecture Map` row for CAP-3 says:

> `CAP-3 — full canvas authoring, General only | src/components/artifacts/, canvas editor | AD-22 ..., AD-13 (Fabric owns canvas state), AD-15 ...`

But the actual canvas editor — `ArtifactEditor.tsx`, the component `AD-13`'s Uncontrolled Wrapper pattern and `AD-22`'s per-kind authoring-authority rule both bind, and the file the spine's own `Deferred` section cites by exact line (`ArtifactEditor.tsx:104`) — lives at `src/components/admin/ArtifactEditor.tsx`. Verified: `src/components/artifacts/` contains only `ArtifactSlide.tsx`, the *renderer* that `AD-12`'s Fat Payload feeds and `AD-7` governs — a different component with a different governing decision.

The `Structural Seed` source tree compounds this: its `src/components/` line reads `# Header (shared nav/profile) + artifacts/ + ui/ shadcn` — it names `artifacts/` but never mentions `admin/` at all, even though that's where the one component central to AD-13/AD-22 actually sits. A builder using the map to locate "where the canvas editor lives" is pointed at the wrong directory, and a reviewer checking "does `admin/` need its own AD-5 matcher entry" would not know it exists from this tree.

**Fix:** Change the CAP-3 "Lives in" cell to `src/components/admin/` (or list both, disambiguated: `src/components/admin/ArtifactEditor.tsx` for the editor, `src/components/artifacts/ArtifactSlide.tsx` for the renderer), and add `admin/` to the Structural Seed tree's `src/components/` line.

### 3. MEDIUM — AD-19's "gone rather than renamed" vocabulary claim is stated as present fact but isn't shipped, unlike AD-21's parallel case

`AD-19`'s Rule states in the present tense: *"the kind vocabulary is exactly the three the SPEC fixes — `general`, `song-set`, `announcement`. `text-placeholder`, `image-placeholder`, `mix-placeholder` and `fullscreen-image` are **gone rather than renamed**."* Checked against `src/lib/registry/types.ts`, the shipped `ARTIFACT_BASE_TYPES` today is still the full seven-value set (`general`, `text-placeholder`, `fullscreen-image`, `image-placeholder`, `mix-placeholder`, `song-set`, `announcement`), and `READ_ONLY_BASE_TYPES` / `EDITABLE_BASE_TYPES` still partition all seven. This is expected — Epic 20's stories are all `backlog` per `sprint-status.yaml` — and `AD-18` does carry a nearby "Until first deploy... ships as a total replacement" framing that supplies context. But `AD-19` itself gets no equivalent explicit flag, whereas `AD-21` does exactly this for its own not-yet-shipped mechanism: *"AD-21's counter does not exist yet, and no story owns introducing it. The shipped mechanism is still the boolean `artifact_seed_hash_backfilled`..."* The inconsistency is in treatment, not substance: one Epic-20 decision names its shipped/unshipped gap explicitly in `Deferred`, the sibling decisions describing the same unshipped migration (AD-19, AD-20, AD-22) do not, so a reader skimming only the AD text (not `Deferred`, not `AD-18`) can mistake "decided" for "already true in `src/`."

**Fix:** Add one `Deferred` line, parallel to the AD-21 one, naming that AD-19/20/22 describe the target `base_type`/kind model and that `src/lib/registry/types.ts` still carries the seven-value pre-Epic-20 vocabulary until Story 20.1 lands.

### 4. MEDIUM — Backup / disaster-recovery of the durable SQLite store is a silent dimension

`AD-4` fixes host-durable paths for `DB_PATH`, the PPTX cache, and `UPLOADS_DIR` specifically to prevent **ephemeral container** data loss, and the registry inherits that durability story via AD-11/AD-16. Nowhere in the spine — not in an AD, not in `Deferred` — is backup cadence, restore procedure, or disk-failure recovery for that same durable path addressed, even though the system's stated purpose is Sabbath-service reliability and the registry is now (per Epic 20) the sole source of the ordered deck structure, not just a seed-recoverable template catalog. This is exactly the kind of operational dimension criterion 7 asks the initiative altitude to at least name, even if only to defer it explicitly (the way `Observability` is named and deliberately left at the `console.error` floor).

**Fix:** Add one line to `Deferred`, next to `Observability`, naming backup/restore of `DB_PATH` as an open ops item at this altitude — even a one-sentence "manual/none today, revisit before the registry becomes irreplaceable authored data" closes the silence.

### 5. LOW — `deferred-work.md`'s "nine routes" figure is now an approximate, possibly stale count

The spine's `Deferred` list cites: *"nine routes rely on the AD-5 proxy gate as their only enforcement layer, with no in-route `requireSession`... Tracked in `deferred-work.md`."* `deferred-work.md` (2026-07-26) names six route groups (`/api/services*`, `/api/hymns`, `/api/scripture`, `/api/announcements`, `/api/upload`, `/api/uploads/[filename]`). Counting actual `route.ts` files under those groups today gives eleven, not nine (`services` alone has four: `route.ts`, `preview/route.ts`, `[id]/route.ts`, `[id]/pptx/route.ts`). Not a spine-authored error — the number lives in the companion doc — but the spine repeats it without a "approximate" qualifier, and a reader treating the spine as load-bearing could under-scope a defense-in-depth pass planned against it.

**Fix:** Either drop the specific number from the spine (point at `deferred-work.md` for the count) or refresh it there and echo the corrected figure.

## Notes on what verified clean

- Stack table: every row (Next 16.2.10, React/React-DOM 19.2.4, better-sqlite3 ^12.11.1, pptxgenjs ^4.0.1, jszip ^3.10.1, fabric ^6.6.1, @base-ui/react ^1.6.0, eslint/eslint-config-next ^9/16.2.10) matches `package.json` exactly.
- `src/proxy.ts`, `tests/proxy-matcher.test.mjs`, `src/lib/registry/store.ts` (`expectedUpdatedAt` / `RegistryStaleError`, lines ~207-228), `src/lib/registry/validate.ts` (placeholder-key vocabulary), `src/lib/present-channel.ts`, `src/lib/db/index.ts` (`artifact_seed_hash_backfilled`), `src/lib/announcements.ts` (`service_id IS NULL OR service_id = ?`), and `ArtifactEditor.tsx:104` / `registry/store.ts:226` (both exact-line citations) all check out against the real source.
- All eight CAP-1..CAP-8 rows in the Capability → Architecture Map cite a governing AD; none is a hole.
- The AD-11..AD-19 renumbering table is internally consistent, and no stale `INIT AD-n` or `epic-16 AD-n` citation remains inside this file.
- No permissive-wording loophole found in any Rule clause; deliberate scope-limiting language (e.g., AD-16's "obliges nobody to keep an older snapshot renderable," AD-18's first-deploy waiver) is paired with an explicit boundary condition rather than left open-ended.
