# Zoom và Responsive Features - AnnotatorWorkspace

## Tổng quan
Đã thêm đầy đủ tính năng zoom, pan và responsive cho annotation workspace để annotations (khung điểm ảnh) luôn scale đúng theo hình ảnh.

## Tính năng Zoom

### 1. Zoom Controls
- **Zoom In**: Click nút "+" hoặc Ctrl + Scroll lên
- **Zoom Out**: Click nút "-" hoặc Ctrl + Scroll xuống  
- **Reset Zoom**: Click nút "1:1" để về zoom 100%
- **Zoom Level Display**: Hiển thị % zoom hiện tại (50% - 300%)

### 2. Zoom Range
- **Minimum**: 0.5x (50%)
- **Maximum**: 3x (300%)
- **Default**: 1x (100%)
- **Step**: 0.25x (25%) mỗi lần click
- **Scroll Step**: 0.1x (10%) mỗi lần scroll

### 3. Zoom Implementation
```javascript
// State
const [zoomLevel, setZoomLevel] = useState(1);

// Zoom functions
const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
};

const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
};

const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
};

// Mouse wheel zoom
const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)));
    }
};
```

## Tính năng Pan (Di chuyển)

### 1. Pan Controls
- **Pan Mode**: Giữ Shift + Click & Drag
- **Middle Mouse**: Click chuột giữa + Drag
- **Pan Tool**: Chọn Pan tool (nếu có)

### 2. Pan Implementation
```javascript
// State
const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
const [isPanning, setIsPanning] = useState(false);
const panStartRef = useRef(null);

// Pan functions
const handlePanStart = (e) => {
    if (selectedTool === 'PAN' || e.button === 1 || (e.button === 0 && e.shiftKey)) {
        e.preventDefault();
        setIsPanning(true);
        panStartRef.current = {
            x: e.clientX - panOffset.x,
            y: e.clientY - panOffset.y
        };
    }
};

const handlePanMove = (e) => {
    if (isPanning && panStartRef.current) {
        setPanOffset({
            x: e.clientX - panStartRef.current.x,
            y: e.clientY - panStartRef.current.y
        });
    }
};

const handlePanEnd = () => {
    setIsPanning(false);
    panStartRef.current = null;
};
```

## Annotations Scale với Zoom

### Cấu trúc HTML
```jsx
<div className="canvas-area">
    {/* Outer transform container - zoom & pan */}
    <div style={{
        transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
        transformOrigin: 'center center',
        transition: isPanning ? 'none' : 'transform 0.1s ease-out'
    }}>
        {/* Inner container - relative positioning */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Image */}
            <img src={...} />
            
            {/* Annotations - scale cùng image */}
            {annotations.map(ann => (
                <div className="annotation-box" style={{
                    left: ann.coordinates.x,
                    top: ann.coordinates.y,
                    width: ann.coordinates.width,
                    height: ann.coordinates.height
                }} />
            ))}
            
            {/* Drawing layer */}
            {/* Polygon layer */}
        </div>
    </div>
</div>
```

### Lợi ích
✅ Annotations luôn đúng vị trí trên ảnh khi zoom
✅ Annotations scale theo tỷ lệ với ảnh
✅ Không cần tính toán lại tọa độ khi zoom
✅ Smooth animation khi zoom/pan

## Responsive Design

### 1. Mobile Responsive (< 768px)
```css
@media (max-width: 767.98px) {
    .sidebar {
        position: absolute;
        right: 0;
        width: 16rem;
    }
    
    .sidebar.hidden {
        transform: translateX(100%);
    }
    
    .toolbar-horizontal {
        padding: 0.375rem 0.5rem;
        flex-wrap: wrap;
    }
    
    .canvas-image {
        max-width: 95vw !important;
        max-height: 60vh !important;
    }
}
```

