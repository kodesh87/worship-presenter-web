---
title: 'Hide the stored image URL, and let an image be fetched from a link'
type: 'feature'
created: '2026-07-27'
status: 'done'
baseline_revision: '5c9e50130f28d14e7d4ae0f909f8bafe5d469705'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<intent-contract>

## Intent

**Problem:** Each of the three service image fields — sermon graphic, family photo, youth photo — puts the stored value in a visible text box. After an upload that value is `/api/uploads/c222ad9010111777535b8b7701cb18e9.png`, a machine-generated string that tells the operator nothing while taking the most prominent place in the card. What the operator actually wants to know is whether a file is selected and what the picture looks like. Separately, when someone sends an image as a link, the only way to use it is to download it by hand and upload the file.

**Approach:** Replace the URL text box with a file picker showing its own no-file-chosen state, an upload button, a thumbnail, and a remove control, keeping the stored value out of sight. Add a second input that takes an image link and fetches it **server-side into a local upload**, so the service always stores its own copy and never depends on someone else's host staying up on a Sabbath morning.

## Boundaries & Constraints

**Always:**
- The stored value is always a local upload reference (`/api/uploads/<32-hex>.<ext>`). A link is a *source to fetch from*, never a value to store.
- The raw stored value is never shown as editable text. The operator sees the picture, the file state, and controls — not the path.
- Every field must be clearable. Removing the visible text box removes today's only way to unset a wrongly uploaded image, so a remove control is part of this change, not a nice-to-have.
- The server-side fetch reuses the existing hardened remote-image path — the same `isSafeImageUrl` gate, refusal to follow redirects, size cap enforced while streaming, and content-type allowlist. **Extract and share it; do not write a second gate.** A duplicated SSRF check is how the two drift and one of them ends up weaker.
- A fetched image is written with a fresh random filename and an extension consistent with its actual content type, exactly as the file-upload route does.
- The fetch route is authenticated by the existing proxy gate; it must not be added to the exempt matcher.
- Failures are specific and actionable: an unreachable host, a non-image response, a too-large file and a blocked address must each say which happened, without leaking internal detail or a stack.
- Create and edit forms stay in lockstep — one shared component, six call sites.
- Submitted field names, the images payload shape, validation and the slide-plan contract are unchanged.
- New tests use `node:test` and are appended to the explicit `package.json` test list.
- Read the relevant guide under `node_modules/next/dist/docs/` before changing Next.js route or page APIs.

**Block If:**
- Sharing the hardened fetch would force `src/lib/pptx.ts` to import from a route handler, or otherwise pull server-route code into the PPTX path. Restructure so both import a library module instead — do not duplicate the gate to avoid the import.

**Never:**
- Do not weaken, bypass or re-implement `isSafeImageUrl` / `isBlockedImageHost`. Private, loopback, link-local and metadata addresses stay blocked.
- Do not follow redirects on the fetch. A redirect is how an allowed URL becomes a blocked one after the check has already passed.
- Do not store a remote URL in the service payload as a result of this feature.
- Do not add an image-processing dependency; the bytes are written as received.
- No change to `/api/webhook`, the announcement flyer flow, or the picoclaw intake — out of scope by the operator's own instruction.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| No image set | empty field | File picker shows its no-file-chosen state; no thumbnail; no remove control | — |
| Pick a file | operator selects a file | The picker shows the chosen filename before upload | — |
| Upload a file | valid image | Stored as a local upload; thumbnail appears; path not shown as text | — |
| Upload a non-image | `.txt` renamed to `.png` | — | 400, message naming the problem; field unchanged |
| Fetch from a link | reachable image URL | Downloaded server-side, stored as a local upload, thumbnail appears | — |
| Fetch, host unreachable | dead domain | — | Message saying it could not be reached; field unchanged |
| Fetch, not an image | URL returning HTML | — | Message saying the link is not an image | — |
| Fetch, too large | oversized image | — | Message naming the size limit; nothing written to disk |
| Fetch, blocked address | `http://127.0.0.1/x.png`, a private or metadata IP | — | Refused by the existing gate; message does not disclose why the host is blocked |
| Fetch, redirect | URL that 302s elsewhere | — | Refused; not followed |
| Fetch, malformed URL | `not a url` | — | 400 before any network call |
| Remove | field has an image | Value cleared; thumbnail and remove control disappear | — |
| Replace | field has an image, operator uploads another | New image replaces it; the form shows the new thumbnail | — |
| Existing service | a service saved before this change | Its image renders in the thumbnail; the field behaves the same | — |
| Save | any of the above, then save | The images payload carries the same shape and field names as before | — |
| Not signed in | request to the fetch route without a session | — | Rejected by the gate, as with every other API route |

</intent-contract>

## Code Map

