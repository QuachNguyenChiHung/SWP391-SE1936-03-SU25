# Data Labeling System — API Documentation

> Version: 1.0 | Base URL: `http://localhost:5000/api` | Last updated: 2026-02-23

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Pagination](#pagination)
5. [Enums Reference](#enums-reference)
6. [Endpoints](#endpoints)
   - [Auth](#auth)
   - [Users](#users)
   - [Profile](#profile)
   - [Projects](#projects)
   - [Labels](#labels)
   - [Tasks](#tasks)
   - [Data Items & Dataset](#data-items--dataset)
   - [Annotations](#annotations)
   - [Reviews](#reviews)
   - [Dashboard](#dashboard)
   - [Export](#export)
   - [Notifications](#notifications)
   - [Activity Logs](#activity-logs)

---

## Overview

The Data Labeling Support System API manages the complete lifecycle of image labeling for machine learning datasets. The system supports four roles: **Admin**, **Manager**, **Annotator**, and **Reviewer**.

### Base URL

```
http://localhost:5000/api
```

### Role Permissions Matrix

| Feature | Admin | Manager | Annotator | Reviewer |
|---------|:-----:|:-------:|:---------:|:--------:|
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Approve/Reject Users | ✅ | ✅ | ❌ | ❌ |
| Create/Edit Projects | ✅ | ✅ | ❌ | ❌ |
| Upload Dataset | ✅ | ✅ | ❌ | ❌ |
| Assign Tasks | ✅ | ✅ | ❌ | ❌ |
| Annotate | ✅ | ✅ | ✅ | ❌ |
| Review Annotations | ✅ | ❌ | ❌ | ✅ |
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| Export Data | ✅ | ✅ | ❌ | ❌ |
| View Activity Logs | ✅ | ✅ | ❌ | ❌ |

---

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header.

```
Authorization: Bearer <your-jwt-token>
```

Tokens are obtained from `POST /api/auth/login`. Tokens expire after 60 minutes by default.

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Field error 1", "Field error 2"]
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK — Request succeeded |
| 201 | Created — Resource created |
| 204 | No Content — Success with no body (e.g., DELETE) |
| 400 | Bad Request — Validation failed |
| 401 | Unauthorized — Missing or invalid token |
| 403 | Forbidden — Insufficient role |
| 404 | Not Found — Resource does not exist |
| 500 | Internal Server Error |

---

## Pagination

Endpoints that return lists accept these query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pageNumber` | int | 1 | Page index (1-based) |
| `pageSize` | int | 10 | Items per page |

Paginated responses have this structure inside `data`:

```json
{
  "items": [ ],
  "totalCount": 100,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 10,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

---

## Enums Reference

### UserRole
| Value | Name | Description |
|-------|------|-------------|
| 1 | Admin | Full system access |
| 2 | Manager | Project management |
| 3 | Annotator | Image labeling |
| 4 | Reviewer | Review and approve annotations |

### UserStatus
| Value | Name |
|-------|------|
| 1 | Active |
| 2 | Inactive |
| 3 | PendingVerification |
| 4 | PendingApproval |

### ProjectStatus
| Value | Name |
|-------|------|
| 1 | Draft |
| 2 | Active |
| 3 | Completed |
| 4 | Archived |

### ProjectType
| Value | Name |
|-------|------|
| 1 | Classification |
| 2 | ObjectDetection |
| 3 | Segmentation |
| 4 | Video |

### DataItemStatus
| Value | Name | Flow |
|-------|------|------|
| 1 | Pending | Initial state after upload |
| 2 | Assigned | Assigned to a task |
| 3 | InProgress | Annotator started work |
| 4 | Submitted | Submitted for review |
| 5 | Approved | Reviewer approved |
| 6 | Rejected | Reviewer rejected (may be re-annotated) |

### AnnotationTaskStatus
| Value | Name |
|-------|------|
| 1 | Assigned |
| 2 | InProgress |
| 3 | Submitted |
| 4 | Completed |

### TaskItemStatus
| Value | Name |
|-------|------|
| 1 | Assigned |
| 2 | InProgress |
| 3 | Completed |

### ReviewDecision
| Value | Name |
|-------|------|
| 1 | Approved |
| 2 | Rejected |

### NotificationType
| Value | Name |
|-------|------|
| 1 | TaskAssigned |
| 2 | ItemApproved |
| 3 | ItemRejected |
| 4 | ProjectPublished |
| 5 | DeadlineReminder |

### ActivityAction
| Value | Name |
|-------|------|
| 1 | Create |
| 2 | Update |
| 3 | Delete |
| 4 | Submit |
| 5 | Approve |
| 6 | Reject |
| 7 | Assign |
| 8 | Login |
| 9 | Logout |

### ExportFormat
| Value | Name |
|-------|------|
| 1 | COCO |
| 2 | YOLO |
| 3 | PascalVOC |

---

## Endpoints

---

### Auth

**Base route:** `/api/auth`
All auth endpoints are public (`[AllowAnonymous]`).

---

#### POST /api/auth/login

> **Purpose:** Authenticate a registered user and receive a JWT access token. This is the entry point for all authenticated users — call this first and attach the returned `token` to all subsequent requests via the `Authorization: Bearer` header.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password@123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "tokenType": "Bearer",
    "expiresAt": "2026-02-23T11:00:00Z",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": 2,
      "roleName": "Manager",
      "status": 1,
      "statusName": "Active",
      "createdAt": "2026-01-01T00:00:00Z",
      "lastLoginAt": "2026-02-23T10:00:00Z"
    }
  }
}
```

---

#### POST /api/auth/register

> **Purpose:** Allow a new user to self-register an account and choose their role (Annotator or Reviewer). After registration, the account is in `PendingVerification` state — the user must verify their email before they can log in. Once verified, an Admin or Manager still needs to approve the account before the user can access the system.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password@123",
  "confirmPassword": "Password@123",
  "role": 3
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "message": "Verification email sent.",
    "email": "jane@example.com"
  }
}
```

---

#### POST /api/auth/verify-email

> **Purpose:** Confirm the user's email address using the one-time token sent to their inbox after registration. Calling this endpoint activates the account from `PendingVerification` → `PendingApproval`, unlocking the next step (admin approval). Use the `email` + `token` values extracted from the verification link in the email.

**Request Body:**
```json
{
  "email": "jane@example.com",
  "token": "verification-token-from-email"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Email verified successfully."
}
```

---

#### POST /api/auth/resend-verification

> **Purpose:** Resend the email verification link to a user who did not receive it or whose token has expired. Only useful for accounts still in `PendingVerification` state.

**Request Body:**
```json
{
  "email": "jane@example.com"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Verification email resent."
}
```

---

#### POST /api/auth/forgot-password

> **Purpose:** Initiate the password reset flow for a user who has forgotten their password. The system sends an email containing a one-time reset token. Always returns a success message regardless of whether the email exists (to prevent email enumeration attacks).

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Password reset instructions have been sent to your email."
}
```

---

#### POST /api/auth/reset-password

> **Purpose:** Set a new password using the reset token received via email. The token is single-use and time-limited. After a successful reset the user should log in again with the new password via `/api/auth/login`.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewPassword@123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Password has been reset successfully."
}
```

---

### Users

**Base route:** `/api/users`
**Required role:** `Admin` (unless noted otherwise)

---

#### GET /api/users

> **Purpose:** Retrieve a paginated, searchable list of all user accounts in the system. Used by Admin to manage the user base — browse all registered accounts, filter by role (e.g., show only Annotators) or by status (e.g., show only inactive users), and search by name or email.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `pageNumber` | int | Page number (default: 1) |
| `pageSize` | int | Items per page (default: 10) |
| `search` | string? | Search by name or email |
| `role` | UserRole? | Filter by role (1–4) |
| `status` | UserStatus? | Filter by status (1–4) |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "email": "admin@example.com",
        "name": "Admin User",
        "role": 1,
        "roleName": "Admin",
        "status": 1,
        "statusName": "Active",
        "createdAt": "2026-01-01T00:00:00Z",
        "lastLoginAt": "2026-02-23T10:00:00Z"
      }
    ],
    "totalCount": 50,
    "pageNumber": 1,
    "pageSize": 10,
    "totalPages": 5,
    "hasPreviousPage": false,
    "hasNextPage": true
  }
}
```

---

#### GET /api/users/{id}

> **Purpose:** Fetch the full profile of a specific user by their ID. Used when Admin needs to view details of a particular account — for example, before editing a user's role or checking their registration date.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | int | User ID |

**Response `200`:** Returns `ApiResponse<UserDto>`.

**Response `404`:** User not found.

---

#### POST /api/users

> **Purpose:** Allow Admin to directly create a user account without going through the self-registration and email-verification flow. The created account is immediately `Active`. Use this to onboard team members quickly (e.g., creating multiple Annotator accounts at project start).

**Request Body:**
```json
{
  "email": "annotator@example.com",
  "password": "Password@123",
  "name": "New Annotator",
  "role": 3
}
```

**Response `201`:** Returns `ApiResponse<UserDto>` with the created user.

---

#### PUT /api/users/{id}

> **Purpose:** Update any combination of a user's fields (name, email, role, or status). Admin can use this to promote a user to a different role, deactivate an account by setting `status = 2 (Inactive)`, or correct a typo in a user's name or email.

**Path Parameters:** `id` — User ID

**Request Body:**
```json
{
  "email": "new-email@example.com",
  "name": "Updated Name",
  "role": 4,
  "status": 1
}
```
All fields are optional. Only provided fields are updated.

**Response `200`:** Returns `ApiResponse<UserDto>` with updated user.

---

#### DELETE /api/users/{id}

> **Purpose:** Permanently remove a user account from the system. This operation is restricted — it will fail if the user has any associated data (projects they created, tasks they were assigned, annotations they made, reviews they submitted). Intended only for removing test accounts or users with no activity.

**Path Parameters:** `id` — User ID

**Response `200`:**
```json
{
  "success": true,
  "message": "User deleted successfully."
}
```

---

#### GET /api/users/pending-approval

> **Purpose:** List all user accounts that have completed email verification but are waiting for Admin or Manager approval before they can log in. This is the moderation queue — regularly check this to review and onboard new team members. The response shows when each user registered so you can prioritize older requests.

**Required roles:** Admin, Manager

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "email": "newuser@example.com",
      "name": "New User",
      "role": 3,
      "registeredAt": "2026-02-20T08:00:00Z"
    }
  ]
}
```

---

#### POST /api/users/{id}/approve

> **Purpose:** Approve a pending user account, granting them access to the system. After approval the account status changes to `Active` and the user can log in. An optional `notes` message can be stored for record-keeping (e.g., "Approved for Project X"). A notification is sent to the user automatically.

**Required roles:** Admin, Manager

**Path Parameters:** `id` — User ID

**Request Body (optional):**
```json
{
  "notes": "Welcome to the team!"
}
```

**Response `200`:** Returns `ApiResponse<UserDto>` with the approved user.

---

#### POST /api/users/{id}/reject

> **Purpose:** Reject a pending user account, preventing them from accessing the system. A mandatory rejection reason must be provided. Use this when a registration does not meet requirements (e.g., unknown person, wrong role requested, duplicate account). The user is notified with the reason.

**Required roles:** Admin, Manager

**Path Parameters:** `id` — User ID

**Request Body:**
```json
{
  "reason": "Does not meet requirements."
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "User rejected."
}
```

---

### Profile

**Base route:** `/api/profile`
**Required role:** Any authenticated user

---

#### GET /api/profile

> **Purpose:** Retrieve the currently logged-in user's own profile information. Called on app startup or when navigating to the "My Profile" page to display the user's name, role, and account status. Also useful for re-validating the session after a token refresh.

**Response `200`:** Returns `ApiResponse<UserDto>`.

---

#### PUT /api/profile

> **Purpose:** Allow any logged-in user to update their own display name. This is the self-service profile edit — users cannot change their own role or email through this endpoint (those require Admin action). Use this for the "Edit Profile" page.

**Request Body:**
```json
{
  "name": "Updated Display Name"
}
```

**Response `200`:** Returns `ApiResponse<UserDto>` with updated profile.

---

#### POST /api/profile/change-password

> **Purpose:** Allow any logged-in user to change their own password securely. Requires providing the current password as confirmation before setting a new one, preventing unauthorized password changes even if a session is left open. Enforce this from the "Security Settings" page.

**Request Body:**
```json
{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@123",
  "confirmNewPassword": "NewPassword@123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Password changed successfully."
}
```

---

### Projects

**Base route:** `/api/projects`
**Required role:** Any authenticated user (write operations require Admin or Manager)

---

#### GET /api/projects

> **Purpose:** Retrieve a paginated list of labeling projects. The results are role-filtered on the backend — Annotators and Reviewers see only projects they are assigned to, while Admin and Manager see all projects. Used to render the project listing/dashboard page. Supports filtering by status and searching by name.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `pageNumber` | int | Page number |
| `pageSize` | int | Items per page |
| `status` | ProjectStatus? | Filter by status (1–4) |
| `searchTerm` | string? | Search by project name |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Vehicle Detection",
        "description": "Detect vehicles in traffic footage",
        "type": 2,
        "status": 2,
        "deadline": "2026-06-30",
        "createdAt": "2026-01-15T08:00:00Z",
        "updatedAt": null,
        "totalItems": 5000,
        "finishedItems": 1200
      }
    ],
    "totalCount": 10,
    "pageNumber": 1,
    "pageSize": 10,
    "totalPages": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

---

#### GET /api/projects/{id}

> **Purpose:** Fetch the full details of a single project, including metadata such as who created it, whether a dataset and guideline have been uploaded, how many labels are defined, and the overall progress (total vs finished items). Use this to populate the project detail/overview page.

**Path Parameters:** `id` — Project ID

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Vehicle Detection",
    "description": "Detect vehicles in traffic footage",
    "type": 2,
    "status": 2,
    "deadline": "2026-06-30",
    "createdAt": "2026-01-15T08:00:00Z",
    "updatedAt": "2026-02-01T10:00:00Z",
    "createdById": 1,
    "createdByName": "Admin User",
    "hasDataset": true,
    "hasGuideline": true,
    "labelCount": 5,
    "taskCount": 12,
    "totalItems": 5000,
    "finishedItems": 1200
  }
}
```

---

#### GET /api/projects/{id}/statistics

> **Purpose:** Retrieve detailed progress statistics for a project, broken down by status (how many items are Pending, InProgress, Submitted, Approved, Rejected). Use this to render charts and progress bars on the project analytics/statistics page. Also useful for generating progress reports.

**Path Parameters:** `id` — Project ID

**Response `200`:** Returns `ApiResponse<ProjectStatistics>` with detailed progress metrics.

---

#### GET /api/projects/upcoming-deadlines

> **Purpose:** Get a list of projects whose deadlines are approaching within the next N days. Used to display a "deadline alert" panel on the Manager dashboard so that project managers can prioritize their work and follow up on slow-progress tasks before the deadline is missed.

**Required roles:** Admin, Manager

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `daysAhead` | int | 7 | Number of days to look ahead |

**Response `200`:** Returns `ApiResponse<IEnumerable<ProjectDto>>`.

---

#### POST /api/projects

> **Purpose:** Create a new labeling project. This is the first step in the labeling workflow. After creation, the Manager uploads a dataset, defines labels, writes guidelines, and then assigns tasks to Annotators. A project starts in `Draft` status and must be changed to `Active` before Annotators can begin work.

**Required roles:** Admin, Manager

**Request Body:**
```json
{
  "name": "New Dataset Project",
  "description": "Optional project description",
  "type": 2,
  "deadline": "2026-12-31",
  "guidelineContent": "Optional initial guideline text"
}
```

**Field rules:**
- `name`: required, max 200 characters
- `description`: optional, max 1000 characters
- `type`: required (see [ProjectType](#projecttype))
- `deadline`: optional, must be a future date

**Response `201`:** Returns `ApiResponse<ProjectDto>` with the created project.

---

#### PUT /api/projects/{id}

> **Purpose:** Update a project's editable metadata — name, description, or deadline. Use this when a project needs to be renamed, its scope description updated, or the deadline extended. This does not affect the project's status or dataset.

**Required roles:** Admin, Manager

**Path Parameters:** `id` — Project ID

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "deadline": "2026-12-31"
}
```

**Response `200`:** Returns `ApiResponse` (no data body).

---

#### PATCH /api/projects/{id}/status

> **Purpose:** Transition a project through its lifecycle statuses (`Draft` → `Active` → `Completed` → `Archived`). Activating a project (`status = 2`) signals that it is ready for annotation work. Completing or archiving it closes it off from further edits. Use this as the project lifecycle control button.

**Required roles:** Admin, Manager

**Path Parameters:** `id` — Project ID

**Request Body:**
```json
{
  "status": 2
}
```

**Response `200`:** Returns `ApiResponse` (no data body).

---

#### DELETE /api/projects/{id}

> **Purpose:** Permanently delete a project along with its dataset, labels, and guideline (cascade). This will fail if any annotation tasks have been created for the project, to prevent accidental loss of work in progress. Only use this for projects that were created by mistake or are no longer needed with no work done yet.

**Required roles:** Admin, Manager

**Path Parameters:** `id` — Project ID

**Response `200`:** Returns `ApiResponse` (no data body).

---

#### POST /api/projects/{id}/guideline/upload

> **Purpose:** Upload a document file (PDF, DOCX, etc.) as the labeling guideline for a project. Annotators will download and read this before starting work to ensure consistent labeling standards. Uploading a new file replaces the previous version and increments the version counter.

**Required roles:** Admin, Manager

**Path Parameters:** `id` — Project ID

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | IFormFile | Guideline document (PDF, DOCX, etc.) |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "fileUrl": "/api/projects/1/guideline/download",
    "fileName": "guideline.pdf",
    "fileSize": 204800
  }
}
```

---

#### GET /api/projects/{id}/guideline/download

> **Purpose:** Download the raw guideline file for a project. Used on the guideline page to let Annotators download the PDF/DOCX to their local machine for reading offline. Returns the binary file stream directly — open in a new browser tab or trigger as a file download.

**Path Parameters:** `id` — Project ID

**Response `200`:** Binary file stream (with appropriate `Content-Type` header).

---

#### GET /api/projects/{id}/guideline

> **Purpose:** Retrieve the guideline's metadata and text content (if stored as plain text) without downloading the file. Used to display guideline information in the UI — for example, showing the file name, version, and last updated date alongside an inline preview or download button.

**Path Parameters:** `id` — Project ID

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "projectId": 1,
    "content": "Text content if stored as text...",
    "fileName": "guideline.pdf",
    "fileSize": 204800,
    "contentType": "application/pdf",
    "fileUrl": "/api/projects/1/guideline/download",
    "version": 2,
    "createdAt": "2026-01-15T08:00:00Z",
    "updatedAt": "2026-02-01T10:00:00Z"
  }
}
```

---

### Labels

**Base route:** `/api`
**Required role:** Any authenticated user (write operations require Admin or Manager)

---

#### GET /api/projects/{projectId}/labels

> **Purpose:** Retrieve all label definitions for a project in their display order. Labels are the categories that Annotators use to tag objects in images (e.g., "Car", "Person", "Truck"). This list is loaded when opening the annotation editor to populate the label palette/toolbar.

**Path Parameters:** `projectId` — Project ID

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "projectId": 1,
      "name": "Car",
      "color": "#FF5733",
      "shortcut": "c",
      "description": "Passenger cars and sedans",
      "displayOrder": 1,
      "createdAt": "2026-01-15T08:00:00Z"
    }
  ]
}
```

---

#### GET /api/labels/{id}

> **Purpose:** Fetch a single label's details by ID. Used when editing a specific label — pre-populate the edit form with the current name, color, shortcut, and description.

**Path Parameters:** `id` — Label ID

**Response `200`:** Returns `ApiResponse<LabelDto>`.

---

#### POST /api/projects/{projectId}/labels

> **Purpose:** Create a new label category for a project. Each label must have a unique name and a distinct color (hex) within the project so Annotators can visually distinguish them. An optional keyboard shortcut allows faster label selection in the annotation editor. Labels should be created before assigning tasks.

**Required roles:** Admin, Manager

**Path Parameters:** `projectId` — Project ID

**Request Body:**
```json
{
  "name": "Truck",
  "color": "#3498DB",
  "shortcut": "t",
  "description": "Large trucks and lorries"
}
```

**Field rules:**
- `name`: required, unique per project
- `color`: required, hex format `#RRGGBB`
- `shortcut`: optional, single character, unique per project

