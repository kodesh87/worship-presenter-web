# Story 13.3: Local announcement image uploads

Status: done

## Story

As an operator,
I want to upload announcement images to the hub (not only paste public http(s) URLs),
So that flyers live on the LiveServer disk and still appear in hub preview and PPTX.

## Acceptance Criteria

1. **Given** a session, **When** `POST /api/upload` with a jpg/png/gif/webp image, **Then** the file is stored under `UPLOADS_DIR` and the response URL is `/api/uploads/<32-hex>.<ext>`.
2. **Given** that local path, **When** creating/updating an announcement, **Then** validation accepts it (remote http(s) rules from 6.7 still apply to remote URLs only).
3. **Given** a stored local upload, **When** PPTX is generated, **Then** the image is read from disk via `UPLOADS_DIR` (not fetched as a relative URL).
4. **Given** a path-traversal style filename, **When** GET `/api/uploads/...` or assert runs, **Then** the request is rejected / not found.
5. **Given** LiveServer compose, **When** inspecting volumes, **Then** host `uploads/` is mounted for durability.

## References

- Spec: `spec-13-hub-ux-and-liveserver-gap.md`
- Amends: Story 6.1 / 6.7 (local path exception)
- Code: `src/lib/uploads.ts`, `src/lib/images.ts`, `src/lib/pptx.ts`, upload API routes
- Docs: `docs/deploy.md` (Announcement image refs)
