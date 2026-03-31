import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';
import Spinner from 'react-bootstrap/Spinner';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useAlert } from '../../shared/context/AlertContext.jsx';

import api from '../../shared/utils/api.js';
import { formatDateTime, formatDate } from '../../shared/utils/dateUtils.js';

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];

const getPriorityBadgeClass = (priority) => {
    const normalized = String(priority || 'Medium').toLowerCase();
    if (normalized === 'high') return 'bg-danger-subtle text-danger border border-danger-subtle';
    if (normalized === 'low') return 'bg-success-subtle text-success border border-success-subtle';
    return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
};

const getPriorityChipClass = (priority) => {
    const normalized = String(priority || 'Medium').toLowerCase();
    if (normalized === 'high') return 'bg-danger-subtle text-danger border border-danger-subtle';
    if (normalized === 'low') return 'bg-success-subtle text-success border border-success-subtle';
    return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
};

const getDeadlineBadgeClass = (deadline) => {
    if (!deadline) return 'text-muted';
    const date = new Date(deadline);
    if (Number.isNaN(date.getTime())) return 'text-muted';
    const now = new Date();
    const diffDays = Math.ceil((date.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / 86400000);
    if (diffDays < 0) return 'text-danger fw-semibold';
    if (diffDays <= 3) return 'text-warning fw-semibold';
    if (diffDays <= 7) return 'text-info fw-semibold';
    return 'text-success';
};

const getDeadlineChipClass = (deadline) => {
    if (!deadline) return 'bg-light text-muted border border-slate-200';
    const date = new Date(deadline);
    if (Number.isNaN(date.getTime())) return 'bg-light text-muted border border-slate-200';
    const now = new Date();
    const diffDays = Math.ceil((date.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / 86400000);
    if (diffDays < 0) return 'bg-danger-subtle text-danger border border-danger-subtle';
    if (diffDays <= 3) return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
    if (diffDays <= 7) return 'bg-info-subtle text-info border border-info-subtle';
    return 'bg-success-subtle text-success border border-success-subtle';
};

const validateDeadline = (value, projectDeadline) => {
    if (!value) return 'Deadline is required';
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return 'Invalid date';
    }
    
    // Check if deadline is in the past
    const now = new Date();
    
    if (parsedDate < now) {
        return 'Task deadline cannot be in the past';
    }
    
    // Check if task deadline exceeds project deadline
    if (projectDeadline) {
        let projectDeadlineStr = '';
        if (typeof projectDeadline === 'object' && projectDeadline !== null) {
            projectDeadlineStr = projectDeadline.Deadline || projectDeadline.deadline || '';
        } else {
            projectDeadlineStr = String(projectDeadline);
        }
        
        if (projectDeadlineStr) {
            const projectDate = new Date(projectDeadlineStr);
            if (!Number.isNaN(projectDate.getTime()) && parsedDate > projectDate) {
                return `Task deadline cannot exceed project deadline (${formatDateTime(projectDeadlineStr)})`;
            }
        }
    }
    
    return '';
};

const toIsoString = (value) => {
    // Value is already in datetime-local format (YYYY-MM-DDTHH:mm)
    // Just convert to ISO string
    return new Date(value).toISOString();
};

export default function TasksPanel({ project, expandedTaskGroups, toggleGroup, StatusBadge, externalAssignTarget }) {
    const { showAlert } = useAlert();
    const [annotators, setAnnotators] = useState([]);
    const [reviewers, setReviewers] = useState([]);
    const [showReviewersModal, setShowReviewersModal] = useState(false);
    const [loadingReviewers, setLoadingReviewers] = useState(false);
    const [reviewerTargetTaskId, setReviewerTargetTaskId] = useState(null);
    const [reviewerTargetTask, setReviewerTargetTask] = useState(null); // Store full task for context
    const [assigningReviewer, setAssigningReviewer] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedAssignee, setSelectedAssignee] = useState(null);
    const [selectedReviewerForTask, setSelectedReviewerForTask] = useState(null); // Reviewer to assign with task
    const [reviewerSearchTerm, setReviewerSearchTerm] = useState(''); // Search term for reviewers
    const [reviewerPage, setReviewerPage] = useState(1); // Current page for reviewer list
    const REVIEWERS_PER_PAGE = 6;
    const [selectedDataItemIds, setSelectedDataItemIds] = useState([]);
    const [taskDeadline, setTaskDeadline] = useState('');
    const [taskDeadlineError, setTaskDeadlineError] = useState('');
    const [taskPriority, setTaskPriority] = useState('Medium');
    const [assigning, setAssigning] = useState(false);
    const DEFAULT_PAGE_SIZE = 12;
    const [dataItems, setDataItems] = useState({ items: [], totalCount: 0, pageNumber: 1, pageSize: DEFAULT_PAGE_SIZE, totalPages: 1 });
    const [loadingItems, setLoadingItems] = useState(false);
    const [tasksPage, setTasksPage] = useState({ items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 1, hasPreviousPage: false, hasNextPage: false });
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
    const [taskDetail, setTaskDetail] = useState(null);
    const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState({ url: '', fileName: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearchTerm, setActiveSearchTerm] = useState(''); // The actual search term being applied
    const [isSearching, setIsSearching] = useState(false);
    const [statusFilter, setStatusFilter] = useState(''); // Status filter for tasks
    const [expandedTaskPages, setExpandedTaskPages] = useState({}); // Track current page for each annotator's tasks
    const TASKS_PER_ANNOTATOR_PAGE = 4;
    
    const taskStatusOptions = [
        { value: '', label: 'All Status' },
        { value: '1', label: 'Assigned' },
        { value: '2', label: 'In Progress' },
        { value: '3', label: 'Submitted' },
        { value: '4', label: 'Completed' },
        { value: '5', label: 'Overdue' }
    ];
    /**
     *   {
        "id": 41,
        "name": "Brooklyn Barnes",
        "email": "user74@example.com",
        "activeTaskCount": 0
      },
      {
        "id": 42,
        "name": "Carson Ross",
        "email": "user75@example.com",
        "activeTaskCount": 0
      },
      //body of annotators
     */
    useEffect(() => {
        fetchTasks(1, 10);
        fetchAnnotators();
        fetchReviewers();
    }, []);

    // Re-enrich tasks when reviewers are loaded
    useEffect(() => {
        if (reviewers.length > 0 && tasksPage.items.length > 0) {
            const reviewerMap = {};
            reviewers.forEach(r => {
                reviewerMap[r.id] = r;
            });
            
            const enrichedItems = tasksPage.items.map(task => {
                if (task.reviewerId && reviewerMap[task.reviewerId]) {
                    return {
                        ...task,
                        reviewerSpecializedIn: reviewerMap[task.reviewerId].specializedIn
                    };
                }
                return task;
            });
            
            // Only update if enrichment actually added data
            const hasNewData = enrichedItems.some((item, idx) => 
                item.reviewerSpecializedIn && !tasksPage.items[idx].reviewerSpecializedIn
            );
            
            if (hasNewData) {
                setTasksPage(prev => ({
                    ...prev,
                    items: enrichedItems
                }));
            }
        }
    }, [reviewers, tasksPage.items.length]);

    const fetchAnnotators = async () => {
        try {
            const res = await api.get('/Tasks/annotators');
            const annotatorsList = res.data?.data ?? res.data ?? [];
            setAnnotators(annotatorsList);
        } catch (e) {
            console.error('Failed to fetch annotators', e);
            setAnnotators([]);
        }
    }

    const fetchReviewers = async () => {
        setLoadingReviewers(true);
        try {
            const res = await api.get('/Tasks/reviewers');
            const list = res.data?.data ?? res.data ?? [];
            console.log('Fetched reviewers:', list);
            setReviewers(list);
        } catch (e) {
            console.error('Failed to fetch reviewers', e);
            setReviewers([]);
        } finally {
            setLoadingReviewers(false);
        }
    }

    const fetchTasks = async (pageNumber = 1, pageSize = 10, projectIdProp, search = '', status = '') => {
        const pId = getProjectIdFromPropsOrPath(projectIdProp);
        setLoadingTasks(true);
        try {
            const params = { projectId: pId, pageNumber, pageSize };
            if (search) {
                params.search = search;
            }
            if (status) {
                params.status = status;
            }
            const res = await api.get('/Tasks', { params });
            const body = res?.data || {};
            const items = body.items || [];
            
            // Enrich tasks with reviewer specialization
            const reviewerMap = {};
            reviewers.forEach(r => {
                reviewerMap[r.id] = r;
            });
            
            const enrichedItems = items.map(task => {
                if (task.reviewerId && reviewerMap[task.reviewerId]) {
                    return {
                        ...task,
                        reviewerSpecializedIn: reviewerMap[task.reviewerId].specializedIn
                    };
                }
                return task;
            });
            
            setTasksPage({
                items: enrichedItems,
                totalCount: body.totalCount || 0,
                pageNumber: body.pageNumber || pageNumber,
                pageSize: body.pageSize || pageSize,
                totalPages: body.totalPages || 1,
                hasPreviousPage: body.hasPreviousPage || false,
                hasNextPage: body.hasNextPage || false
            });
        } catch (e) {
            console.error('Failed to fetch tasks', e);
            setTasksPage({ items: [], totalCount: 0, pageNumber, pageSize, totalPages: 1, hasPreviousPage: false, hasNextPage: false });
        } finally {
            setLoadingTasks(false);
            setIsSearching(false);
        }
    }

    const handleSearch = () => {
        setIsSearching(true);
        setActiveSearchTerm(searchTerm); // Apply the search term
        setExpandedTaskPages({}); // Reset all task pages to 1
        fetchTasks(1, tasksPage.pageSize, undefined, searchTerm, statusFilter);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setActiveSearchTerm(''); // Clear the active search term
        setExpandedTaskPages({}); // Reset all task pages to 1
        fetchTasks(1, tasksPage.pageSize, undefined, '');
    };

    const getProjectIdFromPropsOrPath = (propId) => {
        if (propId) return propId;
        try {
            const m = window.location.pathname.match(/projects\/(\d+)/);
            if (m) return m[1];
        } catch (e) { }
        return 1; // fallback
    }

    const uploadsBase = import.meta.env.VITE_URL_UPLOADS || '';
    const isAbsolute = (u) => /^https?:\/\//i.test(u);
    const buildUploadsUrl = (p) => {
        if (!p) return '';
        if (isAbsolute(p)) return p;
        const base = uploadsBase.replace(/\/$/, '');
        const path = p.replace(/^\//, '');
        return base ? `${base}/${path}` : path;
    }

    const fetchDataItems = async (pageNumber = 1, pageSize = DEFAULT_PAGE_SIZE, projectIdProp) => {
        const pId = getProjectIdFromPropsOrPath(projectIdProp);
        setLoadingItems(true);
        try {
            // Only fetch pending items for assignment
            const res = await api.get(`/projects/${pId}/data-items`, { 
                params: { 
                    pageNumber, 
                    pageSize,
                    status: 'Pending' // Only show pending items in assignment modal
                } 
            });
            // Use full response so UI can show status, dimensions, assignedAnnotator, thumbnails
            if (res?.data) {
                setDataItems({
                    items: res.data.items || [],
                    totalCount: res.data.totalCount || 0,
                    pageNumber: res.data.pageNumber || pageNumber,
                    pageSize: res.data.pageSize || pageSize,
                    totalPages: res.data.totalPages || 1
                });
            }
        } catch (e) {
            console.error('Failed to fetch data items', e);
            setDataItems({ items: [], totalCount: 0, pageNumber, pageSize, totalPages: 1 });
        } finally {
            setLoadingItems(false);
        }
    }

    const openAssignModal = async (assignee) => {
        setSelectedAssignee(assignee);
        setSelectedReviewerForTask(null); // Reset reviewer selection
        setReviewerSearchTerm(''); // Reset reviewer search
        setReviewerPage(1); // Reset reviewer page
        setSelectedDataItemIds([]);
        setTaskDeadline('');
        setTaskDeadlineError('');
        setTaskPriority('Medium');
        setShowAssignModal(true);
        await fetchDataItems(1, DEFAULT_PAGE_SIZE);
    }

    const openAssignReviewerForTask = (task) => {
        setReviewerTargetTaskId(task.id);
        setReviewerTargetTask(task);
        setShowReviewersModal(true);
    }

    const assignReviewer = async (taskId, reviewerId) => {
        if (!taskId || !reviewerId) return;
        console.log('Assigning reviewer:', { taskId, reviewerId });
        setAssigningReviewer(true);
        try {
            await api.put(`/Tasks/${taskId}/reviewer`, { reviewerId }, { headers: { 'Content-Type': 'application/json' } });
            console.log('Reviewer assigned successfully, refreshing data...');
            setAssigningReviewer(false);
            setShowReviewersModal(false);
            setReviewerTargetTaskId(null);
            setReviewerTargetTask(null);
            await showAlert('Reviewer assigned successfully', 'Success', 'success');
            // Refresh both tasks and reviewers to update UI
            await Promise.all([
                fetchTasks(tasksPage.pageNumber, tasksPage.pageSize, undefined, searchTerm, statusFilter),
                fetchReviewers()
            ]);
            console.log('Data refreshed after reviewer assignment');
        } catch (err) {
            console.error('Failed to assign reviewer', err);
            setAssigningReviewer(false);
            await showAlert('Failed to assign reviewer', 'Error', 'error');
        }
    }

    const openTaskDetail = async (taskId) => {
        if (!taskId) return;
        setShowTaskDetailModal(true);
        setLoadingTaskDetail(true);
        try {
            const res = await api.get(`/Tasks/${taskId}`);
            const body = res.data?.data ?? res.data ?? res.data;
            setTaskDetail(body);
        } catch (err) {
            console.error('Failed to fetch task detail', err);
            setTaskDetail(null);
        } finally {
            setLoadingTaskDetail(false);
        }
    }

    // Inline expansion: cache details per task and toggle visibility
    const [expandedTasks, setExpandedTasks] = useState({});
    const [taskDetailsMap, setTaskDetailsMap] = useState({});

    const toggleTaskInline = async (taskId) => {
        if (!taskId) return;
        setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
        if (!taskDetailsMap[taskId]) {
            try {
                const res = await api.get(`/Tasks/${taskId}`);
                const body = res.data?.data ?? res.data ?? res;
                setTaskDetailsMap(prev => ({ ...prev, [taskId]: body }));
            } catch (err) {
                console.error('Failed to fetch task items', err);
            }
        }
    }

    // If parent requests opening assign modal for a specific annotator
    useEffect(() => {
        if (externalAssignTarget) {
            // open assign modal for the provided target
            openAssignModal(externalAssignTarget);
        }
    }, [externalAssignTarget]);

    const closeAssignModal = () => {
        setShowAssignModal(false);
        setSelectedAssignee(null);
        setTaskDeadline('');
        setTaskDeadlineError('');
        setTaskPriority('Medium');
    }
    // group tasksPage items by annotatorId for UI rendering
    const tasksByAnnotator = {};
    tasksPage.items.forEach(it => {
        const aId = it.annotatorId ?? 0;
        if (!tasksByAnnotator[aId]) tasksByAnnotator[aId] = [];
        tasksByAnnotator[aId].push(it);
    });

    // Since we're fetching only pending items from API, all items are pending
    const pendingDataItems = dataItems.items;
    const selectedPendingCount = selectedDataItemIds.length;
    const pendingTotalCount = pendingDataItems.length;
    const canAssignItems = !!selectedAssignee && selectedPendingCount > 0 && !assigning && !taskDeadlineError && !!taskDeadline && !!selectedReviewerForTask;

    // Combine annotators fetched from /Tasks/annotators with annotator info present in the tasks response
    const annotatorMap = {};
    // First, add all annotators from the API with their full data including specializedIn
    (annotators || []).forEach(a => { 
        annotatorMap[a.id] = { 
            id: a.id,
            name: a.name,
            email: a.email,
            specializedIn: a.specializedIn, // Direct mapping from API
            activeTaskCount: a.activeTaskCount, // From API
            activeTaskItemCount: a.activeTaskItemCount, // From API
            activeReviewCount: a.activeReviewCount,
            otherProjectAssignedTaskCount: a.otherProjectAssignedTaskCount
        }; 
    });
    // Then, add any annotators found in tasks that weren't in the annotators list
    (tasksPage.items || []).forEach(it => {
        const aId = it.annotatorId ?? 0;
        if (!annotatorMap[aId]) {
            annotatorMap[aId] = {
                id: aId,
                name: it.annotatorName || (aId === 0 ? 'Unassigned' : `Annotator ${aId}`),
                email: it.annotatorEmail || it.annotatorName || '',
                specializedIn: it.annotatorSpecializedIn || it.specializedIn,
                activeTaskCount: it.activeTaskCount,
                activeTaskItemCount: it.activeTaskItemCount || 0,
                activeReviewCount: it.annotatorActiveReviewCount,
                otherProjectAssignedTaskCount: it.otherProjectAssignedTaskCount
            };
        }
    });
    const combinedAnnotators = Object.values(annotatorMap).sort((x, y) => (x.name || '').localeCompare(y.name || ''));
    
    // Filter annotators by search term (only show matching annotators when searching)
    const filteredAnnotators = activeSearchTerm 
        ? combinedAnnotators.filter(a => 
            a.name.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
            (a.email && a.email.toLowerCase().includes(activeSearchTerm.toLowerCase()))
          )
        : combinedAnnotators;
    
    return (
        <div className="d-flex flex-column gap-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <h5 className="fw-bold mb-0">Task Assignments</h5>
                    <small className="text-muted">Track assignments • Showing {tasksPage.items.length} of {tasksPage.totalCount}</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    <select
                        className="form-select form-select-sm"
                        style={{ width: '150px' }}
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setExpandedTaskPages({}); // Reset all task pages to 1
                            fetchTasks(1, tasksPage.pageSize, undefined, searchTerm, e.target.value);
                        }}
                    >
                        {taskStatusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    
                    <div className="input-group" style={{ width: '350px' }}>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search by annotator, reviewer, or image name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                        />
                        <Button 
                            variant="primary" 
                            size="sm"
                            onClick={handleSearch}
                            disabled={isSearching}
                            title="Search"
                        >
                            {isSearching ? '⏳' : '🔍'}
                        </Button>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <Button variant="secondary" size="sm" disabled={!tasksPage.hasPreviousPage} onClick={() => fetchTasks(Math.max(1, tasksPage.pageNumber - 1), tasksPage.pageSize, undefined, searchTerm, statusFilter)}>Prev</Button>
                        <Button variant="secondary" size="sm" disabled={!tasksPage.hasNextPage} onClick={() => fetchTasks(Math.min(tasksPage.totalPages || 1, tasksPage.pageNumber + 1), tasksPage.pageSize, undefined, searchTerm, statusFilter)}>Next</Button>
                    </div>
                    <div className="text-muted small">Page {tasksPage.pageNumber} / {tasksPage.totalPages}</div>
                </div>
            </div>

            {filteredAnnotators.map((assignee) => {
                const getTime = (t) => {
                    const d = t?.assignedAt ?? t?.createdAt ?? null;
                    const ts = d ? Date.parse(d) : 0;
                    return isNaN(ts) ? 0 : ts;
                };
                // Sort so newest first (oldest will be at the end of the list)
                const allTasks = (tasksByAnnotator[assignee.id] || []).slice().sort((a, b) => getTime(b) - getTime(a));
                
                // Pagination for tasks
                const currentTaskPage = expandedTaskPages[assignee.id] || 1;
                const totalTaskPages = Math.ceil(allTasks.length / TASKS_PER_ANNOTATOR_PAGE);
                const startIdx = (currentTaskPage - 1) * TASKS_PER_ANNOTATOR_PAGE;
                const endIdx = startIdx + TASKS_PER_ANNOTATOR_PAGE;
                const tasks = allTasks.slice(startIdx, endIdx);
                
                const isExpanded = expandedTaskGroups[assignee.id] ?? true;
                const totalCount = allTasks.reduce((s, t) => s + (t.totalItems || 1), 0);
                const completedCount = allTasks.reduce((s, t) => s + (t.completedItems || 0), 0);
                const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : (allTasks[0]?.progressPercent ?? 0);
                const isUnassigned = allTasks.length === 0;
                
                // Check if annotator has reached maximum workload (100 active task items)
                const MAX_ACTIVE_TASK_ITEMS = 100;
                const activeItems = assignee?.activeTaskItemCount ?? 0;
                const isAtMaxCapacity = assignee && (activeItems >= MAX_ACTIVE_TASK_ITEMS);
                
                // Check if annotator has the highest workload (prevent assigning to busiest)
                // Use ALL annotators (not filtered) to ensure fair comparison
                const allActiveItems = combinedAnnotators.map(a => a.activeTaskItemCount ?? 0);
                const maxWorkload = allActiveItems.length > 0 ? Math.max(...allActiveItems) : 0;
                const minWorkload = allActiveItems.length > 0 ? Math.min(...allActiveItems) : 0;
                // Only disable if there are annotators with STRICTLY LOWER workload
                const hasStrictlyLowerWorkloadAnnotators = minWorkload < maxWorkload;
                const hasHighestWorkload = assignee && (activeItems >= maxWorkload) && maxWorkload > 0 && hasStrictlyLowerWorkloadAnnotators;
                
                console.log(`Annotator ${assignee?.name}:`, {
                    activeItems,
                    allActiveItems,
                    minWorkload,
                    maxWorkload,
                    hasStrictlyLowerWorkloadAnnotators,
                    check1: activeItems >= maxWorkload,
                    check2: maxWorkload > 0,
                    check3: hasStrictlyLowerWorkloadAnnotators,
                    hasHighestWorkload,
                    isAtMaxCapacity
                });
                
                // Disable if at max capacity OR has highest workload
                const isOverloaded = isAtMaxCapacity || hasHighestWorkload;
                
                // Find nearest deadline
                const nearestDeadline = tasks.length > 0 
                    ? tasks
                        .filter(t => t.deadline)
                        .map(t => ({ task: t, date: new Date(t.deadline) }))
                        .filter(({ date }) => !isNaN(date.getTime()))
                        .sort((a, b) => a.date - b.date)[0]
                    : null;

                return (
                    <div key={assignee.id} className={`card border-0 shadow-sm overflow-hidden ${isUnassigned ? 'border-start border-warning border-3' : ''}`}>
                        <div className="card-header bg-white py-3 d-flex align-items-center justify-content-between cursor-pointer border-bottom-0" onClick={() => toggleGroup(assignee.id)}>
                            <div className="d-flex align-items-center gap-3">
                                <Button variant="link" className="p-0 text-muted text-decoration-none" onClick={(e) => { e.stopPropagation(); toggleGroup(assignee.id); }}>
                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </Button>
                                <div className="d-flex align-items-center gap-3">
                                    {assignee ? (
                                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: 36, height: 36 }}>
                                            {assignee.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                        </div>
                                    ) : (
                                        <div className="rounded-circle bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center text-secondary small fw-bold" style={{ width: 36, height: 36 }}>?</div>
                                    )}
                                    <div>
                                        <div className="fw-bold mb-0 lh-1 text-dark">
                                            {assignee ? assignee.name : "Unassigned"}
                                            {isUnassigned && <span className="badge bg-warning text-dark ms-2">No Tasks</span>}
                                            {isAtMaxCapacity && <span className="badge bg-danger text-white ms-2">Max Capacity (100)</span>}
                                            {!isAtMaxCapacity && hasHighestWorkload && <span className="badge bg-danger text-white ms-2">Highest Workload</span>}
                                            {assignee && assignee.specializedIn && (
                                                <span 
                                                    className="badge bg-info text-white ms-2" 
                                                    title={`Specialized in: ${assignee.specializedIn}`}
                                                    style={{ 
                                                        maxWidth: '200px', 
                                                        overflow: 'hidden', 
                                                        textOverflow: 'ellipsis', 
                                                        whiteSpace: 'nowrap',
                                                        display: 'inline-block',
                                                        verticalAlign: 'middle'
                                                    }}
                                                >
                                                    🎯 {assignee.specializedIn}
                                                </span>
                                            )}
                                        </div>
                                        <small className="text-muted">
                                            {assignee?.email && `${assignee.email} • `}
                                            {tasks.length} tasks in this project
                                            {assignee && (typeof assignee.activeTaskItemCount !== 'undefined') && ` • ${assignee.activeTaskItemCount} active items`}
                                            {assignee && (typeof assignee.activeReviewCount !== 'undefined') && ` • ${assignee.activeReviewCount} reviews`}
                                            {assignee && (typeof assignee.otherProjectAssignedTaskCount !== 'undefined') && ` • ${assignee.otherProjectAssignedTaskCount} other projects`}
                                        </small>
                                        {nearestDeadline && (
                                            <div className="mt-1">
                                                <span className={`badge ${getDeadlineChipClass(nearestDeadline.task.deadline)} px-2 py-1`} style={{ fontSize: '0.7rem' }}>
                                                    Deadline: {formatDateTime(nearestDeadline.task.deadline)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-4">
                                <Button 
                                    variant="primary" 
                                    size="sm" 
                                    onClick={(e) => { e.stopPropagation(); openAssignModal(assignee); }}
                                    disabled={isOverloaded}
                                    title={
                                        isAtMaxCapacity 
                                            ? 'Annotator has reached maximum capacity (100 active items)' 
                                            : hasHighestWorkload 
                                                ? `Annotator has the highest workload (${activeItems} items). Please assign to others first.`
                                                : 'Assign tasks to this annotator'
                                    }
                                >
                                    Assign
                                </Button>
                                <div className="d-none d-md-block" style={{ width: '180px' }}>
                                    <div className="d-flex justify-content-between small text-muted mb-1">
                                        <span>Progress</span>
                                        <span className="fw-bold">{progress}%</span>
                                    </div>
                                    <ProgressBar now={progress} style={{ height: '6px' }} variant={progress === 100 ? 'success' : 'primary'} />
                                </div>
                            </div>
                        </div>
                        {isExpanded && <div className="card-body bg-light bg-opacity-50 p-3 border-top">
                            {isUnassigned ? (
                                <div className="text-center text-muted py-3">
                                    <p className="mb-2">This annotator has no assigned tasks yet.</p>
                                    <Button 
                                        variant="primary" 
                                        size="sm" 
                                        onClick={(e) => { e.stopPropagation(); openAssignModal(assignee); }}
                                        disabled={isOverloaded}
                                        title={
                                            isAtMaxCapacity 
                                                ? 'Annotator has reached maximum capacity (100 active items)' 
                                                : hasHighestWorkload 
                                                    ? `Annotator has the highest workload (${activeItems} items). Please assign to others first.`
                                                    : 'Assign tasks to this annotator'
                                        }
                                    >
                                        Assign Tasks Now
                                    </Button>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-2">
                                    {tasks.map((t, index) => {
                                        const isTaskExpanded = !!expandedTasks[t.id];
                                        const detail = taskDetailsMap[t.id];
                                        const hasReviewerAssigned = Boolean(t.reviewerId || t.reviewerName);
                                        return (
                                            <div key={t.id}>
                                                <div className="bg-white p-2 rounded shadow-sm d-flex justify-content-between align-items-center border-0">
                                                    <div className="d-flex gap-3 align-items-center">
                                                        <div style={{ width: 56, height: 42 }} className="rounded bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center text-secondary small">#{t.id}</div>
                                                        <div>
                                                            <div className="small fw-bold text-dark">{`Task ${t.id}`}</div>
                                                            <div className="d-flex gap-2 align-items-center text-muted" style={{ fontSize: '11px' }}>
                                                                <span>ID: {t.id}</span>
                                                                <span>•</span>
                                                                <span>{t.totalItems || 1} items</span>
                                                                <span>•</span>
                                                                <span>{t.progressPercent ?? Math.round(((t.completedItems || 0) / (t.totalItems || 1)) * 100)}%</span>
                                                            </div>
                                                            <div className="text-muted small">Assigned: {t.assignedAt ? formatDateTime(t.assignedAt) : (t.createdAt ? formatDateTime(t.createdAt) : '-')}</div>
                                                            
                                                            <div className="text-muted small d-flex align-items-center gap-2 flex-wrap">
                                                                <span>Reviewer: {t.reviewerName || '-'}</span>
                                                                {t.reviewerSpecializedIn && (
                                                                    <span 
                                                                        className="badge bg-info text-white" 
                                                                        style={{ 
                                                                            fontSize: '0.65rem',
                                                                            maxWidth: '150px',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap'
                                                                        }}
                                                                        title={`Reviewer specialized in: ${t.reviewerSpecializedIn}`}
                                                                    >
                                                                        🎯 {t.reviewerSpecializedIn}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="d-flex flex-wrap gap-2 mt-1">
                                                                <span className={`badge rounded-pill px-2 py-1 fw-semibold ${getDeadlineChipClass(t.deadline)}`} style={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                                                                    Deadline: {formatDateTime(t.deadline)}
                                                                </span>
                                                                <span className={`badge rounded-pill px-2 py-1 fw-semibold ${getPriorityChipClass(t.priority)}`} style={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                                                                    Priority: {t.priority || 'Medium'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex gap-3 align-items-center">
                                                        <StatusBadge status={t.status} />
                                                        <Button variant="link" className="text-muted p-0" onClick={(e) => { e.stopPropagation(); toggleTaskInline(t.id); }}>{isTaskExpanded ? 'Hide' : 'View'}</Button>
                                                        {!hasReviewerAssigned ? (
                                                            <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); openAssignReviewerForTask(t); }}>Assign Reviewer</Button>
                                                        ) : (
                                                            <Button size="sm" variant="warning" onClick={(e) => { e.stopPropagation(); openAssignReviewerForTask(t); }}>Reassign Reviewer</Button>
                                                        )}
                                                    </div>
                                                </div>

                                                {isTaskExpanded && (
                                                    <div className="p-2 bg-light rounded mt-2">
                                                        {detail ? (
                                                            <div className="row g-2">
                                                                {(detail.items || []).map(it => (
                                                                    <div key={it.id} className="col-12 col-md-6">
                                                                        <div className="d-flex gap-3 align-items-center border rounded p-2">
                                                                            <img src={buildUploadsUrl(it.thumbnailPath || it.filePath)} alt={it.fileName} style={{ width: 120, height: 90, objectFit: 'cover' }} />
                                                                            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                                                                <div className="fw-bold" title={it.fileName} style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', position: 'relative' }}>
                                                                                    <span
                                                                                        style={{ display: 'inline-block' }}
                                                                                        onMouseEnter={(e) => {
                                                                                            const parent = e.currentTarget.parentElement;
                                                                                            if (e.currentTarget.scrollWidth > parent.clientWidth) {
                                                                                                const distance = e.currentTarget.scrollWidth - parent.clientWidth + 20;
                                                                                                e.currentTarget.style.setProperty('--scroll-distance', `-${distance}px`);
                                                                                                e.currentTarget.style.animation = 'scroll-text 30s linear infinite';
                                                                                            }
                                                                                        }}
                                                                                        onMouseLeave={(e) => {
                                                                                            e.currentTarget.style.animation = 'none';
                                                                                        }}
                                                                                    >
                                                                                        {it.fileName}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="small text-muted">Status: {it.status}</div>
                                                                                <div className="small text-muted">DataItemId: {it.dataItemId}</div>
                                                                            </div>
                                                                            <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedImage({ url: buildUploadsUrl(it.filePath), fileName: it.fileName }); setShowImageModal(true); }}>View</Button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-muted small">Loading items...</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                    
                                    {/* Pagination for tasks */}
                                    {totalTaskPages > 1 && (
                                        <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded mt-2">
                                            <Button 
                                                variant="primary" 
                                                size="sm"
                                                disabled={currentTaskPage <= 1}
                                                onClick={() => setExpandedTaskPages(prev => ({ ...prev, [assignee.id]: Math.max(1, currentTaskPage - 1) }))}
                                            >
                                                Prev
                                            </Button>
                                            <span className="small text-muted">
                                                Page {currentTaskPage} / {totalTaskPages} • {allTasks.length} total tasks
                                            </span>
                                            <Button 
                                                variant="primary" 
                                                size="sm"
                                                disabled={currentTaskPage >= totalTaskPages}
                                                onClick={() => setExpandedTaskPages(prev => ({ ...prev, [assignee.id]: Math.min(totalTaskPages, currentTaskPage + 1) }))}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    )}
                                </div>)}                        </div>}
                    </div>
                )
            })}

            {/* Task detail modal */}
            <Modal show={showTaskDetailModal} onHide={() => { setShowTaskDetailModal(false); setTaskDetail(null); }} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Task Details {taskDetail ? `#${taskDetail.id}` : ''}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingTaskDetail ? (
                        <div className="d-flex justify-content-center py-4"><Spinner animation="border" /></div>
                    ) : taskDetail ? (
                        <div className="d-flex flex-column gap-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="fw-bold">{taskDetail.projectName}</div>
                                    <div className="small text-muted">Annotator: {taskDetail.annotatorName}</div>
                                    <div className="small text-muted">Assigned by: {taskDetail.assignedByName}</div>
                                    <div className="d-flex flex-wrap gap-2 mt-2">
                                        <span className={`badge rounded-pill px-2 py-1 fw-semibold ${getDeadlineChipClass(taskDetail.deadline)}`} style={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                                            Deadline: {formatDateTime(taskDetail.deadline)}
                                        </span>
                                        <span className={`badge rounded-pill px-2 py-1 fw-semibold ${getPriorityChipClass(taskDetail.priority)}`} style={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                                            Priority: {taskDetail.priority || 'Medium'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-end">
                                    <div className="small text-muted">Status</div>
                                    <div className="fw-bold">{taskDetail.status}</div>
                                </div>
                            </div>
                            <div>
                                <h6 className="mb-2">Items</h6>
                                <div className="row g-2">
                                    {(taskDetail.items || []).map(it => (
                                        <div key={it.id} className="col-12">
                                            <div className="d-flex align-items-center gap-3 border rounded p-2">
                                                <img src={buildUploadsUrl(it.thumbnailPath || it.filePath)} alt="thumb" style={{ width: 96, height: 72, objectFit: 'cover' }} />
                                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                                    <div className="fw-bold" title={it.fileName} style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', position: 'relative' }}>
                                                        <span
                                                            style={{ display: 'inline-block' }}
                                                            onMouseEnter={(e) => {
                                                                const parent = e.currentTarget.parentElement;
                                                                if (e.currentTarget.scrollWidth > parent.clientWidth) {
                                                                    const distance = e.currentTarget.scrollWidth - parent.clientWidth + 20;
                                                                    e.currentTarget.style.setProperty('--scroll-distance', `-${distance}px`);
                                                                    e.currentTarget.style.animation = 'scroll-text 30s linear infinite';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.animation = 'none';
                                                            }}
                                                        >
                                                            {it.fileName}
                                                        </span>
                                                    </div>
                                                    <div className="small text-muted">Status: {it.status}</div>
                                                    <div className="small text-muted">DataItemId: {it.dataItemId}</div>
                                                </div>
                                                <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedImage({ url: buildUploadsUrl(it.filePath), fileName: it.fileName }); setShowImageModal(true); }}>View</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-muted">No details</div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => { setShowTaskDetailModal(false); setTaskDetail(null); }}>Close</Button>
                </Modal.Footer>
            </Modal>
            {/* Assign modal */}
            <Modal show={showAssignModal} onHide={closeAssignModal} size="xl" centered scrollable dialogClassName="assign-items-modal-dialog">
                <Modal.Header closeButton className="border-0 pb-2">
                    <div className="d-flex flex-column gap-1 w-100 pe-4">
                        <Modal.Title className="mb-0">
                            Assign items {selectedAssignee ? `to ${selectedAssignee.name}` : ''}
                        </Modal.Title>
                        <div className="text-muted small">
                            Showing only pending (unassigned) items. Set a deadline and assign them.
                        </div>
                    </div>
                </Modal.Header>
                <Modal.Body className="pt-0">
                    {loadingItems ? (
                        <div className="d-flex justify-content-center align-items-center py-5">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <div className="border rounded-4 overflow-hidden bg-white">
                            <div className="px-3 py-2 border-bottom bg-light d-flex align-items-center justify-content-between">
                                <div className="small text-muted">
                                    {pendingTotalCount} pending items available
                                </div>
                                <div className="small text-muted">
                                    Selected {selectedPendingCount}
                                </div>
                            </div>
                            <div style={{ maxHeight: '52vh', overflow: 'auto' }}>
                                <Table hover responsive className="mb-0 align-middle assign-items-table">
                                    <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                        <tr>
                                            <th style={{ width: 48 }}>
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            const pendingIds = pendingDataItems.map(i => i.id);
                                                            setSelectedDataItemIds(pendingIds);
                                                        } else setSelectedDataItemIds([]);
                                                    }}
                                                    checked={pendingTotalCount > 0 && selectedPendingCount === pendingTotalCount}
                                                />
                                            </th>
                                            <th>File</th>
                                            <th className="text-nowrap">Size (KB)</th>
                                            <th className="text-nowrap">Dims</th>
                                            <th>Status</th>
                                            <th>Assigned</th>
                                            <th className="text-nowrap">Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dataItems.items.map(item => {
                                            const checked = selectedDataItemIds.includes(item.id);
                                            // All items are pending since we filter on API level
                                            const isSelectable = true;
                                            return (
                                                <tr key={item.id} className={checked ? 'table-primary' : ''}>
                                                    <td>
                                                        <input type="checkbox" checked={checked} onChange={(e) => {
                                                            if (e.target.checked) setSelectedDataItemIds(prev => [...prev, item.id]);
                                                            else setSelectedDataItemIds(prev => prev.filter(id => id !== item.id));
                                                        }} />
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-3 min-w-0">
                                                            <img src={buildUploadsUrl(item.thumbnailPath || item.filePath)} alt="thumb" style={{ width: 52, height: 40, objectFit: 'cover', flexShrink: 0, borderRadius: 10 }} />
                                                            <div title={item.fileName} className="min-w-0" style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1, position: 'relative' }}>
                                                                <span
                                                                    style={{ display: 'inline-block', fontWeight: 600 }}
                                                                    onMouseEnter={(e) => {
                                                                        const parent = e.currentTarget.parentElement;
                                                                        if (e.currentTarget.scrollWidth > parent.clientWidth) {
                                                                            const distance = e.currentTarget.scrollWidth - parent.clientWidth + 20;
                                                                            e.currentTarget.style.setProperty('--scroll-distance', `-${distance}px`);
                                                                            e.currentTarget.style.animation = 'scroll-text 30s linear infinite';
                                                                        }
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.animation = 'none';
                                                                    }}
                                                                >
                                                                    {item.fileName}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{item.fileSizeKB}</td>
                                                    <td>{item.width}×{item.height}</td>
                                                    <td><StatusBadge status={item.status} /></td>
                                                    <td>{item.assignedAnnotatorName || '-'}</td>
                                                    <td>{formatDateTime(item.createdAt)}</td>
                                                    <td><Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedImage({ url: buildUploadsUrl(item.filePath), fileName: item.fileName }); setShowImageModal(true); }}>View</Button></td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="d-flex flex-column gap-3 align-items-stretch">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 w-100">
                        <div className="d-flex align-items-center gap-2">
                            <Button variant="light" size="sm" disabled={dataItems.pageNumber <= 1 || loadingItems} onClick={() => fetchDataItems(Math.max(1, dataItems.pageNumber - 1), dataItems.pageSize)}>Prev</Button>
                            <Button variant="light" size="sm" disabled={dataItems.pageNumber >= dataItems.totalPages || loadingItems} onClick={() => fetchDataItems(Math.min(dataItems.totalPages, dataItems.pageNumber + 1), dataItems.pageSize)}>Next</Button>
                        </div>
                        <div className="text-muted small">Page {dataItems.pageNumber} / {dataItems.totalPages} • {dataItems.totalCount} items</div>
                    </div>

                    <div className="p-3 bg-light rounded-4 border w-100">
                        <div className="d-flex flex-wrap gap-3">
                            <div style={{ minWidth: 240 }} className="flex-grow-1">
                                <Form.Label className="small fw-semibold mb-1 text-uppercase text-muted">
                                    Deadline <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="datetime-local"
                                    value={taskDeadline}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setTaskDeadline(value);
                                        setTaskDeadlineError(validateDeadline(value, project?.deadline));
                                    }}
                                    className="shadow-none"
                                />
                                {taskDeadlineError && <div className="text-danger small mt-1">{taskDeadlineError}</div>}
                                {project?.deadline && (
                                    <div className="text-muted small mt-1">
                                        Project deadline: {formatDateTime(project.deadline)}
                                    </div>
                                )}
                            </div>
                            <div style={{ minWidth: 180 }}>
                                <Form.Label className="small fw-semibold mb-1 text-uppercase text-muted">Priority</Form.Label>
                                <Form.Select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="shadow-none">
                                    {PRIORITY_OPTIONS.map((priority) => (
                                        <option key={priority} value={priority}>{priority}</option>
                                    ))}
                                </Form.Select>
                                <div className={`small mt-2 ${getPriorityBadgeClass(taskPriority)}`}>
                                    Selected: {taskPriority}
                                </div>
                            </div>
                            <div style={{ minWidth: 240 }} className="flex-grow-1">
                                <Form.Label className="small fw-semibold mb-1 text-uppercase text-muted">
                                    Reviewer <span className="text-danger">*</span>
                                </Form.Label>
                                
                                {/* Search bar for reviewers */}
                                <div className="input-group input-group-sm mb-2">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search reviewers..."
                                        value={reviewerSearchTerm}
                                        onChange={(e) => {
                                            setReviewerSearchTerm(e.target.value);
                                            setReviewerPage(1); // Reset to first page on search
                                        }}
                                    />
                                    {reviewerSearchTerm && (
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setReviewerSearchTerm('');
                                                setReviewerPage(1);
                                            }}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                                
                                {/* Reviewer list */}
                                <div className="border rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {(() => {
                                        // Filter reviewers by search term
                                        const filteredReviewers = reviewers.filter(r => 
                                            r.name.toLowerCase().includes(reviewerSearchTerm.toLowerCase()) ||
                                            (r.specializedIn && r.specializedIn.toLowerCase().includes(reviewerSearchTerm.toLowerCase())) ||
                                            (r.email && r.email.toLowerCase().includes(reviewerSearchTerm.toLowerCase()))
                                        );
                                        
                                        // Calculate max workload for ALL reviewers (not just filtered ones)
                                        // This ensures fair comparison across all reviewers, not just the search results
                                        const allReviewerWorkloads = reviewers.map(r => r.activeReviewCount ?? 0);
                                        const maxReviewerWorkload = allReviewerWorkloads.length > 0 ? Math.max(...allReviewerWorkloads) : 0;
                                        const minReviewerWorkload = allReviewerWorkloads.length > 0 ? Math.min(...allReviewerWorkloads) : 0;
                                        // Desired behavior:
                                        // - If ALL reviewers have the same workload → keep ALL enabled (allow assignment to any)
                                        // - If SOME reviewers have STRICTLY LOWER workload → disable ONLY those with highest, keep others enabled
                                        // - If multiple reviewers tied for highest but others have lower → disable the tied ones
                                        const hasStrictlyLowerWorkloadReviewers = minReviewerWorkload < maxReviewerWorkload;
                                        
                                        console.log('=== ASSIGN MODAL DEBUG ===');
                                        console.log('allReviewerWorkloads:', allReviewerWorkloads);
                                        console.log('minReviewerWorkload:', minReviewerWorkload);
                                        console.log('maxReviewerWorkload:', maxReviewerWorkload);
                                        console.log('hasStrictlyLowerWorkloadReviewers:', hasStrictlyLowerWorkloadReviewers);

                                        
                                        // Paginate filtered reviewers
                                        const startIdx = (reviewerPage - 1) * REVIEWERS_PER_PAGE;
                                        const endIdx = startIdx + REVIEWERS_PER_PAGE;
                                        const paginatedReviewers = filteredReviewers.slice(startIdx, endIdx);
                                        const totalPages = Math.ceil(filteredReviewers.length / REVIEWERS_PER_PAGE);
                                        
                                        return (
                                            <>
                                                {/* Reviewer list */}
                                                {paginatedReviewers.length > 0 ? (
                                                    paginatedReviewers.map(reviewer => {
                                                        // activeReviewCount already includes ALL tasks globally
                                                        const totalWorkload = reviewer.activeReviewCount ?? 0;
                                                        // Disable ONLY if:
                                                        // 1. This reviewer has the highest workload (>= max)
                                                        // 2. AND there are reviewers with STRICTLY LOWER workload
                                                        const hasHighestWorkload = totalWorkload >= maxReviewerWorkload && maxReviewerWorkload > 0 && hasStrictlyLowerWorkloadReviewers;
                                                        const isDisabled = hasHighestWorkload;
                                                        
                                                        console.log(`Reviewer ${reviewer.name}:`, {
                                                            totalWorkload,
                                                            maxReviewerWorkload,
                                                            hasStrictlyLowerWorkloadReviewers,
                                                            check1: totalWorkload >= maxReviewerWorkload,
                                                            check2: maxReviewerWorkload > 0,
                                                            check3: hasStrictlyLowerWorkloadReviewers,
                                                            hasHighestWorkload,
                                                            isDisabled
                                                        });
                                                        
                                                        return (
                                                            <div
                                                                key={reviewer.id}
                                                                className={`p-2 border-bottom ${
                                                                    isDisabled 
                                                                        ? 'bg-light text-muted' 
                                                                        : selectedReviewerForTask?.id === reviewer.id 
                                                                            ? 'bg-primary text-white' 
                                                                            : 'hover-bg-light'
                                                                }`}
                                                                style={{ 
                                                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                                    opacity: isDisabled ? 0.6 : 1
                                                                }}
                                                                onClick={() => {
                                                                    if (!isDisabled) {
                                                                        setSelectedReviewerForTask(reviewer);
                                                                    }
                                                                }}
                                                                title={isDisabled ? `Highest total workload (${totalWorkload} total tasks globally) - please select another reviewer` : ''}
                                                            >
                                                                <div className="small fw-semibold">
                                                                    {reviewer.name}
                                                                    {hasHighestWorkload && <span className="badge bg-danger text-white ms-2" style={{ fontSize: '0.6rem' }}>Highest Workload</span>}
                                                                </div>
                                                                {reviewer.specializedIn && (
                                                                    <div className="small text-muted">Specialized in: {reviewer.specializedIn}</div>
                                                                )}
                                                                <div className="small text-muted">{reviewer.email} • {totalWorkload} total tasks (globally)</div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="p-3 text-center text-muted small">
                                                        {reviewerSearchTerm ? 'No reviewers found' : 'No reviewers available'}
                                                    </div>
                                                )}
                                                
                                                {/* Pagination */}
                                                {totalPages > 1 && (
                                                    <div className="d-flex justify-content-between align-items-center p-2 bg-light border-top">
                                                        <button
                                                            className="btn btn-sm btn-secondary"
                                                            disabled={reviewerPage <= 1}
                                                            onClick={() => setReviewerPage(p => Math.max(1, p - 1))}
                                                        >
                                                            Prev
                                                        </button>
                                                        <span className="small text-muted">
                                                            Page {reviewerPage} / {totalPages}
                                                        </span>
                                                        <button
                                                            className="btn btn-sm btn-secondary"
                                                            disabled={reviewerPage >= totalPages}
                                                            onClick={() => setReviewerPage(p => Math.min(totalPages, p + 1))}
                                                        >
                                                            Next
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                                
                                {selectedReviewerForTask && (
                                    <div className="text-success small mt-1">
                                        ✓ {selectedReviewerForTask.name} selected
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="d-flex align-items-center justify-content-between gap-3 mt-3">
                            <div className="small text-muted">
                                {!selectedReviewerForTask ? (
                                    <span className="text-danger">⚠️ Please select a reviewer</span>
                                ) : selectedPendingCount === 0 ? (
                                    'Select at least one pending item'
                                ) : (
                                    `${selectedPendingCount} items selected • Reviewer: ${selectedReviewerForTask.name}`
                                )}
                            </div>
                            <Button
                                variant="primary"
                                size="sm"
                                disabled={!canAssignItems}
                                className="px-4 fw-semibold"
                                onClick={async () => {
                                    if (!selectedAssignee) return;
                                    const deadlineError = validateDeadline(taskDeadline, project?.deadline);
                                    if (deadlineError) {
                                        setTaskDeadlineError(deadlineError);
                                        await showAlert(deadlineError, 'Validation', 'warning');
                                        return;
                                    }
                                    const pId = Number(getProjectIdFromPropsOrPath());
                                    const payload = {
                                        projectId: pId,
                                        annotatorId: Number(selectedAssignee.id),
                                        deadline: toIsoString(taskDeadline),
                                        priority: taskPriority,
                                        dataItemIds: selectedDataItemIds.map(id => Number(id))
                                    };
                                    
                                    // Add reviewer if selected
                                    if (selectedReviewerForTask) {
                                        payload.reviewerId = Number(selectedReviewerForTask.id);
                                    }
                                    
                                    try {
                                        setAssigning(true);
                                        await api.post('/Tasks', payload, { headers: { 'Content-Type': 'application/json' } });
                                        setAssigning(false);
                                        setShowAssignModal(false);
                                        setSelectedDataItemIds([]);
                                        await showAlert('Assigned successfully', 'Success', 'success');
                                        // Refresh tasks list, annotators, and reviewers
                                        await Promise.all([
                                            fetchTasks(tasksPage.pageNumber, tasksPage.pageSize),
                                            fetchAnnotators(),
                                            fetchReviewers()
                                        ]);
                                    } catch (err) {
                                        console.error('Failed to assign items', err.message || err || err.response);
                                        setAssigning(false);
                                        await showAlert('Failed to assign items', 'Error', 'error');
                                    }
                                }}
                            >
                                {assigning ? 'Assigning...' : `Assign Selected (${selectedDataItemIds.length})`}
                            </Button>
                        </div>
                    </div>
                </Modal.Footer>
            </Modal>

            {/* Reviewers modal */}
            <Modal show={showReviewersModal} onHide={() => { setShowReviewersModal(false); setReviewerTargetTaskId(null); setReviewerTargetTask(null); }} size="md">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {reviewerTargetTask?.reviewerName ? 'Reassign Reviewer' : 'Assign Reviewer'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {reviewerTargetTask?.reviewerName && (
                        <div className="alert alert-info mb-3">
                            <small className="d-block mb-1"><strong>Current Reviewer:</strong> {reviewerTargetTask.reviewerName}</small>
                            {reviewerTargetTask.reviewerSpecializedIn && (
                                <small className="d-block">
                                    <strong>Specialization:</strong> {reviewerTargetTask.reviewerSpecializedIn}
                                </small>
                            )}
                        </div>
                    )}
                    {loadingReviewers ? (
                        <div className="d-flex justify-content-center py-4"><Spinner animation="border" /></div>
                    ) : (
                        <div className="list-group">
                            {reviewers.length === 0 && <div className="text-muted small">No reviewers found</div>}
                            {(() => {
                                // Calculate max workload for reviewers
                                // activeReviewCount already includes ALL tasks globally, so we don't need to add otherProjectAssignedTaskCount
                                const reviewerWorkloads = reviewers.map(r => r.activeReviewCount ?? 0);
                                const maxReviewerWorkload = reviewerWorkloads.length > 0 ? Math.max(...reviewerWorkloads) : 0;
                                const minReviewerWorkload = reviewerWorkloads.length > 0 ? Math.min(...reviewerWorkloads) : 0;
                                // Desired behavior:
                                // - If ALL reviewers have the same workload → keep ALL enabled (allow assignment to any)
                                // - If SOME reviewers have STRICTLY LOWER workload → disable ONLY those with highest, keep others enabled
                                // - If multiple reviewers tied for highest but others have lower → disable the tied ones
                                const hasStrictlyLowerWorkloadReviewers = minReviewerWorkload < maxReviewerWorkload;
                                return reviewers.map(r => {
                                    // activeReviewCount already includes ALL tasks globally
                                    const totalWorkload = r.activeReviewCount ?? 0;
                                    // Disable ONLY if:
                                    // 1. This reviewer has the highest workload (>= max)
                                    // 2. AND there are reviewers with STRICTLY LOWER workload
                                    const hasHighestWorkload = totalWorkload >= maxReviewerWorkload && maxReviewerWorkload > 0 && hasStrictlyLowerWorkloadReviewers;
                                    const isDisabled = hasHighestWorkload;
                                    
                                    return (
                                        <div 
                                            key={r.id} 
                                            className="list-group-item d-flex align-items-center justify-content-between"
                                            style={{ 
                                                opacity: isDisabled ? 0.6 : 1,
                                                backgroundColor: isDisabled ? '#f8f9fa' : 'white'
                                            }}
                                        >
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: 36, height: 36 }}>
                                                    {r.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="fw-bold small mb-0 d-flex align-items-center gap-2">
                                                        {r.name}
                                                        {hasHighestWorkload && <span className="badge bg-danger text-white" style={{ fontSize: '0.6rem' }}>Highest Workload</span>}
                                                    </div>
                                                    <div className="small text-muted">{r.email}</div>
                                                    <div className="small text-muted d-flex gap-2 mt-1">
                                                        <span>Total tasks: <strong>{totalWorkload}</strong> (globally)</span>
                                                    </div>
                                                    {r.specializedIn && (
                                                        <div className="mt-1">
                                                            <span 
                                                                className="badge bg-info text-white" 
                                                                style={{ 
                                                                    fontSize: '0.7rem',
                                                                    maxWidth: '150px',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                                title={`Specialized in: ${r.specializedIn}`}
                                                            >
                                                                🎯 {r.specializedIn}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <Button 
                                                    size="sm" 
                                                    variant="primary" 
                                                    disabled={assigningReviewer || isDisabled} 
                                                    onClick={() => {
                                                        if (reviewerTargetTaskId) {
                                                            assignReviewer(reviewerTargetTaskId, r.id);
                                                        } else {
                                                            setShowReviewersModal(false);
                                                            openAssignModal(r);
                                                        }
                                                    }}
                                                    title={isDisabled ? `Highest total workload (${totalWorkload} total tasks globally) - please select another reviewer` : ''}
                                                >
                                                    {assigningReviewer ? 'Assigning...' : 'Assign Review'}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => { setShowReviewersModal(false); setReviewerTargetTaskId(null); }}>Close</Button>
                </Modal.Footer>
            </Modal>

            {/* Image Viewer Modal */}
            <Modal show={showImageModal} onHide={() => { setShowImageModal(false); setSelectedImage({ url: '', fileName: '' }); }} size="xl" centered>
                <Modal.Header closeButton>
                    <Modal.Title title={selectedImage.fileName} style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '90%', position: 'relative' }}>
                        <span
                            style={{ display: 'inline-block' }}
                            onMouseEnter={(e) => {
                                const parent = e.currentTarget.parentElement;
                                if (e.currentTarget.scrollWidth > parent.clientWidth) {
                                    const distance = e.currentTarget.scrollWidth - parent.clientWidth + 20;
                                    e.currentTarget.style.setProperty('--scroll-distance', `-${distance}px`);
                                    e.currentTarget.style.animation = 'scroll-text 30s linear infinite';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.animation = 'none';
                            }}
                        >
                            {selectedImage.fileName}
                        </span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#f8f9fa', minHeight: '400px' }}>
                    <img src={selectedImage.url} alt={selectedImage.fileName} style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { setShowImageModal(false); setSelectedImage({ url: '', fileName: '' }); }}>Close</Button>
                    <a href={selectedImage.url} download={selectedImage.fileName} className="btn btn-primary">Download</a>
                </Modal.Footer>
            </Modal>

            {/* CSS Animation for scrolling text */}
            <style>{`
                @keyframes scroll-text {
                    0%, 10% { 
                        transform: translateX(0); 
                    }
                    45%, 55% { 
                        transform: translateX(var(--scroll-distance, -200px)); 
                    }
                    90%, 100% { 
                        transform: translateX(0); 
                    }
                }
            `}</style>
        </div>
    );
}