**Response `201`:** Returns `ApiResponse<LabelDto>` with created label.

---

#### PUT /api/labels/{id}

> **Purpose:** Update an existing label's properties (name, color, shortcut, or description). Use this to correct a typo in a label name, change its color for better visual clarity, or update the description with more precise instructions for Annotators. All existing annotations using this label are automatically reflected with the new name/color.

**Required roles:** Admin, Manager

**Path Parameters:** `id` — Label ID

**Request Body:**
```json
{
  "name": "Updated Label",
  "color": "#2ECC71",
  "shortcut": "u",
  "description": "Updated description"
}
```
All fields are optional.

**Response `200`:** Returns `ApiResponse<LabelDto>` with updated label.

---

#### DELETE /api/labels/{id}

> **Purpose:** Delete a label from a project. This will fail if any existing annotations are using this label, to prevent orphaned data. Safe to use on newly created labels that have not been used yet. Before deleting, reassign or remove all annotations with this label first.

**Required roles:** Admin, Manager

**Path Parameters:** `id` — Label ID

**Response `200`:** Returns `ApiResponse` (no data body).

---

#### PUT /api/projects/{projectId}/labels/reorder

> **Purpose:** Change the display order of labels in the annotation editor's label palette. Send the full ordered list of label IDs in the desired sequence. Use this to put the most frequently used labels at the top for faster Annotator access, improving labeling speed.

