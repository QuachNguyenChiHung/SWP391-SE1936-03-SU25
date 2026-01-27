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
    Calendar
} from 'lucide-react';
import { MOCK_TASKS, MOCK_PROJECTS, MOCK_USERS } from '../../services/mockData';
import './AnnotatorWorkspace.css';

export const AnnotatorWorkspace = ({ user }) => {
    const [selectedTask, setSelectedTask] = useState(null);

    // Workspace State
    const [selectedTool, setSelectedTool] = useState('SELECT');
    const [activeLabelId, setActiveLabelId] = useState('');
    const [annotations, setAnnotations] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [showGuidelines, setShowGuidelines] = useState(true);

    // Refs for drag state
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    // Drawing State
    const [isDrawing, setIsDrawing] = useState(false);
    const drawingStartRef = useRef(null);
    const [currentDragInfo, setCurrentDragInfo] = useState(null);

    // Moving State
    const [isDraggingBox, setIsDraggingBox] = useState(false);
    const dragRef = useRef(null);

    // Initialize workspace when task is selected
    const handleSelectTask = (task) => {
        setSelectedTask(task);
        setAnnotations(task.annotations || []);
        const project = MOCK_PROJECTS.find(p => p.id === task.projectId);
        if (project && project.classes.length > 0) {
            setActiveLabelId(project.classes[0].id);
        }
        // Reset states
        setIsDrawing(false);
        setIsDraggingBox(false);
        dragRef.current = null;
    };

    const handleBackToList = () => {
        setSelectedTask(null);
    };

    const handleAiAssist = () => {
        if (!selectedTask) return;
        const project = MOCK_PROJECTS.find(p => p.id === selectedTask.projectId);
        setIsAiLoading(true);
        setTimeout(() => {
            const newAnnotation = {
                id: `ai-${Date.now()}`,
                labelId: project?.classes[2]?.id || 'c1',
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
            // End Moving
            if (dragRef.current) {
                dragRef.current = null;
                setIsDraggingBox(false);
            }

            // End Drawing
            if (isDrawing && drawingStartRef.current && currentDragInfo) {
                const { w, h, x, y } = currentDragInfo;

                // Min size check (5x5 pixels)
                if (w > 5 && h > 5) {
                    const project = MOCK_PROJECTS.find(p => p.id === selectedTask?.projectId);
                    const newAnn = {
                        id: `new-${Date.now()}`,
                        labelId: activeLabelId || (project?.classes[0].id ?? 'unknown'),
                        coordinates: { x, y, width: w, height: h },
                        createdBy: 'HUMAN'
                    };
                    setAnnotations(prev => [...prev, newAnn]);
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
    }, [isDraggingBox, isDrawing, currentDragInfo, activeLabelId, selectedTask]);


    // --- Event Starters ---

    const handleAnnotationMouseDown = (e, ann) => {
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
        // Only allow drawing in BOX mode
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


    // --- VIEW: Task List Grouped by Project ---
    if (!selectedTask) {
        // 1. Filter tasks for current user
        const userTasks = MOCK_TASKS.filter(t => t.assignedTo === user.id);

        // 2. Group tasks by Project ID
        const groupedTasks = {};
        userTasks.forEach(task => {
            if (!groupedTasks[task.projectId]) {
                groupedTasks[task.projectId] = [];
            }
            groupedTasks[task.projectId].push(task);
        });

        // 3. Get Project details for those groups
        const projectGroups = Object.entries(groupedTasks).map(([projectId, tasks]) => {
            const project = MOCK_PROJECTS.find(p => p.id === projectId);
            const manager = project ? MOCK_USERS.find(u => u.id === project.managerId) : undefined;
            return { project, manager, tasks };
        }).filter(g => g.project !== undefined);

        return (
            <div className="animate-fade-in container-lg mx-auto">
                <div className="d-flex justify-content-between align-items-end mb-5">
                    <div>
                        <h2 className="fs-4 fw-bold text-slate-900">My Assigned Tasks</h2>
                        <p className="text-muted" style={{ fontSize: '0.875rem' }}>Overview of pending batches from managers</p>
                    </div>
                </div>

                {projectGroups.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <Layers size={32} />
                        </div>
                        <h3 className="fs-5 fw-medium text-slate-900">No Tasks Assigned</h3>
                        <p className="text-muted mx-auto mt-2" style={{ maxWidth: '28rem' }}>You currently don't have any task items assigned. Check back later or contact your manager.</p>
                    </div>
                ) : (
                    projectGroups.map(({ project, manager, tasks }) => (
                        <div key={project.id} className="bg-white rounded-4 border border-slate-200 shadow-sm overflow-hidden mb-5">
                            {/* Project/Manager Header */}
                            <div className="p-3 border-bottom border-slate-100 bg-slate-50-50 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                                <div className="d-flex align-items-start gap-3">
                                    <div className="p-3 bg-white border border-slate-200 rounded-3 shadow-sm text-indigo-600 d-none d-sm-block">
                                        <Layers size={24} />
                                    </div>
                                    <div>
                                        <h3 className="fw-bold text-slate-900 fs-5 mb-0">{project.name}</h3>
                                        <div className="d-flex align-items-center gap-3 mt-1">
                                            <span className="type-badge">
                                                {project.type.replace(/_/g, ' ')}
                                            </span>
                                            <span className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.75rem' }}>
                                                <Calendar size={12} /> Due {tasks[0]?.dueDate || 'Flexible'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Manager Info */}
                                {manager && (
                                    <div className="d-flex align-items-center gap-3 bg-white px-3 py-2 rounded-3 border border-slate-200 shadow-sm">
                                        <div className="text-end d-none d-sm-block">
                                            <p className="mb-0 text-uppercase fw-bold text-slate-400" style={{ fontSize: '10px' }}>Assigned By</p>
                                            <p className="mb-0 fw-semibold text-slate-800" style={{ fontSize: '0.75rem' }}>{manager.name}</p>
                                        </div>
                                        <img src={manager.avatarUrl} alt={manager.name} className="rounded-circle bg-slate-100" style={{ width: '2rem', height: '2rem' }} />
                                    </div>
                                )}
                            </div>

                            {/* Task Items Grid */}
                            <div className="p-4 bg-slate-50-30">
                                <h4 className="text-uppercase fw-bold text-muted mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                    Task Items ({tasks.length})
                                </h4>
                                <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
                                    {tasks.map((task) => (
                                        <div key={task.id} className="col">
                                            <div
                                                onClick={() => handleSelectTask(task)}
                                                className="task-card bg-white rounded-3 border border-slate-200 overflow-hidden d-flex flex-column h-100 group"
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {/* Task Item Image - CRITICAL: 128px height */}
                                                <div className="position-relative overflow-hidden bg-slate-100" style={{ height: '8rem' }}>
                                                    <img
                                                        src={task.imageUrl}
                                                        alt={task.itemName}
                                                        className="w-100 h-100 object-fit-cover task-card-image"
                                                    />
                                                    <div className="position-absolute" style={{ top: '0.5rem', right: '0.5rem' }}>
                                                        <span className={`priority-badge ${project?.priority === 'HIGH' ? 'high' :
                                                                project?.priority === 'MEDIUM' ? 'medium' : 'low'
                                                            }`}>
                                                            {project?.priority}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="p-3 flex-grow-1 d-flex flex-column">
                                                    <div className="mb-2">
                                                        <p className="mb-0 fw-medium text-slate-900 text-truncate" style={{ fontSize: '0.75rem' }} title={task.itemName}>
                                                            {task.itemName}
                                                        </p>
                                                        <p className="mb-0 text-slate-400" style={{ fontSize: '10px' }}>ID: {task.id}</p>
                                                    </div>

                                                    <div className="mt-auto pt-2 border-top border-slate-100 d-flex justify-content-between align-items-center">
                                                        <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '10px' }}>
                                                            <Tag size={10} />
                                                            {task.annotations.length}
                                                        </div>
                                                        <span className={`status-badge ${task.status === 'COMPLETED' ? 'completed' :
                                                                task.status === 'IN_PROGRESS' ? 'in-progress' : 'pending'
                                                            }`}>
                                                            {task.status.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    }

    // --- VIEW: Workspace (Single Item) ---
    const project = MOCK_PROJECTS.find(p => p.id === selectedTask.projectId);

    return (
        <div className="d-flex flex-column animate-fade-in-zoom bg-white rounded-4 shadow-sm border border-slate-200 overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>

            {/* Workspace Toolbar Header */}
            <div className="border-bottom border-slate-200 d-flex align-items-center justify-content-between px-3 bg-white flex-shrink-0" style={{ height: '3.5rem', zIndex: 10 }}>
                <div className="d-flex align-items-center gap-3">
                    <button onClick={handleBackToList} className="btn btn-link text-muted text-decoration-none d-flex align-items-center gap-1 p-0 hover-text-slate-800" style={{ fontSize: '0.875rem', transition: 'color 0.15s' }}>
                        <ChevronLeft size={16} />
                        Back to Batch
                    </button>
                    <div className="bg-slate-200" style={{ height: '1.25rem', width: '1px' }}></div>
                    <div className="d-flex align-items-center gap-2">
                        <h3 className="mb-0 fw-semibold text-slate-900" style={{ fontSize: '0.875rem' }}>{selectedTask.itemName}</h3>
                        <span className="id-badge">ID: {selectedTask.id}</span>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <button
                        onClick={handleAiAssist}
                        disabled={isAiLoading}
                        className="btn btn-ai-assist d-none d-sm-flex align-items-center gap-2 rounded-3"
                        style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                    >
                        <Bot size={14} className={isAiLoading ? 'animate-pulse' : ''} />
                        {isAiLoading ? 'Analyzing...' : 'AI Assist'}
                    </button>

                    <button className="btn btn-save-draft d-flex align-items-center gap-2 rounded-3" style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}>
                        <Save size={14} />
                        Save Draft
                    </button>

                    <button className="btn btn-submit d-flex align-items-center gap-2 rounded-3 fw-bold" style={{ fontSize: '0.75rem', padding: '0.375rem 1rem' }}>
                        <Check size={14} />
                        Submit
                    </button>
                </div>
            </div>

            <div className="d-flex flex-grow-1 overflow-hidden position-relative user-select-none">
                {/* Left Tools */}
                <div className="toolbar">
                    {[
                        { id: 'SELECT', icon: MousePointer2 },
                        { id: 'BOX', icon: Square },
                        { id: 'POLYGON', icon: Hexagon }
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
                    <div className="toolbar-divider"></div>
                    <button className="btn-tool">
                        <ZoomIn size={18} />
                    </button>
                    <button className="btn-tool">
                        <ZoomOut size={18} />
                    </button>
                </div>

                {/* Canvas Area */}
                <div
                    ref={containerRef}
                    className="canvas-area"
                    style={{ cursor: selectedTool === 'BOX' ? 'crosshair' : 'default' }}
                    onMouseDown={handleContainerMouseDown}
                >
                    <img
                        ref={imageRef}
                        src={selectedTask.imageUrl}
                        alt="Work"
                        className="canvas-image pe-none"
                        draggable={false}
                    />

                    {/* Annotations Layer */}
                    {annotations.map((ann) => {
                        const labelClass = project?.classes.find(c => c.id === ann.labelId);
                        const isBeingDragged = dragRef.current?.id === ann.id;

                        return (
                            <div
                                key={ann.id}
                                className={`annotation-box group-box ${isBeingDragged ? 'dragging' : ''}`}
                                onMouseDown={(e) => handleAnnotationMouseDown(e, ann)}
                                style={{
                                    borderColor: labelClass?.color || '#000',
                                    left: ann.coordinates.x,
                                    top: ann.coordinates.y,
                                    width: ann.coordinates.width,
                                    height: ann.coordinates.height,
                                    backgroundColor: `${labelClass?.color}15`
                                }}
                            >
                                <div
                                    className="annotation-label"
                                    style={{ backgroundColor: labelClass?.color }}
                                >
                                    {labelClass?.name}
                                    {ann.confidence && (
                                        <span style={{ opacity: 0.8, fontWeight: 'normal', marginLeft: '0.25rem' }}>{(ann.confidence * 100).toFixed(0)}%</span>
                                    )}
                                </div>
                                {/* Delete Button on Hover */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setAnnotations(annotations.filter(a => a.id !== ann.id));
                                    }}
                                    className="annotation-delete-btn group-box-hover"
                                >
                                    &times;
                                </button>
                            </div>
                        );
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
                                New {project?.classes.find(c => c.id === activeLabelId)?.name || 'Object'}
                            </div>
                        </div>
                    )}
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
                            <div>
                                {project?.classes.map((cls, idx) => (
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
                        </div>

                        {/* Annotation List */}
                        <div className="mb-4">
                            <h4 className="text-uppercase fw-bold text-muted mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Objects ({annotations.length})</h4>
                            <div className="overflow-auto" style={{ maxHeight: '12rem' }}>
                                {annotations.length === 0 ? (
                                    <p className="text-muted fst-italic" style={{ fontSize: '0.75rem' }}>No objects labeled yet.</p>
                                ) : (
                                    annotations.map((ann, i) => {
                                        const label = project?.classes.find(c => c.id === ann.labelId);
                                        return (
                                            <div key={ann.id} className="d-flex align-items-center justify-content-between px-2 py-1 rounded hover-bg-light mb-1" style={{ fontSize: '0.75rem' }}>
                                                <span className="text-slate-600">#{i + 1} {label?.name}</span>
                                                {ann.createdBy === 'AI' && <Bot size={12} className="text-purple-400" />}
                                            </div>
                                        )
                                    })
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
        </div>
    );
};
