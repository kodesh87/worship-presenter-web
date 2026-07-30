---
name: Worship Presenter Web — Experience
status: final
updated: '2026-07-30'
sources:
  - ../../prds/prd-bic-pptx-workflow-2026-07-10/prd.md
  - ../../architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md
  - ../../../specs/spec-worship-web-input/SPEC.md
  - ../../../specs/spec-artifact-registry-authoring/SPEC.md
design_reference: ./DESIGN.md
---

# Experience — Worship Presenter Web

> **Honesty note.** This documents behavior as shipped, ratified against `src/app/**` on 2026-07-29 and re-verified state by state on 2026-07-30. It is not a redesign. Gaps are recorded under *Open Items*, never described as working. [`DESIGN.md`](./DESIGN.md) owns visual identity; this file owns how the product behaves. Both win over any mock on conflict.
>
> **Where a state is designed but not shipped, this file now says so inline** — marked **⚠ designed, not shipped**. The 2026-07-29 version described four such states in the present tense and deferred verification to the readiness assessment; that assessment ran without answering the question, and one of the four turned out not to exist.
>
> **Glossary:** the operator-facing term is **run sheet** (two words). "Order of service" is the congregation's term and does not appear in the UI.

## Foundation

**Form factor: desktop web, plus a projected second display.** This is not a responsive-first product; see *Responsive & Platform*. The operator works on a laptop; the congregation sees a projector or OBS output. There is no mobile flow, and the canvas editor assumes a pointer.

UI system: **shadcn/ui (base-nova) on Next.js App Router + Tailwind 4**. Server Components are the default; `'use client'` appears only where hooks, browser APIs, or event handlers require it (initiative spine). Visual identity: [`DESIGN.md`](./DESIGN.md) — greyscale, Geist Sans, shadcn defaults unmodified.

Two constraints shape every decision below:

- **The Sabbath path must not depend on the hub.** Offline PPTX download is the primary projection route (INIT AD-1). Web slideshow and presenter mode are shipped conveniences, not the guarantee.
- **Every surface is behind one gate.** `src/proxy.ts` authenticates and authorizes every route except `/login`, the login/logout APIs, `/api/webhook`, and static assets (INIT AD-5). There is no anonymous surface.

## Information Architecture

Ten surfaces, enumerated from `src/app/**/page.tsx`. Route → purpose → who owns the detailed contract:

| Surface | Route | Role | Detailed contract |
| --- | --- | --- | --- |
| Login | `/login` | Session entry; `next` target sanitized via `safeNextPath` | INIT AD-5 |
| Worship Hub | `/` | Service card list + client-side search (date / speaker / title) | PRD FR-8 |
| Create service | `/services/new` | Worship web input form — the manual alternative to agent intake | `spec-worship-web-input` (`form-fields.md`) |
| Run sheet | `/services/[id]` | Service order, timings, edit / delete, PPTX download | `spec-worship-web-input` (`edit-page-chrome.md`) |
| Web slideshow | `/services/[id]/slideshow` | Full-screen review player | PRD FR-9 / FR-15 |
| Presenter | `/services/[id]/present` | Operator control view with notes + KJV lookup | PRD FR-16 / FR-19 |
| Projector | `/services/[id]/present/projector` | Audience output, driven by the presenter | INIT AD-10 |
| Announcements | `/announcements` | Persistent flyer list; hub-local upload | PRD FR-3 |
| Settings (admin) | `/admin` | Per-person Admin/Operator accounts | PRD FR-18 |
| Artifact Registry (admin) | `/admin/artifacts` | Canvas editor for global slide templates | `spec-artifact-registry-authoring` (`slide-kinds.md`) |

Navigation exposes only three of these (`Dashboard` / `Announcements` / `Settings` in `Header`) plus the profile dropdown. Everything else is reached contextually from a service card or from Settings. `/admin` and `/admin/artifacts` are invisible to an operator-role account — the gate returns 403 rather than hiding a link that would then 403.

Every surface above is landed on by a journey in *Key Flows*.

## Voice and Tone

Microcopy is plain and operational. The operator is a volunteer, not a software user — labels name the thing in worship vocabulary ("Run sheet", "Announcements", "Hymn number"), never in system vocabulary ("entity", "record", "payload").

Two binding rules:

- **Never project a placeholder.** Any string that reaches a slide is worship-facing. `midweek-prayer` currently carries a literal `[placeholder]` where a day and time belong (recorded in `deferred-work.md`); it will be projected verbatim until someone supplies real values.
- **Errors state the recovery, not the cause.** A stale-write conflict (INIT AD-6) tells the operator their copy is out of date and to reload — it does not surface HTTP 409.