**Required roles:** Admin, Manager

**Path Parameters:** `projectId` — Project ID

**Request Body:**
```json
{
  "labelIds": [3, 1, 2, 5, 4]
}
```

**Response `200`:** Returns `ApiResponse` (no data body).

---

### Tasks

**Base route:** `/api/tasks`
**Required role:** Admin, Manager, or Annotator (varies by endpoint)

---

#### GET /api/tasks

> **Purpose:** List annotation tasks with filtering. Admin and Manager see all tasks across projects and can filter by project or status to monitor team workload. Annotators see only their own assigned tasks. Used to render the task management page for managers and the "My Tasks" page for annotators.

**Required roles:** Admin, Manager, Annotator (Annotator sees only their own tasks)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `pageNumber` | int | Page number |
| `pageSize` | int | Items per page |
| `projectId` | int? | Filter by project |
| `status` | AnnotationTaskStatus? | Filter by status (1–4) |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "projectId": 1,
        "projectName": "Vehicle Detection",
        "annotatorId": 3,
        "annotatorName": "Jane Annotator",
        "status": 2,
        "totalItems": 50,
        "completedItems": 20,
        "progressPercent": 40.0,
        "assignedAt": "2026-02-01T08:00:00Z",
        "submittedAt": null,
        "completedAt": null,
        "createdAt": "2026-02-01T08:00:00Z"
      }
    ],
    "totalCount": 5,
    "pageNumber": 1,
    "pageSize": 10,
    "totalPages": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