- `src/app/api/upload/route.ts` -- `POST` multipart: requires a `file`, rejects a non-`image/*` type, derives the extension via `normalizeUploadExtension`, writes `crypto.randomBytes(16).toString('hex') + ext` into `ensureUploadsDir()`, returns `{ url: '/api/uploads/<filename>' }`. The shape the new route must match.
- `src/lib/uploads.ts` -- `UPLOAD_IMAGE_EXT` (`.jpe?g|png|gif|webp`), `getUploadsDir`, `ensureUploadsDir`, `isLocalUploadRef`, `localUploadFilename`, `resolveLocalUploadFsPath`, `normalizeUploadExtension`.
- `src/lib/images.ts` -- `isSafeImageUrl` (line 159), `isBlockedImageHost` (130), `coerceOptionalSafeImageUrl` (184), `parseImagesPayload` / `parseImagesPayloadJson`. The SSRF policy lives here and stays here.
- `src/lib/pptx.ts:126-250` -- the hardened remote fetch to extract: a capped streaming body read ("so a lying `content-length` cannot exhaust RAM"), `fetch(url, { redirect: 'error', signal: AbortSignal.timeout(...) })`, a `content-length` pre-check, a content-type allowlist, and `isSafeImageUrl` re-run before the call. This is the behaviour the new route must share, not copy.
- `src/components/ImageFieldPreview.tsx` -- the thumbnail added earlier: fixed 160×96 box, `object-contain`, renders nothing when empty, quiet note on load failure, remounts on URL change. Reuse it.
- `src/app/services/[id]/EditForm.tsx` -- the three fields at ~L746 (sermon, upload input id `sermon-upload-edit`), ~L790 (family) and ~L847 (youth). Each is a `grid gap-4 sm:grid-cols-12 items-end` row: an 8-column URL text input bound to `sermonGraphicUrl` / `familyPhotoUrl` / `youthPhotoUrl`, and a 4-column hidden `<input type="file">` plus a styled label acting as the upload button. `uploadImage(file, setter)` POSTs to `/api/upload`.
- `src/app/services/new/CreateForm.tsx` -- the same three rows, same state names, differing only in the upload input ids.
- `src/proxy.ts` -- the gate. Its matcher exempts only `api/webhook`, `api/auth/login`, `api/auth/logout`, `login`, `_next/static`, `_next/image`, `favicon.ico` and `assets/`, so `/api/upload` and any sibling route are already authenticated.
- `tests/images-ssrf.test.mjs` -- the existing SSRF coverage for `isSafeImageUrl` / announcement refs; the natural home for the shared fetcher's gate assertions.
- `data/uploads/` -- where uploads land under the default `UPLOADS_DIR`. Two files are currently untracked in the working tree; member photos must not be committed.

## Tasks & Acceptance

**Execution:**

- [x] `src/lib/remote-image.ts` -- new: extract the hardened remote fetch from `src/lib/pptx.ts` (gate re-check, `redirect: 'error'`, abort timeout, `content-length` pre-check, streaming size cap, content-type allowlist) into one shared module returning either the bytes plus resolved content type or a typed reason for refusal.
- [x] `src/lib/pptx.ts` -- consume the extracted module instead of its private copy, leaving deck generation behaviour byte-for-byte unchanged.
- [x] `src/app/api/upload/from-url/route.ts` -- new: `POST` taking a URL, refusing a malformed one before any network call, fetching through the shared module, writing the bytes with a fresh random filename and a content-type-consistent extension into `ensureUploadsDir()`, and returning the same `{ url }` shape as `/api/upload`. Map each refusal reason to a specific message and status; log detail server-side only.
- [x] `src/components/ImageUploadField.tsx` -- new: one component owning a field's whole surface — a file picker showing its no-file-chosen state and the chosen filename, an upload button, a link input with a fetch button, the `ImageFieldPreview` thumbnail, and a remove control shown only when a value exists. The stored value is held internally and never rendered as editable text. Busy and error states for both upload paths.
- [x] `src/app/services/[id]/EditForm.tsx` + `src/app/services/new/CreateForm.tsx` -- replace all six URL-input rows with the shared component, keeping the state names, the submitted payload and the surrounding card layout unchanged.
- [x] `.gitignore` -- ignore the local uploads directory so member photos are never committed.
- [x] `tests/remote-image.test.mjs` -- new: cover the fetch rows of the I/O matrix against a local server — success, non-image content type, oversize against the cap, a redirect being refused, a blocked address, and a malformed URL.
- [x] `tests/images-ssrf.test.mjs` -- extend so the shared module is asserted to refuse everything the existing gate refuses, pinning that extraction did not widen the policy.
- [x] `package.json` -- append the new test file to the explicit `test` list.