## Component Patterns

Behavioral contracts only; visual specs live in [`DESIGN.md`](./DESIGN.md) → *Components*. The two tables cover the same component set.

| Pattern | Behavior |
| --- | --- |
| `Header` | Present on every gated page. Shows the signed-in username; profile dropdown carries change-password and logout. |
| Service card list | Loads once, filters client-side. `GET /api/services?q=` remains for agents/automation — the UI does not use it for keystroke search. |
| `HymnNumberAutocomplete` | Number-first lookup against the hymnal corpus; resolves to a title the operator confirms before it enters the run sheet. |
| `ImageUploadField` / `ImageFieldPreview` | Accepts an upload or a remote URL; both resolve through the shared safety helpers (INIT AD-8). A rejected reference must say *why* it was rejected. |
| `SlideView` / `SlidePreviewList` | Render the hydrated plan from `buildSlidePlan` (INIT AD-7). Never re-derive order. Selecting a preview moves the presenter, not the projector directly. |
| `artifacts/ArtifactSlide` | Renders one Artifact template from registry data. Purely presentational: no lookups, no interaction, no state. Identical output on web and in the PPTX path, because both consume the same hydrated AST (epic-16 AD-2). |
| `slide-surface` | Fixed 16:9 region. Content may be clipped at its edges deliberately, preserving source-deck geometry (epic-16 AD-5); clipping is never treated as an error to correct. |
| `admin/ArtifactEditor` | Fabric.js owns canvas state; React reads it only on explicit **Save** (epic-16 AD-3). Consequence for the operator: **unsaved canvas changes are invisible to the app** — navigating away loses them silently. |
| `dialog` / `popover` | Confirmations (delete) and lookups (hymn search). Never carry primary workflow; anything essential stays on the page. |
| `sonner` toasts | Transient confirmations only. Never the sole channel for an error that blocks work. |
| `LogoutButton` | Revokes the session server-side, not just client cookie state (INIT AD-5). |

## State Patterns

Cross-cutting states:

| State | Behavior |
| --- | --- |
| Unauthenticated | Redirect to `/login` with a sanitized `next`; API calls get `401 {error}`. |
| Insufficient role | `403` — for pages a bare Forbidden, for APIs `{error: 'Forbidden'}`. Not a redirect: an operator hitting `/admin` should learn it exists and is not theirs, not bounce. |
| Session revoked mid-session | Logout, password change, demotion, or account deletion invalidate immediately (INIT AD-5). The next request lands on `/login` **without warning**, which is correct for security and unhelpful mid-edit. See Open Items. |
| Stale write | `409`; the operator is told their copy is outdated and must reload (INIT AD-6). Their edit is not silently discarded. |
| Cold load | No skeleton states. Surfaces are Server-Component-rendered and arrive complete; this is a deliberate consequence of the rendering model, not an omission. |
| Deck generation in progress | Generating or regenerating a ~68-slide service is budgeted in **minutes, not seconds** (NFR-2, SM-5). The operator sees that work is running and is prevented from firing a second generation over the first. A multi-minute operation with no progress state reads as a hang. |
| Unmapped input | Any rundown line the parser could not confidently map, and any image whose role could not be resolved or that is missing, is listed for the reviewer to resolve or dismiss — **not** only failed hymn numbers (NFR-5). Nothing is silently dropped, and nothing reaches a slide as a broken placeholder. This is a general channel: it is the safety net that compensates for the deck being reviewed rather than proof-read slide by slide. |

Per-surface states:

| Surface | States |
| --- | --- |
| `/` | **Empty** — first run, no services yet. **Filtered-empty** — search matches nothing; the filter must remain visible and clearable. |
| `/services/new` | **Validation error** — per-field rules in `form-fields.md`; the form retains every entered value and names the offending field. **In-flight submit** — the submit control disables so a double-submit cannot create two services. **Unresolved hymn** — a number the corpus does not know is surfaced at entry, not at generation. |
| `/services/[id]` | **Stale write** — as in the cross-cutting table. **Delete confirmation** — destructive and irreversible, so it is a `dialog`, never an inline control. |
| `/services/[id]/slideshow` | **Plan cannot be built** — a `buildSlidePlan` throw renders a `destructive`-bordered card naming the failure, not a blank screen. *An "empty plan" state is deliberately absent:* `slide-plan.ts:253` pushes the `welcome` leaf unconditionally at the head of every plan, so zero slides cannot occur. |
| `/services/[id]/present` | Four states — see the presenter table below. |
| `/announcements` | **Empty** — no flyers yet. **Upload rejected** — an image failing the INIT AD-8 rules states which rule it failed, not a generic error. |
| `/admin` | **Last admin** — shipped as a refusal, not a warning: `src/lib/auth/accounts.ts:158` refuses the role change, `:195` refuses the delete. |
| `/admin/artifacts` | **Save rejected** — shipped. `epic-16 AD-5` validates every registry write, so rejection is a designed outcome: the canvas keeps the operator's work and the message names what failed (`ArtifactEditor.tsx:728`, `:760` for the concurrent-edit case, which states explicitly what was discarded and what to re-apply). **Reset confirmation** — reset discards persisted edits for one template. **⚠ Unsaved canvas — designed, not shipped.** *Owner: Story 17.4.* No dirty flag and no `beforeunload` guard exists anywhere in `src/`; the only unsaved-work messaging is the 409 conflict path, which fires on save, not on leaving. |

