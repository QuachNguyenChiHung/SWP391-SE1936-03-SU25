# Annotator Components Guide

Hướng dẫn chi tiết về các components trong folder `frontend/src/components/annotator/`

---

## 1. AnnotatorNavigation.jsx

**Mục đích:** Component sidebar navigation dành riêng cho Annotator role

**Chức năng:**
- Hiển thị menu điều hướng cho annotator
- Các mục menu:
  - Dashboard: Trang tổng quan
  - My Tasks: Danh sách task được giao
  - Notifications: Thông báo (có badge hiển thị số lượng chưa đọc)
  - Profile: Trang cá nhân
  - Settings: Cài đặt
- Tự động fetch số lượng notifications chưa đọc từ API
- Highlight mục menu đang active

**Sử dụng ở:** `Layout.jsx` (sidebar cho annotator role)

**Props:** Không có props

---

## 2. AnnotationSidebar.jsx

**Mục đích:** Sidebar bên phải trong AnnotatorWorkspace để quản lý annotations

**Chức năng:**
- Hiển thị danh sách tất cả annotations của image hiện tại
- Mỗi annotation hiển thị:
  - Label name với màu sắc tương ứng
  - Nút Edit để chỉnh sửa
  - Nút Delete để xóa
- Click vào annotation để select/highlight nó trên canvas
- Hiển thị số lượng annotations
- Responsive: có thể toggle show/hide

**Sử dụng ở:** `AnnotatorWorkspace.jsx`

**Props:**
- `annotations`: Array các annotation objects
- `selectedId`: ID của annotation đang được chọn
- `onSelect`: Callback khi click vào annotation
- `onEdit`: Callback khi click nút Edit
- `onDelete`: Callback khi click nút Delete

---

## 3. ToastNotification.jsx

**Mục đích:** Hiển thị thông báo tạm thời (toast) cho user

**Chức năng:**
- Hiển thị thông báo với 3 loại: success, error, info
- Tự động ẩn sau 3 giây
- Icon tương ứng với từng loại thông báo
- Animation slide in/out mượt mà
- Có nút X để đóng thủ công

**Sử dụng ở:** `AnnotatorWorkspace.jsx`, `Settings.jsx`

**Props:**
- `message`: Nội dung thông báo (string)
- `type`: Loại thông báo ('success' | 'error' | 'info')
- `onClose`: Callback khi đóng toast

---

## 4. ConfirmDeleteModal.jsx

**Mục đích:** Modal xác nhận trước khi xóa annotation

**Chức năng:**
- Hiển thị modal cảnh báo khi user muốn xóa annotation
- Yêu cầu xác nhận để tránh xóa nhầm
- 2 nút: Cancel và Delete
- Có thể đóng bằng cách click outside hoặc nút X

**Sử dụng ở:** `AnnotatorWorkspace.jsx`

**Props:**
- `show`: Boolean để hiển thị/ẩn modal
- `onConfirm`: Callback khi user xác nhận xóa
- `onCancel`: Callback khi user hủy

---

## 5. KeyboardShortcutsHelp.jsx

**Mục đích:** Modal hiển thị danh sách keyboard shortcuts

**Chức năng:**
- Hiển thị tất cả phím tắt có sẵn trong AnnotatorWorkspace
- Các shortcuts bao gồm:
  - Navigation: Previous/Next image
  - Actions: Save, Delete
  - View: Zoom, Pan, Reset view
  - Tools: Select tool, Draw box
  - UI: Toggle sidebar, Show help
- Có thể mở bằng phím `?` hoặc nút Help
- Đóng bằng Escape hoặc click outside

**Sử dụng ở:** `AnnotatorWorkspace.jsx`

**Props:**
- `show`: Boolean để hiển thị/ẩn modal
- `onClose`: Callback khi đóng modal

---

## 6. ProgressIndicator.jsx

**Mục đích:** Hiển thị tiến độ hoàn thành task

**Chức năng:**
- Progress bar với phần trăm hoàn thành
- Hiển thị số lượng: "X / Y items completed"
- Màu sắc thay đổi theo tiến độ:
  - Đỏ: < 30%
  - Vàng: 30-70%
  - Xanh: > 70%
- Animation mượt mà khi progress thay đổi

**Sử dụng ở:** `AnnotatorWorkspace.jsx`

**Props:**
- `current`: Số lượng items đã hoàn thành (number)
- `total`: Tổng số items (number)

---

## Workflow tổng quan

```
AnnotatorWorkspace.jsx (Main page)
├── ProgressIndicator (Top - hiển thị tiến độ)
├── Canvas (Center - vẽ annotations)
├── AnnotationSidebar (Right - danh sách annotations)
├── KeyboardShortcutsHelp (Modal - phím tắt)
├── ConfirmDeleteModal (Modal - xác nhận xóa)
└── ToastNotification (Toast - thông báo)

Layout.jsx (Sidebar)
└── AnnotatorNavigation (Menu điều hướng)
```

---

## API Endpoints sử dụng

- `GET /Dashboard/annotator` - Lấy thống kê dashboard
- `GET /notifications` - Lấy danh sách notifications
- `GET /tasks` - Lấy danh sách tasks
- `GET /tasks/{id}/items` - Lấy items của task
- `POST /annotations` - Tạo annotation mới
- `PUT /annotations/{id}` - Cập nhật annotation
- `DELETE /annotations/{id}` - Xóa annotation
- `POST /items/{id}/complete` - Đánh dấu item hoàn thành

---

## Styling

Tất cả components sử dụng:
- Bootstrap 5 classes
- Custom CSS trong `AnnotatorWorkspace.css`
- Lucide React icons
- Inline styles cho dynamic colors

---

## Notes

- Tất cả components đều responsive
- Error handling với try-catch
- Loading states cho async operations
- Accessibility: ARIA labels, keyboard support
