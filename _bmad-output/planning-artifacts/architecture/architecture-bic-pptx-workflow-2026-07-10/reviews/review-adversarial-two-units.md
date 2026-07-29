# Review — Adversarial: Two Compliant Units That Still Diverge

**Spine:** `ARCHITECTURE-SPINE.md` (initiative altitude)
**Lens:** `finalize_reviewers[1]` — "construct two units one level down that each obey every AD to the letter yet still build incompatibly"
**Date:** 2026-07-29
**Verdict:** SIX HOLES FOUND. Each pair below obeys AD-1 through AD-4 completely and still produces an incompatible system. Five map onto rubric findings; C4 and C6 are unique to this lens.

## Attack constructions

### C1 — Two writers of one service row *(→ rubric F2)*

- **Unit A:** `/api/webhook` intake writes a corrected rundown (AD-3: JSON interface, input-agnostic ✅).
- **Unit B:** the hub edit form PATCHes the same service (AD-1: Web Hub review ✅).
- **Divergence:** A implements last-write-wins; B implements an `updated_at` precondition returning 409. Both are fully AD-compliant — no AD arbitrates concurrent writes.
- **Damage:** an operator's Friday edit silently erased by a late Telegram correction, discovered on Sabbath.
- **Close with:** AD-6.

### C2 — Two authorization implementations *(→ rubric F1)*

- **Unit A:** `/api/admin/artifacts` calls `requireAdminSession` (DB re-check).
- **Unit B:** a new `/api/admin/accounts`-style route trusts the cookie's `role` claim.
- **Divergence:** both obey AD-1..AD-4, which say nothing about authorization. B grants admin to a demoted account until its cookie expires.
- **Damage:** privilege escalation after demotion; a revoked session still authorized.
- **Aggravating:** `deferred-work.md` records that nine API routes (`/api/services*`, `/api/hymns`, `/api/scripture`, `/api/announcements`, `/api/upload`, `/api/uploads/[filename]`) carry **no in-route authorization at all** and rely solely on the proxy gate — so the single-layer assumption is already load-bearing and undocumented.
- **Close with:** AD-5.

### C3 — Two slide-order sources *(→ rubric F3)*

- **Unit A:** the PPTX generator consumes `buildSlidePlan`.
- **Unit B:** the projector view recomputes order from service fields (AD-1 blesses the offline path; nothing binds B to the same plan).
- **Divergence:** projector shows slide 7 while the PPTX has it at 9.
- **Damage:** operator and congregation see different slides mid-service.
- **Close with:** AD-7.

### C4 — Two image-reference resolvers *(unique to this lens)*

- **Unit A:** announcement images resolve through `isSafeImageUrl` (allowlisted http(s) or `/api/uploads/<32-hex>.(ext)`) — AD-4's clause ✅.
- **Unit B:** the Epic 16 registry resolves `/assets/...` through `isRegistryImageRef` — a *different* helper with different rules, and AD-4 never claimed exclusivity.
- **Divergence:** a third unit (e.g. a future hymn-background picker) writes resolver #3 admitting `data:` URIs or unbounded remote hosts. Every unit is AD-compliant.
- **Damage:** SSRF or arbitrary-content injection reintroduced through the newest surface, while the audited paths stay clean.
- **Note:** the existence of two resolvers today is *legitimate* (different reference vocabularies) — the hole is that nothing forbids resolver #3 or requires new ones to be centrally reviewed.
- **Close with:** AD-8.

### C5 — Two schema-evolution paths *(→ rubric F6)*

- **Unit A:** adds a table via startup DDL in the `getDb` path.
- **Unit B:** introduces a migration framework for its own tables.
- **Divergence:** two sources of schema truth; a fresh container bootstraps one and not the other.
- **Damage:** production SQLite diverges from a dev machine in a way neither unit can detect.
- **Close with:** AD-9.

### C6 — Two owners of the presenter sync channel *(unique to this lens)*

- **Unit A:** presenter → projector sync via `@/lib/present-channel` (`BroadcastChannel`).
- **Unit B:** the slideshow surface, wanting the same follow-along behavior, opens its own `BroadcastChannel` with its own channel name and message shape.
- **Divergence:** the spine never mentions `BroadcastChannel` at all — only `project-context.md` does ("do not introduce a server realtime channel unless product direction changes"). Both units are AD-compliant.
- **Damage:** sync silently splits — the projector follows one controller and ignores the other, with no error surfaced.
- **Close with:** AD-10.

## What survived the attack

AD-1 (offline PPTX primacy), AD-2 (single repo/deployable), AD-3 (ingestion↔presentation JSON boundary), and AD-4 (durable host paths) each held: I could not construct a compliant pair that diverges on *those* concerns. The holes are all dimensions the spine left silent, not rules it stated weakly.
