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
> **Reconciled against the architecture spine on 2026-07-30.** Structural invariants are the spine's (`AD-1`..`AD-23`) and are cited here, never restated. Everything this file carries from AD-16, AD-19 and AD-22 is `[TARGET]` in that spine — decided and unbuilt — so it appears under the marker above; the spine's own status tags are the authority on which is which. Every `AD-n` in this file was re-checked against the spine's *AD map* on that date, which is the translation table for the nine decisions it renumbered.
>
> **Glossary:** the operator-facing term is **run sheet** (two words). "Order of service" is the congregation's term and does not appear in the UI.

## Foundation

**Form factor: desktop web, plus a projected second display.** This is not a responsive-first product; see *Responsive & Platform*. The operator works on a laptop; the congregation sees a projector or OBS output. There is no mobile flow, and the canvas editor assumes a pointer.

UI system: **shadcn/ui (base-nova) on Next.js App Router + Tailwind 4**. Server Components are the default; `'use client'` appears only where hooks, browser APIs, or event handlers require it (initiative spine). Visual identity: [`DESIGN.md`](./DESIGN.md) — greyscale, Geist Sans, shadcn defaults unmodified.

Two constraints shape every decision below:

- **The Sabbath path must not depend on the hub.** Offline PPTX download is the primary projection route (AD-1). Web slideshow and presenter mode are shipped conveniences, not the guarantee.
- **Every surface is behind one gate.** `src/proxy.ts` authenticates and authorizes every route except `/login`, the login/logout APIs, `/api/webhook`, and static assets (AD-5). There is no anonymous surface.

## Information Architecture

Ten surfaces, enumerated from `src/app/**/page.tsx`. Route → purpose → who owns the detailed contract:

| Surface | Route | Role | Detailed contract |
| --- | --- | --- | --- |
| Login | `/login` | Session entry; `next` target sanitized via `safeNextPath` | AD-5 |
| Worship Hub | `/` | Service card list + client-side search (date / speaker / title) | PRD FR-8 |
| Create service | `/services/new` | Worship web input form — the manual alternative to agent intake | `spec-worship-web-input` (`form-fields.md`) |
| Run sheet | `/services/[id]` | Service order, timings, edit / delete, PPTX download | `spec-worship-web-input` (`edit-page-chrome.md`) |
| Web slideshow | `/services/[id]/slideshow` | Full-screen review player | PRD FR-9 / FR-15 |
| Presenter | `/services/[id]/present` | Operator control view with notes + KJV lookup | PRD FR-16 / FR-19 |
| Projector | `/services/[id]/present/projector` | Audience output, driven by the presenter | AD-10 |
| Announcements | `/announcements` | Persistent flyer list; hub-local upload | PRD FR-3 |
| Settings (admin) | `/admin` | Per-person Admin/Operator accounts, plus the app-wide slide-transition style | PRD FR-18, AD-23 |
| Artifact Registry (admin) | `/admin/artifacts` | Registry authoring — three surfaces in one route, see below | `spec-artifact-registry-authoring` (`slide-kinds.md`) |

Navigation exposes only three of these (`Dashboard` / `Announcements` / `Settings` in `Header`) plus the profile dropdown. Everything else is reached contextually from a service card or from Settings. `/admin` and `/admin/artifacts` are invisible to an operator-role account — the gate returns 403 rather than hiding a link that would then 403.

Every surface above is landed on by a journey in *Key Flows*.

### Inside `/admin/artifacts`: three surfaces, not one

The route is one page and three authoring surfaces, and which one an administrator gets is fixed by the row's kind — no surface widens that authority (AD-22). What a save here reaches is the **live registry**; "global slide templates" is the description AD-16 retires.

