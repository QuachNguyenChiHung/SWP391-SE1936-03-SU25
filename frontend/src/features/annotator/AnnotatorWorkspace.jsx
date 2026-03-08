import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    MousePointer2,
    Square,
    Hexagon,
    Move,
    ZoomIn,
    ZoomOut,
    Check,
    ChevronLeft,
    ChevronRight,
    Layers,
    Calendar,
    Trash2,
    X,
    Keyboard,
    Save
} from 'lucide-react';
import api from '../../shared/utils/api.js';
import { ToastNotification } from './ToastNotification';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { AnnotationSidebar } from './AnnotationSidebar';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { ProgressIndicator } from './ProgressIndicator';
import './AnnotatorWorkspace.css';

export const AnnotatorWorkspace = ({ user }) => {
    const [searchParams] = useSearchParams();
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [taskBatches, setTaskBatches] = useState([]);
    const [batchItems, setBatchItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isLoadingBatches, setIsLoadingBatches] = useState(true);
    const [isLoadingItems, setIsLoadingItems] = useState(false);

    // Workspace State
    const [selectedTool, setSelectedTool] = useState('SELECT');
    const [activeLabelId, setActiveLabelId] = useState('');
    const [annotations, setAnnotations] = useState([]);
    const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [showGuidelines, setShowGuidelines] = useState(true);
    const [projectLabels, setProjectLabels] = useState([]);

    // New Features State
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
    const [copiedAnnotation, setCopiedAnnotation] = useState(null);

    // Zoom and Pan State
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef(null);

    // Toast notification state
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState({ show: false, annotationId: null });

    // Context menu state for annotations
    const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, annotationId: null });

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
    const lastClickTimeRef = useRef(0);

    // Moving State
    const [isDraggingBox, setIsDraggingBox] = useState(false);
    const dragRef = useRef(null);
    const dragToastShownRef = useRef(false);

    // Auto-save debounce ref
    const autoSaveTimerRef = useRef(null);

    // Function to save all annotations at once
    const saveAllAnnotations = async () => {
        if (!selectedItem || annotations.length === 0) {
            return;
        }

        try {
            const payload = {
                annotations: annotations.map(ann => ({
                    id: ann.id,
                    labelId: ann.labelId,
                    coordinates: JSON.stringify(ann.coordinates),
                    attributes: JSON.stringify(ann.attributes || {})
                }))
            };

            console.log('Auto-saving all annotations:', payload);
            await api.put(`/data-items/${selectedItem.dataItemId}/annotations/batch`, payload);
            console.log('All annotations saved successfully');
        } catch (e) {
            console.error('Failed to auto-save annotations:', e);
            console.error('Error response:', e?.response?.data);
        }
    };

    // Debounced auto-save effect
    useEffect(() => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
            saveAllAnnotations();
        }, 2000); // Save after 2 seconds of inactivity

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [annotations, selectedItem]);

    // Fetch task batches assigned to current user
    useEffect(() => {
        let mounted = true;
        const fetchTaskBatches = async () => {
            setIsLoadingBatches(true);
            try {
                const res = await api.get('/Tasks');
                console.log(res.data);
                if (!mounted) return;
                const tasks = res?.data?.items || [];
                setTaskBatches(tasks);

                // Auto-select task from URL parameter
                const taskIdFromUrl = searchParams.get('taskId');
                if (taskIdFromUrl && tasks.length > 0) {
                    const taskToSelect = tasks.find(t => t.id === parseInt(taskIdFromUrl));
                    if (taskToSelect) {
                        setSelectedBatch(taskToSelect);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch task batches:', e?.message || e);
            } finally {
                if (mounted) setIsLoadingBatches(false);
            }
        };
        fetchTaskBatches();
        return () => { mounted = false; };
    }, [searchParams]);

    // Fetch project labels when batch is selected
    useEffect(() => {
        const fetchProjectLabels = async () => {
            if (!selectedBatch?.projectId) return;

            try {
                const res = await api.get(`/projects/${selectedBatch.projectId}/labels`);
                setProjectLabels(res?.data?.data || []);
            } catch (e) {
                console.error('Failed to fetch project labels:', e);
                showToast('Failed to load project labels', 'error');
                setProjectLabels([]);
            }
        };

        fetchProjectLabels();
    }, [selectedBatch?.projectId]);

    // Auto-fetch items when batch is selected (from URL or manual selection)
    useEffect(() => {
        const fetchBatchItems = async () => {
            if (!selectedBatch?.id) {
                setBatchItems([]);
                return;
            }

            setIsLoadingItems(true);
            try {
                // Fetch full task details including items
                const res = await api.get(`/Tasks/${selectedBatch.id}`);
                const taskData = res?.data;

                // Extract items from response
                const items = taskData?.items || [];
                setBatchItems(items);
            } catch (e) {
                console.error('Failed to fetch batch items:', e?.message || e);
                showToast('Failed to load task items', 'error');
                setBatchItems([]);
            } finally {
                setIsLoadingItems(false);
            }
        };

        fetchBatchItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedBatch?.id]);

    // Fetch items for a specific batch
    const handleSelectBatch = async (batch) => {
        // Just set the selected batch, the useEffect will handle fetching items
        setSelectedBatch(batch);
    };

    // Initialize workspace when item is selected
    const handleSelectItem = async (item) => {
        setSelectedItem(item);
        setIsDrawing(false);
        setIsDraggingBox(false);
        dragRef.current = null;

        // Reset zoom and pan
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });

        // Mark task item as started if not already
        if (item.id && item.status === 'Assigned') {
            try {
                await api.post(`/task-items/${item.id}/start`);
                // Update local state
                setBatchItems(prev => prev.map(i =>
                    i.id === item.id ? { ...i, status: 'InProgress' } : i
                ));
            } catch (e) {
                console.error('Failed to start task item:', e);
            }
        }

        // Fetch annotations for this item
        if (item.dataItemId) {
            try {
                const res = await api.get(`/data-items/${item.dataItemId}/annotations`);
                const annotationsData = res?.data || [];

                // Transform API data to internal format
                const transformedAnnotations = annotationsData.map(ann => {
                    // Parse coordinates JSON string
                    const coords = JSON.parse(ann.coordinates);

                    let processedCoordinates;
                    if (coords.type === 'bbox') {
                        // Handle both old format (x, y, width, height) and new format (points array)
                        if (Array.isArray(coords.points) && coords.points.length === 2) {
                            // New format: already in [{x1, y1}, {x2, y2}] format
                            processedCoordinates = {
                                type: 'bbox',
                                points: coords.points
                            };
                        } else if (Array.isArray(coords) && coords.length === 2) {
                            // Alternative new format where coords itself is the array
                            processedCoordinates = {
                                type: 'bbox',
                                points: coords
                            };
                        } else {
                            // Old format: convert from {x, y, width, height} to [{x1, y1}, {x2, y2}]
                            processedCoordinates = {
                                type: 'bbox',
                                points: [
                                    { x: coords.x, y: coords.y },
                                    { x: coords.x + coords.width, y: coords.y + coords.height }
                                ]
                            };
                        }
                    } else {
                        // Polygon format stays the same
                        processedCoordinates = {
                            type: 'polygon',
                            points: coords.points
                        };
                    }

                    return {
                        id: ann.id,
                        labelId: ann.labelId,
                        labelName: ann.labelName,
                        labelColor: ann.labelColor,
                        coordinates: processedCoordinates,
                        createdBy: ann.createdByName,
                        createdAt: ann.createdAt
                    };
                });

                setAnnotations(transformedAnnotations);

                // Set active label to first available if exists
                if (transformedAnnotations.length > 0) {
                    setActiveLabelId(transformedAnnotations[0].labelId);
                } else if (projectLabels.length > 0) {
                    setActiveLabelId(projectLabels[0].id);
                }
            } catch (e) {
                console.error('Failed to fetch annotations:', e);
                showToast('Failed to load annotations', 'error');
                setAnnotations([]);
            }
        } else {
            setAnnotations([]);
        }
    };

    // Create new annotation via API
    const handleCreateAnnotation = async (coordinates, labelId) => {
        console.log('Creating annotation with coordinates:', coordinates, 'labelId:', labelId);

        // Check if task is already submitted
        if (selectedBatch?.status === 'Submitted') {
            showToast('Cannot edit - task has been submitted', 'warning');
            return;
        }

        // Check if item is already completed
        if (selectedItem?.status === 'Completed') {
            showToast('Cannot edit - item has been completed', 'warning');
            return;
        }

        if (!selectedItem?.dataItemId || !labelId) {
            showToast('Please select a label class first', 'warning');
            return;
        }

        try {
            // Format coordinates as JSON string based on type
            let coordinatesObj = coordinates;
            if (Array.isArray(coordinates) && coordinates.length === 2) {
                // New format from drawing: array of two points [{x1, y1}, {x2, y2}]
                // Wrap it with type information
                coordinatesObj = {
                    type: 'bbox',
                    points: coordinates
                };
            }

            const coordinatesJson = JSON.stringify(coordinatesObj);

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
                // Parse coordinates and transform to new format
                const coords = JSON.parse(newAnnotation.coordinates);

                let processedCoordinates;
                if (coords.type === 'bbox') {
                    // Handle both old format (x, y, width, height) and new format (points array)
                    if (Array.isArray(coords.points) && coords.points.length === 2) {
                        // New format: already in [{x1, y1}, {x2, y2}] format
                        processedCoordinates = {
                            type: 'bbox',
                            points: coords.points
                        };
                    } else if (Array.isArray(coords) && coords.length === 2) {
                        // Alternative new format where coords itself is the array
                        processedCoordinates = {
                            type: 'bbox',
                            points: coords
                        };
                    } else {
                        // Old format: convert from {x, y, width, height} to [{x1, y1}, {x2, y2}]
                        processedCoordinates = {
                            type: 'bbox',
                            points: [
                                { x: coords.x, y: coords.y },
                                { x: coords.x + coords.width, y: coords.y + coords.height }
                            ]
                        };
                    }
                } else {
                    // Polygon format stays the same
                    processedCoordinates = {
                        type: 'polygon',
                        points: coords.points
                    };
                }

                const transformedAnnotation = {
                    id: newAnnotation.id,
                    labelId: newAnnotation.labelId,
                    labelName: newAnnotation.labelName,
                    labelColor: newAnnotation.labelColor,
                    coordinates: processedCoordinates,
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

    // Handle right-click on annotation to show context menu
    const handleAnnotationContextMenu = (e, annotationId) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            show: true,
            x: e.clientX,
            y: e.clientY,
            annotationId: annotationId
        });
    };

    // Delete annotation via API
    const handleDeleteAnnotation = async (annotationId) => {
        console.log('Attempting to delete annotation with ID:', annotationId);

        // Check if task is already submitted
        if (selectedBatch?.status === 'Submitted') {
            showToast('Cannot delete - task has been submitted', 'warning');
            return;
        }

        // Check if item is already completed
        if (selectedItem?.status === 'Completed') {
            showToast('Cannot delete - item has been completed', 'warning');
            return;
        }

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

    // Update annotation (coordinates will be auto-saved via debounced effect)
    const handleUpdateAnnotation = async (annotationId, updatedData) => {
        console.log('Updating annotation state:', annotationId, updatedData);

        // Check if task is already submitted
        if (selectedBatch?.status === 'Submitted') {
            showToast('Cannot edit - task has been submitted', 'warning');
            return;
        }

        // Check if item is already completed
        if (selectedItem?.status === 'Completed') {
            showToast('Cannot edit - item has been completed', 'warning');
            return;
        }

        if (!annotationId) {
            console.error('No annotation ID provided');
            return;
        }

        // Update state locally - auto-save will handle API call
        setAnnotations(prev => prev.map(ann =>
            ann.id === annotationId
                ? { ...ann, coordinates: updatedData.coordinates }
                : ann
        ));

        console.log('Annotation updated in state, will be auto-saved');
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
            // Mark task item as completed
            await api.post(`/task-items/${selectedItem.id}/complete`);

            // Update local state
            const updatedItems = batchItems.map(item =>
                item.id === selectedItem.id
                    ? { ...item, status: 'Completed' }
                    : item
            );
            setBatchItems(updatedItems);

            // Update batch progress
            const completedCount = updatedItems.filter(i => i.status === 'Completed').length;
            setSelectedBatch(prev => ({
                ...prev,
                completedItems: completedCount,
                progressPercent: (completedCount / prev.totalItems) * 100
            }));

            showToast('Item completed successfully', 'success');

            // Move to next item
            handleNextItem();
        } catch (e) {
            console.error('Failed to complete item:', e);
            showToast('Failed to complete item: ' + (e?.response?.data?.message || e?.message), 'error');
        }
    };

    // Reject current item (mark for re-annotation) and move to next
    const handleRejectItem = async () => {
        if (!selectedItem) return;

        if (!window.confirm('Are you sure you want to skip this item? It will remain in your task for later.')) {
            return;
        }

        try {
            // Just move to next item without changing status
            // The item remains in the task for later annotation
            showToast('Item skipped', 'info');
            handleNextItem();
        } catch (e) {
            console.error('Failed to skip item:', e);
            showToast('Failed to skip item: ' + (e?.response?.data?.message || e?.message), 'error');
        }
    };

    // Delete a single item
    const handleDeleteItem = async (itemId) => {
        if (!window.confirm('Are you sure you want to remove this item from your task?')) {
            return;
        }

        try {
            await api.delete(`/Tasks/${selectedBatch.id}/items`, {
                data: [itemId]
            });

            // Remove item from local state
            const updatedItems = batchItems.filter(item => item.id !== itemId);
            setBatchItems(updatedItems);

            // Update batch counts
            const completedCount = updatedItems.filter(i => i.status === 'Completed').length;
            setSelectedBatch(prev => ({
                ...prev,
                totalItems: prev.totalItems - 1,
                completedItems: completedCount,
                progressPercent: prev.totalItems > 1
                    ? (completedCount / (prev.totalItems - 1)) * 100
                    : 0
            }));

            // If currently viewing this item, go back
            if (selectedItem?.id === itemId) {
                setSelectedItem(null);
            }

            showToast('Item removed from task', 'success');
        } catch (e) {
            console.error('Failed to delete item:', e);
            showToast('Failed to delete item: ' + (e?.response?.data?.message || e?.message), 'error');
        }
    };

    // Submit task for review
    const handleSubmitTask = async (taskId) => {
        const task = taskBatches.find(t => t.id === taskId);

        if (!task) return;

        // Check if all items are completed
        const allCompleted = batchItems.every(item => item.status === 'Completed');
        if (!allCompleted) {
            showToast('Please complete all items before submitting', 'warning');
            return;
        }

        if (!window.confirm('Are you sure you want to submit this task for review? You will not be able to edit it after submission.')) {
            return;
        }

        try {
            await api.post(`/tasks/${taskId}/submit`);

            // Update task status in local state
            setTaskBatches(prev => prev.map(t =>
                t.id === taskId
                    ? { ...t, status: 'Submitted', submittedAt: new Date().toISOString() }
                    : t
            ));

            // If currently viewing this task, update it
            if (selectedBatch?.id === taskId) {
                setSelectedBatch(prev => ({
                    ...prev,
                    status: 'Submitted',
                    submittedAt: new Date().toISOString()
                }));
            }

            showToast('Task submitted for review successfully', 'success');
        } catch (e) {
            console.error('Failed to submit task:', e);
            showToast('Failed to submit task: ' + (e?.response?.data?.message || e?.message), 'error');
        }
    };

    // Delete entire task (only if all items are deleted)
    const handleDeleteTask = async (taskId) => {
        const task = taskBatches.find(t => t.id === taskId);

        if (task && task.totalItems > 0) {
            showToast('Cannot delete task. Please remove all items first.', 'warning');
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

            showToast('Task deleted successfully', 'success');
        } catch (e) {
            console.error('Failed to delete task:', e);
            showToast('Failed to delete task: ' + (e?.response?.data?.message || e?.message), 'error');
        }
    };

    const handleBackToBatchList = () => {
        setSelectedBatch(null);
        setSelectedItem(null);
        setBatchItems([]);
    };

    const handleBackToItemList = () => {
        setSelectedItem(null);
        // Reset zoom and pan
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
    };

    // Zoom functions
    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 0.25, 3)); // Max 3x zoom
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 0.25, 0.5)); // Min 0.5x zoom
    };

    const handleResetZoom = () => {
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
    };

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

    // Mouse wheel zoom
    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)));
        }
    };

    const handleAiAssist = () => {
        if (!selectedItem) return;
        setIsAiLoading(true);
        // TODO: Call AI API endpoint when available
        setTimeout(() => {
            const newAnnotation = {
                id: `ai-${Date.now()}`,
                labelId: activeLabelId || 'default',
                coordinates: {
                    type: 'bbox',
                    points: [
                        { x: 400, y: 300 },
                        { x: 550, y: 450 }
                    ]
                },
                confidence: 0.94,
                createdBy: 'AI'
            };
            setAnnotations(prev => [...prev, newAnnotation]);
            setIsAiLoading(false);
        }, 1200);
    };

    // --- Coordinates Helper ---
    const getRelativeCoordinates = (clientX, clientY) => {
        if (!imageRef.current) return { x: 0, y: 0 };
        const rect = imageRef.current.getBoundingClientRect();
        return {
            x: (clientX - rect.left) / zoomLevel,
            y: (clientY - rect.top) / zoomLevel
        };
    };

    // Helper to get image bounds in image coordinate system
    const getImageConstraints = () => {
        if (!imageRef.current) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

        return {
            minX: 0,
            minY: 0,
            maxX: imageRef.current.naturalWidth,
            maxY: imageRef.current.naturalHeight
        };
    };

    // --- Global Mouse Handlers (Window level) ---
    useEffect(() => {
        const handleWindowMouseMove = (e) => {
            const bounds = getImageConstraints();

            // 1. Handle annotation dragging with visual feedback
            if (dragRef.current && dragRef.current.type && imageRef.current) {
                // Show warning toast only once per drag session
                if (!dragToastShownRef.current) {
                    showToast('Annotations cannot be moved. Please delete and recreate.', 'warning');
                    dragToastShownRef.current = true;
                }

                const rect = imageRef.current.getBoundingClientRect();
                const mouseX = (e.clientX - rect.left) / zoomLevel;
                const mouseY = (e.clientY - rect.top) / zoomLevel;

                const dragInfo = dragRef.current; // Capture current drag info

                setAnnotations(prev => prev.map(ann => {
                    if (ann.id !== dragInfo.id) return ann;

                    // Handle BBOX movement
                    if (dragInfo.type === 'bbox' && ann.coordinates.type === 'bbox' && ann.coordinates.points) {
                        const { offsetX, offsetY } = dragInfo;
                        const [p1, p2] = ann.coordinates.points;
                        const width = Math.abs(p2.x - p1.x);
                        const height = Math.abs(p2.y - p1.y);

                        let newX = mouseX - offsetX;
                        let newY = mouseY - offsetY;

                        // Clamp to Image Boundaries
                        newX = Math.max(bounds.minX, Math.min(newX, bounds.maxX - width));
                        newY = Math.max(bounds.minY, Math.min(newY, bounds.maxY - height));

                        // Update both points maintaining the same width and height
                        const dx = newX - Math.min(p1.x, p2.x);
                        const dy = newY - Math.min(p1.y, p2.y);

                        return {
                            ...ann,
                            coordinates: {
                                ...ann.coordinates,
                                points: [
                                    { x: p1.x + dx, y: p1.y + dy },
                                    { x: p2.x + dx, y: p2.y + dy }
                                ]
                            }
                        };
                    }

                    // Handle POLYGON movement
                    if (dragInfo.type === 'polygon' && ann.coordinates.type === 'polygon') {
                        const { originalPoints, initialMouseX, initialMouseY } = dragInfo;
                        const deltaX = mouseX - initialMouseX;
                        const deltaY = mouseY - initialMouseY;

                        // Move all points by the same delta
                        const newPoints = originalPoints.map(p => ({
                            x: Math.round(p.x + deltaX),
                            y: Math.round(p.y + deltaY)
                        }));

                        return {
                            ...ann,
                            coordinates: { ...ann.coordinates, points: newPoints }
                        };
                    }

                    return ann;
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
            // End Moving - Snap annotation back to original position
            if (dragRef.current && isDraggingBox && dragRef.current.originalCoordinates) {
                console.log('Mouse up, snapping annotation back to original position:', dragRef.current);
                const draggedAnnotationId = dragRef.current.id;
                const originalCoordinatesStr = dragRef.current.originalCoordinates;

                // Reset annotation to original coordinates
                setAnnotations(prev => prev.map(ann => {
                    if (ann.id === draggedAnnotationId) {
                        try {
                            const originalCoords = JSON.parse(originalCoordinatesStr);
                            console.log('Snapping back annotation', ann.id, 'to:', originalCoords);
                            return { ...ann, coordinates: originalCoords };
                        } catch (e) {
                            console.error('Error parsing original coordinates:', e);
                            return ann;
                        }
                    }
                    return ann;
                }));

                dragRef.current = null;
                dragToastShownRef.current = false;
                setIsDraggingBox(false);
            }

            // End Drawing
            if (isDrawing && drawingStartRef.current && currentDragInfo) {
                const { w, h, x, y } = currentDragInfo;

                // Min size check (5x5 pixels)
                if (w > 5 && h > 5) {
                    // Create bbox coordinates in new format: [{x1, y1}, {x2, y2}]
                    const coordinates = [
                        { x: Math.round(x), y: Math.round(y) },
                        { x: Math.round(x + w), y: Math.round(y + h) }
                    ];

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
        // Ignore right-click
        if (e.button === 2) {
            return;
        }

        // Don't start dragging if clicking on delete button
        if (e.target.classList.contains('annotation-delete-btn')) {
            return;
        }

        // Prevent event propagation to avoid triggering drawing
        e.preventDefault();
        e.stopPropagation();

        // Reset toast flag for new drag session
        dragToastShownRef.current = false;

        // Allow dragging for visual feedback but will snap back on release
        console.log('Dragging annotation - will snap back to original position:', ann.id);

        const coords = getRelativeCoordinates(e.clientX, e.clientY);

        // Handle different annotation types
        if (ann.coordinates.type === 'bbox' && ann.coordinates.points) {
            // New format: coordinates.points = [{x: x1, y: y1}, {x: x2, y: y2}]
            const [p1, p2] = ann.coordinates.points;
            const x1 = Math.min(p1.x, p2.x);
            const y1 = Math.min(p1.y, p2.y);
            dragRef.current = {
                id: ann.id,
                type: 'bbox',
                offsetX: coords.x - x1,
                offsetY: coords.y - y1,
                originalCoordinates: JSON.stringify(ann.coordinates)
            };
            setIsDraggingBox(true);
        } else if (ann.coordinates.type === 'polygon' && ann.coordinates.points && ann.coordinates.points.length > 0) {
            dragRef.current = {
                id: ann.id,
                type: 'polygon',
                originalPoints: ann.coordinates.points,
                initialMouseX: coords.x,
                initialMouseY: coords.y,
                originalCoordinates: JSON.stringify(ann.coordinates)
            };
            setIsDraggingBox(true);
        }
    };

    const handleContainerMouseDown = (e) => {
        // Handle Pan mode
        if (selectedTool === 'PAN' || e.button === 1 || (e.button === 0 && e.shiftKey)) {
            handlePanStart(e);
            return;
        }

        // Prevent drawing if task is submitted or item is completed
        if ((selectedBatch?.status === 'Submitted' || selectedItem?.status === 'Completed') && (selectedTool === 'BOX' || selectedTool === 'POLYGON')) {
            return;
        }

        // Handle Polygon mode
        if (selectedTool === 'POLYGON') {
            e.preventDefault();

            // Prevent adding point if double-click just happened (within 300ms)
            const now = Date.now();
            if (now - lastClickTimeRef.current < 300) {
                return;
            }
            lastClickTimeRef.current = now;

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
        if (selectedTool === 'POLYGON' && polygonPoints.length >= 3 && selectedBatch?.status !== 'Submitted' && selectedItem?.status !== 'Completed') {
            e.preventDefault();
            e.stopPropagation();

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
            lastClickTimeRef.current = Date.now(); // Reset timer to prevent accidental point addition
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

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (contextMenu.show) {
                setContextMenu({ show: false, x: 0, y: 0, annotationId: null });
            }
        };

        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [contextMenu.show]);


    // --- VIEW: Batch Items List (when batch is selected but no item) ---
    if (selectedBatch && !selectedItem) {
        return (
            <div className="animate-fade-in container-lg mx-auto">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center gap-3">
                        <button onClick={handleBackToBatchList} className="btn btn-link text-muted text-decoration-none d-flex align-items-center gap-1 p-0" title="Back to task batches">
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

                    <div className="d-flex align-items-center gap-2">
                        {/* Submit task button */}
                        {selectedBatch.status !== 'Submitted' && selectedBatch.status !== 'Completed' && (
                            <button
                                onClick={() => handleSubmitTask(selectedBatch.id)}
                                className="btn btn-primary d-flex align-items-center gap-2"
                                style={{ fontSize: '0.875rem' }}
                                disabled={selectedBatch.completedItems !== selectedBatch.totalItems}
                                title={selectedBatch.completedItems !== selectedBatch.totalItems ? 'Complete all items first' : 'Submit task for review'}
                            >
                                <Check size={16} />
                                Submit for Review
                            </button>
                        )}
                    </div>
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
                        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
                            {batchItems.map((item) => (
                                <div key={item.id} className="col">
                                    <div className="position-relative">
                                        {/* Checkbox overlay */}
                                        <div
                                            onClick={() => handleSelectItem(item)}
                                            className="task-card bg-white rounded-3 border border-slate-200 d-flex flex-column h-100"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="position-relative bg-slate-100" style={{ height: '8rem' }}>
                                                <img
                                                    src={item.thumbnailPath ? import.meta.env.VITE_URL_UPLOADS + "/" + item.thumbnailPath : item.filePath ? import.meta.env.VITE_URL_UPLOADS + "/" + item.filePath : 'https://via.placeholder.com/300x200?text=No+Image'}
                                                    alt={item.fileName || `Item ${item.id}`}
                                                    className="w-100 h-100 task-card-image"
                                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=Image+Error'; }}
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

    // Helper function to render batch card
    const renderBatchCard = (batch) => (
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
                                Assigned by {batch.assignedByName || batch.annotatorName || 'Manager'}
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
    );

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
                    <div>
                        {console.log('All task statuses:', taskBatches.map(b => b.status))}
                        {/* Assigned Section */}
                        {taskBatches.filter(b => {
                            const status = b.status?.toLowerCase();
                            return status === 'assigned' || status === 'new' || status === 'pending';
                        }).length > 0 && (
                                <div className="mb-5">
                                    <h3 className="fs-5 fw-bold text-slate-900 mb-3 d-flex align-items-center gap-2">
                                        <span className="badge bg-warning text-dark">Assigned</span>
                                        <span className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>
                                            {taskBatches.filter(b => {
                                                const status = b.status?.toLowerCase();
                                                return status === 'assigned' || status === 'new' || status === 'pending';
                                            }).length} task{taskBatches.filter(b => {
                                                const status = b.status?.toLowerCase();
                                                return status === 'assigned' || status === 'new' || status === 'pending';
                                            }).length !== 1 ? 's' : ''}
                                        </span>
                                    </h3>
                                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                                        {taskBatches.filter(b => {
                                            const status = b.status?.toLowerCase();
                                            return status === 'assigned' || status === 'new' || status === 'pending';
                                        }).map((batch) => renderBatchCard(batch))}
                                    </div>
                                </div>
                            )}

                        {/* In Progress Section */}
                        {taskBatches.filter(b => {
                            const status = b.status?.toLowerCase();
                            return status === 'inprogress' || status === 'in progress' || status === 'in_progress';
                        }).length > 0 && (
                                <div className="mb-5">
                                    <h3 className="fs-5 fw-bold text-slate-900 mb-3 d-flex align-items-center gap-2">
                                        <span className="badge bg-info text-white">In Progress</span>
                                        <span className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>
                                            {taskBatches.filter(b => {
                                                const status = b.status?.toLowerCase();
                                                return status === 'inprogress' || status === 'in progress' || status === 'in_progress';
                                            }).length} task{taskBatches.filter(b => {
                                                const status = b.status?.toLowerCase();
                                                return status === 'inprogress' || status === 'in progress' || status === 'in_progress';
                                            }).length !== 1 ? 's' : ''}
                                        </span>
                                    </h3>
                                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                                        {taskBatches.filter(b => {
                                            const status = b.status?.toLowerCase();
                                            return status === 'inprogress' || status === 'in progress' || status === 'in_progress';
                                        }).map((batch) => renderBatchCard(batch))}
                                    </div>
                                </div>
                            )}

                        {/* Completed Section */}
                        {taskBatches.filter(b => {
                            const status = b.status?.toLowerCase();
                            return status === 'completed' || status === 'done' || status === 'finished' || status === 'submitted';
                        }).length > 0 && (
                                <div className="mb-5">
                                    <h3 className="fs-5 fw-bold text-slate-900 mb-3 d-flex align-items-center gap-2">
                                        <span className="badge bg-success">Completed</span>
                                        <span className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>
                                            {taskBatches.filter(b => {
                                                const status = b.status?.toLowerCase();
                                                return status === 'completed' || status === 'done' || status === 'finished' || status === 'submitted';
                                            }).length} task{taskBatches.filter(b => {
                                                const status = b.status?.toLowerCase();
                                                return status === 'completed' || status === 'done' || status === 'finished' || status === 'submitted';
                                            }).length !== 1 ? 's' : ''}
                                        </span>
                                    </h3>
                                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                                        {taskBatches.filter(b => {
                                            const status = b.status?.toLowerCase();
                                            return status === 'completed' || status === 'done' || status === 'finished' || status === 'submitted';
                                        }).map((batch) => renderBatchCard(batch))}
                                    </div>
                                </div>
                            )}
                    </div>
                )}
            </div>
        );
    }

    // --- VIEW: Workspace (Single Item) ---
    const projectClasses = projectLabels;

    return (
        <div className="d-flex flex-column animate-fade-in-zoom bg-white rounded-4 shadow-sm border border-slate-200 overflow-hidden h-100" style={{}}>

            {/* Workspace Toolbar Header */}
            <div className="border-bottom border-slate-200 bg-white flex-shrink-0" style={{ zIndex: 10 }}>
                {/* Status Indicator - shown when task is submitted */}
                {selectedBatch?.status === 'Submitted' && (
                    <div className="alert alert-warning mb-0 py-2 px-3 d-flex align-items-center gap-2 border-bottom border-warning border-opacity-25" role="alert" style={{ fontSize: '0.75rem' }}>
                        <span className="badge bg-warning">Read-Only</span>
                        <span>Task Submitted - Annotations cannot be edited</span>
                    </div>
                )}

                {/* Main Toolbar */}
                <div className="d-flex align-items-center justify-content-between px-3" style={{ height: '3.5rem' }}>
                    <div className="d-flex align-items-center gap-3">
                        <button onClick={handleBackToItemList} className="btn btn-link text-muted text-decoration-none d-flex align-items-center gap-1 p-0 hover-text-slate-800" title="Back to item list" style={{ fontSize: '0.875rem', transition: 'color 0.15s' }}>
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
                        {/* Progress Indicator */}
                        {selectedBatch && (
                            <ProgressIndicator
                                completed={selectedBatch.completedItems || 0}
                                total={selectedBatch.totalItems || 0}
                                startTime={selectedBatch.startedAt}
                                compact={true}
                            />
                        )}

                        <div className="bg-slate-200" style={{ height: '1.25rem', width: '1px' }}></div>

                        {/* Keyboard Shortcuts Button */}
                        <button
                            onClick={() => setShowShortcutsHelp(true)}
                            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                            title="Keyboard Shortcuts (?)"
                            style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                        >
                            <Keyboard size={14} />
                        </button>

                        <div className="bg-slate-200" style={{ height: '1.25rem', width: '1px' }}></div>

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
                                { id: 'POLYGON', icon: Hexagon, label: 'Polygon' },
                                { id: 'PAN', icon: Move, label: 'Pan' }
                            ].map((tool) => (
                                <button
                                    key={tool.id}
                                    onClick={() => setSelectedTool(tool.id)}
                                    disabled={selectedBatch?.status === 'Submitted'}
                                    className={`btn-tool ${selectedTool === tool.id ? 'active' : ''}`}
                                    title={{
                                        'SELECT': 'Select/Move Annotations',
                                        'BOX': 'Draw Bounding Box',
                                        'POLYGON': 'Draw Polygon',
                                        'PAN': 'Pan Canvas (or Shift+Drag)'
                                    }[tool.id] + (selectedBatch?.status === 'Submitted' ? ' (Submitted - Read Only)' : '')}
                                    style={{ opacity: selectedBatch?.status === 'Submitted' ? 0.5 : 1, cursor: selectedBatch?.status === 'Submitted' ? 'not-allowed' : 'pointer' }}
                                >
                                    <tool.icon size={18} />
                                </button>
                            ))}
                            <div className="toolbar-divider-vertical"></div>
                            <button
                                className="btn-tool"
                                onClick={handleZoomIn}
                                title="Zoom In (Ctrl + Scroll)"
                            >
                                <ZoomIn size={18} />
                            </button>
                            <span className="text-muted" style={{ fontSize: '0.75rem', minWidth: '3rem', textAlign: 'center' }}>
                                {Math.round(zoomLevel * 100)}%
                            </span>
                            <button
                                className="btn-tool"
                                onClick={handleZoomOut}
                                title="Zoom Out (Ctrl + Scroll)"
                            >
                                <ZoomOut size={18} />
                            </button>
                            <button
                                className="btn-tool"
                                onClick={handleResetZoom}
                                title="Reset Zoom (1:1)"
                                style={{ fontSize: '0.75rem', padding: '0.375rem 0.5rem' }}
                            >
                                1:1
                            </button>
                        </div>
                    </div>

                    {/* Submitted Read-Only Banner */}
                    {selectedBatch?.status === 'Submitted' && (
                        <div className="alert alert-warning mb-0 d-flex align-items-center gap-2 rounded-0" style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', backgroundColor: '#fef08a', borderColor: '#fcd34d', color: '#92400e' }}>
                            <span className="fw-semibold">⏸️ Task Submitted - Read Only Mode</span>
                        </div>
                    )}

                    {/* Canvas Area */}
                    <div
                        ref={containerRef}
                        className="canvas-area"
                        style={{
                            cursor: isPanning ? 'grabbing' : selectedTool === 'PAN' ? 'grab' : selectedTool === 'BOX' ? 'crosshair' : selectedTool === 'POLYGON' ? 'crosshair' : 'default',
                            flex: 1,
                            overflow: 'hidden'
                        }}
                        onMouseDown={handleContainerMouseDown}
                        onClick={(e) => {
                            // Clear selection if clicking on empty space (not on an annotation)
                            if (e.target === containerRef.current || e.target.tagName === 'IMG') {
                                setSelectedAnnotationId(null);
                            }
                        }}
                        onMouseMove={handlePanMove}
                        onMouseUp={handlePanEnd}
                        onMouseLeave={handlePanEnd}
                        onDoubleClick={handleContainerDoubleClick}
                        onWheel={handleWheel}
                    >
                        <div
                            style={{
                                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                                transformOrigin: 'center center',
                                transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                                position: 'relative',
                                display: 'inline-block'
                            }}
                        >
                            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '800px', maxHeight: '600px' }}>
                                <img
                                    ref={imageRef}
                                    src={selectedItem?.filePath ? import.meta.env.VITE_URL_UPLOADS + "/" + selectedItem.filePath : selectedItem?.thumbnailPath ? import.meta.env.VITE_URL_UPLOADS + "/" + selectedItem.thumbnailPath : 'https://via.placeholder.com/800x600?text=No+Image'}
                                    alt={selectedItem?.fileName || 'Work'}
                                    draggable={false}
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/800x600?text=Image+Error'; }}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain'
                                    }}
                                />

                                {/* Annotations Layer */}
                                {showGuidelines && annotations.map((ann) => {
                                    console.log('Rendering annotation:', ann.id, ann);
                                    const isBeingDragged = dragRef.current?.id === ann.id;
                                    const isSelected = selectedAnnotationId === ann.id;
                                    const boxColor = ann.labelColor || '#6366f1';

                                    // Render bbox type
                                    if (ann.coordinates.type === 'bbox' && ann.coordinates.points && ann.coordinates.points.length === 2) {
                                        // New format: coordinates.points = [{x: x1, y: y1}, {x: x2, y: y2}]
                                        const [p1, p2] = ann.coordinates.points;
                                        const x1 = Math.min(p1.x, p2.x);
                                        const y1 = Math.min(p1.y, p2.y);
                                        const x2 = Math.max(p1.x, p2.x);
                                        const y2 = Math.max(p1.y, p2.y);
                                        const width = x2 - x1;
                                        const height = y2 - y1;

                                        return (
                                            <div
                                                key={ann.id}
                                                className={`annotation-box group-box ${isBeingDragged ? 'dragging' : ''}`}
                                                onMouseDown={(e) => handleAnnotationMouseDown(e, ann)}
                                                onContextMenu={(e) => handleAnnotationContextMenu(e, ann.id)}
                                                onClick={() => setSelectedAnnotationId(ann.id)}
                                                style={{
                                                    borderColor: boxColor,
                                                    borderWidth: isSelected ? '2px' : '2px',
                                                    left: x1,
                                                    top: y1,
                                                    width: width,
                                                    height: height,
                                                    backgroundColor: `${boxColor}15`,
                                                    cursor: 'grab',
                                                    animation: isSelected ? 'glowingBorder 2s ease-in-out infinite' : 'none',
                                                    transition: 'all 0.2s'
                                                }}
                                                title="Click to select • Drag to simulate move • Right-click to delete"
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

                                        // Find the highest point (minimum Y coordinate)
                                        const highestPoint = points.reduce((min, p) => p.y < min.y ? p : min, points[0]);
                                        const labelX = highestPoint.x;
                                        const labelY = highestPoint.y;
                                        const labelWidth = ann.labelName ? (ann.labelName.length * 6 + 8) : 50;
                                        const labelHeight = 16;

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
                                                onContextMenu={(e) => handleAnnotationContextMenu(e, ann.id)}
                                            >
                                                <polygon
                                                    points={pointsString}
                                                    fill={`${boxColor}15`}
                                                    stroke={boxColor}
                                                    strokeWidth={isSelected ? '4' : '2'}
                                                    className={isBeingDragged ? 'dragging' : ''}
                                                    style={{
                                                        pointerEvents: 'auto',
                                                        cursor: 'move',
                                                        animation: isSelected ? 'glowingBorderPolygon 2s ease-in-out infinite' : 'none',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        handleAnnotationMouseDown(e, ann);
                                                    }}
                                                    onClick={() => setSelectedAnnotationId(ann.id)}
                                                    onContextMenu={(e) => handleAnnotationContextMenu(e, ann.id)}
                                                />

                                                {/* Label background - bottom-left snapped to highest point */}
                                                <g transform={`translate(${labelX}, ${labelY})`} style={{ pointerEvents: 'auto' }}>
                                                    <rect
                                                        x={0}
                                                        y={-labelHeight}
                                                        width={labelWidth}
                                                        height={labelHeight}
                                                        fill={boxColor}
                                                        rx="3"
                                                        style={{ cursor: 'move' }}
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                            handleAnnotationMouseDown(e, ann);
                                                        }}
                                                        onClick={() => setSelectedAnnotationId(ann.id)}
                                                        onContextMenu={(e) => handleAnnotationContextMenu(e, ann.id)}
                                                    />

                                                    {/* Label text */}
                                                    <text
                                                        x={4}
                                                        y={-5}
                                                        fill="white"
                                                        fontSize="10"
                                                        fontWeight="bold"
                                                        style={{ pointerEvents: 'auto', cursor: 'move' }}
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                            handleAnnotationMouseDown(e, ann);
                                                        }}
                                                        onClick={() => setSelectedAnnotationId(ann.id)}
                                                        onContextMenu={(e) => handleAnnotationContextMenu(e, ann.id)}
                                                    >
                                                        {ann.labelName || 'Object'}
                                                        {ann.confidence && (
                                                            <tspan opacity="0.8" fontWeight="normal">
                                                                {' '}{(ann.confidence * 100).toFixed(0)}%
                                                            </tspan>
                                                        )}
                                                    </text>
                                                </g>


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
                                                        style={{ pointerEvents: 'auto', cursor: 'move' }}
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                            handleAnnotationMouseDown(e, ann);
                                                        }}
                                                        onClick={() => setSelectedAnnotationId(ann.id)}
                                                        onContextMenu={(e) => handleAnnotationContextMenu(e, ann.id)}
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
                        </div>
                    </div>

                    {/* Action Bar (Below Canvas) */}
                    <div className="p-4 bg-white border-top border-slate-200">
                        <div className="d-flex align-items-center gap-3" style={{ height: '3rem' }}>
                            <button
                                onClick={handlePreviousItem}
                                disabled={selectedBatch?.status === 'Submitted'}
                                className="btn btn-outline-secondary h-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                                style={{ fontSize: '0.875rem', opacity: selectedBatch?.status === 'Submitted' ? 0.5 : 1, cursor: selectedBatch?.status === 'Submitted' ? 'not-allowed' : 'pointer' }}
                                title={selectedBatch?.status === 'Submitted' ? 'Task submitted - read only' : 'Go to previous item'}
                            >
                                <ChevronLeft size={18} />
                                Previous
                            </button>

                            <button
                                onClick={selectedItem?.status === 'Completed' ? handleNextItem : handleAcceptAndNext}
                                disabled={selectedBatch?.status === 'Submitted'}
                                className={`btn flex-fill h-100 d-flex align-items-center justify-content-center gap-2 fw-bold shadow-sm ${selectedItem?.status === 'Completed' ? 'btn-secondary' : 'btn-success'}`}
                                style={{ fontSize: '0.875rem', opacity: selectedBatch?.status === 'Submitted' ? 0.5 : 1, cursor: selectedBatch?.status === 'Submitted' ? 'not-allowed' : 'pointer' }}
                                title={selectedBatch?.status === 'Submitted' ? 'Task submitted - read only' : selectedItem?.status === 'Completed' ? 'Move to next item' : ''}
                            >
                                <Check size={18} />
                                {selectedItem?.status === 'Completed' ? 'Next' : 'Accept & Next'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="d-flex flex-column gap-3 p-3 bg-white border-start border-slate-200" style={{ width: '320px', overflowY: 'auto', minHeight: 0, flex: '0 0 320px' }}>
                    {/* Annotation Sidebar */}
                    <AnnotationSidebar
                        showGuidelines={showGuidelines}
                        setShowGuidelines={setShowGuidelines}
                        projectClasses={projectLabels}
                        activeLabelId={activeLabelId}
                        setActiveLabelId={setActiveLabelId}
                        annotations={annotations}
                        selectedAnnotationId={selectedAnnotationId}
                        setSelectedAnnotationId={setSelectedAnnotationId}
                        handleDeleteAnnotation={handleDeleteAnnotation}
                    />
                </div>
            </div>

            {/* Keyboard Shortcuts Help Modal */}
            <KeyboardShortcutsHelp
                show={showShortcutsHelp}
                onClose={() => setShowShortcutsHelp(false)}
            />

            {/* Confirm Delete Modal */}
            <ConfirmDeleteModal
                show={confirmDialog.show}
                onConfirm={confirmDeleteAnnotation}
                onCancel={() => setConfirmDialog({ show: false, annotationId: null })}
            />

            {/* Context Menu for Annotations */}
            {contextMenu.show && (
                <div
                    style={{
                        position: 'fixed',
                        left: contextMenu.x,
                        top: contextMenu.y,
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.375rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        zIndex: 9999,
                        minWidth: '120px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => {
                            handleDeleteAnnotation(contextMenu.annotationId);
                            setContextMenu({ show: false, x: 0, y: 0, annotationId: null });
                        }}
                        style={{
                            width: '100%',
                            padding: '0.5rem 1rem',
                            textAlign: 'left',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            color: '#dc2626'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#fee2e2';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                        }}
                    >
                        🗑️ Delete
                    </button>
                </div>
            )}

            {/* Toast Notification */}
            <ToastNotification
                toast={toast}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </div>
    );
};
