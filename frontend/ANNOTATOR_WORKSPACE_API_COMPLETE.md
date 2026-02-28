# AnnotatorWorkspace - Complete API Integration Guide

## Overview
The AnnotatorWorkspace.jsx component has been fully integrated with the backend API according to the API documentation. All API calls are now properly implemented with error handling and user feedback.

## Implemented API Endpoints

### 1. Task Management

#### GET /api/Tasks
**Purpose:** Fetch all task batches assigned to the current annotator
**When:** Component mount
**Response:** List of task batches with progress information
```javascript
useEffect(() => {
    const fetchTaskBatches = async () => {
        const res = await api.get('/Tasks');
        setTaskBatches(res?.data?.items || []);
    };
    fetchTaskBatches();
}, [user]);
```

#### GET /api/Tasks/{id}
**Purpose:** Fetch detailed task information including all items
**When:** User selects a batch from the list
**Response:** Task details with items array
```javascript
const handleSelectBatch = async (batch) => {
    const res = await api.get(`/Tasks/${batch.id}`);
    const taskData = res?.data;
    setSelectedBatch(taskData);
    setBatchItems(taskData?.items || []);
};
```

#### POST /api/tasks/{taskId}/submit
**Purpose:** Submit completed task for review
**When:** User clicks "Submit for Review" button (all items must be completed)
**Validation:** Checks if all items are completed before allowing submission
```javascript
const handleSubmitTask = async (taskId) => {
    await api.post(`/tasks/${taskId}/submit`);
    // Updates task status to 'Submitted'
};
```

#### DELETE /api/Tasks/{id}
**Purpose:** Delete an empty task
**When:** User clicks delete button on task card
**Validation:** Only allows deletion if task has no items
```javascript
const handleDeleteTask = async (taskId) => {
    await api.delete(`/Tasks/${taskId}`);
};
```

---

### 2. Task Items Management

#### POST /api/task-items/{taskItemId}/start
**Purpose:** Mark a task item as started
**When:** User opens an item in the annotation workspace (if status is 'Assigned')
**Effect:** Changes item status from 'Assigned' to 'InProgress'
```javascript
const handleSelectItem = async (item) => {
    if (item.status === 'Assigned') {
        await api.post(`/task-items/${item.id}/start`);
    }
};
```

#### POST /api/task-items/{taskItemId}/complete
**Purpose:** Mark a task item as completed
**When:** User clicks "Accept & Next" button
**Effect:** Changes item status to 'Completed', updates task progress
```javascript
const handleAcceptAndNext = async () => {
    await api.post(`/task-items/${selectedItem.id}/complete`);
    // Updates progress and moves to next item
};
```

#### DELETE /api/Tasks/{taskId}/items
**Purpose:** Remove items from a task
**When:** User deletes single or multiple items
**Request Body:** Array of item IDs to remove
```javascript
// Single item
await api.delete(`/Tasks/${selectedBatch.id}/items`, {
    data: [itemId]
});

// Multiple items
await api.delete(`/Tasks/${selectedBatch.id}/items`, {
    data: itemIds
});
```

---

### 3. Annotations Management

#### GET /api/data-items/{dataItemId}/annotations
**Purpose:** Fetch all annotations for a specific image
**When:** User opens an item in the annotation workspace
**Response:** Array of annotation objects with coordinates, labels, and metadata
```javascript
const handleSelectItem = async (item) => {
    const res = await api.get(`/data-items/${item.dataItemId}/annotations`);
    const annotationsData = res?.data || [];
    // Transform and set annotations
};
```

#### POST /api/data-items/{dataItemId}/annotations
**Purpose:** Create a new annotation
**When:** User finishes drawing a bounding box or polygon
**Request Body:**
```json
{
    "labelId": 1,
    "coordinates": "{\"type\":\"bbox\",\"x\":120,\"y\":80,\"width\":200,\"height\":150}",
    "attributes": "{}"
}
```
```javascript
const handleCreateAnnotation = async (coordinates, labelId) => {
    const payload = {
        labelId: labelId,
        coordinates: JSON.stringify(coordinates),
        attributes: JSON.stringify({})
    };
    await api.post(`/data-items/${selectedItem.dataItemId}/annotations`, payload);
};
```

#### PUT /api/annotations/{id}
**Purpose:** Update an existing annotation
**When:** User moves/resizes a bounding box or modifies a polygon
**Request Body:** Same as create, but updates existing annotation
```javascript
const handleUpdateAnnotation = async (annotationId, updatedData) => {
    const payload = {
        labelId: updatedData.labelId,
        coordinates: JSON.stringify(updatedData.coordinates),
        attributes: JSON.stringify(updatedData.attributes || {})
    };
    await api.put(`/annotations/${annotationId}`, payload);
};
```

#### DELETE /api/annotations/{id}
**Purpose:** Delete an annotation
**When:** User clicks delete button on an annotation
**Confirmation:** Shows modal confirmation dialog
```javascript
const handleDeleteAnnotation = async (annotationId) => {
    // Shows confirmation modal first
    await api.delete(`/annotations/${annotationId}`);
};
```

---

### 4. Project Labels

#### GET /api/projects/{projectId}/labels
**Purpose:** Fetch label definitions for a project
**When:** User selects a batch (loads labels for the annotation palette)
**Response:** Array of label objects with id, name, color, shortcut
```javascript
useEffect(() => {
    const fetchProjectLabels = async () => {
        const res = await api.get(`/projects/${selectedBatch.projectId}/labels`);
        setProjectLabels(res?.data || []);
    };
    fetchProjectLabels();
}, [selectedBatch?.projectId]);
```