Presenter states, broken out because this is the surface an operator watches while a service runs:

| State | Behavior |
| --- | --- |
| **Projector blanked** (FR-16) | Shipped, all four consequences. The operator blacks the projector at any time with `B` or the control and restores it; the deck still advances underneath; the projector window is not lost; a scripture overlay beneath is undisturbed; the operator view keeps showing current and next slide and indicates the blanked state; a projector opened or reloaded while blanked comes up blank. |
| **Popup blocked** | The browser refused the projector window. The presenter offers the same URL as a plain link rather than leaving a dead button. |
| **KJV corpus absent** | Lookup is unavailable when the corpus was never imported (an ops step). The presenter says so instead of returning empty results. |
| **⚠ Lost sync** — designed, not shipped | *Owner: Story 17.5.* The projector window is closed or crashed. INIT AD-10 forbids a server fallback, so the presenter is the only thing that can report it, and today it detects nothing — see Open Item 1. |

## Interaction Primitives

- **Presenter → projector** is one-way over a single `BroadcastChannel` (INIT AD-10). Both windows are same-origin on one machine; there is no server round-trip and therefore no dependency on hub connectivity mid-service.
- **Full-screen surfaces** (slideshow, projector) fill the viewport; chrome is absent by design.
- **PPTX download** is the terminal action of Friday preparation and the first action of Sabbath. It is a file, not a link.
- **Search** is client-side filtering over an already-loaded list, not a server query per keystroke.

## Accessibility Floor

Stated honestly: **no accessibility pass has been run.** What holds today does so by construction rather than by verification —

- Primary-text contrast is high because the palette is near-black on near-white ([`DESIGN.md`](./DESIGN.md) → *Contrast on load-bearing combinations*). `muted-foreground` is the exception, and it is no longer merely suspected: measured at **4.35:1 on `muted`, which fails WCAG AA**, and 4.74:1 on `background`. Story 17.2 owns the fix.
- The dark palette's contrast has **never** been measured, on any pair. It renders today in the presenter and slide-grid surfaces ([`DESIGN.md`](./DESIGN.md) → *Open Item 2*), which means the two surfaces used while a service is running are the two whose legibility nobody has checked. Story 17.1 carries the measurement.
- shadcn primitives carry Base UI's focus management and ARIA wiring, unmodified, so the five installed components inherit a reasonable floor.

Unverified and load-bearing: keyboard reachability of the Fabric canvas editor (a pointer-first surface with no known keyboard equivalent), focus order on the run sheet edit form, and screen-reader labelling throughout. Treated as an Open Item, not a claim.

## Responsive & Platform

Triggered because this is a multi-surface product. The committed platform set is deliberately narrow:

| Surface | Commitment |
| --- | --- |
| Operator laptop (desktop browser, pointer + keyboard) | The only supported working surface. Layouts assume ≥1024px. |
| Projected display (second monitor / OBS capture) | Output only. 16:9, no chrome, no interaction. |
| Tablet | **Out of scope**, not undecided. The canvas editor is pointer-first and the run sheet is dense. |
| Phone | **Out of scope.** No flow in this product is designed to be completed on a phone. |

This is a commitment, not an aspiration: a future request to operate from a tablet at the console is a real design question requiring its own UX work, not a CSS adjustment.

## Venue & Projection Constraints

Product-specific section — experience constraints no generic UX checklist would surface.

