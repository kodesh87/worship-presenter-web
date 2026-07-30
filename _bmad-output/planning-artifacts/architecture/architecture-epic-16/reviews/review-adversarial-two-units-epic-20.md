# Reviewer Gate — adversarial two-units lens (Epic 20 amendment, 2026-07-30)

Configured lens: *construct two units one level down that each obey every AD to the letter yet
still build incompatibly.* Each pair below is a hole, or an attempt that failed to find one —
the failures are recorded too, so a later reader knows the ground was walked.

**Verdict: two incompatible pairs found, both real.**

## Pair 1 — Sync Artifact: 409 or overwrite? (HIGH, same finding as rubric HIGH-1)

- **Unit A** builds Sync Artifact as an ordinary service mutation: the client sends the service's
  `updated_at`, a stale value gets HTTP 409, the operator re-reads and retries.
- **Unit B** builds Sync Artifact as an idempotent re-clone: no precondition, last writer wins,
  because AD-6 says the re-clone is "destructive" and mentions no precondition.

Both obey AD-6 literally. Both obey AD-5. Neither obeys the *other*. And B silently erases the
case INIT AD-6 exists to prevent — an operator's service edit destroyed by a concurrent action —
which is aggravated by the owner's decision that Sync is allowed on an already-presented service.

Root cause: **INIT AD-6 is not in the Inherited Invariants table**, so a builder reading only this
spine has no reason to look for it. The registry code already implements the pattern
(`RegistryStaleError`, `expectedUpdatedAt`), so the pair is not hypothetical — A is what the
existing code would suggest and B is what AD-6's own wording suggests.

**Close it:** inherit INIT AD-6 explicitly, and make AD-6 say Sync carries the precondition.

## Pair 2 — the SongSet hymn-number binding key (HIGH, same as rubric HIGH-2)

- **Unit A** (registry authoring) stores the four slots as ordinary ordered rows and treats
  `label` as the human handle, since CAP-2 makes label editable.
- **Unit B** (worship-service settings form) needs to bind four hymn numbers to four slots and
  keys them by **position** — slot 1 is the first SongSet row — because position is what the
  ordered registry made canonical.

Both obey every AD. Then an admin reorders Divine Service before Bible Talk (which CAP-8's own
success clause explicitly invites: *"Reordering the four SongSet rows changes Presenter
sequence"*), and every service's hymn numbers are now bound to the wrong songs. Nothing errors.
The congregation sees the closing hymn at the opening.

A third unit could key on `label`, which breaks on rename instead of on reorder.

**Close it:** fix that the binding is by stable slot identity, opaque to both label and order.

## Pair 3 — the Placeholder Catalog key set (MED, same as rubric MED-1)

- **Unit A** (canvas editor) offers "Insert placeholder" from a hard-coded client list.
- **Unit B** (save API) validates structure and image refs per AD-5 and accepts any string as a
  placeholder key, because AD-5 fixes ID *stability*, not the *admitted key set*.

Both comply. A shipped UI can then never invent a key — but any other writer into the registry
can, including the import/asset-extraction script AD-5 itself anticipates as a second writer.
CAP-4's *"UI cannot invent new catalog keys"* is satisfied while the boundary it is protecting is
not, and an unadmitted key is precisely a channel for arbitrary congregation text.

**Close it:** the admitted catalog key set is server-side vocabulary, validated on every write
path — the same treatment AD-5 gave image refs.

## Attempts that found nothing (recorded so the ground is not re-walked)

- **Two writers into one snapshot.** Service create clones; Sync re-clones. Both are AD-6 write
  paths and both validate under AD-5. No third writer is admitted, and no renderer can reach a
  snapshot. Clean — apart from Pair 1's precondition question.
- **Order source split.** AD-6 makes the snapshot the sequence *input* while INIT AD-7 keeps
  `buildSlidePlan` the only order *source*. A builder cannot read this as licence to order
  slides in a renderer; the diagram's dotted no-access edges reinforce it. Clean.
- **Does AD-7 break Reset?** Checked against code, not assumed: `loadSeedTemplates()` reads the
  seed file and caches per process (`src/lib/registry/seed.ts:55`) independently of any marker,
  so an explicit Reset still has seed content to restore after bootstrap has been marked done.
  AD-1's Reset clause survives AD-7 intact. Clean.
- **AD-7 vs AD-8 overlap.** AD-7 removes boot as a write channel; AD-8 supplies the replacement
  channel and confines it. They compose without a gap: there is exactly one way for shipped
  content to reach a persisted row, and it is explicit. Clean.
- **AD-8's pre-live waiver vs AD-6's snapshots.** Pre-first-deploy there are no live rows *and* no
  snapshots, so the waiver cannot leave a snapshot behind at a stale vocabulary. The waiver's
  expiry text already names snapshots as post-expiry migration scope. Clean.

## One consequence that is not a hole but must not be discovered by an operator

Under AD-7 the administrator owns `label`, but AD-1's Reset restores the shipped template —
**including its label**. So Reset silently reverts a rename. That is defensible (Reset means
"restore what we shipped") but it is now a visible operator surprise where before Epic 20 labels
were not admin-owned. It belongs in `EXPERIENCE.md` with the Reset affordance, not in an `AD`.
