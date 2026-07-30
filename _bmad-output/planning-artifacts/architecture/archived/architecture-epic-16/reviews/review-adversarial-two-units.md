# Review — Adversarial: Two Compliant Units That Still Diverge

**Spine:** `ARCHITECTURE-SPINE.md` (epic altitude, Epic 16)
**Lens:** `finalize_reviewers[1]` — construct compliant-yet-incompatible pairs
**Date:** 2026-07-29
**Verdict:** ONE REAL HOLE (E6, validation bypass on the non-canvas write path), one low-severity rounding divergence.

## Attack constructions

### E6 (MEDIUM-HIGH) — Two persistence paths, only one of them validated

- **Unit A:** the Canvas Editor save API. AD-5 binds it: "Canvas serialization is untrusted and must pass strict structural and image-reference validation before persistence." Compliant ✅
- **Unit B:** a seed importer or asset-extraction script writing registry rows directly (AD-1 blesses a seed path; AD-5's validation clause is scoped to **canvas serialization**, which Unit B does not produce).
- **Divergence:** Unit B persists a template with an element key outside `ALLOWED_ELEMENT_KEYS`, or an image ref that `isRegistryImageRef` would reject. Both units obey every AD as written.
- **Damage:** an invalid or unsafe template reaches the renderers through the back door, and the canvas editor then round-trips it as if it had been validated.
- **Not hypothetical:** `deferred-work.md` records that closing the `offering-tithe` QR gap "needs an asset-extraction step first, then an `image` element" — i.e. a second writer of registry content is already on the roadmap.
- **Close with:** widen AD-5's validation clause from *canvas serialization* to *every write path into the registry*, seed and script included.

### E7 (LOW) — Two renderers, two rounding behaviors

- **Unit A:** `SlideView` consumes normalized percentages directly (CSS %).
- **Unit B:** `pptx.ts` converts percentages to inches for pptxgenjs.
- **Divergence:** AD-5 fixes the coordinate space but not conversion or rounding, so the two surfaces can land a box a fraction of a percent apart.
- **Damage:** sub-pixel; invisible in practice. Genuine divergence, but not worth an AD — the Fat Payload (AD-2) already guarantees both read identical source numbers.
- **Disposition:** note only, no change.

## What survived the attack

- **AD-1** (SQLite live + JSON seed, never overwriting persisted edits) held — I could not construct a compliant pair that disagrees on who wins between seed and persisted state.
- **AD-2** (Fat Payload) held, and is the strongest AD here: it structurally forbids the classic "each renderer looks things up itself" divergence.
- **AD-3** (Fabric owns canvas state; React reads on save) held.
- **AD-4** (global templates, admin-only, DB role re-check, server-side read path) held — and note it is doing work the *parent* spine should have fixed (see the initiative spine's rubric finding F1).

## Inherited-invariant attack

Checked each local AD against INIT AD-1..INIT AD-4 for weakening:

| Local AD | Weakens an inherited invariant? |
| --- | --- |
| AD-1 | **Yes, in its rationale** — names Vercel, contradicting INIT AD-4's LiveServer/Docker reality. Rule itself is compatible. Fixed. |
| AD-2 | No — a hydrated payload strengthens INIT AD-1 (offline PPTX needs no lookups at render time). |
| AD-3 | No. |
| AD-4 | No — specializes the (previously undocumented) parent authorization rule. |
| AD-5 | No. |