- A failure during a service cannot be retried later. Every constraint below follows from that, as does the offline primacy stated in *Foundation*.
- The operator watches two surfaces at once — presenter notes on the laptop, audience output on the projector. Requiring attention on a third surface breaks the model.
- The projected surface is 16:9 and fixed. Template geometry is normalized percentages with stable IDs; coordinates may deliberately exceed the canvas to preserve source-deck clipping (epic-16 AD-5).
- Registry edits are global and immediate. An administrator changing a template on Friday changes every service, including ones already reviewed. There is no per-service override, by design (epic-16 AD-4). **Scheduled to reverse:** Epic 20 CAP-6 clones the registry per service and refreshes it only on Sync, which supersedes AD-4; this bullet and Flow 5's climax change with that amendment.
- **Nobody owns the question *"is this readable from the pews?"*** The ownership split for the projected deck, and the fact that this gap is deliberate rather than accidental, are stated once in [`DESIGN.md`](./DESIGN.md) → *Who owns the deck the congregation sees*.

## Key Flows

Every flow names its PRD user journey, and protagonist names are the PRD's (§2.3) used verbatim — Sari, Bimo, Elen. **UJ-1** (Sari sends the week's rundown to the events Telegram chat) has no flow here by design: Sari never opens the Web Hub, so her journey lives entirely outside this product's surfaces.

### Flow 1 — Bimo prepares Sabbath on Friday evening *(UJ-2)*

Bimo is on the multimedia team and used to rebuild the deck by hand every week. It is Friday, past nine, and the speaker changed this afternoon.

1. Opens the hub, signs in.
2. Scans the service card list, types the date to filter, opens this Sabbath's run sheet.
3. Sees the run sheet that arrived from the Telegram intake earlier in the week — one hymn number failed to resolve and was read back rather than dropped.
4. Fixes the hymn number; the autocomplete confirms a title before he accepts it.
5. Updates the speaker and saves.
6. Opens the web slideshow to read through what will be projected.
7. **Climax:** downloads the PPTX. From this moment the service is safe — the venue needs no network, no hub, and no laptop but the one holding the file.
8. Closes the laptop.

**Branch 1a — someone edited while he was reading.** His save at step 5 is refused: the run sheet changed after he loaded it (INIT AD-6). He is told his copy is out of date and to reload — his typed values are not discarded silently. He reloads, re-applies the speaker change, and continues. Without this refusal, the other person's edit would have vanished with no trace.

**Branch 1b — the rundown had lines nobody could map.** Step 3 shows more than a failed hymn: two rundown lines could not be confidently parsed, and one image's role could not be resolved. Both are listed for him to resolve or dismiss (NFR-5). Nothing is silently dropped, and nothing reaches a slide as a broken placeholder.

### Flow 2 — Bimo creates a service by hand *(UJ-5)*

The Telegram channel is not configured this week — or it is down. This is the fallback path that keeps the product usable without intake.

1. Opens **Create service** (`/services/new`).
2. Pastes the raw rundown text and triggers Parse.
3. Fills sermon and family/youth details directly in the form. A hymn number the corpus does not know is flagged as he types, not at generation.
4. **Climax:** a service already exists for the parsed date. The form warns of the collision and refuses to create a duplicate until he explicitly confirms an override — so the fallback path cannot quietly shadow a service that already arrived by Telegram.
5. Submits once; the control disables so an impatient second click cannot create two services. He rejoins Flow 1 at step 6.

### Flow 3 — Elen projects on Sabbath morning *(UJ-4)*

Elen has never built a deck. She is scheduled on the presentation computer today, arrives twenty minutes early, and the sanctuary Wi-Fi is unreliable.

1. Opens the downloaded PPTX. This is the guaranteed path and needs nothing else.
2. *If* the hub is reachable and she prefers the richer path, opens presenter mode and sends the projector window to the second display.
3. Follows the run sheet; presenter and projector stay in step over the local `BroadcastChannel`.
4. **Climax:** mid-sermon the speaker cites a verse that is not in the deck. She looks it up in the presenter's KJV panel and shows it on demand — without it ever having been injected into the deck.
5. Between sections she blanks the projector to black while the podium changes over, then restores it. The deck position does not move, the projector window is not lost, and her own view keeps showing current and next slide with the blanked state clearly indicated (FR-16).
6. After the service nothing needs saving. The service record is already immutable.

**Branch 3a — the projector window dies.** Between hymns someone closes the projector window. **⚠ The first beat is designed, not shipped** (*Story 17.5*): the presenter should surface lost sync immediately, but today it detects nothing, so Elen keeps advancing a deck no one can see until she happens to look at the second screen. The rest of the branch works — she reopens the projector from the same control and it re-attaches on one `request-sync` round trip, coming up blank if it was blank when it died. If the hub itself has gone she falls back to the PPTX from step 1, which is the entire reason step 1 comes first.

