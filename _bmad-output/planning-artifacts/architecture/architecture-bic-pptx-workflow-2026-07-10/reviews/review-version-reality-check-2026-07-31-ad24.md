# Version / Reality-Check Review — AD-24 amendment

- **Target:** `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
- **Lens:** VERSION / REALITY-CHECK — was every committed claim web-researched or reality-checked, or asserted from training data?
- **Run:** UPDATE (AD-24 / Story 17.1 amendment), 2026-07-31
- **Scope:** the `next-themes` Stack row, AD-24's three rules and its two supporting notes, the `next-themes` *Deferred* item, the Stack table's zero-drift claim, and every file:line citation the amendment introduced.
- **Method:** npm registry API + GitHub REST API for upstream facts; `node_modules/next-themes/dist/index.mjs` for the behavioural claim; direct read/grep of `src/`, `tests/`, `package.json` for every citation.

## Verdict

**PASS with four findings, none blocking.** This is the strongest-sourced amendment this spine has received. Every load-bearing upstream figure in the `next-themes` row was independently confirmed against two sources, and the behavioural claim in AD-24 — the exact class of claim this spine has already been burned by once (AD-5's `middleware.ts`-is-Edge error) — is **confirmed in the library's shipped source**, not asserted. No HIGH finding exists: the mandate's stated HIGH trigger ("if any figure is wrong") did not fire.

The findings that do exist are all in **item 4 — the Stack table's coverage**, not its accuracy. Zero drift is *true* for every row present. Two `package.json` entries that are load-bearing for the very `.dark` palette AD-24 keys on are absent from the table, and one of them is absent in a way that makes a reader think it is already covered.

---

## 1. The `next-themes` Stack row and *Deferred* item — CONFIRMED (4 of 5 claims exactly; 1 imprecise)

Spine text under review (`ARCHITECTURE-SPINE.md:241`, and *Deferred* `:377`):

> `next-themes` | `^0.4.6` (resolved `0.4.6`) … Web-verified 2026-07-31: `0.4.6` **is** the latest release (2025-03-11), so this row is both undrifted and at head
>
> **`next-themes` is at head and has not moved in ~16 months** — `0.4.6`, released 2025-03-11, is still the latest, with no archive or deprecation notice.

| Claim | Verified against | Result |
| --- | --- | --- |
| `package.json` pins `^0.4.6` | `package.json:28` → `"next-themes": "^0.4.6"` | **CONFIRMED** |
| resolves to `0.4.6` | `node_modules/next-themes/package.json` → `"version": "0.4.6"` | **CONFIRMED** |
| `0.4.6` **is** the latest release | npm `registry.npmjs.org/next-themes` → `dist-tags.latest` = `"0.4.6"`; `…/next-themes/latest` → `"version": "0.4.6"`; GitHub `releases?per_page=5` → newest is `v0.4.6`, `draft: false`, `prerelease: false` | **CONFIRMED — two independent sources** |
| dated **2025-03-11** | GitHub release `v0.4.6` → `published_at: "2025-03-11T21:03:39Z"` | **CONFIRMED to the day** |
| no archive notice | GitHub repo → `"archived": false`, `"disabled": false` | **CONFIRMED** |
| no deprecation notice | npm `…/next-themes/latest` → no `deprecated` field present | **CONFIRMED** |
| "has not moved in ~16 months" | 2025-03-11 → 2026-07-31 = 16 months 20 days | **CONFIRMED as arithmetic** |
| "effectively dormant" | GitHub repo → `"pushed_at": "2026-02-25T05:25:42Z"` | **IMPRECISE — see Finding 3** |

Release history for context (GitHub, newest first): `v0.4.6` 2025-03-11, `v0.4.5` 2025-03-09, `v0.4.4` 2024-12-05, `v0.4.3` 2024-11-04, `v0.4.2` 2024-11-04. The 0.4.x line was actively cut through March 2025 and then stopped.

**Assessment.** The row does exactly what the mandate demands of it: it states the resolved version, the upstream head, the release date, and the archive/deprecation status, and it dates the verification. Nothing here was carried from training data. The row's own distinction between *undrifted* and *at head* — and the *Deferred* item's further distinction between *at head* and *active* — is the reasoning a version lens exists to check, and it is present rather than needing to be supplied.

---

## 2. AD-24's behavioural claim about the `storage` event — CONFIRMED IN SOURCE

Spine text (`:213`):

> the moment a theme existed that strip followed the operator's choice **live, mid-service**, because next-themes syncs across same-origin windows on the `storage` event and a projector window is same-origin.

This is the highest-risk sentence in the amendment, because it is a *behavioural* assertion about a third-party library placed inside a Rule's justification — the shape the spine itself flags at AD-5 (`:98`): *"a rule defended by a refutable reason is a rule that gets reverted."*

**It is not refutable. It is in the shipped code.** From `node_modules/next-themes/dist/index.mjs`:

```js
t.useEffect(() => {
  let o = r => { r.key === m && (r.newValue ? n(r.newValue) : f(l)) };
  return window.addEventListener("storage", o),
         () => window.removeEventListener("storage", o)
}, [f])
```

- `m` is the `storageKey` prop, defaulting to `"theme"` (`storageKey: o = "theme"` in the same bundle).
- The handler filters on `r.key === m`, then pushes `r.newValue` into the theme state setter `n` (or resets to the fallback `l` when the key is cleared).
- The DOM write it triggers is `g === "class" ? (P.classList.remove(...k), v && P.classList.add(v))` on `P = document.documentElement`.

Per the HTML storage specification, a `storage` event fires in every **same-origin** document *other than* the one that performed the write — which is precisely the cross-window propagation AD-24 describes. A projector window opened from the hub is same-origin. **The claim is correct, and the mechanism is correct in both halves (the listener and the resulting `documentElement` class write).**

Corroboration that this is not merely theoretical: `src/lib/use-projected-shell.ts` records the same reasoning in its own header ("next-themes syncs across same-origin windows on the `storage` event, so without this the strip would follow the operator's choice live, mid-service"), and the hook exists specifically to close it. The spine and the code agree, and both agree with upstream.

**No finding.** This is the amendment's best-evidenced claim.

---

## 3. `attribute="class"` and `globals.css:5` — CONFIRMED, exact line

Spine text (`:210`):

> `next-themes` owns the `theme` key and the `attribute="class"` contract that `globals.css:5`'s `@custom-variant dark (&:is(.dark *))` is keyed on

Verified end to end:

| Link in the chain | Evidence | Result |
| --- | --- | --- |
| the cited line | `src/app/globals.css:5` is literally `@custom-variant dark (&:is(.dark *));` | **CONFIRMED — line 5 exactly** |
| `attribute="class"` is passed | `src/components/ThemeProvider.tsx` → `<NextThemesProvider attribute="class" defaultTheme="system" enableSystem>` | **CONFIRMED** |
| `attribute="class"` produces a class | dist: `g === "class" ? (P.classList.remove(...k), v && P.classList.add(v))`, `P = document.documentElement` | **CONFIRMED** |
| the `theme` key is next-themes' | no `storageKey` prop is passed, so the default `"theme"` applies (dist: `storageKey: o = "theme"`) | **CONFIRMED** |

The mechanism claim is therefore not just cited correctly but *closed*: next-themes adds `.dark` to `<html>`, and the Tailwind v4 custom variant at line 5 is what makes every `dark:` utility in the palette respond to it. `ThemeProvider.tsx`'s own comment states the same thing in the same terms ("`attribute="class"` is not a preference"), so code and spine do not drift.

**No finding.**

---

## 4. The Stack table's zero-drift claim, and what the table does not cover

Spine text (`:246`):

> `package.json` pins every library row and this table mirrors it — last mirrored 2026-07-30, zero drift.

### 4a. Zero drift for rows that are present — CONFIRMED

Every table row was checked against its installed tree:

| Row | Pin | Resolved | Match |
| --- | --- | --- | --- |
| Next.js | `16.2.10` | `16.2.10` | yes |
| React / React DOM | `19.2.4` | `19.2.4` / `19.2.4` | yes |
| TypeScript | `^5` | `5.9.3` | yes |
| Tailwind CSS | `^4` | `4.3.3` | yes |
| better-sqlite3 | `^12.11.1` | `12.11.1` | yes |
| pptxgenjs | `^4.0.1` | `4.0.1` | yes |
| jszip | `^3.10.1` | `3.10.1` | yes |
| fabric | `^6.6.1` | `6.6.1` | yes |
| @base-ui/react | `^1.6.0` | `1.6.0` | yes |
| next-themes | `^0.4.6` | `0.4.6` | yes |
| ESLint / eslint-config-next | `^9` / `16.2.10` | `9.39.5` / `16.2.10` | yes |
| fast-xml-parser | `^5.10.1` | `5.10.1` | yes |

The claim holds. The *Deferred* item at `:374` correctly identifies `9.39.5` as the maintenance tag, which is an accurate reading of the resolved value rather than of the pin.

### 4b. The `sonner` exclusion — grounds VERIFIED BY GREP

Spine text (`:383`) excludes `sonner ^2.0.7` on stated grounds. All three sub-claims verified:

| Sub-claim | Evidence | Result |
| --- | --- | --- |
| "`sonner.tsx` already calls `useTheme()`" | `src/components/ui/sonner.tsx:3` imports `useTheme` from `next-themes`; `:8` calls it | **CONFIRMED** |
| "`<Toaster />` is mounted nowhere" | `grep -rn "Toaster" src/` returns **only** `src/components/ui/sonner.tsx` — import `:4`, definition `:7`, export `:49`. No JSX mount in any file. | **CONFIRMED** |
| "`toast(` is called nowhere in `src/`" | `grep -rn "toast(" src/` → **zero hits** | **CONFIRMED** |

`grep -rn "sonner" src/` likewise returns a single line (`sonner.tsx:4`), confirming the dependency has exactly one consumer and that consumer is never mounted. **The exclusion is defensible and the reasoning is recorded rather than silent** — this is the correct handling of an omission, and it is the model the two findings below fall short of.

### 4c. Enumerated gap: `package.json` dependencies absent from the Stack table

`dependencies` has 16 entries. Nine are in the table. Seven are not:

| Absent entry | Resolved | Load-bearing? | Judgement |
| --- | --- | --- | --- |
| `clsx ^2.1.1` | 2.1.1 | half of `cn()` — `src/lib/utils.ts:1,5` | **defensible** — incidental utility, no structural invariant rests on it |
| `tailwind-merge ^3.6.0` | 3.6.0 | other half of `cn()` — `utils.ts:2,5` | **defensible** — same |
| `class-variance-authority ^0.7.1` | 0.7.1 | 1 consuming file | **defensible** — incidental utility |
| `lucide-react ^1.25.0` | 1.25.0 | 3 consuming files, icons only | **defensible** — incidental |
| `sonner ^2.0.7` | 2.0.7 | one unmounted consumer | **defensible, and documented** (4b) |
| **`shadcn ^4.13.0`** | 4.13.0 | **`src/app/globals.css:3` — `@import "shadcn/tailwind.css"`** | **REAL MISS — Finding 1** |
| **`tw-animate-css ^1.4.0`** | 1.4.0 | **`src/app/globals.css:2` — `@import "tw-animate-css"`** | **borderline miss — Finding 4** |

`devDependencies` has 12 entries; `tailwindcss ^4`, `typescript ^5`, `eslint ^9`, `eslint-config-next`, `fast-xml-parser` are covered. Absent: `@tailwindcss/postcss ^4`, `@types/better-sqlite3 ^7.6.13`, `@types/react ^19`, `@types/react-dom ^19` — all build glue or type stubs mirroring a dependency already in the table, all **defensible** — and `@types/node ^20`, which is **Finding 2**.

---

## 5. Every other citation the amendment introduced — ALL RESOLVE

| Citation | Claim | Evidence | Result |
| --- | --- | --- | --- |
| `src/app/layout.tsx` | "stays a Server Component" | no `'use client'` directive in the file | **CONFIRMED** |
| `src/app/layout.tsx` | "reaches the client through exactly one child" | single `<ThemeProvider>{children}</ThemeProvider>` in `<body>`; one import | **CONFIRMED** |
| `<html>` `suppressHydrationWarning` | "part of this boundary" | present on `<html>`, with an in-file comment giving the pre-hydration-class reason | **CONFIRMED** |
| `src/components/ThemeProvider.tsx` | "the ONE root client boundary" | `'use client'`; wraps `NextThemesProvider`; only root-level provider in `layout.tsx` | **CONFIRMED** |
| `src/lib/use-projected-shell.ts` | "the one shared hook", "never its own copy" | file exists; `useProjectedShell` called from exactly two sites — `ProjectorClient.tsx:96` and `SlideshowClient.tsx:33` | **CONFIRMED** |
| same | resets `html`/`body` background and `scrollbar-gutter` | sets `root.style.scrollbarGutter = 'auto'`, `root/body.style.backgroundColor = '#000000'`, both overflows hidden, and restores all five on unmount | **CONFIRMED** |
| `ArtifactSlide` literal fallback | "falling back to a literal `#FFFFFF`" | `src/components/artifacts/ArtifactSlide.tsx:128` — `color: toCssColor(style.fontColor) ?? '#FFFFFF',` inside an inline `style` | **CONFIRMED** |
| `tests/theme-chrome.test.mjs` | has a `PROJECTED` set a new surface joins | `:127-138`, six entries: `SlideView.tsx`, `ArtifactSlide.tsx`, `ProjectorClient.tsx`, `SlideshowClient.tsx`, and **both route shells** (`projector/page.tsx`, `slideshow/page.tsx`) | **CONFIRMED** |
| *Deferred* `:384` | the suite "now strips comments" | test header `:25-28` states it; `read()` is a comment-stripping wrapper distinct from `readRaw` (`:41`) | **CONFIRMED** |
| Testing convention | a new suite is registered in `package.json` `scripts.test` | `theme-chrome.test.mjs` is present in the explicit file list | **CONFIRMED** |
| `PresenterOperator.tsx` pins `.dark` | "operator surfaces, not room-facing" | `src/app/services/[id]/present/PresenterOperator.tsx:449` — `className="dark flex min-h-dvh flex-col bg-background …"` | **CONFIRMED (path imprecise — Finding 3b)** |
| `SlideGridDialog.tsx` pins `.dark` | same | `src/app/services/[id]/present/SlideGridDialog.tsx:176` — `className="dark flex max-h-[85dvh] …"` | **CONFIRMED (path imprecise — Finding 3b)** |
| Structural Seed tree | `src/lib/ + use-projected-shell.ts` | correct location | **CONFIRMED** |
| Structural Seed tree | `src/components/ + ThemeProvider.tsx … and ThemeToggle.tsx` | both present in `src/components/` | **CONFIRMED** |
| Consistency Conventions "Client state" | three tiers matching AD-24 | row text matches AD-24's rule 1 without divergence | **CONFIRMED** |

---

## Findings

### Finding 1 — MEDIUM — `shadcn ^4.13.0` is absent from the Stack table, and the `@base-ui/react` row's parenthetical makes the absence look already covered

**Evidence.** `package.json:32` declares `"shadcn": "^4.13.0"` as a **runtime dependency**, resolved `4.13.0`. `src/app/globals.css:3` does `@import "shadcn/tailwind.css"` — this package's stylesheet is imported directly into the global palette file whose line 5 AD-24 now cites as a structural contract.

The Stack table's row reads `@base-ui/react (shadcn base-nova) | ^1.6.0`. That parenthetical names *shadcn* while pinning *`@base-ui/react`*'s version. A reader auditing the table against `package.json` sees the word "shadcn" and marks it covered; the `shadcn` package's own version (`4.13.0`) appears nowhere in the spine. This is worse than a plain omission — an omission is visible, a mislabelled row is not.

**Why it matters at this altitude.** The mandate asks whether each omission is incidental utility or structurally load-bearing. `clsx` and `lucide-react` are incidental — nothing in the spine rests on them. `shadcn` is in a different class: it supplies CSS into `globals.css`, the file AD-24 keys the entire `.dark` palette on. A major bump to it can move the palette that AD-24's token clause and `tests/theme-chrome.test.mjs`'s parsed token list both depend on. The table's stated purpose — "Storage target, PPTX generator, and canvas library are fixed" — is to pin the things a change would ripple through, and this is one.

**Suggested repair (not applied).** Give `shadcn` its own row with its resolved version, or restate the existing row so the parenthetical does not read as coverage — e.g. `@base-ui/react ^1.6.0` and a separate `shadcn ^4.13.0 (resolved 4.13.0) — supplies globals.css:3`.

### Finding 2 — MEDIUM — `@types/node ^20` contradicts the Node 22 row, and no *Deferred* item names it

**Evidence.** The Stack table's first row commits to **Node.js 22.x (`>=22.12`)** and states Node 20 reached **EOL 2026-04-30**. `package.json:40` pins `"@types/node": "^20"`, resolved **20.19.43**. The typings the TypeScript compiler checks all server code against are therefore a full major behind the runtime the table commits to, and behind a runtime the table calls end-of-life.

The spine's *Deferred* list is thorough about currency but misses this specific instance twice over:
- `:374` enumerates "**four** Stack rows a major behind" — TypeScript, better-sqlite3, fabric, ESLint. `@types/node` is not a Stack row, so it is outside that item by construction.
- `:373` is the item about the missing `engines` field, and its remediation list is *documentation only* — "correcting the five docs that still say 'Node 20' (`README.md`, `docs/QUICKSTART.md`, `docs/deploy.md`, `docs/development-guide-monolith.md`, and `README.md`'s prerequisites)". It does not mention that a Node-20 assumption is also **pinned in the manifest the Stack table claims to mirror**.

So the one place a stale Node-20 commitment is machine-enforced rather than merely written down is the one place the spine does not name. Given that `:373` exists precisely to record that the Node row has no manifest to be authoritative *from*, `@types/node` belongs in that item: it is the manifest's only Node-version statement, and it says 20.

**Why it is MEDIUM and not LOW.** This is not cosmetic drift. `@types/node@20` omits Node 22 API surface, so it can either reject valid Node 22 code or, worse, silently type-check code against absent APIs. The proposed `engines` change at `:373` (`">=22.12.0"`) would ship alongside a typings package that disagrees with it.

**Suggested repair (not applied).** Extend the `:373` *Deferred* item to include bumping `@types/node` to `^22` in the same change set as `engines`, so the manifest states one Node version rather than two.

### Finding 3 — LOW — two precision defects in otherwise well-sourced claims

**3a — "has not moved in ~16 months" is true of releases and false of the repository.**

`Deferred:377` says next-themes "**has not moved in ~16 months**" and is "**effectively dormant**". GitHub reports `"pushed_at": "2026-02-25T05:25:42Z"` — commits landed on the default branch about **five months** ago, not sixteen. `open_issues_count` is 66.

The arithmetic behind "~16 months" is correct *for releases* (2025-03-11 → 2026-07-31 = 16 months 20 days), and the row above it says "latest **release**" precisely. But the *Deferred* item drops the qualifier and generalises to "has not moved", which the push data refutes. The practical conclusion — an unreleased upstream, so a React/Next major break would not arrive as a patch — survives intact; only the characterisation is loose. Worth tightening because this item's own stated purpose is that "a version match says nothing about velocity", and it then measures velocity with the wrong instrument.

**Suggested repair (not applied).** "has cut no release in ~16 months (`0.4.6`, 2025-03-11), though the repository still receives commits (last push 2026-02-25)".

**3b — `PresenterOperator.tsx` and `SlideGridDialog.tsx` are cited as bare filenames and are not where a reader will look.**

AD-24's final note and AD-23 both cite these as bare filenames. Both actually live at `src/app/services/[id]/present/` — **not** `src/components/`. Every other citation AD-24 introduces carries a full path, and the Structural Seed tree enumerates `src/components/`'s inhabitants without these two, so there is no positively false statement — but the asymmetry invites the wrong guess.

This repo has already been bitten by exactly this ambiguity: AD-13 (`:142`) and the Epic 16 map (`:344`) both carry explicit disambiguating notes — "not `components/artifacts/`, which is the AD-12 renderer" — because two similarly-named component locations were once confused. The same care is warranted here.

**Suggested repair (not applied).** Cite `src/app/services/[id]/present/PresenterOperator.tsx:449` and `src/app/services/[id]/present/SlideGridDialog.tsx:176`.

### Finding 4 — LOW — `tw-animate-css ^1.4.0` is absent from the Stack table and is a `globals.css` import

**Evidence.** `package.json:35` declares `"tw-animate-css": "^1.4.0"`, resolved `1.4.0`. `src/app/globals.css:2` does `@import "tw-animate-css"` — the line immediately above the `shadcn` import of Finding 1 and three above the `@custom-variant dark` line AD-24 cites.

This is a weaker case than `shadcn`: the package supplies animation utilities rather than the colour palette, and no AD-24 clause rests on an animation. But it is in the same structural class — a CSS dependency compiled into the one stylesheet AD-24 now treats as a contract — and not in the class of `clsx`/`lucide-react`, which are ordinary JS utilities no invariant touches. Recorded so the Finding 4c enumeration is complete rather than because it needs urgent repair.

**Suggested repair (not applied).** Either add a row, or add a sentence to the table's trailing paragraph naming the three `globals.css` `@import` sources (`tailwindcss`, `tw-animate-css`, `shadcn/tailwind.css`) as the palette's actual inputs.

---

## What this lens explicitly did not find

Recorded so a later reader does not re-open settled ground:

- **No wrong upstream figure.** The mandate's HIGH trigger did not fire. Version, latest-tag, release date, archive status and deprecation status are all correct, each confirmed against two independent sources (npm registry API and GitHub REST API).
- **No refutable reason in a Rule.** AD-24's `storage`-event claim — the structural analogue of the AD-5 `middleware.ts` error this spine had to repair — is confirmed in `node_modules/next-themes/dist/index.mjs`, in both the listener and the resulting `documentElement` class write. It is the amendment's best-evidenced sentence.
- **No drift in the Stack table's existing rows.** All twelve library rows resolve to their pins.
- **No broken citation.** Every file:line the amendment introduced resolves to what the spine says it does, including `globals.css:5` at the exact line and `ArtifactSlide.tsx:128`'s literal `#FFFFFF`.
- **The `sonner` exclusion is sound.** `Toaster` is mounted nowhere and `toast(` is called nowhere in `src/`, both confirmed by grep with zero false positives.
- **The Next 16.2.10 / CVE item (`:375`) was not re-verified in this run.** It predates this amendment and is out of scope for an UPDATE-focused pass. It remains the highest-severity open item in the *Deferred* list on its own stated terms ("belongs before first deploy") and is unaffected by anything here.

## Disposition

Four findings, two MEDIUM and two LOW, **all confined to the Stack table's coverage and to wording precision — none to the correctness of a decision.** AD-24 is well-sourced and may stand as written. The MEDIUM findings are best folded into the existing *Deferred* items they belong beside (`:373` for `@types/node`, the table's trailing paragraph for `shadcn`) rather than raised as new work.
