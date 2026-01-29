import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Plus, MoreHorizontal, Tag, FileText,
    ChevronRight, Filter, ArrowLeft, Pencil, Trash2, ChevronDown, ChevronUp,
    Upload, X, Image as ImageIcon, Save, PieChart as PieChartIcon
} from 'lucide-react';
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_USERS } from '../../services/mockData.js';
import { ProjectStatus, DataItemStatus } from '../../types.js';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from 'react-bootstrap/Modal';

import Button from 'react-bootstrap/Button';
import ModalDialog from 'react-bootstrap/esm/ModalDialog.js';
export const ManagerProjectDetails = ({ user }) => {
    const { pid } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [activeTab, setActiveTab] = useState('Overview');
    const [expandedTaskGroups, setExpandedTaskGroups] = useState({});

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [isGuidelinesModalOpen, setIsGuidelinesModalOpen] = useState(false);
    const [guidelinesText, setGuidelinesText] = useState('');
    const [isEditingGuidelines, setIsEditingGuidelines] = useState(false);
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    // Load project from URL parameter
    useEffect(() => {
        if (!pid) {
            navigate('/manager/projects', { replace: true });
            return;
        }

        const foundProject = MOCK_PROJECTS.find(p => p.id === pid);
        if (foundProject) {
            setProject(foundProject);
            setGuidelinesText(foundProject.guidelines || '');
            setActiveTab('Overview');
        } else {
            // Project not found, redirect to projects list
            navigate('/manager/projects', { replace: true });
        }
    }, [pid, navigate]);

    const handleBackToProjects = () => {
        navigate('/manager/projects');
    };

    const toggleGroup = (userId) => {
        setExpandedTaskGroups(prev => ({ ...prev, [userId]: !prev[userId] }));
    };

    const handleFileSelect = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...filesArray]);
        }
    };

    const removeSelectedFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleImport = () => {
        if (!project || selectedFiles.length === 0) return;

        let progress = 0;
        const interval = setInterval(() => {
            progress += 20;
            setUploadProgress(progress);

            if (progress >= 100) {
                clearInterval(interval);

                const newTasks = selectedFiles.map((file, idx) => ({
                    id: `new-task-${Date.now()}-${idx}`,
                    projectId: project.id,
                    itemName: file.name,
                    imageUrl: URL.createObjectURL(file),
                    status: DataItemStatus.NOT_ASSIGNED,
                    annotations: []
                }));

                MOCK_TASKS.push(...newTasks);
                project.totalItems += newTasks.length;

                setTimeout(() => {
                    setUploadProgress(0);
                    setSelectedFiles([]);
                    setIsImportModalOpen(false);
                    setActiveTab('Dataset');
                }, 500);
            }
        }, 300);
    };

    const openGuidelines = () => {
        if (project) {
            setGuidelinesText(project.guidelines || '');
            setIsEditingGuidelines(false);
            setIsGuidelinesModalOpen(true);
        }
    };

    const handleSaveGuidelines = () => {
        if (project) {
            project.guidelines = guidelinesText;
            setIsEditingGuidelines(false);
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            [ProjectStatus.PENDING]: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            [ProjectStatus.FINISHED]: 'bg-green-50 text-green-700 border-green-200',
            [ProjectStatus.NOT_STARTED]: 'bg-slate-50 text-slate-600 border-slate-200',
            [ProjectStatus.CANCELLED]: 'bg-red-50 text-red-700 border-red-200',
            [DataItemStatus.COMPLETED]: 'bg-blue-50 text-blue-700 border-blue-200',
            [DataItemStatus.IN_PROGRESS]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            [DataItemStatus.ACCEPTED]: 'bg-green-50 text-green-700 border-green-200',
            [DataItemStatus.REJECTED]: 'bg-red-50 text-red-700 border-red-200',
            [DataItemStatus.NOT_ASSIGNED]: 'bg-slate-100 text-slate-500 border-slate-200',
        };

        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
                {status.replace(/_/g, ' ')}
            </span>
        );
    };

    if (!project) {
        return (
            <div className="h-100 d-flex align-items-center justify-content-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    const tabs = ['Overview', 'Dataset', 'Labels', 'Tasks'];
    const projectTasks = MOCK_TASKS.filter(t => t.projectId === project.id);
    const tasksByAssignee = projectTasks.reduce((acc, task) => {
        const key = task.assignedTo || 'Unassigned';
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
    }, {});

    return (
        <div className="h-100 d-flex flex-column gap-4 animate-in fade-in slide-in-from-right-4 duration-300 position-relative">
            <div className="d-flex align-items-center gap-3">
                <button onClick={handleBackToProjects} className="btn btn-light border">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="h5 fw-bold text-dark mb-1">{project.name}</h2>
                    <div className="d-flex align-items-center gap-3">
                        <p className="small text-muted mb-0">{project.type.replace(/_/g, ' ')}</p>
                        <span className={`badge ${project.priority === 'HIGH' ? 'bg-danger-light text-danger' :
                            project.priority === 'MEDIUM' ? 'bg-orange-light text-warning' :
                                'bg-secondary bg-opacity-10 text-secondary'}`}
                            style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                            {project.priority} Priority
                        </span>
                    </div>
                </div>
            </div>

            <ul className="nav nav-tabs border-bottom">
                {tabs.map(tab => (
                    <li key={tab} className="nav-item">
                        <button
                            onClick={() => setActiveTab(tab)}
                            className={`nav-link ${activeTab === tab ? 'active' : ''}`}
                        >
                            {tab}
                        </button>
                    </li>
                ))}
            </ul>

            <div style={{ minHeight: '400px' }}>
                {activeTab === 'Overview' && (
                    <div className="row g-4">
                        <div className="col-12 col-lg-8">
                            <div className="card border shadow-sm">
                                <div className="card-body">
                                    <h3 className="h6 fw-semibold mb-4 d-flex align-items-center gap-2">
                                        <PieChartIcon size={18} className="text-muted" />
                                        Completion Status
                                    </h3>
                                    <div className="d-flex align-items-center justify-content-center" style={{ height: '16rem' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Completed', value: project.completedItems },
                                                        { name: 'Remaining', value: project.totalItems - project.completedItems }
                                                    ]}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#4f46e5" />
                                                    <Cell fill="#e2e8f0" />
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="d-flex justify-content-center gap-5 mt-4">
                                        <div className="text-center">
                                            <p className="h3 fw-bold mb-1">{project.completedItems}</p>
                                            <p className="small text-muted text-uppercase">Done</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="h3 fw-bold mb-1">{project.totalItems}</p>
                                            <p className="small text-muted text-uppercase">Total</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-lg-4">
                            <div className="card border shadow-sm">
                                <div className="card-body">
                                    <h3 className="h6 fw-semibold mb-3">Quick Actions</h3>
                                    <div className="d-flex flex-column gap-2">
                                        <button
                                            onClick={() => setIsImportModalOpen(true)}
                                            className="btn btn-light border d-flex align-items-center justify-content-between p-3"
                                        >
                                            <div className="d-flex align-items-center gap-2">
                                                <Upload size={16} />
                                                <span className="small fw-medium">Import Dataset</span>
                                            </div>
                                            <ChevronRight size={16} />
                                        </button>
                                        <button
                                            onClick={openGuidelines}
                                            className="btn btn-light border d-flex align-items-center justify-content-between p-3"
                                        >
                                            <div className="d-flex align-items-center gap-2">
                                                <FileText size={16} />
                                                <span className="small fw-medium">Review Guidelines</span>
                                            </div>
                                            <ChevronRight size={16} />
                                        </button>
                                        <button className='btn btn-danger' style={{ alignSelf: 'center' }} onClick={handleShow}>Delete Project</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Dataset' && (
                    <div className="card border shadow-sm">
                        <div className="card-header bg-light d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-2">
                                <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2">
                                    <Filter size={14} />
                                    Filter Status
                                </button>
                            </div>
                            <span className="small text-muted">Showing {projectTasks.length} items</span>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="fw-semibold">Task Item</th>
                                        <th className="fw-semibold">Assigned Annotator</th>
                                        <th className="fw-semibold">Status</th>
                                        <th className="fw-semibold text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projectTasks.length > 0 ? (
                                        projectTasks.map(task => {
                                            const assignee = MOCK_USERS.find(u => u.id === task.assignedTo);
                                            return (
                                                <tr key={task.id}>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="rounded overflow-hidden border" style={{ width: '80px', height: '48px' }}>
                                                                <img src={task.imageUrl} alt="" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                                                            </div>
                                                            <div>
                                                                <div className="fw-medium">{task.itemName}</div>
                                                                <div className="small text-muted">ID: {task.id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {assignee ? (
                                                            <div className="d-flex align-items-center gap-2">
                                                                <img src={assignee.avatarUrl} alt="" className="rounded-circle" style={{ width: '24px', height: '24px' }} />
                                                                <span className="fw-medium">{assignee.name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted fst-italic small">Unassigned</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <StatusBadge status={task.status} />
                                                    </td>
                                                    <td className="text-end">
                                                        <button className="btn btn-link btn-sm text-primary p-0">Manage</button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="text-center text-muted py-5">
                                                No tasks found in this dataset.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'Labels' && (
                    <div>
                        <div className="d-flex justify-content-between align-items-start mb-4">
                            <div>
                                <h3 className="h5 fw-semibold">Label Classes</h3>
                                <p className="small text-muted">Define the objects of interest for this project</p>
                            </div>
                            <button className="btn btn-primary d-flex align-items-center gap-2">
                                <Plus size={16} />
                                Add Label
                            </button>
                        </div>
                        <div className="row g-3">
                            {project.classes.map(cls => (
                                <div key={cls.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                                    <div className="card border shadow-sm h-100">
                                        <div className="card-body d-flex align-items-center justify-content-between">
                                            <div className="d-flex align-items-center gap-3">
                                                <span className="rounded flex-shrink-0" style={{ width: '2rem', height: '2rem', backgroundColor: cls.color }}></span>
                                                <div>
                                                    <p className="fw-semibold mb-0">{cls.name}</p>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="small text-muted">ID: {cls.id}</span>
                                                        {cls.hotkey && (
                                                            <span className="badge bg-light text-dark border font-monospace">
                                                                Key: {cls.hotkey}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="d-flex gap-1">
                                                <button className="btn btn-sm btn-link text-muted p-1">
                                                    <Pencil size={16} />
                                                </button>
                                                <button className="btn btn-sm btn-link text-danger p-1">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="col-12 col-md-6 col-lg-4 col-xl-3">
                                <button className="card border border-2 border-dashed bg-light h-100 w-100" style={{ minHeight: '5rem' }}>
                                    <div className="card-body d-flex flex-column align-items-center justify-content-center text-muted">
                                        <Plus size={24} className="mb-1" />
                                        <span className="small fw-medium">Create New Label</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Tasks' && (
                    <div>
                        <div className="d-flex justify-content-between align-items-start mb-4">
                            <div>
                                <h3 className="h5 fw-semibold">Task Assignments</h3>
                                <p className="small text-muted">Manage work batches and track annotator progress</p>
                            </div>
                            <div className="d-flex gap-2">
                                <button className="btn btn-outline-secondary btn-sm">
                                    Auto-Assign
                                </button>
                                <button className="btn btn-primary btn-sm d-flex align-items-center gap-2">
                                    <Plus size={16} />
                                    New Assignment
                                </button>
                            </div>
                        </div>

                        <div className="d-flex flex-column gap-3">
                            {Object.entries(tasksByAssignee).map(([assigneeId, tasks]) => {
                                const assignee = MOCK_USERS.find(u => u.id === assigneeId);
                                const isExpanded = expandedTaskGroups[assigneeId] ?? true;
                                const completedCount = tasks.filter(t => t.status === DataItemStatus.COMPLETED || t.status === DataItemStatus.ACCEPTED).length;
                                const progress = Math.round((completedCount / tasks.length) * 100);

                                return (
                                    <div key={assigneeId} className="card border shadow-sm">
                                        <div
                                            onClick={() => toggleGroup(assigneeId)}
                                            className="card-header bg-light d-flex align-items-center justify-content-between p-3"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="d-flex align-items-center gap-3">
                                                <button className="btn btn-sm btn-link text-muted p-0">
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </button>
                                                <div className="d-flex align-items-center gap-3">
                                                    {assignee ? (
                                                        <div className="position-relative">
                                                            <img src={assignee.avatarUrl} alt={assignee.name} className="rounded-circle" style={{ width: '2.5rem', height: '2.5rem' }} />
                                                            <span className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle" style={{ width: '1rem', height: '1rem' }}></span>
                                                        </div>
                                                    ) : (
                                                        <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white fw-bold border border-2 border-white" style={{ width: '2.5rem', height: '2.5rem' }}>?</div>
                                                    )}
                                                    <div>
                                                        <h4 className="fw-semibold mb-0">{assignee ? assignee.name : 'Unassigned Pool'}</h4>
                                                        <p className="small text-muted mb-0">{tasks.length} items assigned</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="d-flex align-items-center gap-4">
                                                <div className="d-none d-sm-block" style={{ width: '8rem' }}>
                                                    <div className="d-flex justify-content-between small text-muted mb-1">
                                                        <span>Progress</span>
                                                        <span>{progress}%</span>
                                                    </div>
                                                    <div className="progress" style={{ height: '6px' }}>
                                                        <div className="progress-bar bg-primary" style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <span className="badge bg-light text-dark border">
                                                        {completedCount} / {tasks.length} Done
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="card-body">
                                                <h5 className="text-muted text-uppercase small fw-bold mb-3 ps-2">Task Items</h5>
                                                <div className="d-flex flex-column gap-2">
                                                    {tasks.map(task => (
                                                        <div key={task.id} className="d-flex align-items-center gap-3 p-2 rounded border border-transparent hover-bg-light" style={{ cursor: 'pointer' }}>
                                                            <div className="rounded overflow-hidden flex-shrink-0 position-relative" style={{ width: '3rem', height: '3rem' }}>
                                                                <img src={task.imageUrl} alt="" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                                                            </div>
                                                            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <p className="small fw-medium mb-0 text-truncate">{task.itemName}</p>
                                                                    <span className="badge bg-light text-muted border" style={{ fontSize: '0.625rem' }}>ID: {task.id}</span>
                                                                </div>
                                                                <div className="d-flex align-items-center gap-3 mt-1">
                                                                    <div className="d-flex align-items-center gap-1 small text-muted">
                                                                        <Tag size={12} />
                                                                        {task.annotations.length} Objects
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="d-flex align-items-center gap-3">
                                                                <StatusBadge status={task.status} />
                                                                <button className="btn btn-link btn-sm text-muted p-1">
                                                                    <MoreHorizontal size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
            <Modal show={show} onHide={handleClose} animation={false}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete Project</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to delete this project?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="danger" onClick={handleClose}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-light">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="p-2 bg-primary bg-opacity-10 rounded text-primary">
                                        <Upload size={20} />
                                    </div>
                                    <div>
                                        <h5 className="modal-title mb-0">Import Dataset</h5>
                                        <p className="small text-muted mb-0">Upload multiple images to the project</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsImportModalOpen(false)} className="btn-close"></button>
                            </div>

                            <div className="modal-body">
                                {uploadProgress > 0 ? (
                                    <div className="py-5 text-center">
                                        <div className="spinner-border text-primary mb-3" style={{ width: '4rem', height: '4rem' }}></div>
                                        <h4 className="h5 fw-bold">Uploading Files...</h4>
                                        <p className="text-muted small mb-3">{uploadProgress}% Complete</p>
                                        <div className="progress mx-auto" style={{ maxWidth: '24rem', height: '8px' }}>
                                            <div className="progress-bar bg-primary" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-4">
                                        <div className="border border-2 border-dashed rounded p-5 text-center position-relative" style={{ cursor: 'pointer' }}>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-center mx-auto mb-3" style={{ width: '3rem', height: '3rem' }}>
                                                <ImageIcon size={24} />
                                            </div>
                                            <p className="small fw-medium mb-1">
                                                <span className="text-primary">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="small text-muted mb-0">PNG, JPG, JPEG (Max 10MB each)</p>
                                        </div>

                                        {selectedFiles.length > 0 && (
                                            <div className="border rounded overflow-hidden">
                                                <div className="bg-light px-3 py-2 border-bottom d-flex justify-content-between align-items-center">
                                                    <span className="small fw-semibold text-muted">Selected Files ({selectedFiles.length})</span>
                                                    <button onClick={() => setSelectedFiles([])} className="btn btn-link btn-sm text-danger p-0">Clear All</button>
                                                </div>
                                                <div className="p-2 overflow-auto" style={{ maxHeight: '12rem' }}>
                                                    <div className="d-flex flex-column gap-2">
                                                        {selectedFiles.map((file, idx) => (
                                                            <div key={idx} className="d-flex align-items-center gap-3 p-2 bg-white border rounded">
                                                                <div className="rounded overflow-hidden flex-shrink-0" style={{ width: '2.5rem', height: '2.5rem' }}>
                                                                    <img src={URL.createObjectURL(file)} alt="" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                                                                </div>
                                                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                                                    <p className="small fw-medium mb-0 text-truncate">{file.name}</p>
                                                                    <p className="small text-muted mb-0">{(file.size / 1024).toFixed(1)} KB</p>
                                                                </div>
                                                                <button onClick={() => removeSelectedFile(idx)} className="btn btn-link btn-sm text-muted p-0">
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer bg-light">
                                <button
                                    disabled={uploadProgress > 0}
                                    onClick={() => setIsImportModalOpen(false)}
                                    className="btn btn-light"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={selectedFiles.length === 0 || uploadProgress > 0}
                                    onClick={handleImport}
                                    className="btn btn-primary d-flex align-items-center gap-2"
                                >
                                    {uploadProgress > 0 ? 'Uploading...' : `Upload ${selectedFiles.length} Images`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Guidelines Modal */}
            {isGuidelinesModalOpen && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-light">
                                <div className="d-flex align-items-center gap-2">
                                    <FileText size={20} className="text-primary" />
                                    <h5 className="modal-title mb-0">Project Guidelines</h5>
                                </div>
                                <button onClick={() => setIsGuidelinesModalOpen(false)} className="btn-close"></button>
                            </div>

                            <div className="modal-body">
                                {isEditingGuidelines ? (
                                    <div className="d-flex flex-column gap-3">
                                        <label className="small fw-bold text-muted text-uppercase">Edit Guidelines Content</label>
                                        <textarea
                                            value={guidelinesText}
                                            onChange={(e) => setGuidelinesText(e.target.value)}
                                            className="form-control"
                                            style={{ height: '16rem', resize: 'none' }}
                                            placeholder="Enter detailed annotation instructions here..."
                                        />
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-3">
                                        <label className="small fw-bold text-muted text-uppercase">Current Guidelines</label>
                                        <div className="bg-light p-3 rounded border overflow-auto" style={{ minHeight: '16rem', maxHeight: '24rem' }}>
                                            <div className="small" style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                                                {guidelinesText || "No guidelines defined for this project yet."}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer bg-light">
                                {isEditingGuidelines ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                setGuidelinesText(project?.guidelines || '');
                                                setIsEditingGuidelines(false);
                                            }}
                                            className="btn btn-light"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveGuidelines}
                                            className="btn btn-primary d-flex align-items-center gap-2"
                                        >
                                            <Save size={16} />
                                            Save Changes
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditingGuidelines(true)}
                                        className="btn btn-light border d-flex align-items-center gap-2 w-100"
                                    >
                                        <Pencil size={16} />
                                        Edit Guidelines
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