### Flow 4 — a correction arrives by Telegram on Saturday morning *(UJ-3)*

Saturday, 08:40. The song leader messages the events chat: the divine-service opening song is changing. The agent proposes the target service and applies the correction only after the sender confirms.

1. Bimo opens the run sheet he reviewed on Friday and sees that its content changed after his download.
2. The changed song block is identifiable — he is not left to diff two decks by eye.
3. **Climax:** he regenerates and re-downloads. Generation shows progress while it runs, because the budget for this operation is minutes rather than seconds (NFR-2), and the whole round trip must fit inside five minutes (SM-5).
4. The stale PPTX on the presentation laptop is replaced before the service starts.

*The reviewer-facing half is what this product owns; the Telegram confirmation exchange belongs to the agent, not the Web Hub.*

### Flow 5 — Bimo changes a slide template without a deploy

1. Signs in as an administrator; reaches Settings, then the Artifact Registry.
2. Picks the template whose title sits too low.
3. Drags it on the canvas. Fabric owns this state — the app cannot see it yet.
4. **Climax:** clicks **Save**. Validation runs on an untrusted payload; the template persists to SQLite and every service — including ones already reviewed — renders the new geometry on both web and PPTX, with no code change and no deploy.
5. If the result is wrong, Reset restores that one template from the seed.

**Branch 5a — validation refuses the payload.** His canvas contains an element the registry vocabulary does not admit (rotation, for instance, which the validator has no property for). Save is refused, the canvas keeps his arrangement, and the message names the offending property rather than reporting a generic failure. Extending the vocabulary is a registry-contract change, not something he can resolve on the canvas.

### Flow 6 — Bimo refreshes the announcement flyers

Announcements persist between services, so this happens on its own schedule rather than during service prep.

1. Opens **Announcements** from the header. On a first run the list is empty and says so.
2. Adds this month's flyer — either uploading a file to the hub or pasting a remote URL.
3. **Climax:** a pasted URL is rejected. The message names the rule it broke — the host is not on the allowlist — rather than saying "invalid image". He uploads the file instead, which resolves to a hub-local reference (INIT AD-8) and therefore still works when the venue is offline.
4. The flyer appears in the next generated deck without him touching a service.

### Flow 7 — Bimo onboards a new projector volunteer

1. Opens **Settings**; the surface is reachable only because his account is `admin`.
2. Creates an account for the new volunteer with the `operator` role.
3. **Climax:** the volunteer signs in and sees the hub, Announcements, and every service — but neither Settings nor the Artifact Registry. Reaching `/admin` directly returns Forbidden, so they learn the surface exists and is not theirs.
4. Months later the volunteer stops serving. Bimo deletes the account; any live session dies on its next request rather than lingering until the cookie expires.

## Open Items

Behavioral items this file owns. Token and visual-identity gaps — dark-mode choice, `metadata` boilerplate, `muted-foreground` contrast — live in [`DESIGN.md`](./DESIGN.md) → *Open Items* and are not restated here. **Each item names the story key that owns it**, or says why it has none.

1. **The projector can die and the presenter will not notice.** *Owner: Story 17.5 — `epics.md` carries the file-level evidence; there is no story file yet.* An operator can advance the deck for the remainder of a service with nothing on the second screen, and the surface whose entire job is to report what the congregation sees will show no sign of it. INIT AD-10 forbids a server fallback, so the presenter is the only thing that *can* report this.

   **This replaces the prior item that deferred four states to the readiness assessment.** That assessment ran and never answered the question, so all four were verified against `src/` on 2026-07-30: three are shipped and are now stated as facts with file references in *State Patterns*, and the fourth — lost sync — does not exist.

2. **No accessibility verification.** *No owner yet — needs a scoping decision before a story can be written.* See *Accessibility Floor*. The canvas editor is the sharpest risk: pointer-first, with no known keyboard equivalent. Writing a story first would fix a scope nobody has chosen; the decision is how far this internal tool goes, and it is the owner's.

3. **Unsaved canvas changes are silent.** *Owner: Story 17.4.* No dirty indicator, no navigation guard — confirmed absent from `src/` on 2026-07-30. A consequence of `epic-16 AD-3` (Fabric owns canvas state) that no UX decision had answered until the story was written.

4. **Session revocation has no mid-edit warning.** *No owner yet.* A demoted or logged-out operator loses in-progress work with no notice on their next request. The security behavior is correct and must not change; the experience around it is undesigned, and designing it properly means deciding what a mid-edit interruption owes the operator — which is adjacent to item 3 and may want one story, not two.