---

#### GET /api/tasks/{id}

> **Purpose:** Fetch the full details of a task, including the list of all individual image items (TaskItems) within it and each item's current status. Used to render the task detail page — an Annotator can see all their assigned images and their progress, while a Manager can inspect the task's composition and track completion item by item.

**Path Parameters:** `id` — Task ID

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "projectId": 1,
    "projectName": "Vehicle Detection",
    "annotatorId": 3,
    "annotatorName": "Jane Annotator",
    "assignedById": 2,
    "assignedByName": "Project Manager",
    "status": 2,
    "totalItems": 50,
    "completedItems": 20,
    "progressPercent": 40.0,
    "assignedAt": "2026-02-01T08:00:00Z",
    "submittedAt": null,
    "completedAt": null,
    "createdAt": "2026-02-01T08:00:00Z",
    "updatedAt": "2026-02-10T12:00:00Z",
    "items": [
      {
        "id": 10,
        "dataItemId": 100,
        "fileName": "image_001.jpg",
        "filePath": "/uploads/1/1/image_001.jpg",
        "thumbnailPath": "/uploads/1/1/thumbnails/image_001.jpg",
        "status": 2,
        "dataItemStatus": 3,
        "assignedAt": "2026-02-01T08:00:00Z",
        "startedAt": "2026-02-05T09:00:00Z",
        "completedAt": null
      }
    ]
  }
}
```

---

#### POST /api/tasks

> **Purpose:** Create a new annotation task by selecting a set of unassigned images from a project and assigning them to a specific Annotator. This is the primary task management action for Managers — distribute the dataset among available Annotators. Items already assigned to another task are automatically skipped (reported in `skippedItems`). A notification is sent to the assigned Annotator upon creation.

**Required roles:** Admin, Manager

**Request Body:**
```json
{
  "projectId": 1,
  "annotatorId": 3,
  "dataItemIds": [100, 101, 102, 103, 104]
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "task": { },
    "assignedItems": 5,
    "skippedItems": 0,
    "errors": []
  }
}
```

- `skippedItems`: items already assigned to another task (not reassigned)
- `errors`: messages for items that could not be assigned

---

#### POST /api/tasks/{id}/submit

> **Purpose:** Allow an Annotator to officially submit a completed task for review. All items in the task must be in `Completed` status before this call succeeds. Submitting changes the task status to `Submitted` and all items to `Submitted`, placing them in the reviewer's pending queue. A notification is sent to the project's Reviewers.

**Required role:** Annotator

**Path Parameters:** `id` — Task ID

**Response `200`:** Returns `ApiResponse`.

---

#### POST /api/tasks/{id}/items

> **Purpose:** Add additional image items to an existing task that has already been created. Use this when a Manager needs to expand an Annotator's workload after initial assignment — for example, after uploading a new batch of images to the dataset. Items already assigned elsewhere are automatically skipped.

**Required roles:** Admin, Manager

**Path Parameters:** `id` — Task ID

**Request Body:**
```json
{
  "dataItemIds": [200, 201, 202]
}
```

**Response `200`:** Returns `TaskAssignmentResultDto`.

---

#### DELETE /api/tasks/{id}/items

> **Purpose:** Remove specific image items from a task without deleting the task itself. Use this to reassign certain images to a different Annotator, or to remove images that were incorrectly included. Removed items return to `Pending` status and become available for reassignment.

**Required roles:** Admin, Manager

**Path Parameters:** `id` — Task ID

**Request Body:**
```json
[200, 201, 202]
```
(Array of `dataItemId` integers)

**Response `200`:** Returns removal result.

---

#### DELETE /api/tasks/{id}

> **Purpose:** Delete an entire task. All items in the task are returned to `Pending` status and can be reassigned. Use this when a task was created by mistake or the Annotator is no longer available and the work needs to be redistributed. Cannot delete a task that has already been submitted or completed.

**Required roles:** Admin, Manager

**Path Parameters:** `id` — Task ID

**Response `204`:** No content.

---

#### GET /api/tasks/projects/{projectId}/unassigned-items

> **Purpose:** List images in a project that have not been assigned to any task yet (status = `Pending`). Used to populate the item selection UI when creating a new task — the Manager picks from this list to build the task's item set. Supports pagination for large datasets.

**Required roles:** Admin, Manager

**Path Parameters:** `projectId` — Project ID

**Query Parameters:** `pageNumber`, `pageSize`

**Response `200`:** Returns paginated `DataItemDto` list.

---

#### GET /api/tasks/annotators

> **Purpose:** Retrieve a simplified list of all active Annotator accounts. Used to populate the "Assign to Annotator" dropdown when creating or editing a task, allowing the Manager to select who to assign the work to.

**Required roles:** Admin, Manager

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "name": "Jane Annotator",
      "email": "jane@example.com"
    }
  ]
}
```

