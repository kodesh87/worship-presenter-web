# API Contracts - Monolith

This document outlines the API endpoints, request/response formats, authentication requirements, and details of the monolithic Next.js backend of the `bic-pptx-workflow` project.

## Authentication Overview

The system uses two primary authentication methods:
1. **Session Cookie-Based Authentication:** Standard web routes and operational API endpoints require a signed session cookie (`auth_session`). Admin paths (`/api/admin/*`) additionally verify that the user has the `admin` role.
2. **Webhook Token-Based Authentication:** The webhook endpoint (`/api/webhook`) uses a custom request header signature check (`x-webhook-secret` or `Authorization: Bearer <secret>`) matching `WEBHOOK_SECRET`.

---

## Endpoint Summary

| Method | Path | Authentication | Role Required | Description |
|---|---|---|---|---|
| **POST** | `/api/auth/login` | None | None | Logs in a user, setting the session cookie. |
| **POST** | `/api/auth/logout` | Session | None | Logs out the current user, clearing the session cookie. |
| **POST** | `/api/auth/change-password` | Session | None | Changes the current user's password. |
| **POST** | `/api/webhook` | Webhook Secret | None | Receives run sheet rundown payloads and generates/updates services. |
| **GET** | `/api/services` | Session | None | Lists service entries with optional query filter. |
| **POST** | `/api/services` | Session | None | Creates a new service entry. |
| **GET** | `/api/services/[id]` | Session | None | Retrieves a specific service entry. |
| **PUT** | `/api/services/[id]` | Session | None | Updates a specific service entry. |
| **DELETE** | `/api/services/[id]` | Session | None | Deletes a specific service entry. |
| **GET** | `/api/services/[id]/pptx` | Session | None | Generates and downloads the PowerPoint slide deck for a service. |
| **GET** | `/api/announcements` | Session | None | Lists announcement flyer items. |
| **POST** | `/api/announcements` | Session | None | Adds new announcement items. |
| **GET** | `/api/announcements/[id]` | Session | None | Retrieves a specific announcement. |
| **PUT** | `/api/announcements/[id]` | Session | None | Updates an announcement item. |
| **DELETE** | `/api/announcements/[id]` | Session | None | Deletes an announcement item. |
| **POST** | `/api/upload` | Session | None | Uploads image files to local storage. |
| **GET** | `/api/uploads/[filename]` | Session | None | Retrieves an uploaded static file. |
| **GET** | `/api/scripture` | Session | None | Resolves scripture text references (KJV). |
| **GET** | `/api/admin/accounts` | Session | `admin` | Lists registered accounts. |
| **POST** | `/api/admin/accounts` | Session | `admin` | Creates a new operator/admin account. |
| **GET** | `/api/admin/accounts/[id]` | Session | `admin` | Retrieves account details. |
| **PUT** | `/api/admin/accounts/[id]` | Session | `admin` | Updates an account (role, username). |
| **DELETE** | `/api/admin/accounts/[id]` | Session | `admin` | Deletes an account. |
| **GET** | `/api/admin/settings` | Session | `admin` | Retrieves configuration settings. |
| **POST** | `/api/admin/settings` | Session | `admin` | Saves configuration settings. |

---

## Detailed API Specifications

### Authentication APIs

#### 1. POST `/api/auth/login`
- **Request Body:**
  ```json
  {
    "username": "user",
    "password": "password"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Logged in successfully",
    "role": "admin"
  }
  ```
- **Headers Set:** `Set-Cookie: auth_session=<signed-token>; HttpOnly; SameSite=Lax; Path=/`

#### 2. POST `/api/auth/logout`
- **Response (200 OK):**
  ```json
  {
    "message": "Logged out successfully"
  }
  ```
- **Headers Set:** Clears the `auth_session` cookie.

#### 3. POST `/api/auth/change-password`
- **Request Body:**
  ```json
  {
    "currentPassword": "old-password",
    "newPassword": "new-secure-password"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Password changed successfully"
  }
  ```

---

### Webhook & Services APIs

#### 4. POST `/api/webhook`
Receives run sheets and image announcements from chat bots (e.g., Telegram).
- **Authentication Headers:**
  - `x-webhook-secret: <secret>` OR `Authorization: Bearer <secret>`
- **Request Body:**
  ```json
  {
    "action": "correct", // Optional: indicates a correction message
    "serviceId": "123", // Optional: target service ID for corrections
    "date": "2026-07-19", // Optional: target date
    "text": "Divine Service\nElder: John Doe\nSDAH 100\n...", // Markdown/Text rundown payload
    "images": [
      "https://example.com/flyer.png"
    ],
    "announcements": [
      "https://example.com/flyer1.jpg"
    ]
  }
  ```
- **Response (201 Created or 200 OK):**
  ```json
  {
    "message": "Webhook received and processed successfully",
    "id": 1,
    "date": "2026-07-19",
    "parsedData": { ... },
    "resolvedHymns": [
      { "number": 100, "title": "Great Is Thy Faithfulness" }
    ],
    "failedHymnNumbers": [],
    "imagesCount": 1,
    "announcementsAdded": 1,
    "updated": false
  }
  ```

#### 5. GET `/api/services`
Lists recorded services.
- **Query Parameters:**
  - `q`: String (optional text search over date, raw rundown, or parsed content)
- **Response (200 OK):**
  ```json
  {
    "services": [
      {
        "id": 1,
        "date": "2026-07-19",
        "created_at": "2026-07-19T06:30:00.000Z",
        "updated_at": "2026-07-19T06:30:00.000Z",
        "raw_payload": "...",
        "parsed_data": { ... }
      }
    ],
    "q": null,
    "count": 1
  }
  ```

#### 6. GET `/api/services/[id]/pptx`
Generates and downloads the compiled PowerPoint slide deck.
- **Response (200 OK):** Binary stream of type `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- **Headers Set:** `Content-Disposition: attachment; filename="Service-2026-07-19.pptx"`

---

### Static Uploads & Utility APIs

#### 7. POST `/api/upload`
Uploads raw media files.
- **Request Body:** `multipart/form-data` containing:
  - `file`: Binary image file (JPEG, PNG, GIF, WebP)
- **Response (200 OK):**
  ```json
  {
    "url": "/api/uploads/a1b2c3d4e5f6g7h8.png"
  }
  ```

#### 8. GET `/api/scripture`
Resolves scripture reference to text from KJV database. Used for Presenter operator screen overlay.
- **Query Parameters:**
  - `ref`: String (e.g., `John 4:23` or `John 4:23,24`)
- **Response (200 OK):**
  ```json
  {
    "reference": "John 4:23",
    "text": "But the hour cometh, and now is, when the true worshippers..."
  }
  ```