### 2. Small Mobile (< 576px)
```css
@media (max-width: 575.98px) {
    .sidebar {
        width: 14rem;
    }
    
    .toolbar-horizontal {
        font-size: 0.875rem;
    }
    
    .toolbar-divider-vertical {
        display: none;
    }
}
```

### 3. Tablet & Desktop (>= 768px)
```css
@media (min-width: 768px) {
    .sidebar {
        position: relative;
    }
    
    .sidebar-toggle {
        display: none;
    }
}
```

## Cursor States

### Dynamic Cursor
```javascript
cursor: isPanning ? 'grabbing' 
      : selectedTool === 'PAN' ? 'grab'
      : selectedTool === 'BOX' ? 'crosshair'
      : selectedTool === 'POLYGON' ? 'crosshair'
      : 'default'
```

### Cursor Types
- **default**: Select mode
- **crosshair**: Drawing mode (Box/Polygon)
- **grab**: Pan mode ready
- **grabbing**: Panning active
- **move**: Moving annotation

## User Experience Improvements

### 1. Smooth Transitions
- Zoom animation: 0.1s ease-out
- Pan: No transition (instant feedback)
- Sidebar toggle: 0.3s ease-in-out

### 2. Visual Feedback
- Zoom level percentage display
- Cursor changes based on mode
- Annotation highlight on hover
- Dragging state visual

### 3. Keyboard Shortcuts
- **Ctrl + Scroll**: Zoom in/out
- **Shift + Drag**: Pan
- **ESC**: Cancel polygon drawing
- **1-9**: Select label class (if available)

## Reset Behavior

### Auto Reset on Item Change
```javascript
const handleSelectItem = async (item) => {
    // ... other code
    
    // Reset zoom and pan
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
};

const handleBackToItemList = () => {
    setSelectedItem(null);
    // Reset zoom and pan
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
};
```

## Performance Optimizations

### 1. Conditional Transitions
```javascript
transition: isPanning ? 'none' : 'transform 0.1s ease-out'
```
- Disable transition during pan for smooth dragging
- Enable transition for zoom for smooth animation

### 2. Transform Origin
```javascript
transformOrigin: 'center center'
```
- Zoom từ center của viewport
- Giữ ảnh ở giữa màn hình

### 3. User Select Prevention
```css
.canvas-area {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}
```
- Ngăn text selection khi drag
- Cải thiện UX khi pan/zoom

## Browser Compatibility

### Supported Browsers
✅ Chrome/Edge (latest)
✅ Firefox (latest)
✅ Safari (latest)
✅ Mobile browsers (iOS Safari, Chrome Mobile)

### CSS Features Used
- CSS Transforms (scale, translate)
- CSS Transitions
- Flexbox
- Media Queries
- CSS Variables

## Testing Checklist

- [ ] Zoom in/out bằng buttons
- [ ] Zoom bằng Ctrl + Scroll
- [ ] Pan bằng Shift + Drag
- [ ] Pan bằng middle mouse
- [ ] Reset zoom về 1:1
- [ ] Annotations scale đúng khi zoom
- [ ] Annotations ở đúng vị trí khi pan
- [ ] Draw annotations khi zoomed
- [ ] Move annotations khi zoomed
- [ ] Responsive trên mobile
- [ ] Sidebar toggle trên mobile
- [ ] Toolbar responsive
- [ ] Reset zoom khi chuyển item

## Known Limitations

1. **Coordinate Calculation**: Tọa độ annotations được tính relative to image, không phải viewport
2. **Max Zoom**: Giới hạn 3x để tránh pixelation quá mức
3. **Min Zoom**: Giới hạn 0.5x để đảm bảo visibility
4. **Mobile Pan**: Có thể conflict với scroll gesture trên một số devices

## Future Enhancements

- [ ] Pinch to zoom trên mobile
- [ ] Zoom to fit button
- [ ] Zoom to selection
- [ ] Mini-map navigator
- [ ] Zoom history (undo/redo zoom)
- [ ] Keyboard shortcuts cho zoom (+ / -)
- [ ] Touch gestures cho pan