---

### Data Items & Dataset

**Base route:** `/api`
**Required role:** Any authenticated user (write/delete operations require Admin or Manager)

---

#### GET /api/projects/{projectId}/dataset

> **Purpose:** Get high-level metadata about a project's dataset — how many images have been uploaded and the total file size. Used to display a dataset summary card on the project detail page before diving into individual items. Also useful for checking whether a dataset has been created yet (`hasDataset` check on project detail).

**Path Parameters:** `projectId` — Project ID

**Response `200`:**
```json
{
  "id": 1,
  "projectId": 1,
  "totalItems": 5000,
  "totalSizeMB": 2048.5,
  "createdAt": "2026-01-20T08:00:00Z"
}
```

---

#### POST /api/projects/{projectId}/dataset/upload

> **Purpose:** Batch upload image files to a project's dataset. This is the core data ingestion endpoint — Managers upload all the images that need to be labeled. Supports multiple files in a single request. The server automatically generates thumbnails, extracts image dimensions, and records file metadata. Unsupported formats are rejected individually while valid files proceed.

**Required roles:** Admin, Manager

**Path Parameters:** `projectId` — Project ID

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `files` | IFormFileCollection | Image files (`.jpg`, `.jpeg`, `.png`) |

**Response `200`:**
```json
{
  "uploadedCount": 48,
  "failedCount": 2,
  "errors": ["file_invalid.txt: Unsupported file type"]
}
```

---

#### GET /api/projects/{projectId}/data-items

> **Purpose:** Retrieve a paginated list of all images in a project's dataset with their current labeling status. Used to render the dataset browser page — Managers can see which images are still unassigned (`Pending`), in progress, awaiting review, or already approved. Filter by `status` to focus on a specific subset.

**Path Parameters:** `projectId` — Project ID

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `pageNumber` | int | Page number |
| `pageSize` | int | Items per page |
| `status` | DataItemStatus? | Filter by status (1–6) |

**Response `200`:** Returns paginated list.

```json
{
  "items": [
    {
      "id": 100,
      "datasetId": 1,
      "fileName": "image_001.jpg",
      "filePath": "/uploads/1/1/image_001.jpg",
      "thumbnailPath": "/uploads/1/1/thumbnails/image_001.jpg",
      "fileSizeKB": 512,
      "width": 1920,
      "height": 1080,
      "status": 1,
      "createdAt": "2026-01-20T08:00:00Z"
    }
  ],
  "totalCount": 5000,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 500,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

---

#### GET /api/data-items/{id}

> **Purpose:** Get complete details about a single image, including all annotations that have been placed on it and all review decisions it has received. Used to render the image detail/inspection page — useful for Managers auditing specific images or for debugging annotation issues.

**Path Parameters:** `id` — DataItem ID

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": 100,
    "fileName": "image_001.jpg",
    "filePath": "/uploads/1/1/image_001.jpg",
    "thumbnailPath": "/uploads/1/1/thumbnails/image_001.jpg",
    "status": 5,
    "projectId": 1,
    "projectName": "Vehicle Detection",
    "annotations": [ ],
    "reviews": [ ],
    "currentTaskItemId": 10,
    "createdAt": "2026-01-20T08:00:00Z"
  }
}
```

---

#### DELETE /api/data-items/{id}

> **Purpose:** Remove a specific image from the dataset and delete its file from storage. Will fail if the image has completed annotations or review records to prevent data loss. Use this to clean up incorrectly uploaded images, blurry photos, or duplicate files before work has started on them.

**Required roles:** Admin, Manager

**Path Parameters:** `id` — DataItem ID

**Response `204`:** No content.

---

#### DELETE /api/projects/{projectId}/dataset

> **Purpose:** Wipe the entire dataset for a project — deletes all images, thumbnails, and their database records at once. This is a destructive operation and will also remove all associated annotations and reviews (cascade). Only use this to completely restart the data ingestion process for a project (e.g., wrong images were uploaded).

**Required roles:** Admin, Manager

**Path Parameters:** `projectId` — Project ID

**Response `204`:** No content.

---

#### PATCH /api/data-items/{id}/status

> **Purpose:** Manually override the status of a single image. Used by Managers to fix data inconsistencies — for example, resetting a stuck item back to `Pending`, or manually moving an item forward in the workflow. Prefer using the normal workflow actions (annotate, submit, review) over this unless correcting errors.

**Required roles:** Admin, Manager

**Path Parameters:** `id` — DataItem ID

**Request Body:**
```json
{
  "status": 1
}
```

**Response `204`:** No content.

---

#### PATCH /api/data-items/bulk-status

> **Purpose:** Override the status of multiple images in a single API call. Used for bulk data management operations — for example, resetting a batch of rejected images back to `Pending` so they can be reassigned, or bulk-approving a set of images after an offline review. More efficient than calling the single-item endpoint repeatedly.

**Required roles:** Admin, Manager

**Request Body:**
```json
{
  "ids": [100, 101, 102, 103],
  "status": 1
}
```

**Response `204`:** No content.

---

### Annotations

**Base route:** `/api`
**Required role:** Any authenticated user (write operations require Admin, Manager, or Annotator)

---

#### GET /api/data-items/{dataItemId}/annotations

> **Purpose:** Retrieve all annotation objects (bounding boxes, polygons, classifications) that have been drawn on a specific image. Used when loading the annotation editor to display existing annotations, or when the Review editor needs to display what the Annotator labeled for inspection.

**Path Parameters:** `dataItemId` — DataItem ID

**Response `200`:**
```json
[
  {
    "id": 1,
    "dataItemId": 100,
    "labelId": 1,
    "labelName": "Car",
    "labelColor": "#FF5733",
    "createdById": 3,
    "createdByName": "Jane Annotator",
    "coordinates": "{\"type\":\"bbox\",\"x\":120,\"y\":80,\"width\":200,\"height\":150}",
    "attributes": null,
    "createdAt": "2026-02-05T09:30:00Z",
    "updatedAt": null
  }
]
```

**Coordinate formats:**
```json
// Bounding box
{"type":"bbox","x":100,"y":200,"width":150,"height":100}

// Polygon
{"type":"polygon","points":[{"x":100,"y":100},{"x":200,"y":100},{"x":150,"y":200}]}

// Classification
{"type":"classification"}
```

