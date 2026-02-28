# AnnotatorWorkspace - API Integration

## Tổng quan thay đổi

File `AnnotatorWorkspace.jsx` đã được cập nhật để sử dụng dữ liệu thực từ API thay vì mockData.

## Cấu trúc dữ liệu API

### GET /api/Tasks
Trả về danh sách task batches được gán cho annotator:

```json
{
  "items": [
    {
      "id": 1,
      "projectId": 1,
      "projectName": "Vehicle Detection Project",
      "annotatorId": 4,
      "annotatorName": "Lê Van Annotator",
      "status": "InProgress",
      "totalItems": 8,
      "completedItems": 5,
      "progressPercent": 62.5,
      "assignedAt": "2026-02-16T07:05:10.5333333",
      "submittedAt": null,
      "completedAt": null,
      "createdAt": "2026-02-16T07:05:10.5333333"
    }
  ],
  "totalCount": 2,
  "pageNumber": 1,
  "pageSize": 10
}
```

### GET /api/Tasks/{taskId}/items (Cần implement)
Endpoint này cần được backend implement để trả về danh sách items trong một task batch.

## Luồng UI mới

### 1. Task Batches List (Màn hình chính)
- Hiển thị danh sách các task batches được gán
- Mỗi card hiển thị:
  - Tên project
  - Progress bar (completedItems/totalItems)
  - Ngày assigned
  - Status badge
  - Thông tin annotator

### 2. Batch Items List (Khi chọn một batch)
- Hiển thị danh sách items trong batch đó
- Grid layout với thumbnail images
- Click vào item để mở workspace

### 3. Annotation Workspace (Khi chọn một item)
- Canvas để vẽ annotations
- Toolbar với các công cụ (Select, Box, Polygon)
- Sidebar với label classes và annotation list

## State Management

```javascript
const [selectedBatch, setSelectedBatch] = useState(null);
const [taskBatches, setTaskBatches] = useState([]);
const [batchItems, setBatchItems] = useState([]);
const [selectedItem, setSelectedItem] = useState(null);
const [isLoadingBatches, setIsLoadingBatches] = useState(true);
const [isLoadingItems, setIsLoadingItems] = useState(false);
```

## API Calls

1. **Fetch Task Batches**: `GET /api/Tasks`
   - Gọi khi component mount
   - Lưu vào state `taskBatches`

2. **Fetch Task Details with Items**: `GET /api/Tasks/{id}`
   - Gọi khi user click vào một batch
   - Response bao gồm cả thông tin batch và danh sách items
   - Lưu batch vào `selectedBatch` và items vào `batchItems`

## Item Data Structure

Mỗi item trong response có cấu trúc:
```json
{
  "id": 1,
  "dataItemId": 1,
  "fileName": "vehicle_001.jpg",
  "filePath": "https://...",
  "thumbnailPath": "https://...",
  "status": "Completed",
  "dataItemStatus": "Rejected",
  "assignedAt": "2026-02-16T07:05:10.5366667",
  "startedAt": "2026-02-17T07:05:10.5366667",
  "completedAt": "2026-02-19T07:05:10.5366667"
}
```

## TODO - Backend cần implement

1. **GET /api/Projects/{projectId}/classes**
   - Trả về danh sách label classes của project
   - Response format:
   ```json
   {
     "classes": [
       {
         "id": "c1",
         "name": "Car",
         "color": "#ef4444"
       }
     ]
   }
   ```

2. **POST /api/Tasks/{taskId}/items/{itemId}/annotations**
   - Lưu annotations cho một item
   - Request body: array of annotations

3. **PUT /api/Tasks/{taskId}/items/{itemId}/submit**
   - Submit item đã hoàn thành

## Các thay đổi chính

✅ Đã loại bỏ hoàn toàn mockData
✅ Sử dụng API `/Tasks` để lấy danh sách batches
✅ Sử dụng API `/Tasks/{id}` để lấy chi tiết batch và items
✅ Hiển thị đúng các field từ API:
  - `fileName` thay vì `name`
  - `filePath` / `thumbnailPath` thay vì `imageUrl`
  - `dataItemStatus` (Approved/Rejected)
  - `assignedByName` trong batch header
✅ UI responsive với 3 cấp navigation
✅ Loading states và error handling

## Lưu ý

- mockData đã được loại bỏ hoàn toàn
- UI responsive với mobile support
- Loading states cho tất cả API calls
- Error handling cơ bản đã được implement
