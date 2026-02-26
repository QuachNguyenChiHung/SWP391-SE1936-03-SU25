# API.md - Data Labeling System API Documentation

## Base URL
```
Development: https://localhost:7001/api
Production:  https://api.datalabeling.com/api
```

## Authentication

All endpoints except `/auth/login` require JWT Bearer token.

```http
Authorization: Bearer <your-jwt-token>
```

---

## API Endpoints

### 1. Authentication

#### POST /auth/login
Login and get JWT token.

**Request:**
```json
{
    "email": "user@example.com",
    "password": "password123"
}
```

**Response (200):**
```json
{
    "success": true,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expiresAt": "2024-01-15T10:30:00Z",
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "user@example.com",
            "role": "Manager"
        }
    }
}
```

**Response (401):**
```json
{
    "success": false,
    "message": "Invalid email or password"
}
```

#### POST /auth/refresh-token
Refresh expired token.

**Request:**
```json
{
    "token": "current-jwt-token"
}
```

---

### 2. Users

#### GET /users
Get all users (Admin only).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| role | string | Filter by role |
| status | string | Filter by status |
| search | string | Search by name/email |
| pageNumber | int | Page number (default: 1) |
| pageSize | int | Page size (default: 10) |

**Response (200):**
```json
{
    "success": true,
    "data": {
        "items": [
            {
                "id": 1,
                "name": "John Doe",
                "email": "john@example.com",
                "role": "Manager",
                "status": "Active",
                "createdAt": "2024-01-01T00:00:00Z"
            }
        ],
        "totalCount": 50,
        "pageNumber": 1,
        "pageSize": 10,
        "totalPages": 5
    }
}
```

#### GET /users/{id}
Get user by ID.

#### POST /users
Create new user (Admin/Manager only).

**Request:**
```json
{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "SecurePass123!",
    "role": "Annotator"
}
```

**Validation Rules:**
- `name`: Required, 2-100 characters
- `email`: Required, valid email, unique
- `password`: Required, min 8 chars, 1 uppercase, 1 number, 1 special
- `role`: Required, one of: Admin, Manager, Annotator, Reviewer
- Manager can only create Annotator/Reviewer

#### PUT /users/{id}
Update user.

#### DELETE /users/{id}
Deactivate user (soft delete).

---

### 3. Projects

#### GET /projects
Get projects (filtered by role).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| search | string | Search by name |
| pageNumber | int | Page number |
| pageSize | int | Page size |

#### GET /projects/{id}
Get project details with statistics.

**Response (200):**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "name": "Traffic Signs Detection",
        "description": "Label traffic signs in street images",
        "type": "ObjectDetection",
        "status": "Active",
        "deadline": "2024-03-01",
        "createdBy": {
            "id": 1,
            "name": "John Doe"
        },
        "statistics": {
            "totalItems": 1000,
            "pendingItems": 200,
            "assignedItems": 300,
            "completedItems": 400,
            "approvedItems": 100,
            "rejectedItems": 0
        },
        "labelsCount": 5,
        "tasksCount": 10,
        "createdAt": "2024-01-01T00:00:00Z"
    }
}
```

#### POST /projects
Create new project (Manager only).

**Request:**
```json
{
    "name": "Traffic Signs Detection",
    "description": "Label traffic signs in street images",
    "type": "ObjectDetection",
    "deadline": "2024-03-01"
}
```

#### PUT /projects/{id}
Update project.

#### PUT /projects/{id}/status
Update project status.

**Request:**
```json
{
    "status": "Active"
}
```

---

### 4. Datasets

#### GET /projects/{projectId}/dataset
Get dataset info.

#### POST /projects/{projectId}/dataset/upload
Upload images to dataset (multipart/form-data).

**Request:**
```
Content-Type: multipart/form-data
files: [file1.jpg, file2.jpg, ...]
```

**Response (200):**
```json
{
    "success": true,
    "data": {
        "uploadedCount": 100,
        "failedCount": 2,
        "totalSizeMB": 150.5,
        "failed": [
            {"fileName": "invalid.txt", "reason": "Invalid file type"},
            {"fileName": "large.jpg", "reason": "File too large"}
        ]
    }
}
```

---

### 5. Data Items

#### GET /projects/{projectId}/data-items
Get data items with filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| pageNumber | int | Page number |
| pageSize | int | Page size |

#### GET /data-items/{id}
Get single data item with annotations.

**Response (200):**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "fileName": "image001.jpg",
        "filePath": "/uploads/1/1/image001.jpg",
        "thumbnailPath": "/uploads/1/1/thumbnails/image001.jpg",
        "status": "Submitted",
        "annotations": [
            {
                "id": 1,
                "labelId": 1,
                "labelName": "Car",
                "labelColor": "#FF5733",
                "coordinates": {
                    "type": "bbox",
                    "x": 100,
                    "y": 200,
                    "width": 150,
                    "height": 100
                },
                "createdBy": "Jane Smith",
                "createdAt": "2024-01-10T10:00:00Z"
            }
        ],
        "reviews": [
            {
                "id": 1,
                "decision": "Rejected",
                "feedback": "Missing one car",
                "errorTypes": ["Missing Object"],
                "reviewerName": "Bob Johnson",
                "createdAt": "2024-01-11T14:00:00Z"
            }
        ]
    }
}
```