**Acceptance Criteria:**
- Given a field with an uploaded image, when the form renders, then the operator sees the thumbnail and controls and the stored path appears nowhere as editable text.
- Given an empty field, when the form renders, then the file picker shows its no-file-chosen state and no remove control is offered.
- Given a valid image link, when the operator fetches it, then the image is stored as a local upload, the thumbnail shows it, and the saved payload contains a local upload reference rather than the remote URL.
- Given a link that redirects, a non-image response, an oversized image, or a blocked address, when the operator fetches it, then nothing is written to disk, the field is unchanged, and the message says which of those happened.
- Given a field with an image, when the operator removes it, then the value is cleared and saving persists the field as empty.
- Given a service saved before this change, when it is opened, then its image renders and the field behaves identically.
- Given the deck generator, when a service is regenerated, then the PPTX output is unchanged by the fetch extraction.
- Given `npm test`, `npm run build` and `npx tsc --noEmit`, when they run, then all pass and no new lint error appears in this diff.

## Spec Change Log

## Review Triage Log

## Design Notes

Fetching a remote image server-side is the exact shape of the SSRF hole Story 6.7 closed, so this feature must not open a second door beside the one that is already locked. The hardened fetcher in `pptx.ts` was written for the deck path and already does the right things; the only safe way to have two callers is one implementation. Extracting it is therefore the first task, not a cleanup afterwards — and `redirect: 'error'` matters most of all, because following a redirect is how a URL that passed the gate turns into one that would not have.

Storing a local copy rather than the link is the point, not an implementation detail. The offline PPTX is the load-bearing Sabbath path; a deck that references someone else's host is one outage away from a blank slide in front of the congregation.

The remove control is included because this change would otherwise strand the operator: the visible text box is currently the only way to clear a field, and hiding it without a replacement turns a cosmetic complaint into a real defect.

## Verification

**Commands:**
- `npm test` -- expected: all suites pass, including the new fetch tests
- `npx tsc --noEmit` -- expected: no type errors
- `npm run build` -- expected: succeeds
- `npm run lint` -- expected: no new error attributable to this diff
- `node scripts/smoke-deck-fidelity.mjs` -- expected: no regression against the baseline of 28 pass / 2 known-stale fail

**Manual checks (if no CLI):**
- On `/services/2` and `/services/new`: upload a file, fetch a link, replace an image, remove one, and save — confirming the stored path is never shown and the payload keeps its shape.
- Confirm a deck generated after the change is unchanged from one generated before it.

## Auto Run Result

Status: done
Blocking condition: none

### Summary

The three service image fields now behave like a file picker - the browser's own no-file state, an Upload button, the thumbnail and a Remove control - with the stored path never rendered as editable text. A second input takes an image link and fetches it server-side into a local upload, so the service always stores its own copy.

### The security core

Fetching a caller-supplied URL server-side is the SSRF surface Story 6.7 closed. The hardened fetcher already living in `src/lib/pptx.ts` was **extracted** to `src/lib/remote-image.ts` and shared, not copied: one gate, two callers, no drift. It keeps `redirect: 'error'`, the abort timeout, the `content-length` pre-check, the streaming size cap and the content-type allowlist, and re-runs `isSafeImageUrl` itself. The extraction also closed a latent hole: `isSafeImageUrl` accepts `/api/uploads/*` refs, which must be read from disk and never fetched, so the shared module requires an absolute http(s) URL first.

Proven with real HTTP requests, not asserted: loopback, private and cloud-metadata addresses refused; a 302 pointing at the metadata address refused rather than followed; non-image content type, a 17 MB body, malformed URLs and a missing session each refused with their own status and message; nothing written to disk on any failure.

### Deck unchanged

276 zip entries byte-identical before and after the extraction, same stable digest, with only `docProps/core.xml` excluded because it carries a generation timestamp that differs between two runs of unmodified code as well.

### Verification

- `npm test` - 314 pass, 0 fail
- `npx tsc --noEmit` - clean; `npm run build` - succeeds; eslint clean on every new file
- `node scripts/smoke-deck-fidelity.mjs` - 28 pass, 2 known-stale fail, the documented baseline
- Browser: on `/services/2` and `/services/new`, zero inputs anywhere hold an `/api/uploads/...` value; upload, replace, fetch-from-link and remove all confirmed; the submitted payload keeps its keys and shape, carrying a local ref for an image that arrived as a link

### Residual risks

- No pixels were confirmed - the browser pane does not composite, so every check was DOM state. Chrome renders "No file chosen" inside a closed shadow root, so the literal string could not be read; what was verified is that the pickers exist, are visible and hold no files.
- The 8-second fetch timeout path and a real cross-internet host were not exercised.
- Five files under `data/uploads/` were committed before this change. `.gitignore` does not untrack, so they remain in history; two are referenced as announcement flyers, so untracking is a deliberate decision left to the project lead.
