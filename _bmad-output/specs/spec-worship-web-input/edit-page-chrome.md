# Service Page Chrome — `/services/[id]`

Service-scoped chrome around the shared worship form. Create (`/services/new`) has no service actions; `/services/[id]` may add only what this companion keeps.

Today this route still reads as a **show/run-sheet**. Contract: it must become a **create-parity form with a working edit path**, plus the Keep chrome below.

## Keep

| Chrome | Purpose |
|---|---|
| **Preview** | Open slideshow preview for this service. |
| **Present** | Open presenter mode for this service. |
| **Delete Service** | Remove the service record. |
| **Download PPTX** | Download generated deck for this service. |
| **Announcement flyers → Manage list** | Link to `/announcements` so the operator can manage the master/list outside the form. |
| **Announcement flyers read-only strip** (summary above the form) | Leave unchanged this pass — do not redesign or remove. |

## Remove

| Chrome | Reason |
|---|---|
| **Order of Service** (read-only card listing `parsedData.items`) | Redundant. Order is already represented by **Raw Rundown Text** and **Live Slide Preview**. |
| **Service Highlights** | Not needed by operators; operators rely directly on the Raw Rundown Text. |

## Form parity with create

The `/services/[id]` form body (fields, groupings, labels, Parse control placement, announcement list editor inside the form) must match create. A working edit form is required (CAP-2, CAP-7). See `form-fields.md`. Differences allowed only for edit save semantics (PUT, `updated_at` / 409) and the Keep table above. Show-only divergence from create is a defect.

## Shell parity

`/`, `/services/new`, and `/services/[id]` share a stable header and main content column width (CAP-8). Create and `/services/[id]` use the same shell; navigating among the three routes must not jump header or column width.