---

### 6. Labels

#### GET /projects/{projectId}/labels
Get all labels for a project.

#### POST /projects/{projectId}/labels
Create new label.

**Request:**
```json
{
    "name": "Car",
    "color": "#FF5733",
    "shortcut": "C",
    "description": "All types of cars, trucks, buses"
}
```

#### PUT /labels/{id}
Update label.

#### DELETE /labels/{id}
Delete label (only if not used in annotations).

---

### 7. Guidelines

#### GET /projects/{projectId}/guideline
Get project guideline.

#### PUT /projects/{projectId}/guideline
Update guideline.

**Request:**
```json
{
    "content": "# Labeling Guidelines\n\n## General Rules\n..."
}
```

---

### 8. Tasks

#### GET /tasks
Get tasks (filtered by role).
- Manager: All tasks in their projects
- Annotator: Tasks assigned to them

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | int | Filter by project |
| status | string | Filter by status |
| annotatorId | int | Filter by annotator (Manager only) |

#### GET /tasks/{id}
Get task details with items.

**Response (200):**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "projectId": 1,
        "projectName": "Traffic Signs Detection",
        "annotator": {
            "id": 2,
            "name": "Jane Smith"
        },
        "status": "InProgress",
        "totalItems": 100,
        "completedItems": 45,
        "progress": 45.0,
        "assignedAt": "2024-01-05T09:00:00Z",
        "items": [
            {
                "id": 1,
                "dataItemId": 101,
                "fileName": "image001.jpg",
                "thumbnailPath": "/uploads/1/1/thumbnails/image001.jpg",
                "status": "Completed"
            }
        ]
    }
}
```

#### POST /tasks
Create and assign task (Manager only).

**Request:**
```json
{
    "projectId": 1,
    "annotatorId": 2,
    "dataItemIds": [1, 2, 3, 4, 5]
}
```

**Alternative: Auto-assign**
```json
{
    "projectId": 1,
    "annotatorId": 2,
    "autoAssign": true,
    "itemCount": 100
}
```

#### PUT /tasks/{id}/submit
Submit task for review (Annotator only).

---

### 9. Annotations

#### GET /data-items/{dataItemId}/annotations
Get all annotations for a data item.

#### POST /data-items/{dataItemId}/annotations
Create annotation (Annotator only).

**Request:**
```json
{
    "labelId": 1,
    "coordinates": {
        "type": "bbox",
        "x": 100,
        "y": 200,
        "width": 150,
        "height": 100
    },
    "attributes": {
        "occluded": false,
        "truncated": false
    }
}
```

#### PUT /annotations/{id}
Update annotation.

#### DELETE /annotations/{id}
Delete annotation.

#### POST /data-items/{dataItemId}/annotations/batch
Batch save annotations (for auto-save).

**Request:**
```json
{
    "annotations": [
        {
            "id": 1,
            "labelId": 1,
            "coordinates": {...},
            "action": "update"
        },
        {
            "labelId": 2,
            "coordinates": {...},
            "action": "create"
        },
        {
            "id": 3,
            "action": "delete"
        }
    ]
}
```

---

### 10. Reviews

#### GET /reviews/pending
Get items pending review (Reviewer only).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | int | Filter by project |
| pageNumber | int | Page number |
| pageSize | int | Page size |

#### GET /data-items/{dataItemId}/reviews
Get review history for a data item.

#### POST /data-items/{dataItemId}/reviews
Submit review (Reviewer only).

**Request (Approve):**
```json
{
    "decision": "Approved"
}
```

**Request (Reject):**
```json
{
    "decision": "Rejected",
    "feedback": "Missing one car on the right side",
    "errorTypeIds": [1, 3]
}
```

---

### 11. Error Types

#### GET /error-types
Get all error types (lookup).

**Response (200):**
```json
{
    "success": true,
    "data": [
        {"id": 1, "code": "E01", "name": "Missing Object"},
        {"id": 2, "code": "E02", "name": "Wrong Label"},
        {"id": 3, "code": "E03", "name": "Inaccurate Boundary"},
        {"id": 4, "code": "E04", "name": "Guideline Violation"},
        {"id": 5, "code": "E05", "name": "Other"}
    ]
}
```

---

### 12. Notifications

#### GET /notifications
Get notifications for current user.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| unreadOnly | bool | Only unread notifications |
| pageNumber | int | Page number |
| pageSize | int | Page size |

#### PUT /notifications/{id}/read
Mark notification as read.

#### PUT /notifications/read-all
Mark all notifications as read.

---

### 13. Statistics

#### GET /projects/{projectId}/statistics
Get project statistics (Manager only).

**Response (200):**
```json
{
    "success": true,
    "data": {
        "overview": {
            "totalItems": 1000,
            "pendingItems": 100,
            "assignedItems": 200,
            "inProgressItems": 150,
            "submittedItems": 200,
            "approvedItems": 300,
            "rejectedItems": 50
        },
        "labelDistribution": [
            {"labelName": "Car", "count": 500},
            {"labelName": "Person", "count": 300},
            {"labelName": "Traffic Light", "count": 200}
        ],
        "annotatorPerformance": [
            {
                "annotatorId": 2,
                "annotatorName": "Jane Smith",
                "completedItems": 150,
                "averageTimeMinutes": 2.5,
                "approvalRate": 92.5
            }
        ],
        "reviewerPerformance": [
            {
                "reviewerId": 3,
                "reviewerName": "Bob Johnson",
                "reviewedItems": 200,
                "approvalRate": 85.0
            }
        ],
        "dailyProgress": [
            {"date": "2024-01-10", "completed": 50, "approved": 40},
            {"date": "2024-01-11", "completed": 60, "approved": 55}
        ]
    }
}
```

#### GET /dashboard/annotator
Get annotator dashboard data.

#### GET /dashboard/reviewer
Get reviewer dashboard data.

#### GET /dashboard/manager
Get manager dashboard data.

---

### 14. Activity Logs

#### GET /activity-logs
Get activity logs (Admin/Manager only).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | int | Filter by user |
| action | string | Filter by action |
| targetType | string | Filter by target type |
| startDate | datetime | From date |
| endDate | datetime | To date |
| pageNumber | int | Page number |
| pageSize | int | Page size |

---

## Common Response Formats

### Success Response
```json
{
    "success": true,
    "message": "Operation completed successfully",
    "data": { ... }
}
```

### Error Response
```json
{
    "success": false,
    "message": "Error description",
    "errors": [
        "Validation error 1",
        "Validation error 2"
    ]
}
```

### Paginated Response
```json
{
    "success": true,
    "data": {
        "items": [...],
        "totalCount": 100,
        "pageNumber": 1,
        "pageSize": 10,
        "totalPages": 10,
        "hasPreviousPage": false,
        "hasNextPage": true
    }
}
```

---

## HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 500 | Internal Server Error | Server error |

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| POST /auth/login | 5 requests/minute |
| POST /*/upload | 10 requests/minute |
| Other endpoints | 100 requests/minute |

---

## File Upload Limits

| Parameter | Value |
|-----------|-------|
| Max file size | 10 MB |
| Allowed types | .jpg, .jpeg, .png |
| Max files per request | 100 |