---

#### GET /api/annotations/{id}

> **Purpose:** Fetch a single annotation object by its ID. Used when the frontend needs to reload or verify a specific annotation after an edit, or display its details in a side panel without reloading all annotations.

**Path Parameters:** `id` — Annotation ID

**Response `200`:** Returns `AnnotationDto`.

---

#### POST /api/data-items/{dataItemId}/annotations

> **Purpose:** Create a single new annotation on an image — for example, when an Annotator draws one bounding box. The annotation is immediately persisted. For saving many annotations at once after a full editing session, prefer `save-all` instead for better performance.

**Required roles:** Admin, Manager, Annotator

**Path Parameters:** `dataItemId` — DataItem ID

**Request Body:**
```json
{
  "labelId": 1,
  "coordinates": "{\"type\":\"bbox\",\"x\":120,\"y\":80,\"width\":200,\"height\":150}",
  "attributes": null
}
```

**Response `201`:** Returns `AnnotationDto`.

---

#### PUT /api/annotations/{id}

> **Purpose:** Update an existing annotation — for example, when an Annotator resizes a bounding box, changes the label, or corrects the polygon points. Only the fields provided are updated; omitted fields retain their current values.

**Required roles:** Admin, Manager, Annotator

**Path Parameters:** `id` — Annotation ID

**Request Body:**
```json
{
  "labelId": 2,
  "coordinates": "{\"type\":\"bbox\",\"x\":130,\"y\":90,\"width\":210,\"height\":160}",
  "attributes": null
}
```
All fields are optional.

**Response `200`:** Returns updated `AnnotationDto`.

---

#### DELETE /api/annotations/{id}

> **Purpose:** Remove a single annotation from an image — for example, when an Annotator deletes a mistakenly drawn bounding box. The deletion is immediate. Use `save-all` if you need to delete multiple annotations as part of a full canvas reset.

**Required roles:** Admin, Manager, Annotator

**Path Parameters:** `id` — Annotation ID

**Response `204`:** No content.

---

#### POST /api/data-items/{dataItemId}/annotations/save-all

> **Purpose:** Atomically replace all annotations on an image with a new set in a single request. This is the recommended way to save from the annotation editor — send the complete current state of the canvas (all annotations as drawn) and the server replaces everything. Eliminates the need to track individual creates/updates/deletes on the frontend.

**Required roles:** Admin, Manager, Annotator

**Path Parameters:** `dataItemId` — DataItem ID

**Request Body:**
```json
{
  "annotations": [
    {
      "labelId": 1,
      "coordinates": "{\"type\":\"bbox\",\"x\":120,\"y\":80,\"width\":200,\"height\":150}",
      "attributes": null
    },
    {
      "labelId": 2,
      "coordinates": "{\"type\":\"bbox\",\"x\":400,\"y\":200,\"width\":100,\"height\":80}",
      "attributes": null
    }
  ]
}
```

**Response `200`:** Returns `IEnumerable<AnnotationDto>` for all saved annotations.

---

#### GET /api/task-items/{taskItemId}/editor

> **Purpose:** Load all the data needed to open the annotation editor for a specific task item in a single call. Returns the image path, project info, all label definitions (for the label palette), existing annotations (to display on the canvas), and navigation info (previous/next item IDs for arrow-key navigation between images within the task).

**Required roles:** Admin, Manager, Annotator

**Path Parameters:** `taskItemId` — TaskItem ID

**Response `200`:**
```json
{
  "taskItemId": 10,
  "dataItemId": 100,
  "fileName": "image_001.jpg",
  "filePath": "/uploads/1/1/image_001.jpg",
  "projectId": 1,
  "projectName": "Vehicle Detection",
  "labels": [ ],
  "currentAnnotations": [ ],
  "hasPreviousItem": false,
  "hasNextItem": true,
  "previousItemId": null,
  "nextItemId": 11
}
```

---

#### POST /api/task-items/{taskItemId}/start

> **Purpose:** Signal that an Annotator has opened and started working on a specific image within their task. Changes the item's status from `Assigned` → `InProgress` and records the start timestamp. Call this when the Annotator first opens the annotation editor for this item. The overall task status also transitions to `InProgress` if it hasn't already.

**Required role:** Annotator

**Path Parameters:** `taskItemId` — TaskItem ID

**Response `200`:**
```json
{
  "taskItemId": 10,
  "status": 2,
  "taskProgress": 20.0,
  "message": "Task item started."
}
```

---

#### POST /api/task-items/{taskItemId}/complete

> **Purpose:** Mark an image as fully annotated and done. Changes the item's status from `InProgress` → `Completed` and updates the task's overall progress percentage. Call this when the Annotator clicks "Done" or "Next" after finishing an image. Once all items in a task are `Completed`, the Annotator can submit the task for review.

**Required role:** Annotator

**Path Parameters:** `taskItemId` — TaskItem ID

**Response `200`:** Returns `TaskItemProgressDto`.

---

#### POST /api/task-items/{taskItemId}/re-annotate

> **Purpose:** Allow an Annotator to re-open and rework a previously rejected image. Resets the item from `Rejected` back to `InProgress`, allowing the Annotator to edit the annotations and complete it again. Call this from the "Rejected Items" view when the Annotator is ready to fix a specific image.

**Required role:** Annotator

**Path Parameters:** `taskItemId` — TaskItem ID

**Response `200`:** Returns `TaskItemProgressDto`.

---

#### GET /api/tasks/{taskId}/rejected-items

> **Purpose:** Get the list of images within a task that were rejected by a Reviewer and need to be re-annotated. Used to populate the "Rejected Items" panel in the Annotator's task view, showing which images failed review, why they were rejected (`rejectionReason`), and when. The Annotator uses this as a to-do list for fixing their work.

**Required role:** Annotator

**Path Parameters:** `taskId` — Task ID

**Response `200`:**
```json
[
  {
    "taskItemId": 10,
    "dataItemId": 100,
    "fileName": "image_001.jpg",
    "filePath": "/uploads/1/1/image_001.jpg",
    "rejectionReason": "Bounding box is too loose",
    "rejectedAt": "2026-02-15T14:00:00Z"
  }
]
```

---

### Reviews

**Base route:** `/api`
**Required role:** Varies by endpoint (Admin, Reviewer, or any authenticated user)

---

#### GET /api/reviews/pending

> **Purpose:** Retrieve the queue of images that have been submitted by Annotators and are waiting for a quality review. This is the main entry point for Reviewers — they use this list to pick the next image to review. Supports filtering by project to focus on one project at a time.

**Required roles:** Admin, Reviewer

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `pageNumber` | int | Page number |
| `pageSize` | int | Items per page |
| `projectId` | int? | Filter by project |

