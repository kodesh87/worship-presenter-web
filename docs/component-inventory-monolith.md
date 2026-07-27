# Component Inventory - Monolith

This document catalogues the UI components and pages in the `bic-pptx-workflow` project, detailing their functionalities, patterns, and categories.

## Architecture & Technology Stack

- **UI Framework:** React 19.2.4 (in Next.js 16.2.10 App Router)
- **Styling Engine:** Tailwind CSS v4 (with PostCSS compilation)
- **Component Primitives:** Shadcn UI components built on top of Radix UI / Base UI react.
- **State & Synchronisation:**
  - **BroadcastChannel:** HTML5 local sync mechanism for real-time remote slideshow/projector control (`BroadcastChannel("bic-present-[serviceId]")`).
  - **Server Actions & Fetch API:** Standard REST communication with `/api/*` endpoints.

---

## Component Catalog

### 1. Layout & Layout Components

#### `Header` (`src/components/Header.tsx`)
The primary application banner shown across all authenticated pages.
- **Features:**
  - Dynamic branding link ("BIC Presenter Hub").
  - Account info display (displays username and role).
  - Navigation links to Dashboard, Announcements, and Admin settings.
  - Integration with the `LogoutButton`.

#### `LogoutButton` (`src/components/LogoutButton.tsx`)
A button that initiates session destruction.
- **Features:**
  - Issues a `POST /api/auth/login` equivalent request to `/api/auth/logout`.
  - Redirects user to `/login` upon success.

---

### 2. Specialized Feature Components

#### `ServicesList` (`src/app/ServicesList.tsx`)
The dashboard core listing church services sorted by date.
- **Features:**
  - Search filter bar (`GET /api/services?q=`).
  - Lists service date, created date, and parsing status (e.g., failed hymn indicators).
  - Quick action buttons: View details, Presentation Operator dashboard, Projector Screen view, Download PowerPoint slide deck, and Delete service.

#### `AccountsManager` (`src/app/admin/AccountsManager.tsx`)
Management console for operator and admin accounts.
- **Features:**
  - Tables list of current usernames and roles.
  - "Add Account" popover with username, password, and role selector.

#### `RetentionSettings` (`src/app/admin/RetentionSettings.tsx`)
System cleanup utility.
- **Features:**
  - Configures settings key/value.
  - Allows administrative cleanups of database history or temp slides.

#### `AnnouncementsManager` (`src/app/announcements/AnnouncementsManager.tsx`)
Drag-and-drop file flyer slide upload.
- **Features:**
  - Uploads local images using `POST /api/upload`.
  - Integrates draggable list layout to sort announcement flyers using order handles.
  - Persists order configurations via backend APIs.

#### `EditForm` (`src/app/services/[id]/EditForm.tsx`)
Dual panel workspace for a service rundown.
- **Features:**
  - Textarea markdown rundown editor panel.
  - Shows parsing validation results: detected date, scripture references, sermon, special song, closing prayer, and list of resolved hymns.
  - Flags unresolved SDAH hymn indices.

---

### 3. Presentation & Rendering Components

#### `SlideView` (`src/components/SlideView.tsx`)
Renders an individual slide page.
- **Features:**
  - Scale-to-fit letterbox viewport calculations.
  - Supports image slides, lyrics/text slides, and announcement flyers.

#### `PresenterOperator` (`src/app/services/[id]/present/PresenterOperator.tsx`)
Real-time dashboard for the AV operator in the church.
- **Features:**
  - Sidebar showing service rundown schedule (sections, hymns, speaker roles, announcements).
  - Main panel showing current active slide and next slide preview.
  - Dynamic scripture quick search overlay allowing search in the KJV Bible and instant projection on screen.
  - Broadcasts slide changes (`{type: "sync", index}`) and scripture overlays via the `BroadcastChannel`.

#### `ProjectorClient` (`src/app/services/[id]/present/projector/ProjectorClient.tsx`)
Full-screen projection view meant for the church projector screen.
- **Features:**
  - Listens to slide index sync actions via `BroadcastChannel`.
  - Renders slide imagery or scripture text overlay dynamically.
  - Features CSS crossfade transition animations between slides.

---

### 4. Shared UI Components (`src/components/ui/`)
Standard design system wrappers.

| Component | File | Radix/Base UI Primitive | Purpose |
|---|---|---|---|
| **Button** | `button.tsx` | - | Form button styling with variants (default, outline, destructive, ghost). |
| **Card** | `card.tsx` | - | Border container layout wrappers. |
| **Dialog** | `dialog.tsx` | `@base-ui/react` Dialog | Accessible overlay modals. |
| **Popover** | `popover.tsx` | `@base-ui/react` Popover | Contextual popups (e.g., adding user form). |
| **Sonner** | `sonner.tsx` | `sonner` | Toast message overlay utility. |
