# Story 6.7: Image URL Allowlist (SSRF Harden)

Status: done

## Story

As the system,
I want announcement image fetches restricted to an allowlist or sandboxed download,
So that webhook/edit cannot SSRF via PPTX `addImage`.

## Acceptance Criteria

1. **Given** a remote image URL outside the allowlist (or non-http(s)), **When** PPTX is generated, **Then** the image is skipped or rejected safely.
2. **Given** an allowlisted https URL, **When** generated, **Then** the announcement slide still embeds.

## Amendment (2026-07-19)

Hub-local `/api/uploads/<32-hex>.(jpg|jpeg|png|gif|webp)` is an allowed non-remote exception (Story 13.3). Host allowlist still applies only to remote URLs. See Spec Change Log on `spec-6-7-image-url-allowlist-ssrf.md`.

## References

- `deferred-work.md` SSRF finding; `src/lib/images.ts`
- Related: `stories/13-3-local-announcement-uploads.md`
