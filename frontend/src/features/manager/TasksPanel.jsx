import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';
import Spinner from 'react-bootstrap/Spinner';
import { ChevronUp, ChevronDown, Tag, MoreHorizontal } from 'lucide-react';

import api from '../../shared/utils/api.js';

// CSS for scrolling text animation
const scrollingTextStyle = {
    display: 'inline-block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    maxWidth: '100%'
};

const scrollingTextInnerStyle = {
    display: 'inline-block',
    paddingRight: '20px',
    animation: 'scroll-text 10s linear infinite'
};

export default function TasksPanel({ expandedTaskGroups, toggleGroup, StatusBadge, externalAssignTarget }) {
    const [annotators, setAnnotators] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedAssignee, setSelectedAssignee] = useState(null);
    const [selectedDataItemIds, setSelectedDataItemIds] = useState([]);
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
    }, []);

    const fetchAnnotators = async () => {
        try {
            const res = await api.get('/Tasks/annotators');
            const annotatorsList = res?.data || [];
            setAnnotators(annotatorsList);
        } catch (e) {
            console.error('Failed to fetch annotators', e);
            setAnnotators([]);
        }
    }

    const fetchTasks = async (pageNumber = 1, pageSize = 10, projectIdProp) => {
        const pId = getProjectIdFromPropsOrPath(projectIdProp);
        setLoadingTasks(true);
        try {
            const res = await api.get('/Tasks', { params: { projectId: pId, pageNumber, pageSize } });
            const body = res?.data || {};
            const items = body.items || [];
            setTasksPage({
                items,
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
        }
    }

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
            const res = await api.get(`/projects/${pId}/data-items`, { params: { pageNumber, pageSize } });
            const filteredItems = res.data.items.filter(i => i.status !== 'Assigned');
            console.log('Fetched data items:', filteredItems);
            if (res?.data) {
                setDataItems({
                    items: filteredItems || [],
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
        setSelectedDataItemIds([]);
        setShowAssignModal(true);
        await fetchDataItems(1, DEFAULT_PAGE_SIZE);
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
    }
    // group tasksPage items by annotatorId for UI rendering
    const tasksByAnnotator = {};
    tasksPage.items.forEach(it => {
        const aId = it.annotatorId ?? 0;
        if (!tasksByAnnotator[aId]) tasksByAnnotator[aId] = [];
        tasksByAnnotator[aId].push(it);
    });
    return (
        <div className="d-flex flex-column gap-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <h5 className="fw-bold mb-0">Task Assignments</h5>
                    <small className="text-muted">Track assignments</small>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="primary" size="sm">Auto-Assign</Button>
                </div>
            </div>
            {annotators.map((assignee) => {
                const tasks = tasksByAnnotator[assignee.id] || [];
                const isExpanded = expandedTaskGroups[assignee.id] ?? true;
                const totalCount = tasks.reduce((s, t) => s + (t.totalItems || 1), 0);
                const completedCount = tasks.reduce((s, t) => s + (t.completedItems || 0), 0);
                const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : (tasks[0]?.progressPercent ?? 0);
                const isUnassigned = tasks.length === 0;

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
                                        </div>
                                        <small className="text-muted">
                                            {assignee?.email && `${assignee.email} • `}
                                            {tasks.length} tasks{assignee && ` • ${assignee.activeTaskCount} active`}
                                        </small>
                                    </div>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-4">
                                <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); openAssignModal(assignee); }}>Assign</Button>
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
                                    <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); openAssignModal(assignee); }}>Assign Tasks Now</Button>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-2">
                                    {tasks.map(t => {
                                        const isTaskExpanded = !!expandedTasks[t.id];
                                        const detail = taskDetailsMap[t.id];
                                        return (
                                            <div key={t.id}>
                                                <div className="bg-white p-2 rounded shadow-sm d-flex justify-content-between align-items-center border-0">
                                                    <div className="d-flex gap-3 align-items-center">
                                                        <div style={{ width: 56, height: 42 }} className="rounded bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center text-secondary small">#{t.id}</div>
                                                        <div>
                                                            <div className="small fw-bold text-dark">{t.projectName || `Project ${t.projectId || ''}`}</div>
                                                            <div className="d-flex gap-2 align-items-center text-muted" style={{ fontSize: '11px' }}>
                                                                <span>ID: {t.id}</span>
                                                                <span>•</span>
                                                                <span>{t.totalItems || 1} items</span>
                                                                <span>•</span>
                                                                <span>{t.progressPercent ?? Math.round(((t.completedItems || 0) / (t.totalItems || 1)) * 100)}%</span>
                                                            </div>
                                                            <div className="text-muted small">Assigned: {t.assignedAt ? new Date(t.assignedAt).toLocaleString() : (t.createdAt ? new Date(t.createdAt).toLocaleString() : '-')}</div>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <StatusBadge status={t.status} />
                                                        <Button variant="link" className="text-muted p-0" onClick={(e) => { e.stopPropagation(); toggleTaskInline(t.id); }}>{isTaskExpanded ? 'Hide' : 'View'}</Button>
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
                                                                            <Button variant="outline-primary" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedImage({ url: buildUploadsUrl(it.filePath), fileName: it.fileName }); setShowImageModal(true); }}>View</Button>
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
                                                <Button variant="outline-primary" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedImage({ url: buildUploadsUrl(it.filePath), fileName: it.fileName }); setShowImageModal(true); }}>View</Button>
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
            <Modal show={showAssignModal} onHide={closeAssignModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Assign items {selectedAssignee ? `to ${selectedAssignee.name}` : ''}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingItems ? (
                        <div className="d-flex justify-content-center py-4"><Spinner animation="border" /></div>
                    ) : (
                        <Table hover responsive>
                            <thead>
                                <tr>
                                    <th style={{ width: 48 }}>
                                        <input
                                            type="checkbox"
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedDataItemIds(dataItems.items.map(i => i.id));
                                                else setSelectedDataItemIds([]);
                                            }}
                                            checked={dataItems.items.length > 0 && selectedDataItemIds.length === dataItems.items.length}
                                        />
                                    </th>
                                    <th>File</th>
                                    <th>Size (KB)</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataItems.items.map(item => {
                                    const checked = selectedDataItemIds.includes(item.id);
                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <input type="checkbox" checked={checked} onChange={(e) => {
                                                    if (e.target.checked) setSelectedDataItemIds(prev => [...prev, item.id]);
                                                    else setSelectedDataItemIds(prev => prev.filter(id => id !== item.id));
                                                }} />
                                            </td>
                                            <td style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                                                <img src={buildUploadsUrl(item.thumbnailPath || item.filePath)} alt="thumb" style={{ width: 64, height: 48, objectFit: 'cover', flexShrink: 0 }} />
                                                <div title={item.fileName} style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', minWidth: 0, flex: 1, position: 'relative' }}>
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
                                                        {item.fileName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>{item.fileSizeKB}</td>
                                            <td>{item.status}</td>
                                            <td>{new Date(item.createdAt).toLocaleString()}</td>
                                            <td><Button variant="outline-primary" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedImage({ url: buildUploadsUrl(item.filePath), fileName: item.fileName }); setShowImageModal(true); }}>View</Button></td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </Table>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <div className="d-flex align-items-center gap-2 w-100 justify-content-between">
                        <div>
                            <Button variant="secondary" size="sm" disabled={dataItems.pageNumber <= 1 || loadingItems} onClick={() => fetchDataItems(Math.max(1, dataItems.pageNumber - 1), dataItems.pageSize)}>Prev</Button>
                            <Button variant="secondary" size="sm" className="ms-2" disabled={dataItems.pageNumber >= dataItems.totalPages || loadingItems} onClick={() => fetchDataItems(Math.min(dataItems.totalPages, dataItems.pageNumber + 1), dataItems.pageSize)}>Next</Button>
                        </div>
                        <div className="text-muted small">Page {dataItems.pageNumber} / {dataItems.totalPages} • {dataItems.totalCount} items</div>
                    </div>
                    <div className="ms-3">
                        <Button variant="primary" size="sm" disabled={!selectedAssignee || selectedDataItemIds.length === 0 || assigning} onClick={async () => {
                            if (!selectedAssignee) return;
                            const pId = Number(getProjectIdFromPropsOrPath());
                            const payload = {
                                projectId: pId,
                                annotatorId: Number(selectedAssignee.id),
                                dataItemIds: selectedDataItemIds.map(id => Number(id))
                            };
                            try {
                                console.log('Assigning with payload:', payload);
                                setAssigning(true);
                                await api.post('/Tasks', payload, { headers: { 'Content-Type': 'application/json' } });
                                setAssigning(false);
                                setShowAssignModal(false);
                                setSelectedDataItemIds([]);
                                window.alert('Assigned successfully');
                                // refresh tasks list and annotators
                                fetchTasks(tasksPage.pageNumber, tasksPage.pageSize);
                                fetchAnnotators();
                            } catch (err) {
                                console.error('Failed to assign items', err.message || err || err.response);
                                setAssigning(false);
                                window.alert('Failed to assign items');
                            }
                        }}>{assigning ? 'Assigning...' : `Assign Selected (${selectedDataItemIds.length})`}</Button>
                    </div>
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