---
title: '6.7 Image URL Allowlist (SSRF Harden)'
type: 'feature'
created: '2026-07-18'
status: 'done'
baseline_revision: '60ba9e6'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/stories/6-7-image-url-allowlist-ssrf.md'
---

<intent-contract>

## Intent

**Problem:** Announcement/PPTX image URLs were only checked for http(s), allowing SSRF to localhost/private/metadata.

**Approach:** Harden `isSafeImageUrl`: optional `IMAGE_URL_ALLOWLIST` hostnames; when unset, http(s) plus block private/localhost/link-local/metadata. PPTX skips unsafe URLs. Hub-local upload paths (Epic 13.3) are a separate allowlisted shape and are not subject to host allowlist.

## Boundaries & Constraints

**Always:** Remote refs are http(s) only with host checks; skip/reject unsafe remote URLs during PPTX/announcement assert. Hub-local `/api/uploads/<32-hex>.(jpg|jpeg|png|gif|webp)` is allowed as a non-remote exception.
**Never:** KJV import; DNS-based allow (literal host checks only); treat arbitrary relative paths as safe.

</intent-contract>

## Spec Change Log

### 2026-07-19 — Epic 13.3 local uploads
- `isSafeImageUrl` accepts safe hub-local upload refs; `IMAGE_URL_ALLOWLIST` still applies only to remote hosts.
- See `spec-13-hub-ux-and-liveserver-gap.md` / story `13-3-local-announcement-uploads.md`.

## Tasks & Acceptance

**Execution:**
- [x] Harden `src/lib/images.ts`
- [x] smoke + unit tests
- [x] sprint/story/spec done
- [x] `npm run build`

## Verification

**Commands:**
- `node scripts/smoke-image-ssrf.mjs`
- `npm test`
- `npm run build`

## Auto Run Result

Status: done

**Summary:** `isSafeImageUrl` enforces optional `IMAGE_URL_ALLOWLIST` and otherwise blocks localhost/private/link-local/metadata hosts. PPTX continues to skip unsafe URLs. No KJV/bible import.

**Files changed:**
- `src/lib/images.ts`
- `scripts/smoke-image-ssrf.mjs`
- `tests/images-ssrf.test.mjs`
- tracking: sprint-status, story 6-7, this spec