**Response `200`:**
```json
{
  "items": [
    {
      "dataItemId": 100,
      "fileName": "image_001.jpg",
      "projectId": 1,
      "projectName": "Vehicle Detection",
      "annotatorName": "Jane Annotator",
      "submittedAt": "2026-02-10T12:00:00Z"
    }
  ],
  "totalCount": 15,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 2,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

---

#### GET /api/data-items/{dataItemId}/review-editor

> **Purpose:** Load everything needed to open the review editor for an image in one call. Returns the image path, all annotations drawn by the Annotator (to display on the review canvas), the full list of error types (for the rejection form), and any previous review history (so the Reviewer can see if this image was rejected before). Also provides next/previous item navigation for efficient batch reviewing.

**Required roles:** Admin, Reviewer

**Path Parameters:** `dataItemId` — DataItem ID

**Response `200`:**
```json
{
  "dataItemId": 100,
  "fileName": "image_001.jpg",
  "filePath": "/uploads/1/1/image_001.jpg",
  "projectId": 1,
  "projectName": "Vehicle Detection",
  "annotations": [ ],
  "errorTypes": [ ],
  "previousReviews": [ ],
  "hasPreviousItem": false,
  "hasNextItem": true,
  "previousItemId": null,
  "nextItemId": 101
}
```

---

#### POST /api/data-items/{dataItemId}/reviews

> **Purpose:** Submit a review decision (Approve or Reject) for an annotated image. If approving, a feedback note is optional. If rejecting, both a feedback message and at least one error type are required to give the Annotator clear guidance on what to fix. Approving moves the image to `Approved` status; rejecting returns it to the Annotator for rework. Notifications are sent automatically.

**Required roles:** Admin, Reviewer

**Path Parameters:** `dataItemId` — DataItem ID

**Request Body:**
```json
{
  "decision": 1,
  "feedback": "Annotations look accurate.",
  "errorTypeIds": []
}
```

**Validation rules:**
- If `decision` = `2` (Rejected): `feedback` is required, and `errorTypeIds` must contain at least one entry.

**Response `201`:**
```json
{
  "id": 1,
  "dataItemId": 100,
  "reviewerId": 4,
  "reviewerName": "John Reviewer",
  "decision": 1,
  "feedback": "Annotations look accurate.",
  "errorTypes": [],
  "createdAt": "2026-02-15T14:00:00Z"
}
```

---

#### GET /api/reviews/{id}

> **Purpose:** Fetch a single review record by ID. Used when displaying the details of a specific review decision — for example, in a review history timeline or when an Admin audits a Reviewer's past decisions.

**Path Parameters:** `id` — Review ID

**Response `200`:** Returns `ReviewDto`.

---

#### GET /api/data-items/{dataItemId}/reviews

> **Purpose:** Get the complete review history for an image — all Approve/Reject decisions made over time. Useful on the image detail page to show the full audit trail, especially for images that went through multiple rejection-rework cycles.

**Path Parameters:** `dataItemId` — DataItem ID

**Response `200`:** Returns `IEnumerable<ReviewDto>`.

---

#### GET /api/data-items/{dataItemId}/reviews/latest

> **Purpose:** Get only the most recent review decision for an image. More efficient than fetching the full history when you only need to display the current review status — for example, showing the latest rejection feedback to an Annotator who is about to re-annotate.

**Path Parameters:** `dataItemId` — DataItem ID

**Response `200`:** Returns `ReviewDto`.

---

#### GET /api/error-types

> **Purpose:** Retrieve the master list of error type categories (E01–E05) used when rejecting annotations. Load this once when initializing the review editor to populate the error type checkboxes in the rejection form. This list is shared across all projects and does not change frequently.

**Response `200`:**
```json
[
  {
    "id": 1,
    "code": "E01",
    "name": "Missing Annotation",
    "description": "Object is present but not annotated"
  },
  {
    "id": 2,
    "code": "E02",
    "name": "Wrong Label",
    "description": "Object annotated with incorrect label"
  },
  {
    "id": 3,
    "code": "E03",
    "name": "Inaccurate Boundary",
    "description": "Bounding box or polygon does not fit object closely"
  },
  {
    "id": 4,
    "code": "E04",
    "name": "Extra Annotation",
    "description": "Annotation placed on non-existent or irrelevant object"
  },
  {
    "id": 5,
    "code": "E05",
    "name": "Other",
    "description": "Other error type not covered above"
  }
]
```

---

#### GET /api/reviews/my-stats

> **Purpose:** Get performance statistics for the currently logged-in Reviewer — how many items they have reviewed, how many they approved vs rejected, their approval rate, and their average time per item. Used to display a personal performance card on the Reviewer's dashboard or profile page.

**Required roles:** Admin, Reviewer

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalReviewed": 320,
    "approvedCount": 290,
    "rejectedCount": 30,
    "approvalRate": 0.906,
    "averageTimePerItem": "00:04:30"
  }
}
```

---

#### GET /api/reviews/stats/{reviewerId}

> **Purpose:** Get review performance statistics for any specific Reviewer by their user ID. Used by Admin to evaluate and compare Reviewer performance across the team — for example, in a team performance table on the admin dashboard or when generating a performance report.

**Required role:** Admin

**Path Parameters:** `reviewerId` — User ID of the reviewer

**Response `200`:** Returns same structure as `/api/reviews/my-stats`.

---

### Dashboard

**Base route:** `/api/dashboard`
**Required role:** Role-specific (see each endpoint)

---

#### GET /api/dashboard/annotator

> **Purpose:** Load all data needed to render the Annotator's home dashboard in a single request. Returns a summary of the Annotator's workload stats (how many items are assigned, in progress, completed, or waiting review), their most recently active tasks for quick access, and their latest notifications. Call this when the Annotator logs in or navigates to the home page.

**Required role:** Annotator

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalAssigned": 150,
      "inProgress": 30,
      "completed": 100,
      "pendingReview": 20
    },
    "recentTasks": [
      {
        "taskId": 1,
        "projectName": "Vehicle Detection",
        "status": "InProgress",
        "totalItems": 50,
        "completedItems": 20,
        "progressPercent": 40.0,
        "assignedAt": "2026-02-01T08:00:00Z"
      }
    ],
    "notifications": [ ]
  }
}
```

---

#### GET /api/dashboard/reviewer

> **Purpose:** Load all data needed for the Reviewer's home dashboard. Returns their review workload stats (how many items are pending review today vs total), the next few items in the pending review queue for quick access, and their recent review history. Call this when the Reviewer logs in or navigates home.

**Required role:** Reviewer

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "pendingReview": 45,
      "reviewedToday": 12,
      "totalReviewed": 320,
      "approvalRate": 0.906
    },
    "pendingQueue": [ ],
    "recentReviews": [ ]
  }
}
```

---

#### GET /api/dashboard/manager

> **Purpose:** Load all data for the Manager/Admin home dashboard. Returns high-level project metrics (number of active projects, overall completion rate), a project-by-project overview table, and a team performance breakdown by member. This is the central operational overview — use it to render the main dashboard page for Admin and Manager users.

