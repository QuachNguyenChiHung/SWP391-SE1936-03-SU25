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
    Clock
} from 'lucide-react';
import { MOCK_TASKS, MOCK_PROJECTS, MOCK_USERS } from '../../services/mockData';
import { Annotation, Task, User, Project } from '../../types';

interface AnnotatorWorkspaceProps {
    user: User;
}

export const AnnotatorWorkspace: React.FC<AnnotatorWorkspaceProps> = ({ user }) => {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Workspace State
    const [selectedTool, setSelectedTool] = useState<'SELECT' | 'BOX' | 'POLYGON'>('SELECT');
    const [activeLabelId, setActiveLabelId] = useState<string>('');
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [showGuidelines, setShowGuidelines] = useState(true);

    // Refs for drag state
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    // Drawing State
    const [isDrawing, setIsDrawing] = useState(false);
    const drawingStartRef = useRef<{ x: number, y: number } | null>(null);
    const [currentDragInfo, setCurrentDragInfo] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

    // Moving State
    const [isDraggingBox, setIsDraggingBox] = useState(false);
    const dragRef = useRef<{
        id: string;
        offsetX: number;
        offsetY: number;
    } | null>(null);

    // Initialize workspace when task is selected
    const handleSelectTask = (task: Task) => {
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
            const newAnnotation: Annotation = {
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
    const getRelativeCoordinates = (clientX: number, clientY: number) => {
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
        const handleWindowMouseMove = (e: MouseEvent) => {
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
                    const newAnn: Annotation = {
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

    const handleAnnotationMouseDown = (e: React.MouseEvent, ann: Annotation) => {
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

    const handleContainerMouseDown = (e: React.MouseEvent) => {
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
        const groupedTasks: Record<string, Task[]> = {};
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
            <div className="animate-in fade-in duration-300 max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">My Assigned Tasks</h2>
                        <p className="text-sm text-slate-500">Overview of pending batches from managers</p>
                    </div>
                </div>

                {projectGroups.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Layers size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No Tasks Assigned</h3>
                        <p className="text-slate-500 max-w-md mx-auto mt-2">You currently don't have any task items assigned. Check back later or contact your manager.</p>
                    </div>
                ) : (
                    projectGroups.map(({ project, manager, tasks }) => (
                        <div key={project!.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            {/* Project/Manager Header */}
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm text-indigo-600 hidden sm:block">
                                        <Layers size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg">{project!.name}</h3>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">
                                                {project!.type.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Calendar size={12} /> Due {tasks[0]?.dueDate || 'Flexible'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Manager Info */}
                                {manager && (
                                    <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Assigned By</p>
                                            <p className="text-xs font-semibold text-slate-800">{manager.name}</p>
                                        </div>
                                        <img src={manager.avatarUrl} alt={manager.name} className="w-8 h-8 rounded-full bg-slate-100" />
                                    </div>
                                )}
                            </div>

                            {/* Task Items Grid */}
                            <div className="p-6 bg-slate-50/30">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                                    Task Items ({tasks.length})
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            onClick={() => handleSelectTask(task)}
                                            className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col h-full"
                                        >
                                            {/* Task Item Image */}
                                            <div className="h-32 bg-slate-100 relative overflow-hidden">
                                                <img
                                                    src={task.imageUrl}
                                                    alt={task.itemName}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute top-2 right-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-sm shadow-sm
                                                ${project?.priority === 'HIGH' ? 'text-red-600 border border-red-100' :
                                                            project?.priority === 'MEDIUM' ? 'text-orange-600 border border-orange-100' :
                                                                'text-slate-600 border border-slate-100'}
                                            `}>
                                                        {project?.priority}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-3 flex-1 flex flex-col">
                                                <div className="mb-2">
                                                    <p className="text-xs font-medium text-slate-900 truncate" title={task.itemName}>
                                                        {task.itemName}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">ID: {task.id}</p>
                                                </div>

                                                <div className="mt-auto pt-2 border-t border-slate-100 flex justify-between items-center">
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                                        <Tag size={10} />
                                                        {task.annotations.length}
                                                    </div>
                                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded
                                                ${task.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                                                            task.status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700' :
                                                                'bg-slate-100 text-slate-600'}
                                            `}>
                                                        {task.status.replace(/_/g, ' ')}
                                                    </span>
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
        <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in zoom-in-95 duration-300 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

            {/* Workspace Toolbar Header */}
            <div className="h-14 border-b border-slate-200 flex items-center justify-between px-4 bg-white z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={handleBackToList} className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 text-sm font-medium">
                        <ChevronLeft size={16} />
                        Back to Batch
                    </button>
                    <div className="h-5 w-px bg-slate-200"></div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{selectedTask.itemName}</h3>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 border border-slate-200">ID: {selectedTask.id}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleAiAssist}
                        disabled={isAiLoading}
                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                        <Bot size={14} className={isAiLoading ? 'animate-pulse' : ''} />
                        {isAiLoading ? 'Analyzing...' : 'AI Assist'}
                    </button>

                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 border border-slate-200 text-xs font-medium transition-colors">
                        <Save size={14} />
                        Save Draft
                    </button>

                    <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 text-xs font-bold transition-colors">
                        <Check size={14} />
                        Submit
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative select-none">
                {/* Left Tools */}
                <div className="absolute left-4 top-4 z-20 flex flex-col gap-2 bg-white/90 backdrop-blur shadow-lg border border-slate-200 rounded-lg p-1.5">
                    {[
                        { id: 'SELECT', icon: MousePointer2 },
                        { id: 'BOX', icon: Square },
                        { id: 'POLYGON', icon: Hexagon }
                    ].map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => setSelectedTool(tool.id as any)}
                            className={`p-2 rounded-md transition-all ${selectedTool === tool.id
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-500 hover:bg-slate-100'
                                }`}
                            title={tool.id === 'SELECT' ? 'Move Tool' : `${tool.id} Tool`}
                        >
                            <tool.icon size={18} />
                        </button>
                    ))}
                    <div className="h-px bg-slate-200 my-0.5"></div>
                    <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
                        <ZoomIn size={18} />
                    </button>
                    <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
                        <ZoomOut size={18} />
                    </button>
                </div>

                {/* Canvas Area */}
                <div
                    ref={containerRef}
                    className={`flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center 
                  ${selectedTool === 'BOX' ? 'cursor-crosshair' : 'cursor-default'}
                `}
                    onMouseDown={handleContainerMouseDown}
                >
                    <img
                        ref={imageRef}
                        src={selectedTask.imageUrl}
                        alt="Work"
                        className="max-w-full max-h-full object-contain pointer-events-none shadow-2xl"
                        draggable={false}
                    />

                    {/* Annotations Layer */}
                    {annotations.map((ann) => {
                        const labelClass = project?.classes.find(c => c.id === ann.labelId);
                        const isBeingDragged = dragRef.current?.id === ann.id;

                        return (
                            <div
                                key={ann.id}
                                className={`absolute border-2 group/box cursor-move 
                                ${isBeingDragged ? 'opacity-80 z-50 ring-2 ring-indigo-400 ring-offset-1' : 'z-30 hover:shadow-lg'}
                            `}
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
                                    className="absolute -top-6 left-[-2px] px-1.5 py-0.5 text-[10px] font-bold text-white rounded-t shadow-sm flex items-center gap-1 whitespace-nowrap"
                                    style={{ backgroundColor: labelClass?.color }}
                                >
                                    {labelClass?.name}
                                    {ann.confidence && (
                                        <span className="opacity-80 font-normal ml-1">{(ann.confidence * 100).toFixed(0)}%</span>
                                    )}
                                </div>
                                {/* Delete Button on Hover */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setAnnotations(annotations.filter(a => a.id !== ann.id));
                                    }}
                                    className="absolute -top-6 right-[-2px] bg-red-500 text-white w-4 h-[18px] flex items-center justify-center rounded-tr text-[10px] opacity-0 group-hover/box:opacity-100 hover:bg-red-600 transition-opacity"
                                >
                                    &times;
                                </button>
                            </div>
                        );
                    })}

                    {/* Drawing Layer (Temporary Box) */}
                    {isDrawing && currentDragInfo && (
                        <div
                            className="absolute border-2 border-dashed z-50 pointer-events-none bg-blue-500/10 border-blue-500"
                            style={{
                                left: currentDragInfo.x,
                                top: currentDragInfo.y,
                                width: currentDragInfo.w,
                                height: currentDragInfo.h,
                            }}
                        >
                            <div className="absolute -top-5 left-0 text-[10px] bg-blue-500 text-white px-1 rounded">
                                New {project?.classes.find(c => c.id === activeLabelId)?.name || 'Object'}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className={`w-72 bg-white border-l border-slate-200 flex flex-col z-10 transition-transform absolute right-0 top-0 bottom-0 md:relative ${showGuidelines ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                    {/* Mobile Toggle Handle */}
                    <button
                        onClick={() => setShowGuidelines(!showGuidelines)}
                        className="md:hidden absolute -left-8 top-1/2 -translate-y-1/2 bg-white border border-slate-200 border-r-0 p-2 rounded-l-lg shadow-md text-slate-500"
                    >
                        {showGuidelines ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                        {/* Class Selector */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Label Classes</h4>
                            <div className="space-y-1">
                                {project?.classes.map((cls, idx) => (
                                    <button
                                        key={cls.id}
                                        onClick={() => setActiveLabelId(cls.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm border transition-all ${activeLabelId === cls.id
                                            ? 'bg-slate-50 border-indigo-200 ring-1 ring-indigo-500/20'
                                            : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cls.color }}></span>
                                            <span className={activeLabelId === cls.id ? 'text-slate-900 font-medium' : 'text-slate-600'}>{cls.name}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 rounded border border-slate-200">{idx + 1}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Annotation List */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Objects ({annotations.length})</h4>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                                {annotations.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">No objects labeled yet.</p>
                                ) : (
                                    annotations.map((ann, i) => {
                                        const label = project?.classes.find(c => c.id === ann.labelId);
                                        return (
                                            <div key={ann.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded hover:bg-slate-50 group">
                                                <span className="text-slate-600">#{i + 1} {label?.name}</span>
                                                {ann.createdBy === 'AI' && <Bot size={12} className="text-purple-400" />}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        {/* Guidelines */}
                        <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4">
                            <div className="flex items-center gap-2 text-blue-800 font-semibold text-xs mb-2">
                                <AlertCircle size={14} />
                                <span>Labeling Guidelines</span>
                            </div>
                            <ul className="text-[11px] text-blue-900/70 space-y-2 list-disc list-inside leading-relaxed">
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