| Authoring surface | Applies to | What the administrator may do | Status |
| --- | --- | --- | --- |
| Ordered registry list | every row | Add, delete, rename, reorder. The order of this list is the order of the deck (CAP-2; AD-17 for a delete that stays deleted through a restart) | **⚠ designed, not shipped.** *Owner: Story 20.3.* `artifact_templates` has no ordering column — the list is sorted by label — and `/api/admin/artifacts` carries no create, delete or reorder verb |
| Free canvas | `general` rows **only** | Compose freely, including Placeholder Catalog keys inserted onto the slide (CAP-3, CAP-4; AD-22 for *General only*, AD-19 for the catalog's key set) | **Partly shipped.** The canvas itself ships (AD-13, AD-15). *General only* and the catalog do not: **⚠** *Owners: Story 20.4, Story 20.5.* Today `READ_ONLY_BASE_TYPES` refuses every administrator edit to a `song-set` or `announcement` row instead |
| Bounded configuration | `songset-*` rows | Exactly two background images — one for the title layout, one for the lyric layout that verse and refrain share — plus font style and font size. **No canvas**, and the row's placeholder set and slot binding are not the administrator's to touch (AD-22, AD-19) | **⚠ designed, not shipped.** *Owner: Story 20.7* |

An `announcement` row is authored nowhere on this route: its membership is the Announcements master list at `/announcements` (CAP-7).

### Sub-surfaces inside those routes

Three surfaces carry their own behavior but no route of their own, so they are named here rather than left to be discovered inside a flow.

| Sub-surface | Lives in | Role | Status |
| --- | --- | --- | --- |
| Slide transition (admin) | `/admin` | Picks the one app-wide transition style. Applied identically in the generated PPTX and on the projector (AD-23). Landed on by Flow 8 | **Shipped** (`admin/TransitionSettings.tsx` → `PUT /api/admin/settings`) |
| Live transition override | `/services/[id]/present` | Lets the presenter change the style for the live browser session only. Travels to the projector over AD-10's channel; changes nothing persisted, and a PPTX already downloaded keeps the style it was built with (AD-23). Landed on by Flow 8 | **Shipped** (`PresenterOperator.tsx`, badged *Live only · not saved*) |
| Four per-slot hymnal bindings | `/services/new` and the run sheet edit form | Binds a hymnal number to each of the four SongSet slot identities — `songset-bt-open`, `songset-bt-close`, `songset-ds-open`, `songset-ds-close`. The slot identity **is** the binding key and is never administrator-editable (AD-19, CAP-8). Landed on by Flow 1 step 4 and Flow 2 step 3 | **⚠ designed, not shipped.** *Owner: Story 20.7.* The four identities appear nowhere in `src/`; today these are the four positional fields `song1Number`…`song4Number`, which AD-19 replaces rather than aliases |

## Voice and Tone

Microcopy is plain and operational. The operator is a volunteer, not a software user — labels name the thing in worship vocabulary ("Run sheet", "Announcements", "Hymn number"), never in system vocabulary ("entity", "record", "payload").

Two binding rules:

- **Never project a placeholder.** Any string that reaches a slide is worship-facing. `midweek-prayer` currently carries a literal `[placeholder]` where a day and time belong (recorded in `deferred-work.md`); it will be projected verbatim until someone supplies real values.
- **Errors state the recovery, not the cause.** A stale-write conflict (AD-6) tells the operator their copy is out of date and to reload — it does not surface HTTP 409.

## Component Patterns

Behavioral contracts only; visual specs live in [`DESIGN.md`](./DESIGN.md) → *Components*. The two tables cover the same component set.

| Pattern | Behavior |
| --- | --- |
| `Header` | Present on every gated page. Shows the signed-in username; profile dropdown carries change-password and logout. |
| Service card list | Loads once, filters client-side. `GET /api/services?q=` remains for agents/automation — the UI does not use it for keystroke search. |
| `HymnNumberAutocomplete` | Number-first lookup against the hymnal corpus; resolves to a title the operator confirms before it enters the run sheet. |
| `ImageUploadField` / `ImageFieldPreview` | Accepts an upload or a remote URL; both resolve through the shared safety helpers (AD-8). A rejected reference must say *why* it was rejected. |
| `SlideView` / `SlidePreviewList` | Render the hydrated plan from `buildSlidePlan` (AD-7). Never re-derive order. Selecting a preview moves the presenter, not the projector directly. |
| `artifacts/ArtifactSlide` | Renders one Artifact template from registry data. Purely presentational: no lookups, no interaction, no state. Identical output on web and in the PPTX path, because both consume the same hydrated AST (AD-12). |
| `slide-surface` | Fixed 16:9 region. Content may be clipped at its edges deliberately, preserving source-deck geometry (AD-15); clipping is never treated as an error to correct. |
| `admin/ArtifactEditor` | Fabric.js owns canvas state; React reads it only on explicit **Save** (AD-13). Consequence for the operator: **unsaved canvas changes are invisible to the app** — navigating away loses them silently. |
| `admin/TransitionSettings` | Selects the one app-wide transition style and saves it explicitly (AD-23). Its confirmation must say *where* the change lands and when: new PPTX downloads and the projector, from the next download onward — never implying that decks already downloaded were restyled. |
| Presenter transition control | Overrides the style for the live browser session and broadcasts it to the projector immediately (AD-23, AD-10). **It must read as live-only at a glance**, not on hover: the control is badged and, whenever the live style differs from the saved one, the surface says so in words. An operator who believed this had changed the deck would stop asking for the saved setting to be fixed, and their next download would contradict what they just watched. |
| `dialog` / `popover` | Confirmations (delete) and lookups (hymn search). Never carry primary workflow; anything essential stays on the page. |
| `sonner` toasts | Transient confirmations only. Never the sole channel for an error that blocks work. |
| `LogoutButton` | Revokes the session server-side, not just client cookie state (AD-5). |

## State Patterns

Cross-cutting states:

| State | Behavior |
| --- | --- |
| Unauthenticated | Redirect to `/login` with a sanitized `next`; API calls get `401 {error}`. |
| Insufficient role | `403` — for pages a bare Forbidden, for APIs `{error: 'Forbidden'}`. Not a redirect: an operator hitting `/admin` should learn it exists and is not theirs, not bounce. |
| Session revoked mid-session | Logout, password change, demotion, or account deletion invalidate immediately (AD-5). The next request lands on `/login` **without warning**, which is correct for security and unhelpful mid-edit. See Open Items. |
| Stale write | `409`; the operator is told their copy is outdated and must reload (AD-6). Their edit is not silently discarded. |
| Cold load | No skeleton states. Surfaces are Server-Component-rendered and arrive complete; this is a deliberate consequence of the rendering model, not an omission. |
| Deck generation in progress | Generating or regenerating a ~68-slide service is budgeted in **minutes, not seconds** (NFR-2, SM-5). The operator sees that work is running and is prevented from firing a second generation over the first. A multi-minute operation with no progress state reads as a hang. |
| Unmapped input | Any rundown line the parser could not confidently map, and any image whose role could not be resolved or that is missing, is listed for the reviewer to resolve or dismiss — **not** only failed hymn numbers (NFR-5). Nothing is silently dropped, and nothing reaches a slide as a broken placeholder. This is a general channel: it is the safety net that compensates for the deck being reviewed rather than proof-read slide by slide. |

Per-surface states:

| Surface | States |
| --- | --- |
| `/` | **Empty** — first run, no services yet. **Filtered-empty** — search matches nothing; the filter must remain visible and clearable. |
| `/services/new` | **Validation error** — per-field rules in `form-fields.md`; the form retains every entered value and names the offending field. **In-flight submit** — the submit control disables so a double-submit cannot create two services. **Unresolved hymn** — a number the corpus does not know is surfaced at entry, not at generation. |
| `/services/[id]` | **Stale write** — as in the cross-cutting table. **Delete confirmation** — destructive and irreversible, so it is a `dialog`, never an inline control. **⚠ Stale snapshot — designed, not shipped.** *Owner: Story 20.8.* Once a service carries its own cloned registry snapshot (AD-16), the live registry can move on without it, so a reviewed service can be out of date with respect to what an administrator has since authored. AD-16 makes the *state* real; **whether and how an operator sees it is undecided, and this file owns that call** — see Open Item 5. |
| `/services/[id]/slideshow` | **Plan cannot be built** — a `buildSlidePlan` throw renders a `destructive`-bordered card naming the failure, not a blank screen. *An "empty plan" state is deliberately absent:* `slide-plan.ts:253` pushes the `welcome` leaf unconditionally at the head of every plan, so zero slides cannot occur. |
| `/services/[id]/present` | Five states — see the presenter table below. |
| `/announcements` | **Empty** — no flyers yet. **Upload rejected** — an image failing the AD-8 rules states which rule it failed, not a generic error. |
| `/admin` | **Last admin** — shipped as a refusal, not a warning: `src/lib/auth/accounts.ts:158` refuses the role change, `:195` refuses the delete. **Transition save failed** — shipped: the failure is stated on the surface and the selection stays as the administrator left it, so a failed save never reads as an applied one (`TransitionSettings.tsx`). |
| `/admin/artifacts` | **Save rejected** — shipped. `AD-15` validates every registry write, so rejection is a designed outcome: the canvas keeps the operator's work and the message names what failed (`ArtifactEditor.tsx:728`, `:760` for the concurrent-edit case, which states explicitly what was discarded and what to re-apply). **Reset confirmation** — reset discards persisted edits for one template. **⚠ Unsaved canvas — designed, not shipped.** *Owner: Story 17.4.* No dirty flag and no `beforeunload` guard exists anywhere in `src/`; the only unsaved-work messaging is the 409 conflict path, which fires on save, not on leaving. |

Presenter states, broken out because this is the surface an operator watches while a service runs:

| State | Behavior |
| --- | --- |
| **Projector blanked** (FR-16) | Shipped, all four consequences. The operator blacks the projector at any time with `B` or the control and restores it; the deck still advances underneath; the projector window is not lost; a scripture overlay beneath is undisturbed; the operator view keeps showing current and next slide and indicates the blanked state; a projector opened or reloaded while blanked comes up blank. |
| **Popup blocked** | The browser refused the projector window. The presenter offers the same URL as a plain link rather than leaving a dead button. |
| **KJV corpus absent** | Lookup is unavailable when the corpus was never imported (an ops step). The presenter says so instead of returning empty results. |
| **Live transition differs from the saved style** | Shipped. The operator has overridden the transition for this session (AD-23). The surface states which style is projecting, that nothing was saved, and what the deck, future PPTX downloads and the next Presenter will still use — so the override cannot be mistaken for a settings change. |
| **⚠ Lost sync** — designed, not shipped | *Owner: Story 17.5.* The projector window is closed or crashed. AD-10 forbids a server fallback, so the presenter is the only thing that can report it, and today it detects nothing — see Open Item 1. |

## Interaction Primitives

- **Presenter → projector** is one-way over a single `BroadcastChannel` (AD-10). Both windows are same-origin on one machine; there is no server round-trip and therefore no dependency on hub connectivity mid-service. **What the channel does not yet carry is which deck it is talking about.** AD-10 requires every message to carry a plan identity so a receiver holding a different plan refuses to follow the index and says so on the room-facing screen; that clause is `[TARGET]` in the spine and the messages carry a bare index today. Presenter and projector each build their own plan at their own moment, so a structural change while a projector window is open — an administrator saving a template right now, a Sync once AD-16 ships — offsets one screen against the other with nothing to signal it. The remedy is code, not an affordance, which is why it is not an Open Item here; it is noted because it is the one way this primitive can be *silently* wrong, and it bounds what the presenter can currently promise.
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
- The projected surface is 16:9 and fixed. Template geometry is normalized percentages with stable IDs; coordinates may deliberately exceed the canvas to preserve source-deck clipping (AD-15).
- **Registry edits are global and immediate today, and that rule has already been reversed in the decision that governs it.** Both halves have to be stated, because the rule is settled and the code is not. *As shipped:* an administrator changing a template on Friday changes every service, including ones already reviewed, and there is no per-service override — the "global across services" clause of AD-14. *Decided, not scheduled:* AD-16 was recorded on 2026-07-30 and supersedes that clause. Creating a service clones the registry into a service-bound snapshot, a later live edit reaches an existing service only through the explicit **Sync Artifact** action, and Sync is admin-only. AD-16 is `[TARGET]` — it lands with Epic 20 (CAP-6, Story 20.8) and no code implements it yet, which is why this bullet still describes the old behavior first. It supersedes **AD-14** and nothing else; a previous version of this bullet cited `AD-4`, which is LiveServer durable paths and an unrelated decision. The new state this creates — a service whose snapshot has fallen behind — is in *State Patterns* under `/services/[id]`, and its affordance is Open Item 5.
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

**Branch 1a — someone edited while he was reading.** His save at step 5 is refused: the run sheet changed after he loaded it (AD-6). He is told his copy is out of date and to reload — his typed values are not discarded silently. He reloads, re-applies the speaker change, and continues. Without this refusal, the other person's edit would have vanished with no trace.

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
4. **Climax:** clicks **Save**. Validation runs on an untrusted payload (AD-15) and the template persists to SQLite, with no code change and no deploy. *What the save reaches is the part that changes:* today it reaches **every** service, including ones already reviewed, which render the new geometry on both web and PPTX. **⚠ Designed, not shipped** (*AD-16; Epic 20 CAP-6, owner Story 20.8*): the save reaches the **live registry** only. A service that already exists keeps its own cloned snapshot and renders exactly what it rendered before — nothing Bimo does on this route reaches next Sabbath's service on its own.
5. **⚠ Designed, not shipped** (*AD-16; owner Story 20.8*). To bring an existing service onto the new template he opens that service and runs **Sync Artifact**, which re-clones the registry into that service's snapshot. Three properties the affordance has to carry, because each is a promise to somebody: it is **admin-only**, so this beat is Bimo's and not an operator's; it carries the service's `updated_at` precondition (AD-6), so a Sync over a service someone else has just changed is refused rather than applied; and it **replaces the structure while leaving every value the operator entered untouched** (*State* convention) — "destructive" is about the snapshot, never about the run sheet.
6. If the result is wrong, Reset restores that one template from the seed. Two consequences of AD-11 and AD-17 that will surprise him and that this file has not yet designed for: Reset restores the shipped **label** too, so it reverts a rename, and a row Bimo authored himself has no shipped content to restore and therefore exposes **no Reset at all** — two rows in one list with different affordances. Open Item 6.

**Branch 5a — validation refuses the payload.** His canvas contains an element the registry vocabulary does not admit (rotation, for instance, which the validator has no property for). Save is refused, the canvas keeps his arrangement, and the message names the offending property rather than reporting a generic failure. Extending the vocabulary is a registry-contract change, not something he can resolve on the canvas.

**Branch 5b — the service Elen presents on Sabbath is still on last week's structure. ⚠ Designed, not shipped** (*AD-16; owner Story 20.8*). Bimo's save at step 4 never reached it, and he does not run Sync — so the service is *stale*: correct, renderable, and behind. This is the intended behavior of AD-16 rather than a fault, which is precisely why it needs an affordance: a state nobody is shown is indistinguishable from a template edit that silently failed. Two constraints bound whatever this file eventually designs. The operator who reviews the service is the person most likely to notice, and Sync is admin-only, so **the most an operator can be given is seeing the staleness and asking for a sync** — the surface has to be honest about that rather than offering a control that 403s. And a stale snapshot must never read as an error on the run sheet: the deck it renders is the one that was reviewed. Open Item 5 owns the call.

### Flow 6 — Bimo refreshes the announcement flyers

Announcements persist between services, so this happens on its own schedule rather than during service prep.

1. Opens **Announcements** from the header. On a first run the list is empty and says so.
2. Adds this month's flyer — either uploading a file to the hub or pasting a remote URL.
3. **Climax:** a pasted URL is rejected. The message names the rule it broke — the host is not on the allowlist — rather than saying "invalid image". He uploads the file instead, which resolves to a hub-local reference (AD-8) and therefore still works when the venue is offline.
4. The flyer appears in the next generated deck without him touching a service.

### Flow 7 — Bimo onboards a new projector volunteer

1. Opens **Settings**; the surface is reachable only because his account is `admin`.
2. Creates an account for the new volunteer with the `operator` role.
3. **Climax:** the volunteer signs in and sees the hub, Announcements, and every service — but neither Settings nor the Artifact Registry. Reaching `/admin` directly returns Forbidden, so they learn the surface exists and is not theirs.
4. Months later the volunteer stops serving. Bimo deletes the account; any live session dies on its next request rather than lingering until the cookie expires.

### Flow 8 — the transition style is set once, and overridden live

Both halves of this ship today. It has no PRD user journey — transitions arrived as FR-7 without one — and it is here because both of its surfaces are otherwise landed on by nothing.

1. Bimo opens **Settings** and finds **Slide transition**. One style, app-wide — there is no per-service choice to make (AD-23).
2. He picks one and saves. The confirmation tells him where it lands: the projector, and the next PPTX generated. Decks already downloaded keep the style they were built with, because a file on a laptop cannot be restyled after the fact.
3. Sabbath morning, Elen is in Presenter. The configured fade is fighting the room's projector, and the service starts in four minutes.
4. **Climax:** she changes the transition on the presenter itself. The projector picks it up immediately over the same channel that carries the deck position (AD-10), so the two screens never disagree *about the style* — and the control tells her plainly that nothing was saved: the deck, future downloads, and the next Presenter she opens all stay on Bimo's setting. She fixes the room without touching a setting she has no mandate to change, and without needing Bimo on a Sabbath morning.
5. Nothing to undo afterwards. Closing the presenter ends the override.

## Open Items

Behavioral items this file owns. Token and visual-identity gaps — dark-mode choice, `metadata` boilerplate, `muted-foreground` contrast — live in [`DESIGN.md`](./DESIGN.md) → *Open Items* and are not restated here. **Each item names the story key that owns it**, or says why it has none.

1. **The projector can die and the presenter will not notice.** *Owner: Story 17.5 — `epics.md` carries the file-level evidence; there is no story file yet.* An operator can advance the deck for the remainder of a service with nothing on the second screen, and the surface whose entire job is to report what the congregation sees will show no sign of it. AD-10 forbids a server fallback, so the presenter is the only thing that *can* report this.

   **This replaces the prior item that deferred four states to the readiness assessment.** That assessment ran and never answered the question, so all four were verified against `src/` on 2026-07-30: three are shipped and are now stated as facts with file references in *State Patterns*, and the fourth — lost sync — does not exist.

2. **No accessibility verification.** *No owner yet — needs a scoping decision before a story can be written.* See *Accessibility Floor*. The canvas editor is the sharpest risk: pointer-first, with no known keyboard equivalent. Writing a story first would fix a scope nobody has chosen; the decision is how far this internal tool goes, and it is the owner's.

3. **Unsaved canvas changes are silent.** *Owner: Story 17.4.* No dirty indicator, no navigation guard — confirmed absent from `src/` on 2026-07-30. A consequence of `AD-13` (Fabric owns canvas state) that no UX decision had answered until the story was written.

4. **Session revocation has no mid-edit warning.** *No owner yet.* A demoted or logged-out operator loses in-progress work with no notice on their next request. The security behavior is correct and must not change; the experience around it is undesigned, and designing it properly means deciding what a mid-edit interruption owes the operator — which is adjacent to item 3 and may want one story, not two.

**Items 5 and 6 are questions the architecture spine explicitly routes to this file.** It states in its own *Deferred* that both are UX concerns owned by `EXPERIENCE.md`, and until 2026-07-30 this list carried neither. Recording them here is what makes the handoff received rather than merely sent; both are undecided, and neither is a decision the spine will make.

5. **A stale snapshot has no affordance.** *Owner: Story 20.8.* AD-16 makes staleness possible by design — a service renders its own cloned snapshot while the live registry moves on — so the state is real the moment CAP-6 ships. What an operator sees is undecided: a badge on the service card, a line on the run sheet, something on the download control, or deliberately nothing. Three constraints on the answer, all of them already fixed elsewhere. **Sync is admin-only** (AD-16), so an operator can be shown staleness and can *request* a sync, but cannot perform one — designing a control that 403s for the person most likely to notice would be the worst of the options. **A stale service is correct, not broken:** the deck it renders is the one that was reviewed, so this cannot borrow the `destructive` vocabulary that delete and stale-write conflicts own ([`DESIGN.md`](./DESIGN.md) → *Colors*). And *"nothing"* is a legitimate answer that has to be **chosen** rather than reached by omission — AD-16 exists partly so that a service being prepared does not shift underneath its reviewer, and telling that reviewer about every upstream edit is a way of reintroducing the interruption on the screen instead of in the deck.

6. **Reset reverts a rename, and some rows have no Reset at all.** *Owner: Story 20.3.* AD-17 gives the administrator the row's `label`, and AD-11's Reset restores the shipped template *including* that label — so Reset silently undoes a rename nobody thought they were resetting. It is defensible (Reset means restore what we shipped) and it is a new operator-visible surprise, which makes it this file's call and not the spine's: confirm-with-consequences, keep the label, or restore it and say so. The same decision has a second face in the same list — under AD-17 a row an administrator *authored* has no seed to restore, so it exposes **no Reset**, and two rows sitting side by side will offer different verbs. Whatever answers the first face has to explain the second, or the list reads as broken. Both are visible in Flow 5 step 6.