**Required roles:** Admin, Manager

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalProjects": 12,
      "activeProjects": 5,
      "totalItems": 50000,
      "completionRate": 0.42
    },
    "projectOverview": [
      {
        "projectId": 1,
        "projectName": "Vehicle Detection",
        "status": "Active",
        "totalItems": 5000,
        "completedItems": 2100,
        "progressPercent": 42.0,
        "deadline": "2026-06-30"
      }
    ],
    "teamPerformance": [
      {
        "userId": 3,
        "userName": "Jane Annotator",
        "role": "Annotator",
        "tasksCompleted": 8,
        "itemsProcessed": 400,
        "averageAccuracy": 0.95
      }
    ]
  }
}
```

---

### Export

**Base route:** `/api`
**Required roles:** Admin, Manager

---

#### POST /api/projects/{projectId}/export

> **Purpose:** Trigger an asynchronous export of a project's annotation data in a machine-learning-ready format (COCO, YOLO, or Pascal VOC). The server packages all approved annotations (or filtered by status) together with the images into a downloadable ZIP file. After calling this endpoint, use the returned `fileName` to download the file via the next endpoint. The export is typically used to hand off the labeled dataset to an ML training pipeline.

**Path Parameters:** `projectId` — Project ID

**Request Body:**
```json
{
  "format": 1,
  "includeImages": true,
  "statusFilter": 5
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `format` | ExportFormat | required | 1=COCO, 2=YOLO, 3=PascalVOC |
| `includeImages` | bool | true | Include image files in export ZIP |
| `statusFilter` | DataItemStatus? | 5 (Approved) | Only export items with this status |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "fileName": "export_1_20260223_coco.zip",
    "downloadUrl": "/api/exports/export_1_20260223_coco.zip",
    "imageCount": 1200,
    "annotationCount": 5800,
    "createdAt": "2026-02-23T10:00:00Z",
    "fileSize": 10485760
  }
}
```

---

#### GET /api/exports/{fileName}

> **Purpose:** Download a previously generated export ZIP file by its file name. Use the `fileName` returned from the export creation endpoint. The file is streamed directly — trigger this as a browser file download or pipe it to a file on the ML server. Export files are stored temporarily on the server and should be cleaned up after use.

**Path Parameters:** `fileName` — File name from export result

**Response `200`:** Binary ZIP file stream.

---

#### DELETE /api/exports/{fileName}

> **Purpose:** Delete a generated export ZIP file from the server's storage to free up disk space. Call this after you have successfully downloaded the file or no longer need it. Export files are not automatically cleaned up, so it is good practice to delete them after downloading.

**Path Parameters:** `fileName` — File name from export result

**Response `204`:** No content.

---

### Notifications

**Base route:** `/api/notifications`
**Required role:** Any authenticated user

---

#### GET /api/notifications

> **Purpose:** Retrieve the current user's notification inbox — system events relevant to them such as task assignments, annotation approvals/rejections, and deadline reminders. Used to render the notification bell/panel in the app header. Set `unreadOnly=true` to show only unread notifications for a badge count display.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `pageNumber` | int | Page number |
| `pageSize` | int | Items per page |
| `unreadOnly` | bool | If `true`, return only unread notifications |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "type": 1,
        "typeName": "TaskAssigned",
        "title": "New task assigned",
        "content": "You have been assigned 50 items in Vehicle Detection.",
        "referenceType": "Task",
        "referenceId": 1,
        "isRead": false,
        "createdAt": "2026-02-01T08:00:00Z"
      }
    ],
    "totalCount": 10,
    "pageNumber": 1,
    "pageSize": 10,
    "totalPages": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

---

#### GET /api/notifications/unread-count

> **Purpose:** Get only the number of unread notifications for the current user, without fetching the full list. Designed for the notification badge counter in the app header — call this on page load and on a polling interval to keep the badge count current. Much lighter than fetching the full notification list.

**Response `200`:**
```json
{
  "success": true,
  "data": 5
}
```

---

#### PATCH /api/notifications/{id}/read

> **Purpose:** Mark a single notification as read. Call this when the user clicks on or dismisses a specific notification in the notification panel. Updates `isRead = true` for that notification so it no longer contributes to the unread count badge.

**Path Parameters:** `id` — Notification ID

**Response `200`:**
```json
{
  "success": true,
  "message": "Notification marked as read."
}
```

---

#### PATCH /api/notifications/read-all

> **Purpose:** Mark all of the current user's unread notifications as read in one operation. Call this when the user clicks "Mark all as read" in the notification panel, clearing the badge counter to zero without requiring individual clicks on each notification.

**Response `200`:**
```json
{
  "success": true,
  "message": "All notifications marked as read."
}
```

---

### Activity Logs

**Base route:** `/api/activity-logs`
**Required role:** Admin (some endpoints allow Manager)

---

#### GET /api/activity-logs

> **Purpose:** Query the full system-wide audit trail with flexible filtering. Every significant action (user logins, project creation, task assignments, annotation submissions, review decisions, etc.) is recorded here. Used by Admin to monitor system usage, investigate incidents, or generate audit reports. Filter by user, action type, target entity, or date range to narrow down specific events.

**Required role:** Admin

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `pageNumber` | int | Page number |
| `pageSize` | int | Items per page |
| `userId` | int? | Filter by user |
| `action` | ActivityAction? | Filter by action type (1–9) |
| `targetType` | string? | Filter by target entity type (e.g. `"Project"`) |
| `startDate` | DateTime? | Filter from this date (UTC, ISO 8601) |
| `endDate` | DateTime? | Filter to this date (UTC, ISO 8601) |

**Response `200`:**
```json
{
  "items": [
    {
      "id": 1,
      "userId": 2,
      "userName": "Project Manager",
      "action": 7,
      "targetType": "Task",
      "targetId": 1,
      "description": "Assigned 50 items to Jane Annotator",
      "createdAt": "2026-02-01T08:00:00Z"
    }
  ],
  "totalCount": 500,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 50,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

---

#### GET /api/activity-logs/me

> **Purpose:** Retrieve the recent activity history of the currently logged-in user. Used to display a "Recent Activity" section on the user's profile page or personal dashboard — showing the last N actions they performed in the system (e.g., annotations submitted, tasks completed, logins). Does not expose other users' activity.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `count` | int | 20 | Number of recent entries to return |

**Response `200`:** Returns `IEnumerable<ActivityLogDto>`.

---

#### GET /api/activity-logs/target/{targetType}/{targetId}

> **Purpose:** Get all activity log entries related to a specific entity (e.g., all actions performed on Project #5, or all events for Task #12). Used to render an activity timeline on the detail page of a project, task, or user — giving managers full visibility into what happened to that specific resource and when.

**Required roles:** Admin, Manager

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `targetType` | string | Entity type (e.g. `Project`, `Task`, `DataItem`, `User`) |
| `targetId` | int | Entity ID |

**Response `200`:** Returns `IEnumerable<ActivityLogDto>`.

---

*End of API Documentation*