---

## Data Flow

### 1. Initial Load
```
User Login → GET /api/Tasks → Display task batches list
```

### 2. Select Batch
```
Click batch → GET /api/Tasks/{id} → Display items grid
```

### 3. Select Item
```
Click item → POST /api/task-items/{id}/start (if needed)
          → GET /api/data-items/{dataItemId}/annotations
          → GET /api/projects/{projectId}/labels
          → Display annotation workspace
```

### 4. Annotate
```
Draw box/polygon → POST /api/data-items/{dataItemId}/annotations
Move annotation → PUT /api/annotations/{id}
Delete annotation → DELETE /api/annotations/{id}
```

### 5. Complete Item
```
Click "Accept & Next" → POST /api/task-items/{id}/complete
                      → Move to next item
```

### 6. Submit Task
```
All items completed → Click "Submit for Review"
                    → POST /api/tasks/{id}/submit
                    → Task status = 'Submitted'
```

---

## Coordinate Formats

### Bounding Box
```json
{
    "type": "bbox",
    "x": 120,
    "y": 80,
    "width": 200,
    "height": 150
}
```

### Polygon
```json
{
    "type": "polygon",
    "points": [
        {"x": 100, "y": 100},
        {"x": 200, "y": 100},
        {"x": 150, "y": 200}
    ]
}
```

---

## Error Handling

All API calls include comprehensive error handling:

1. **Try-Catch Blocks:** All async operations wrapped in try-catch
2. **Toast Notifications:** User-friendly error messages displayed via toast
3. **Console Logging:** Detailed error logs for debugging
4. **Fallback States:** Graceful degradation when API calls fail

Example:
```javascript
try {
    await api.post(`/annotations/${id}`);
    showToast('Annotation created successfully', 'success');
} catch (e) {
    console.error('Failed to create annotation:', e);
    showToast('Failed to create annotation: ' + (e?.response?.data?.message || e?.message), 'error');
}
```

---

## User Feedback

### Toast Notifications
- Success: Green toast for successful operations
- Error: Red toast for failed operations
- Warning: Yellow toast for validation issues
- Info: Blue toast for informational messages

### Confirmation Dialogs
- Delete annotation: Custom modal component
- Delete items: Browser confirm dialog
- Submit task: Browser confirm dialog
- Delete task: Browser confirm dialog

---

## State Management

### Main State Variables
```javascript
// Task & Batch Management
const [taskBatches, setTaskBatches] = useState([]);
const [selectedBatch, setSelectedBatch] = useState(null);
const [batchItems, setBatchItems] = useState([]);
const [selectedItem, setSelectedItem] = useState(null);

// Annotation Workspace
const [annotations, setAnnotations] = useState([]);
const [projectLabels, setProjectLabels] = useState([]);
const [selectedTool, setSelectedTool] = useState('SELECT');
const [activeLabelId, setActiveLabelId] = useState('');

// UI State
const [isLoadingBatches, setIsLoadingBatches] = useState(true);
const [isLoadingItems, setIsLoadingItems] = useState(false);
const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
```

---

## Navigation Flow

```
Task Batches List
    ↓ (select batch)
Batch Items Grid
    ↓ (select item)
Annotation Workspace
    ↓ (back button)
Batch Items Grid
    ↓ (back button)
Task Batches List
```

---

## Features Implemented

✅ Fetch and display task batches
✅ Fetch and display batch items
✅ Start task items automatically
✅ Load annotations for items
✅ Load project labels
✅ Create bounding box annotations
✅ Create polygon annotations
✅ Update annotation positions
✅ Delete annotations with confirmation
✅ Complete items and track progress
✅ Submit tasks for review
✅ Delete items from tasks
✅ Delete empty tasks
✅ Navigation between items (Previous/Next)
✅ Toast notifications for all operations
✅ Error handling for all API calls
✅ Loading states for async operations

---

## Testing Checklist

- [ ] Load task batches on component mount
- [ ] Select a batch and view items
- [ ] Open an item in workspace
- [ ] Draw a bounding box annotation
- [ ] Draw a polygon annotation
- [ ] Move an existing annotation
- [ ] Delete an annotation
- [ ] Navigate between items using Previous/Next
- [ ] Complete an item using "Accept & Next"
- [ ] Submit a completed task for review
- [ ] Delete an item from a task
- [ ] Delete multiple items at once
- [ ] Delete an empty task
- [ ] Verify all toast notifications appear
- [ ] Verify error handling for failed API calls

---

## Notes

1. **Authentication:** All API calls automatically include the Bearer token from cookies via the axios interceptor in `api.js`

2. **Base URL:** Configured via environment variable `VITE_URL` in `.env` file

3. **Coordinate System:** All coordinates are relative to the image container, not the actual image pixels

4. **Label Selection:** Users must select a label before drawing annotations

5. **Task Submission:** Only allowed when all items in the task are completed

6. **Item Deletion:** Removes items from the task but doesn't delete the actual data item from the database

---

## Future Enhancements

- [ ] Implement AI-assisted annotation (endpoint exists but not integrated)
- [ ] Add zoom and pan functionality for large images
- [ ] Implement keyboard shortcuts for tools and labels
- [ ] Add undo/redo functionality
- [ ] Implement batch annotation operations
- [ ] Add annotation quality metrics
- [ ] Implement real-time collaboration features
