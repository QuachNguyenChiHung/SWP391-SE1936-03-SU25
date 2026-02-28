import React, { useState, useRef, useEffect } from 'react';
import {
    MousePointer2,
    Square,
    Hexagon,
    Tag,
    ZoomIn,
    ZoomOut,
    Check,
    Bot,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Save,
    Layers,
    Calendar,
    Trash2,
    X
} from 'lucide-react';
import api from '../../ultis/api.js';
import './AnnotatorWorkspace.css';

export const AnnotatorWorkspace = ({ user }) => {
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [taskBatches, setTaskBatches] = useState([]);
    const [batchItems, setBatchItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isLoadingBatches, setIsLoadingBatches] = useState(true);
    const [isLoadingItems, setIsLoadingItems] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState([]);

    // Workspace State
    const [selectedTool, setSelectedTool] = useState('SELECT');
    const [activeLabelId, setActiveLabelId] = useState('');
    const [annotations, setAnnotations] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [showGuidelines, setShowGuidelines] = useState(true);
    const [projectLabels, setProjectLabels] = useState([]);
    
    // Toast notification state
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    
    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState({ show: false, annotationId: null });

    // Show toast notification
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    // Refs for drag state
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    // Drawing State
    const [isDrawing, setIsDrawing] = useState(false);
    const drawingStartRef = useRef(null);
    const [currentDragInfo, setCurrentDragInfo] = useState(null);
    
    // Polygon drawing state
    const [polygonPoints, setPolygonPoints] = useState([]);
    const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);

    // Moving State
    const [isDraggingBox, setIsDraggingBox] = useState(false);
    const dragRef = useRef(null);

    // Fetch task batches assigned to current user
    useEffect(() => {
        let mounted = true;
        const fetchTaskBatches = async () => {
            setIsLoadingBatches(true);
            try {
                const res = await api.get('/Tasks');
                if (!mounted) return;
                setTaskBatches(res?.data?.items || []);
            } catch (e) {
                console.error('Failed to fetch task batches:', e?.message || e);
            } finally {
                if (mounted) setIsLoadingBatches(false);
            }
        };
        fetchTaskBatches();
        return () => { mounted = false; };
    }, [user]);

    // Fetch project labels when batch is selected
    useEffect(() => {
        const fetchProjectLabels = async () => {
            if (!selectedBatch?.projectId) return;
            
            try {
                // TODO: Replace with actual API endpoint when available
                // const res = await api.get(`/projects/${selectedBatch.projectId}/labels`);
                // setProjectLabels(res?.data || []);
                
                // For now, use empty array - labels will come from annotations
                setProjectLabels([]);
            } catch (e) {
                console.error('Failed to fetch project labels:', e);
                setProjectLabels([]);
            }
        };
        
        fetchProjectLabels();
    }, [selectedBatch?.projectId]);

    // Fetch items for a specific batch
    const handleSelectBatch = async (batch) => {
        setSelectedBatch(batch);
        setIsLoadingItems(true);
        try {
            // Fetch full task details including items
            const res = await api.get(`/Tasks/${batch.id}`);
            const taskData = res?.data;
            
            // Update batch with full details
            setSelectedBatch(taskData);
            
            // Extract items from response
            const items = taskData?.items || [];
            setBatchItems(items);
        } catch (e) {
            console.error('Failed to fetch batch items:', e?.message || e);
            setBatchItems([]);
        } finally {
            setIsLoadingItems(false);
        }
    };

    // Initialize workspace when item is selected
    const handleSelectItem = async (item) => {
        setSelectedItem(item);
        setIsDrawing(false);
        setIsDraggingBox(false);
        dragRef.current = null;
        
        // Fetch annotations for this item
        if (item.dataItemId) {
            try {
                const res = await api.get(`/data-items/${item.dataItemId}/annotations`);
                const annotationsData = res?.data || [];
                
                // Transform API data to internal format
                const transformedAnnotations = annotationsData.map(ann => {
                    // Parse coordinates JSON string
                    const coords = JSON.parse(ann.coordinates);
                    return {
                        id: ann.id,
                        labelId: ann.labelId,
                        labelName: ann.labelName,
                        labelColor: ann.labelColor,
                        coordinates: coords.type === 'bbox' ? {
                            type: 'bbox',
                            x: coords.x,
                            y: coords.y,
                            width: coords.width,
                            height: coords.height
                        } : {
                            type: 'polygon',
                            points: coords.points
                        },
                        createdBy: ann.createdByName,
                        createdAt: ann.createdAt
                    };
                });
                
                setAnnotations(transformedAnnotations);
                
                // Set active label to first available if exists
                if (transformedAnnotations.length > 0) {
                    setActiveLabelId(transformedAnnotations[0].labelId);
                }
            } catch (e) {
                console.error('Failed to fetch annotations:', e);
                setAnnotations([]);
            }
        } else {
            setAnnotations([]);
        }
    };

    // Create new annotation via API
    const handleCreateAnnotation = async (coordinates, labelId) => {
        console.log('Creating annotation with coordinates:', coordinates, 'labelId:', labelId);
        
        if (!selectedItem?.dataItemId || !labelId) {
            showToast('Please select a label class first', 'warning');
            return;
        }

        try {
            // Format coordinates as JSON string based on type
            const coordinatesJson = JSON.stringify(coordinates);
            
            const payload = {
                labelId: labelId,
                coordinates: coordinatesJson,
                attributes: JSON.stringify({}) // Empty attributes for now
            };

            console.log('Sending POST request with payload:', payload);
            const res = await api.post(`/data-items/${selectedItem.dataItemId}/annotations`, payload);
            const newAnnotation = res?.data;
            
            console.log('API response - new annotation:', newAnnotation);

            if (newAnnotation) {
                // Parse coordinates and keep the structure
                const coords = JSON.parse(newAnnotation.coordinates);
                const transformedAnnotation = {
                    id: newAnnotation.id, // This should be 104 from your example
                    labelId: newAnnotation.labelId,
                    labelName: newAnnotation.labelName,
                    labelColor: newAnnotation.labelColor,
                    coordinates: coords, // This will have {type: 'bbox', x, y, width, height}
                    createdBy: newAnnotation.createdByName,
                    createdAt: newAnnotation.createdAt
                };
                
                console.log('Transformed annotation to add to state:', transformedAnnotation);
                setAnnotations(prev => [...prev, transformedAnnotation]);
                showToast('Annotation created successfully', 'success');
            }
        } catch (e) {
            console.error('Failed to create annotation:', e);
            console.error('Error details:', e?.response?.data);
            showToast('Failed to create annotation: ' + (e?.response?.data?.message || e?.message), 'error');
        }
    };

    // Delete annotation via API
    const handleDeleteAnnotation = async (annotationId) => {
        console.log('Attempting to delete annotation with ID:', annotationId);
        
        if (!annotationId) {
            console.error('No annotation ID provided');
            return;
        }

        // Show confirm dialog instead of window.confirm
        setConfirmDialog({ show: true, annotationId });
    };

    // Confirm delete annotation
    const confirmDeleteAnnotation = async () => {
        const annotationId = confirmDialog.annotationId;
        setConfirmDialog({ show: false, annotationId: null });

        if (!annotationId) return;

        try {
            console.log('Calling DELETE /annotations/' + annotationId);
            await api.delete(`/annotations/${annotationId}`);
            
            console.log('Successfully deleted annotation:', annotationId);
            
            // Remove from local state
            setAnnotations(prev => prev.filter(ann => ann.id !== annotationId));
            showToast('Annotation deleted successfully', 'success');
        } catch (e) {
            console.error('Failed to delete annotation:', e);
            console.error('Error response:', e?.response?.data);
            showToast('Failed to delete annotation: ' + (e?.response?.data?.message || e?.message), 'error');
        }
    };

    // Update annotation via API
    const handleUpdateAnnotation = async (annotationId, updatedData) => {
        console.log('Updating annotation:', annotationId, updatedData);
        
        if (!annotationId) {
            console.error('No annotation ID provided');
            return;
        }

        try {
            const payload = {
                labelId: updatedData.labelId,
                coordinates: JSON.stringify(updatedData.coordinates),
                attributes: JSON.stringify(updatedData.attributes || {})
            };

            console.log('Calling PUT /annotations/' + annotationId, payload);
            await api.put(`/annotations/${annotationId}`, payload);
            
            console.log('Successfully updated annotation:', annotationId);
            showToast('Annotation position updated', 'success');
        } catch (e) {
            console.error('Failed to update annotation:', e);
            console.error('Error response:', e?.response?.data);
            showToast('Failed to update annotation: ' + (e?.response?.data?.message || e?.message), 'error');
        }
    };

    // Navigate to next item (circular)
    const handleNextItem = () => {
        if (batchItems.length === 0) return;
        
        const currentIndex = batchItems.findIndex(item => item.id === selectedItem?.id);
        const nextIndex = (currentIndex + 1) % batchItems.length; // Circular: wrap to 0 if at end
        
        handleSelectItem(batchItems[nextIndex]);
    };

    // Navigate to previous item (circular)
    const handlePreviousItem = () => {
        if (batchItems.length === 0) return;
        
        const currentIndex = batchItems.findIndex(item => item.id === selectedItem?.id);
        const prevIndex = currentIndex === 0 ? batchItems.length - 1 : currentIndex - 1; // Circular
        
        handleSelectItem(batchItems[prevIndex]);
    };

    // Accept current item and move to next
    const handleAcceptAndNext = async () => {
        if (!selectedItem) return;

        try {
            // TODO: Call API to mark item as accepted/completed
            // await api.post(`/Tasks/${selectedBatch.id}/items/${selectedItem.id}/accept`);
            
            // Update local state
            const updatedItems = batchItems.map(item => 
                item.id === selectedItem.id 
                    ? { ...item, status: 'Completed' }
                    : item
            );
            setBatchItems(updatedItems);
            
            // Move to next item
            handleNextItem();
        } catch (e) {
            console.error('Failed to accept item:', e);
            alert('Failed to accept item: ' + (e?.response?.data?.message || e?.message));
        }
    };

    // Reject current item (delete it) and move to next
    const handleRejectItem = async () => {
        if (!selectedItem) return;
        
        if (!window.confirm('Are you sure you want to reject and delete this item?')) {
            return;
        }

        try {
            // Delete the item using existing API
            await api.delete(`/Tasks/${selectedBatch.id}/items`, {
                data: { itemIds: [selectedItem.id] }
            });
            
            // Remove from local state
            const updatedItems = batchItems.filter(item => item.id !== selectedItem.id);
            setBatchItems(updatedItems);
            
            // Update batch counts
            setSelectedBatch(prev => ({
                ...prev,
                totalItems: prev.totalItems - 1,
                progressPercent: prev.totalItems > 1 
                    ? (prev.completedItems / (prev.totalItems - 1)) * 100 
                    : 0
            }));

            // Move to next item or go back if no items left
            if (updatedItems.length > 0) {
                const currentIndex = batchItems.findIndex(item => item.id === selectedItem.id);
                const nextIndex = currentIndex >= updatedItems.length ? 0 : currentIndex;
                handleSelectItem(updatedItems[nextIndex]);
            } else {
                setSelectedItem(null);
            }
        } catch (e) {
            console.error('Failed to reject item:', e);
            alert('Failed to reject item: ' + (e?.response?.data?.message || e?.message));
        }
    };

    // Delete a single item
    const handleDeleteItem = async (itemId) => {
        if (!window.confirm('Are you sure you want to delete this item?')) {
            return;
        }

        try {
            await api.delete(`/Tasks/${selectedBatch.id}/items`, {
                data: { itemIds: [itemId] }
            });
            
            // Remove item from local state
            const updatedItems = batchItems.filter(item => item.id !== itemId);
            setBatchItems(updatedItems);
            
            // Update batch counts
            setSelectedBatch(prev => ({
                ...prev,
                totalItems: prev.totalItems - 1,
                progressPercent: prev.totalItems > 1 
                    ? (prev.completedItems / (prev.totalItems - 1)) * 100 
                    : 0
            }));

            // If currently viewing this item, go back
            if (selectedItem?.id === itemId) {
                setSelectedItem(null);
            }

            alert('Item deleted successfully');
        } catch (e) {
            console.error('Failed to delete item:', e);
            alert('Failed to delete item: ' + (e?.response?.data?.message || e?.message));
        }
    };

    // Delete multiple items
    const handleDeleteMultipleItems = async (itemIds) => {
        if (!window.confirm(`Are you sure you want to delete ${itemIds.length} items?`)) {
            return;
        }

        try {
            await api.delete(`/Tasks/${selectedBatch.id}/items`, {
                data: { itemIds }
            });
            
            // Remove items from local state
            const updatedItems = batchItems.filter(item => !itemIds.includes(item.id));
            setBatchItems(updatedItems);
            
            // Update batch counts
            setSelectedBatch(prev => ({
                ...prev,
                totalItems: prev.totalItems - itemIds.length,
                progressPercent: prev.totalItems > itemIds.length
                    ? (prev.completedItems / (prev.totalItems - itemIds.length)) * 100
                    : 0
            }));

            alert(`${itemIds.length} items deleted successfully`);
        } catch (e) {
            console.error('Failed to delete items:', e);
            alert('Failed to delete items: ' + (e?.response?.data?.message || e?.message));
        }
    };

    // Delete entire task (only if all items are deleted)
    const handleDeleteTask = async (taskId) => {
        const task = taskBatches.find(t => t.id === taskId);
        
        if (task && task.totalItems > 0) {
            alert('Cannot delete task. Please delete all items first.');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/Tasks/${taskId}`);
            
            // Remove task from local state
            setTaskBatches(prev => prev.filter(t => t.id !== taskId));
            
            // If currently viewing this task, go back
            if (selectedBatch?.id === taskId) {
                setSelectedBatch(null);
                setBatchItems([]);
                setSelectedItem(null);
            }

            alert('Task deleted successfully');
        } catch (e) {
            console.error('Failed to delete task:', e);
            alert('Failed to delete task: ' + (e?.response?.data?.message || e?.message));
        }
    };

    const handleBackToBatchList = () => {
        setSelectedBatch(null);
        setSelectedItem(null);
        setBatchItems([]);
        setSelectedItemIds([]);
    };

    const handleBackToItemList = () => {
        setSelectedItem(null);
    };

    const handleAiAssist = () => {
        if (!selectedItem) return;
        setIsAiLoading(true);
        // TODO: Call AI API endpoint when available
        setTimeout(() => {
            const newAnnotation = {
                id: `ai-${Date.now()}`,
                labelId: activeLabelId || 'default',
                coordinates: { x: 400, y: 300, width: 150, height: 150 },
                confidence: 0.94,
                createdBy: 'AI'
            };
            setAnnotations(prev => [...prev, newAnnotation]);
            setIsAiLoading(false);
        }, 1200);
    };

    // --- Coordinates Helper ---
    const getRelativeCoordinates = (clientX, clientY) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    // Helper to get image bounds relative to container
    const getImageConstraints = () => {
        if (!containerRef.current || !imageRef.current) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

        const containerRect = containerRef.current.getBoundingClientRect();
        const imageRect = imageRef.current.getBoundingClientRect();

        return {
            minX: imageRect.left - containerRect.left,
            minY: imageRect.top - containerRect.top,
            maxX: (imageRect.left - containerRect.left) + imageRect.width,
            maxY: (imageRect.top - containerRect.top) + imageRect.height
        };
    };

    // --- Global Mouse Handlers (Window level) ---
    useEffect(() => {
        const handleWindowMouseMove = (e) => {
            const bounds = getImageConstraints();

            // 1. Handle Box Moving
            if (dragRef.current && containerRef.current) {
                const { id, offsetX, offsetY } = dragRef.current;
                const rect = containerRef.current.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                setAnnotations(prev => prev.map(ann => {
                    if (ann.id !== id) return ann;

                    let newX = mouseX - offsetX;
                    let newY = mouseY - offsetY;

                    // Clamp to Image Boundaries
                    newX = Math.max(bounds.minX, Math.min(newX, bounds.maxX - ann.coordinates.width));
                    newY = Math.max(bounds.minY, Math.min(newY, bounds.maxY - ann.coordinates.height));

                    return {
                        ...ann,
                        coordinates: { ...ann.coordinates, x: newX, y: newY }
                    };
                }));
                return;
            }

            // 2. Handle Drawing
            if (isDrawing && drawingStartRef.current && containerRef.current) {
                const coords = getRelativeCoordinates(e.clientX, e.clientY);

                // Clamp current mouse position to image bounds
                const currentX = Math.max(bounds.minX, Math.min(coords.x, bounds.maxX));
                const currentY = Math.max(bounds.minY, Math.min(coords.y, bounds.maxY));

                const start = drawingStartRef.current; // Already clamped on start
                const width = Math.abs(currentX - start.x);
                const height = Math.abs(currentY - start.y);
                const x = Math.min(currentX, start.x);
                const y = Math.min(currentY, start.y);

                setCurrentDragInfo({ x, y, w: width, h: height });
            }
        };

        const handleWindowMouseUp = () => {
            // End Moving - Save updated position to API
            if (dragRef.current && isDraggingBox) {
                const draggedAnnotationId = dragRef.current.id;
                
                // Find the annotation with updated coordinates
                const updatedAnnotation = annotations.find(ann => ann.id === draggedAnnotationId);
                
                if (updatedAnnotation) {
                    console.log('Drag ended, updating annotation position:', updatedAnnotation);
                    
                    // Call API to update coordinates
                    handleUpdateAnnotation(updatedAnnotation.id, {
                        labelId: updatedAnnotation.labelId,
                        coordinates: updatedAnnotation.coordinates,
                        attributes: {}
                    });
                }
                
                dragRef.current = null;
                setIsDraggingBox(false);
            }

            // End Drawing
            if (isDrawing && drawingStartRef.current && currentDragInfo) {
                const { w, h, x, y } = currentDragInfo;

                // Min size check (5x5 pixels)
                if (w > 5 && h > 5) {
                    // Create bbox coordinates
                    const coordinates = {
                        type: 'bbox',
                        x: Math.round(x),
                        y: Math.round(y),
                        width: Math.round(w),
                        height: Math.round(h)
                    };
                    
                    // Save to API
                    handleCreateAnnotation(coordinates, activeLabelId);
                }
                setIsDrawing(false);
                drawingStartRef.current = null;
                setCurrentDragInfo(null);
            } else if (isDrawing) {
                // Cancel drawing if didn't drag
                setIsDrawing(false);
                drawingStartRef.current = null;
                setCurrentDragInfo(null);
            }
        };

        if (isDraggingBox || isDrawing) {
            window.addEventListener('mousemove', handleWindowMouseMove);
            window.addEventListener('mouseup', handleWindowMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [isDraggingBox, isDrawing, currentDragInfo, activeLabelId, selectedItem]);


    // --- Event Starters ---

    const handleAnnotationMouseDown = (e, ann) => {
        // Don't start dragging if clicking on delete button
        if (e.target.classList.contains('annotation-delete-btn')) {
            return;
        }
        
        // Smart Tool: Always allow moving an existing box, even if in BOX/DRAW mode.
        e.preventDefault();
        e.stopPropagation(); // Important: Stop event from bubbling to container (which would start drawing)

        const coords = getRelativeCoordinates(e.clientX, e.clientY);

        dragRef.current = {
            id: ann.id,
            offsetX: coords.x - ann.coordinates.x,
            offsetY: coords.y - ann.coordinates.y
        };
        setIsDraggingBox(true);
    };

    const handleContainerMouseDown = (e) => {
        // Handle Polygon mode
        if (selectedTool === 'POLYGON') {
            e.preventDefault();
            const coords = getRelativeCoordinates(e.clientX, e.clientY);
            const bounds = getImageConstraints();
            
            // Clamp to image bounds
            const constrainedX = Math.max(bounds.minX, Math.min(coords.x, bounds.maxX));
            const constrainedY = Math.max(bounds.minY, Math.min(coords.y, bounds.maxY));
            
            // Add point to polygon
            setPolygonPoints(prev => [...prev, { x: constrainedX, y: constrainedY }]);
            setIsDrawingPolygon(true);
            return;
        }
        
        // Handle Box mode
        if (selectedTool !== 'BOX') return;

        e.preventDefault();
        const rawCoords = getRelativeCoordinates(e.clientX, e.clientY);
        const bounds = getImageConstraints();

        // Clamp start position to be inside image
        const constrainedX = Math.max(bounds.minX, Math.min(rawCoords.x, bounds.maxX));
        const constrainedY = Math.max(bounds.minY, Math.min(rawCoords.y, bounds.maxY));

        drawingStartRef.current = { x: constrainedX, y: constrainedY };
        setIsDrawing(true);
        setCurrentDragInfo({ x: constrainedX, y: constrainedY, w: 0, h: 0 });
    };

    // Handle double click to finish polygon
    const handleContainerDoubleClick = (e) => {
        if (selectedTool === 'POLYGON' && polygonPoints.length >= 3) {
            e.preventDefault();
            
            // Create polygon coordinates
            const coordinates = {
                type: 'polygon',
                points: polygonPoints.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }))
            };
            
            // Save to API
            handleCreateAnnotation(coordinates, activeLabelId);
            
            // Reset polygon state
            setPolygonPoints([]);
            setIsDrawingPolygon(false);
        }
    };

    // Handle Escape key to cancel polygon
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isDrawingPolygon) {
                setPolygonPoints([]);
                setIsDrawingPolygon(false);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDrawingPolygon]);


    // --- VIEW: Batch Items List (when batch is selected but no item) ---
    if (selectedBatch && !selectedItem) {
        return (
            <div className="animate-fade-in container-lg mx-auto">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center gap-3">
                        <button onClick={handleBackToBatchList} className="btn btn-link text-muted text-decoration-none d-flex align-items-center gap-1 p-0">
                            <ChevronLeft size={16} />
                            Back to Batches
                        </button>
                        <div className="bg-slate-200" style={{ height: '1.25rem', width: '1px' }}></div>
                        <div>
                            <h2 className="fs-4 fw-bold text-slate-900 mb-0">{selectedBatch.projectName}</h2>
                            <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
                                {selectedBatch.completedItems} / {selectedBatch.totalItems} items completed ({selectedBatch.progressPercent.toFixed(0)}%)
                                {selectedBatch.assignedByName && (
                                    <span className="ms-2">• Assigned by {selectedBatch.assignedByName}</span>
                                )}
                            </p>
                        </div>
                    </div>
                    
                    {/* Delete selected items button */}
                    {selectedItemIds.length > 0 && (
                        <button
                            onClick={() => handleDeleteMultipleItems(selectedItemIds)}
                            className="btn btn-danger d-flex align-items-center gap-2"
                            style={{ fontSize: '0.875rem' }}
                        >
                            <Trash2 size={16} />
                            Delete {selectedItemIds.length} item{selectedItemIds.length > 1 ? 's' : ''}
                        </button>
                    )}
                </div>

                {isLoadingItems ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : batchItems.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <Layers size={32} />
                        </div>
                        <h3 className="fs-5 fw-medium text-slate-900">No Items Found</h3>
                        <p className="text-muted">This batch doesn't have any items yet.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-4 border border-slate-200 shadow-sm p-4">
                        {/* Select all checkbox */}
                        <div className="d-flex align-items-center gap-2 mb-3 pb-3 border-bottom">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectedItemIds.length === batchItems.length && batchItems.length > 0}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedItemIds(batchItems.map(item => item.id));
                                    } else {
                                        setSelectedItemIds([]);
                                    }
                                }}
                                style={{ cursor: 'pointer' }}
                            />
                            <label className="text-muted mb-0" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
                                Select all items
                            </label>
                        </div>

                        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
                            {batchItems.map((item) => (
                                <div key={item.id} className="col">
                                    <div className="position-relative">
                                        {/* Checkbox overlay */}
                                        <div className="position-absolute" style={{ top: '0.5rem', left: '0.5rem', zIndex: 10 }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedItemIds.includes(item.id)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    if (e.target.checked) {
                                                        setSelectedItemIds(prev => [...prev, item.id]);
                                                    } else {
                                                        setSelectedItemIds(prev => prev.filter(id => id !== item.id));
                                                    }
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ cursor: 'pointer', width: '1.25rem', height: '1.25rem' }}
                                            />
                                        </div>

                                        <div
                                            onClick={() => handleSelectItem(item)}
                                            className="task-card bg-white rounded-3 border border-slate-200 overflow-hidden d-flex flex-column h-100"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="position-relative overflow-hidden bg-slate-100" style={{ height: '8rem' }}>
                                                <img
                                                    src={item.thumbnailPath || item.filePath || 'https://via.placeholder.com/300x200?text=No+Image'}
                                                    alt={item.fileName || `Item ${item.id}`}
                                                    className="w-100 h-100 object-fit-cover task-card-image"
                                                />
                                                {item.dataItemStatus && (
                                                    <div className="position-absolute" style={{ top: '0.5rem', right: '0.5rem' }}>
                                                        <span className={`badge ${item.dataItemStatus === 'Approved' ? 'bg-success' : item.dataItemStatus === 'Rejected' ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '0.625rem' }}>
                                                            {item.dataItemStatus}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-3 flex-grow-1 d-flex flex-column">
                                                <div className="mb-2">
                                                    <p className="mb-0 fw-medium text-slate-900 text-truncate" style={{ fontSize: '0.75rem' }} title={item.fileName}>
                                                        {item.fileName || `Item ${item.id}`}
                                                    </p>
                                                    <p className="mb-0 text-slate-400" style={{ fontSize: '10px' }}>ID: {item.id}</p>
                                                </div>

                                                <div className="mt-auto pt-2 border-top border-slate-100">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <span className={`status-badge ${item.status === 'Completed' ? 'completed' : item.status === 'InProgress' ? 'in-progress' : 'pending'}`}>
                                                            {item.status || 'Pending'}
                                                        </span>
                                                    </div>
                                                    {item.completedAt && (
                                                        <div className="d-flex align-items-center gap-1 text-success" style={{ fontSize: '10px' }}>
                                                            <Check size={10} />
                                                            {new Date(item.completedAt).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- VIEW: Task Batches List ---
    if (!selectedBatch) {

        return (
            <div className="animate-fade-in container-lg mx-auto">
                <div className="d-flex justify-content-between align-items-end mb-5">
                    <div>
                        <h2 className="fs-4 fw-bold text-slate-900">My Assigned Task Batches</h2>
                        <p className="text-muted" style={{ fontSize: '0.875rem' }}>Overview of annotation batches assigned to you</p>
                    </div>
                </div>

                {isLoadingBatches ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : taskBatches.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <Layers size={32} />
                        </div>
                        <h3 className="fs-5 fw-medium text-slate-900">No Task Batches Assigned</h3>
                        <p className="text-muted mx-auto mt-2" style={{ maxWidth: '28rem' }}>You currently don't have any task batches assigned. Check back later or contact your manager.</p>
                    </div>
                ) : (
                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                        {taskBatches.map((batch) => (
                            <div key={batch.id} className="col">
                                <div
                                    onClick={() => handleSelectBatch(batch)}
                                    className="bg-white rounded-4 border border-slate-200 shadow-sm overflow-hidden h-100 d-flex flex-column"
                                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    {/* Header */}
                                    <div className="p-4 border-bottom border-slate-100">
                                        <div className="d-flex align-items-start gap-3">
                                            <div className="p-2 bg-indigo-50 rounded-3 text-indigo-600">
                                                <Layers size={20} />
                                            </div>
                                            <div className="flex-grow-1">
                                                <h3 className="fw-bold text-slate-900 fs-6 mb-1">{batch.projectName}</h3>
                                                <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>
                                                    Assigned by {batch.annotatorName || 'Manager'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="p-4 flex-grow-1">
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Progress</span>
                                                <span className="fw-bold text-slate-900" style={{ fontSize: '0.875rem' }}>
                                                    {batch.progressPercent.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                                                <div
                                                    className="progress-bar bg-indigo-600"
                                                    role="progressbar"
                                                    style={{ width: `${batch.progressPercent}%` }}
                                                    aria-valuenow={batch.progressPercent}
                                                    aria-valuemin="0"
                                                    aria-valuemax="100"
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div>
                                                <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Total Items</p>
                                                <p className="fw-bold text-slate-900 mb-0" style={{ fontSize: '1.25rem' }}>{batch.totalItems}</p>
                                            </div>
                                            <div className="text-end">
                                                <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Completed</p>
                                                <p className="fw-bold text-success mb-0" style={{ fontSize: '1.25rem' }}>{batch.completedItems}</p>
                                            </div>
                                        </div>

                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <Calendar size={12} className="text-muted" />
                                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                Assigned: {new Date(batch.assignedAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {batch.completedAt && (
                                            <div className="d-flex align-items-center gap-2">
                                                <Check size={12} className="text-success" />
                                                <span className="text-success" style={{ fontSize: '0.75rem' }}>
                                                    Completed: {new Date(batch.completedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="p-3 bg-slate-50 border-top border-slate-100 d-flex justify-content-between align-items-center">
                                        <span className={`status-badge ${batch.status === 'Completed' ? 'completed' : batch.status === 'InProgress' ? 'in-progress' : 'pending'}`}>
                                            {batch.status}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTask(batch.id);
                                            }}
                                            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                            title={batch.totalItems > 0 ? 'Delete all items first' : 'Delete task'}
                                            disabled={batch.totalItems > 0}
                                        >
                                            <Trash2 size={12} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // --- VIEW: Workspace (Single Item) ---
    const projectClasses = projectLabels;

    return (
        <div className="d-flex flex-column animate-fade-in-zoom bg-white rounded-4 shadow-sm border border-slate-200 overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>

            {/* Workspace Toolbar Header */}
            <div className="border-bottom border-slate-200 d-flex align-items-center justify-content-between px-3 bg-white flex-shrink-0" style={{ height: '3.5rem', zIndex: 10 }}>
                <div className="d-flex align-items-center gap-3">
                    <button onClick={handleBackToItemList} className="btn btn-link text-muted text-decoration-none d-flex align-items-center gap-1 p-0 hover-text-slate-800" style={{ fontSize: '0.875rem', transition: 'color 0.15s' }}>
                        <ChevronLeft size={16} />
                        Back to Items
                    </button>
                    <div className="bg-slate-200" style={{ height: '1.25rem', width: '1px' }}></div>
                    <div className="d-flex align-items-center gap-2">
                        <span className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.625rem', letterSpacing: '0.05em' }}>
                            ITEM #{selectedItem?.id}
                        </span>
                        <h3 className="mb-0 fw-semibold text-slate-900" style={{ fontSize: '0.875rem' }}>
                            {selectedItem?.fileName || `Item ${selectedItem?.id}`}
                        </h3>
                        {selectedItem?.dataItemStatus && (
                            <span className={`badge ${selectedItem.dataItemStatus === 'Approved' ? 'bg-success' : selectedItem.dataItemStatus === 'Rejected' ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '0.625rem' }}>
                                {selectedItem.dataItemStatus}
                            </span>
                        )}
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    {/* Navigation buttons */}
                    <button
                        onClick={handlePreviousItem}
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                        style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                        disabled={batchItems.length <= 1}
                    >
                        <ChevronLeft size={14} />
                        Previous
                    </button>
                    
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {batchItems.findIndex(item => item.id === selectedItem?.id) + 1} / {batchItems.length}
                    </span>
                    
                    <button
                        onClick={handleNextItem}
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                        style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                        disabled={batchItems.length <= 1}
                    >
                        Next
                        <ChevronRight size={14} />
                    </button>

                    <div className="bg-slate-200" style={{ height: '1.25rem', width: '1px' }}></div>

                    <button
                        onClick={() => setShowGuidelines(!showGuidelines)}
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                        style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                    >
                        {showGuidelines ? 'Hide Labels' : 'Show Labels'}
                    </button>
                </div>
            </div>

            <div className="d-flex flex-grow-1 overflow-hidden position-relative user-select-none">
                {/* Canvas Container with Toolbar on Top */}
                <div className="d-flex flex-column flex-grow-1">
                    {/* Horizontal Toolbar */}
                    <div className="toolbar-horizontal">
                        <div className="d-flex align-items-center gap-2">
                            {[
                                { id: 'SELECT', icon: MousePointer2, label: 'Select' },
                                { id: 'BOX', icon: Square, label: 'Box' },
                                { id: 'POLYGON', icon: Hexagon, label: 'Polygon' }
                            ].map((tool) => (
                                <button
                                    key={tool.id}
                                    onClick={() => setSelectedTool(tool.id)}
                                    className={`btn-tool ${selectedTool === tool.id ? 'active' : ''}`}
                                    title={tool.id === 'SELECT' ? 'Move Tool' : `${tool.id} Tool`}
                                >
                                    <tool.icon size={18} />
                                </button>
                            ))}
                            <div className="toolbar-divider-vertical"></div>
                            <button className="btn-tool">
                                <ZoomIn size={18} />
                            </button>
                            <button className="btn-tool">
                                <ZoomOut size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <div
                        ref={containerRef}
                        className="canvas-area"
                        style={{ 
                            cursor: selectedTool === 'BOX' ? 'crosshair' : selectedTool === 'POLYGON' ? 'crosshair' : 'default', 
                            flex: 1 
                        }}
                        onMouseDown={handleContainerMouseDown}
                        onDoubleClick={handleContainerDoubleClick}
                    >
                        <img
                            ref={imageRef}
                            src={selectedItem?.filePath || selectedItem?.thumbnailPath || 'https://via.placeholder.com/800x600?text=No+Image'}
                            alt={selectedItem?.fileName || 'Work'}
                            className="canvas-image pe-none"
                            draggable={false}
                        />

                        {/* Annotations Layer */}
                        {annotations.map((ann) => {
                            console.log('Rendering annotation:', ann.id, ann);
                            const isBeingDragged = dragRef.current?.id === ann.id;
                            const boxColor = ann.labelColor || '#6366f1';

                            // Render bbox type
                            if (ann.coordinates.type === 'bbox') {
                                return (
                                    <div
                                        key={ann.id}
                                        className={`annotation-box group-box ${isBeingDragged ? 'dragging' : ''}`}
                                        onMouseDown={(e) => handleAnnotationMouseDown(e, ann)}
                                        style={{
                                            borderColor: boxColor,
                                            left: ann.coordinates.x,
                                            top: ann.coordinates.y,
                                            width: ann.coordinates.width,
                                            height: ann.coordinates.height,
                                            backgroundColor: `${boxColor}15`
                                        }}
                                    >
                                        <div
                                            className="annotation-label"
                                            style={{ backgroundColor: boxColor }}
                                        >
                                            {ann.labelName || 'Object'}
                                            {ann.confidence && (
                                                <span style={{ opacity: 0.8, fontWeight: 'normal', marginLeft: '0.25rem' }}>{(ann.confidence * 100).toFixed(0)}%</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            // Render polygon type
                            if (ann.coordinates.type === 'polygon' && ann.coordinates.points) {
                                const points = ann.coordinates.points;
                                const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');
                                
                                // Use first point for label position
                                const firstPoint = points[0];

                                return (
                                    <svg
                                        key={ann.id}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            pointerEvents: 'none',
                                            zIndex: 30
                                        }}
                                    >
                                        <polygon
                                            points={pointsString}
                                            fill={`${boxColor}15`}
                                            stroke={boxColor}
                                            strokeWidth="2"
                                            className={isBeingDragged ? 'dragging' : ''}
                                        />
                                        
                                        {/* Label background */}
                                        <rect
                                            x={firstPoint.x - 2}
                                            y={firstPoint.y - 20}
                                            width={ann.labelName ? (ann.labelName.length * 6 + 8) : 50}
                                            height="16"
                                            fill={boxColor}
                                            rx="3"
                                        />
                                        
                                        {/* Label text */}
                                        <text
                                            x={firstPoint.x + 2}
                                            y={firstPoint.y - 9}
                                            fill="white"
                                            fontSize="10"
                                            fontWeight="bold"
                                        >
                                            {ann.labelName || 'Object'}
                                            {ann.confidence && (
                                                <tspan opacity="0.8" fontWeight="normal">
                                                    {' '}{(ann.confidence * 100).toFixed(0)}%
                                                </tspan>
                                            )}
                                        </text>
                                        
                                        {/* Draw points */}
                                        {points.map((point, idx) => (
                                            <circle
                                                key={idx}
                                                cx={point.x}
                                                cy={point.y}
                                                r="4"
                                                fill={boxColor}
                                                stroke="white"
                                                strokeWidth="2"
                                            />
                                        ))}
                                    </svg>
                                );
                            }

                            return null;
                        })}

                        {/* Drawing Layer (Temporary Box) */}
                        {isDrawing && currentDragInfo && (
                            <div
                                className="drawing-box"
                                style={{
                                    left: currentDragInfo.x,
                                    top: currentDragInfo.y,
                                    width: currentDragInfo.w,
                                    height: currentDragInfo.h,
                                }}
                            >
                                <div className="drawing-label">
                                    New Annotation
                                </div>
                            </div>
                        )}

                        {/* Polygon Drawing Layer */}
                        {isDrawingPolygon && polygonPoints.length > 0 && (
                            <svg
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    pointerEvents: 'none',
                                    zIndex: 50
                                }}
                            >
                                {/* Draw lines between points */}
                                <polyline
                                    points={polygonPoints.map(p => `${p.x},${p.y}`).join(' ')}
                                    fill="rgba(59, 130, 246, 0.1)"
                                    stroke="#3b82f6"
                                    strokeWidth="2"
                                    strokeDasharray="5,5"
                                />
                                {/* Draw points */}
                                {polygonPoints.map((point, idx) => (
                                    <circle
                                        key={idx}
                                        cx={point.x}
                                        cy={point.y}
                                        r="4"
                                        fill="#3b82f6"
                                        stroke="white"
                                        strokeWidth="2"
                                    />
                                ))}
                                {/* Instruction text */}
                                {polygonPoints.length > 0 && (
                                    <text
                                        x={polygonPoints[0].x}
                                        y={polygonPoints[0].y - 10}
                                        fill="#3b82f6"
                                        fontSize="12"
                                        fontWeight="bold"
                                    >
                                        {polygonPoints.length < 3 
                                            ? `Click to add points (${polygonPoints.length}/3 min)` 
                                            : 'Double-click to finish or ESC to cancel'}
                                    </text>
                                )}
                            </svg>
                        )}
                    </div>

                    {/* Action Bar (Below Canvas) */}
                    <div className="p-4 bg-white border-top border-slate-200">
                        <div className="d-flex align-items-center gap-3" style={{ height: '3rem' }}>
                            <button
                                onClick={handleRejectItem}
                                className="btn btn-danger flex-fill h-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                                style={{ fontSize: '0.875rem' }}
                            >
                                <X size={18} />
                                Reject
                            </button>
                            
                            <button
                                onClick={handleAcceptAndNext}
                                className="btn btn-success h-100 d-flex align-items-center justify-content-center gap-2 fw-bold shadow-sm"
                                style={{ flex: '2', fontSize: '0.875rem' }}
                            >
                                <Check size={18} />
                                Accept & Next
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className={`sidebar ${showGuidelines ? '' : 'hidden'}`} style={{ position: window.innerWidth < 768 ? 'absolute' : 'relative', right: 0, top: 0, bottom: 0 }}>
                    {/* Mobile Toggle Handle */}
                    <button
                        onClick={() => setShowGuidelines(!showGuidelines)}
                        className="sidebar-toggle d-md-none"
                    >
                        {showGuidelines ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>

                    <div className="flex-grow-1 overflow-auto custom-scrollbar p-3">
                        {/* Class Selector */}
                        <div className="mb-4">
                            <h4 className="text-uppercase fw-bold text-muted mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Label Classes</h4>
                            {projectClasses.length === 0 ? (
                                <div>
                                    <p className="text-muted fst-italic mb-2" style={{ fontSize: '0.75rem' }}>
                                        {annotations.length > 0 
                                            ? 'Available labels from annotations:' 
                                            : 'No label classes available. Draw annotations to see labels.'}
                                    </p>
                                    {annotations.length > 0 && (
                                        <div>
                                            {/* Show unique labels from existing annotations */}
                                            {Array.from(new Map(annotations.map(ann => [ann.labelId, ann])).values()).map((ann, idx) => (
                                                <button
                                                    key={ann.labelId}
                                                    onClick={() => setActiveLabelId(ann.labelId)}
                                                    className={`label-class-btn mb-1 ${activeLabelId === ann.labelId ? 'active' : ''}`}
                                                    style={{ fontSize: '0.875rem' }}
                                                >
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="rounded-circle" style={{ backgroundColor: ann.labelColor, width: '0.625rem', height: '0.625rem' }}></span>
                                                        <span className={activeLabelId === ann.labelId ? 'text-slate-900 fw-medium' : 'text-slate-600'}>{ann.labelName}</span>
                                                    </div>
                                                    <span className="shortcut-badge">{idx + 1}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {projectClasses.map((cls, idx) => (
                                        <button
                                            key={cls.id}
                                            onClick={() => setActiveLabelId(cls.id)}
                                            className={`label-class-btn mb-1 ${activeLabelId === cls.id ? 'active' : ''}`}
                                            style={{ fontSize: '0.875rem' }}
                                        >
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="rounded-circle" style={{ backgroundColor: cls.color, width: '0.625rem', height: '0.625rem' }}></span>
                                                <span className={activeLabelId === cls.id ? 'text-slate-900 fw-medium' : 'text-slate-600'}>{cls.name}</span>
                                            </div>
                                            <span className="shortcut-badge">{idx + 1}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Annotation List */}
                        <div className="mb-4">
                            <h4 className="text-uppercase fw-bold text-muted mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Annotations ({annotations.length})</h4>
                            <div className="overflow-auto" style={{ maxHeight: '12rem' }}>
                                {annotations.length === 0 ? (
                                    <p className="text-muted fst-italic" style={{ fontSize: '0.75rem' }}>No annotations yet.</p>
                                ) : (
                                    annotations.map((ann, i) => (
                                        <div key={ann.id} className="d-flex align-items-start gap-2 px-3 py-2 rounded mb-2 bg-light border border-slate-200" style={{ fontSize: '0.75rem' }}>
                                            <div 
                                                className="rounded-circle flex-shrink-0 mt-1" 
                                                style={{ 
                                                    backgroundColor: ann.labelColor || '#6366f1', 
                                                    width: '0.75rem', 
                                                    height: '0.75rem' 
                                                }}
                                            ></div>
                                            <div className="flex-grow-1">
                                                <div className="d-flex align-items-center justify-content-between mb-1">
                                                    <span className="fw-semibold text-slate-900">{ann.labelName || 'Object'}</span>
                                                    <span className="text-muted" style={{ fontSize: '0.625rem' }}>#{i + 1}</span>
                                                </div>
                                                <div className="text-muted" style={{ fontSize: '0.625rem' }}>
                                                    Confidence: {ann.confidence ? `${(ann.confidence * 100).toFixed(0)}%` : '100%'}
                                                </div>
                                                {/* Action buttons */}
                                                <div className="d-flex gap-1 mt-2">
                                                    <button
                                                        onClick={() => {
                                                            console.log('Delete annotation:', ann.id);
                                                            handleDeleteAnnotation(ann.id);
                                                        }}
                                                        className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                                                        style={{ fontSize: '0.625rem', padding: '0.125rem 0.375rem' }}
                                                        title="Delete annotation"
                                                    >
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Guidelines */}
                        <div className="guidelines-box">
                            <div className="guidelines-title">
                                <AlertCircle size={14} />
                                <span>Labeling Guidelines</span>
                            </div>
                            <ul className="guidelines-list">
                                <li>Draw tight boxes around visible vehicles.</li>
                                <li>Include side mirrors, exclude antennas.</li>
                                <li>Ignore occluded vehicles less than 20% visible.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Delete Modal */}
            {confirmDialog.show && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">Confirm Delete</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setConfirmDialog({ show: false, annotationId: null })}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p className="mb-0">Are you sure you want to delete this annotation?</p>
                                <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>This action cannot be undone.</p>
                            </div>
                            <div className="modal-footer border-0">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => setConfirmDialog({ show: false, annotationId: null })}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-danger"
                                    onClick={confirmDeleteAnnotation}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
                <div className={`toast ${toast.show ? 'show' : ''}`} role="alert" aria-live="assertive" aria-atomic="true">
                    <div className={`toast-header ${toast.type === 'success' ? 'bg-success' : toast.type === 'error' ? 'bg-danger' : 'bg-warning'} text-white`}>
                        <strong className="me-auto">
                            {toast.type === 'success' ? '✓ Success' : toast.type === 'error' ? '✗ Error' : '⚠ Warning'}
                        </strong>
                        <button 
                            type="button" 
                            className="btn-close btn-close-white" 
                            onClick={() => setToast({ ...toast, show: false })}
                            aria-label="Close"
                        ></button>
                    </div>
                    <div className="toast-body">
                        {toast.message}
                    </div>
                </div>
            </div>
        </div>
    );
};
