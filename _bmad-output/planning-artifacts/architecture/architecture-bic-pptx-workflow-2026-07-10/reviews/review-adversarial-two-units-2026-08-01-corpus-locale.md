# Reviewer Gate — adversarial two-units lens

**Run:** `bmad-architecture` Update, 2026-08-01 (corpus + locale; AD-25, AD-26, AD-27)
**Target:** `ARCHITECTURE-SPINE.md`
**Lens:** *"Construct two units one level down that each obey every AD to the letter yet still build incompatibly."*
**Verdict:** four holes found, all four closed in the same run. The draft's `Prevents` clauses were right about the divergence they named and silent about four adjacent ones.

The two units are real rather than hypothetical, which is what made this lens productive: Epic 21 (bible) and Epic 22 (hymns) are cut into **separate worktrees on purpose**, and the run's own opening finding is that they have *already* answered one architectural question two different ways in shipped code.

---

## F1 — CRITICAL. "Rows absent from the file are removed" deletes the corpus when the file will not open

**Attack.** Unit A implements AD-25's complete reconcile literally: read the file, diff, delete what is not in it. The file is missing, truncated by a bad merge, or fails validation. It contributes zero rows. The reconcile deletes all 695 hymns — on a boot, with no operator involved.

Unit B reads the same rule and treats an unreadable file as "skip this corpus". Both are faithful. One of them empties the song book on a Sabbath morning.

**Why the draft did not catch it.** The rule was written from the correction case (a title changes, a hymn is withdrawn) and never from the failure case. The word *absent* silently covers two very different states — *the file says this row is gone* and *there is no file* — and only one of them is evidence.

**Disposition — fixed.** AD-25 gains a clause forbidding the literal reading: a corpus whose file is missing, unparseable or refused **does not reconcile at all**, the table is left as it stands, and the failure is loud with the corpus and the reason named. Removal is what the reconcile does *having read a good file*; never what it does having read nothing. This is the posture AD-5, AD-8 and AD-17 already take, and the shipped loader already throws (`src/lib/corpus.ts:64-79`), so the fix ratifies existing behaviour rather than inventing one.

---

## F2 — HIGH. A content row whose corpus is not registered

**Attack.** AD-26 adds a registry row per corpus; AD-25 reconciles content rows. Unit A writes the registry row first, Unit B writes it last, and either way a boot that fails partway leaves `hymns` rows carrying a `song_book_code` with no row in `song_books` — or a registered corpus with no content. Nothing in the draft said the two were one operation.

**Disposition — fixed.** AD-25 now states the corpus is the **atomic unit**: registry row and content rows reconcile in one transaction, so a partial boot leaves neither half applied.

---

## F3 — HIGH. "Globally unique" with no enforcer, and last-wins is the default a builder reaches for

**Attack.** AD-26 says the corpus code is globally unique across locales. Two files — `data/en/song-book/sdah.json` and `data/id/song-book/sdah.json`, each honestly declaring its own directory's locale — satisfy the declared-locale check and violate uniqueness. Unit A refuses the boot; Unit B takes whichever reconciled last. Last-wins on a key is exactly what AD-19 forbids for the slot identity it calls this same class of value.

Note the locale-directory check does **not** subsume this: it catches the copied file that kept its old declared locale, and misses the pair that each declare truthfully.

**Disposition — fixed.** AD-26 states the enforcer: two files declaring one code make the boot refuse, naming both paths.

---

## F4 — MEDIUM. A `default_*` setting pointing at a corpus that is no longer installed

**Attack.** AD-25 makes uninstalling a corpus as cheap as deleting a file. `default_song_book` still names it. Unit A fails closed and the picker errors; Unit B silently rewrites the setting to `SDAH`. The second loses the administrator's choice permanently and says nothing.

**Disposition — fixed.** AD-26 answers it on AD-19's own precedent — *a binding whose slot row has been deleted is inert, not an error* — applied to the other end of the same kind of key: the surface falls back and says the configured corpus is not installed, and **the setting is not rewritten**, so re-installing restores the choice.

---

## Attacks that did not land

- **Locale reaching a query.** AD-26's *locale is never part of a key* closes it structurally rather than by discipline — no key contains a locale, so no read path can need one. This is stronger than the PRD's phrasing of the same rule and is the draft's best clause.
- **Two corpora, same code, same locale directory.** Impossible: the path is `<code>.json` within one directory.
- **Book names surviving their translation's removal.** They carry the translation code, so AD-25's reconcile reaches them — once its `Binds` was restated by property rather than as today's table list (see the data-integrity review, F6).
- **`hymn` kept as the entry term while `song-book` is the container.** Deliberate, argued from an external contract (`resolvedHymns`), and consistent with AD-3.

## Standing note for the next run

Three of the four findings are the same failure in different clothes: **a rule stated from its success case, silent on its failure case.** F1 (no file), F3 (duplicate key), F4 (dangling reference) are all "what does this do when the input is wrong", and the draft answered none of them until attacked. This spine already carries a pattern entry about lists-versus-criteria; this is a second one worth watching — *write the `Prevents` from the failure, not from the happy path.*
