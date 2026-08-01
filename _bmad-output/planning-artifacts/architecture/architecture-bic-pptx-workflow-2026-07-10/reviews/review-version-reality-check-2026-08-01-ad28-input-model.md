# Reviewer Gate — Version / Reality Check

**Run:** 2026-08-01 architecture Update, AD-28 (scripture input model)
**Lens (configured `finalize_reviewers[0]`):** every committed decision web-researched or reality-checked rather than asserted from training data.
**Verdict:** **AD-28 names no technology at all** — no library, no framework, no starter — so the version half of this lens has nothing to bind. Every claim it makes is a claim about *this repository*, and all of them were re-measured at this run rather than inherited. **Two findings, both LOW, both corrections to inherited citations rather than to decisions.**

---

## Scope note — why the version half is empty, stated rather than left blank

An empty finding list from this lens usually means the lens was skipped. It was not. AD-28 fixes a resolution rule, a scope parameter, an alias ownership boundary and a column removal. It introduces no dependency, and it does not lean on a starter. The **Stack table is untouched by this change** and its standing currency gaps (four rows a major behind, the `next@16.2.10` security bump, the Node 22 maintenance-LTS row, `@types/node` pinned to the retired runtime) are unchanged and remain in *Deferred* — none of them is affected by, or affects, AD-28.

## Claims re-measured at this run

| Claim in AD-28 | Verified against | Result |
|---|---|---|
| The book-name group appears at exactly three sites | repo-wide search of `src/`, `tests/`, `scripts/` | ✅ `scripture.ts:42`, `parser.ts:152`, `parser.ts:162`, no fourth |
| `shortName` reaches the sites the proposal listed | grep | ✅ all present (`corpus.ts:27/108/134`, `db/index.ts:100-104/117/227`, `scripture.ts:87-88`, `verify-corpora.mjs:71-72`, `tests/scripture.test.mjs:24/37/40`) |
| `/api/scripture` and `/api/hymns` are gated by default | `src/proxy.ts:122` | ✅ exclusions are `api/webhook`, `api/auth/login`, `api/auth/logout`, `login`, `assets`, `_next/static`, `_next/image`, `favicon.ico` |
| `bible_books` is AD-25's stated exception | `ARCHITECTURE-SPINE.md` AD-25 `Binds`, AD-27 ¶2 | ✅ — see V1 |
| The Correct Course is approved | `sprint-change-proposal-2026-08-01-input-model.md` frontmatter | ✅ `status: approved`, `approved_by: kodesh87` |
| PR #17 carrying it is merged | `gh pr list` | ✅ merged; `origin/main` at `5f2c6fa` |
| Story 21.4's rewritten AC survives the corpus correction | `epics.md:531`, `:535` | ✅ still owed, explicitly |
| `Ps`/`1 Cor`/`Song` prefix their books; `Kis` prefixes `Kisah Para Rasul` | `data/bible/kjv.json` (66 books) | ✅ for KJV; the `Kis` case is TB and is not installed, so it rests on the sabda.org names the previous run verified |

## V1 — LOW — the approved proposal justified the `shortName` drop through a rule that excepts the very table it names

The proposal says the drop is free because *under AD-25 a corpus table is a projection of its committed file*. `bible_books` is **the one table AD-25 excepts from itself** (its `Binds`: *"`bible_books` is the one exception and AD-27 says why: the canonical identity is application-fixed, not corpus-derived"*), and AD-27 adds that the canonical list *"does not travel through AD-25's channel"* at all.

The conclusion is still right — the drop is free — but on a different leg: `bible_books` is AD-9 startup DDL, and it is free **because AD-4 records that no deployment exists**, the same pre-first-deploy licence AD-18 carries.

This is the third time this file has been bitten by a right conclusion resting on a refutable reason (the Next CVE non-applicability argument and the `useLayoutEffect` reasoning being the other two), and the cost here is concrete: a builder following the proposal goes looking for a reconcile that does not govern this table.

**Fixed:** corrected in writing inside AD-28's `shortName` clause rather than silently, and recorded in the memlog as a `correction`.

## V2 — LOW — an inherited line citation points one line-range early

The proposal and Story 21.5 both cite `src/proxy.ts:101` for the exclusion list. `:101` opens the explanatory comment block; the matcher regex itself — the thing that *is* the authorization boundary under AD-5 — is at **`:122`**.

Harmless to a reader who scrolls, and worth correcting anyway, because AD-5's whole posture is that the regex is the boundary and this file's recorded failure mode is citations that rot into pointing at unrelated content.

**Fixed:** AD-28 cites `:122` and names `:101` as the comment opening, so both readings resolve.

## Not verified, and named rather than left implicit

The Indonesian *Terjemahan Baru* book names underpinning the hyphen and three-word findings (`Kisah Para Rasul`, `Hakim-hakim`, `1 Raja-raja`) were verified at `sabda.org` by the **previous** run and were not re-verified here — **no TB corpus is installed**, so there is nothing in this repository to measure them against. AD-28 does not depend on them for any rule: they motivate the retirement of the regex, which is independently forced by `Song of Solomon` in the shipped KJV. Recorded so that "all claims measured" is not read as covering a claim that no longer can be, until Story 21.3 or a TB corpus lands.
