import { useState, useEffect, use } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Plus, MoreHorizontal, Tag, FileText,
    ChevronRight, Filter, ArrowLeft, Pencil, Trash2, ChevronDown, ChevronUp,
    Upload, X, Image as ImageIcon, Save, PieChart as PieChartIcon,
    LayoutDashboard, Database, Layers
} from 'lucide-react'; // Đã thêm LayoutDashboard, Database, Layers
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_USERS } from '../../services/mockData.js';
import { ProjectStatus, DataItemStatus } from '../../types.js';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Form from 'react-bootstrap/Form';
import api from '../../ultis/api.js';

export const ManagerProjectDetails = ({ user }) => {
    const { pid } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [activeTab, setActiveTab] = useState('Overview');
    const [expandedTaskGroups, setExpandedTaskGroups] = useState({});

    // Import Modal States
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Add Label Modal States
    const [isAddLabelOpen, setIsAddLabelOpen] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [listLabels, setListLabels] = useState([]);
    const [newLabelColor, setNewLabelColor] = useState('#000000');
    const [addLabelError, setAddLabelError] = useState('');
    // Edit/Delete Label Modals
    const [isEditLabelOpen, setIsEditLabelOpen] = useState(false);
    const [editLabelName, setEditLabelName] = useState('');
    const [editLabelColor, setEditLabelColor] = useState('#000000');
    const [currentEditingLabel, setCurrentEditingLabel] = useState(null);
    const [isDeleteLabelOpen, setIsDeleteLabelOpen] = useState(false);
    const [labelToDelete, setLabelToDelete] = useState(null);

    // Guidelines Modal States
    const [isGuidelinesModalOpen, setIsGuidelinesModalOpen] = useState(false);
    const [guidelinesText, setGuidelinesText] = useState('');
    const [isEditingGuidelines, setIsEditingGuidelines] = useState(false);
    const [dataSet, setDataSet] = useState([]);
    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Edit Project Modal States
    const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editStatus, setEditStatus] = useState(ProjectStatus.NOT_STARTED);
    const [editDeadline, setEditDeadline] = useState('');
    // --- LOGIC: Load Project ---
    useEffect(() => {
        if (!pid) {
            navigate('/manager/projects', { replace: true });
            return;
        }
    }, [pid]);
    useEffect(() => {
        (async () => {
            try {
                const response = await api.get(`/Projects/${pid}`);
                const dataResponse = await api.get(`/projects/${pid}/data-items`);
                const listLabelsResponse = await api.get(`/projects/${pid}/labels`);
                setProject(response.data);
                //do it later
                setDataSet(dataResponse.data);
                setListLabels(listLabelsResponse.data.data);
            } catch (error) {
                console.warn('Failed to fetch project details', error);
            }
        })();
    }, []);
    const handleBackToProjects = () => navigate('/manager/projects');
    const toggleGroup = (userId) => setExpandedTaskGroups(prev => ({ ...prev, [userId]: !prev[userId] }));

    // --- LOGIC: Import File ---
    const handleFileSelect = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...filesArray]);
        }
    };
    const removeSelectedFile = (index) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    const handleDelete = async () => {

        try {
            await api.delete(`/Projects/${pid}`);
        } catch (error) {
            alert('Failed to delete project. Read the note below the Delete button for more information.');
            console.warn('Failed to delete project', error.response);
        }
        setShowDeleteModal(false);
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

    // --- LOGIC: Guidelines ---
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

    // --- LOGIC: Edit Project ---
    const openEditProject = () => {
        if (!project) return;
        setEditName(project.name || '');
        setEditDescription(project.description || '');
        setEditStatus(project.status || ProjectStatus.NOT_STARTED);
        try {
            setEditDeadline(project.deadline ? new Date(project.deadline).toISOString().slice(0, 16) : '');
        } catch (e) { setEditDeadline(''); }
        setIsEditProjectOpen(true);
    };

    const handleSaveProjectUpdate = async () => {
        if (!editName.trim() || !editDescription.trim()) {
            alert('Name and description are required');
            return;
        }
        try {
            // Mock update logic
            const updated = { ...project, name: editName, description: editDescription, status: editStatus, deadline: editDeadline ? new Date(editDeadline).toISOString() : null };
            const idx = MOCK_PROJECTS.findIndex(p => p.id === project.id);
            if (idx !== -1) MOCK_PROJECTS[idx] = { ...MOCK_PROJECTS[idx], ...updated };
            setProject(updated);
            alert('Project updated locally (mock)');
        } catch (error) {
            console.warn('Update failed', error);
        }
        setIsEditProjectOpen(false);
    };

    // --- LOGIC: Add Label ---
    const openAddLabel = () => {
        setNewLabelName('');
        setNewLabelColor('#000000');
        setAddLabelError('');
        setIsAddLabelOpen(true);
    };
    const handleSaveLabel = async () => {
        const hexRe = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
        if (!hexRe.test(newLabelColor)) {
            setAddLabelError('Mã màu phải là mã hex hợp lệ bắt đầu bằng #, ví dụ: #000000');
            return;
        }
        try {
            await api.post(`/projects/${pid}/labels`, { name: newLabelName, color: newLabelColor });
            setListLabels(prev => [...prev, { id: `label-${Date.now()}`, name: newLabelName, color: newLabelColor }]);
        } catch (error) {

        }
        setIsAddLabelOpen(false);
    };

    // --- LOGIC: open edit/delete modals ---
    const openEditLabelModal = (label, e) => {
        if (e) e.stopPropagation();
        setCurrentEditingLabel(label);
        setEditLabelName(label.name || '');
        setEditLabelColor(label.color || '#000000');
        setIsEditLabelOpen(true);
    };

    const openDeleteLabelModal = (label, e) => {
        if (e) e.stopPropagation();
        setLabelToDelete(label);
        setIsDeleteLabelOpen(true);
    };

    const handleEditLabelSubmit = async () => {
        if (!currentEditingLabel) return;
        try {
            await api.put(`/labels/${currentEditingLabel.id}`, { name: editLabelName, color: editLabelColor });
            setListLabels(prev => prev.map(l => l.id === currentEditingLabel.id ? { ...l, name: editLabelName, color: editLabelColor } : l));
            setIsEditLabelOpen(false);
            setCurrentEditingLabel(null);
        } catch (err) {
            console.error('Update label failed', err);
            alert('Failed to update label');
        }
    };

    const handleDeleteLabelConfirm = async () => {
        if (!labelToDelete) return;
        try {
            await api.delete(`/labels/${labelToDelete.id}`);
            setListLabels(prev => prev.filter(l => l.id !== labelToDelete.id));
            setIsDeleteLabelOpen(false);
            setLabelToDelete(null);
            alert('Label deleted');
        } catch (err) {
            console.error('Delete label failed', err);
            alert('Failed to delete label');
        }
    };

    // --- Component: Status Badge ---
    const StatusBadge = ({ status }) => {
        const styles = {
            [ProjectStatus.PENDING]: 'bg-warning-subtle text-warning-emphasis border-warning-subtle',
            [ProjectStatus.FINISHED]: 'bg-success-subtle text-success-emphasis border-success-subtle',
            [ProjectStatus.NOT_STARTED]: 'bg-secondary-subtle text-secondary-emphasis border-secondary-subtle',
            [ProjectStatus.CANCELLED]: 'bg-danger-subtle text-danger-emphasis border-danger-subtle',
            [DataItemStatus.COMPLETED]: 'bg-primary-subtle text-primary-emphasis border-primary-subtle',
            [DataItemStatus.IN_PROGRESS]: 'bg-info-subtle text-info-emphasis border-info-subtle',
            [DataItemStatus.ACCEPTED]: 'bg-success-subtle text-success-emphasis border-success-subtle',
            [DataItemStatus.REJECTED]: 'bg-danger-subtle text-danger-emphasis border-danger-subtle',
            [DataItemStatus.NOT_ASSIGNED]: 'bg-light text-muted -subtle',
        };
        return (
            <span className={`px-2 py-1 rounded-pill text-uppercase fw-bold border ${styles[status] || 'bg-light text-muted'}`} style={{ fontSize: '0.7rem' }}>
                {status}
            </span>
        );
    };

    if (!project) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;

    const tabs = [
        { id: 'Overview', icon: LayoutDashboard },
        { id: 'Dataset', icon: Database },
        { id: 'Labels', icon: Tag },
        { id: 'Tasks', icon: Layers }
    ];

    const projectTasks = MOCK_TASKS.filter(t => t.projectId === project.id);
    const tasksByAssignee = projectTasks.reduce((acc, task) => {
        const key = task.assignedTo || 'Unassigned';
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
    }, {});

    return (
        <div className="d-flex flex-column gap-4 container-fluid p-0">
            {/* Header */}
            <div className="d-flex align-items-center gap-3 mb-2">
                <Button variant="light" className="border shadow-sm bg-white" onClick={handleBackToProjects}>
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h2 className="h4 fw-bold text-dark mb-1">{project.name}</h2>
                    <div className="d-flex align-items-center gap-2">
                        <span className="text-muted small border-end pe-2 me-1">{project.type}</span>
                    </div>
                </div>
            </div>

            {/* --- NEW MODERN TABS UI --- */}
            <div className="border-bottom">
                <div className="d-flex gap-4">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`d-flex align-items-center gap-2 px-1 py-3 bg-transparent border-0 position-relative transition-all`}
                                style={{
                                    cursor: 'pointer',
                                    color: isActive ? '#0d6efd' : '#6c757d',
                                    fontWeight: isActive ? '600' : '500',
                                    marginBottom: '-1px' // Để border active đè lên border bottom của container
                                }}
                            >
                                <Icon size={18} />
                                <span>{tab.id}</span>
                                {isActive && (
                                    <div
                                        className="position-absolute bottom-0 start-0 w-100 bg-primary"
                                        style={{ height: '3px', borderTopLeftRadius: '3px', borderTopRightRadius: '3px' }}
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-transparent animate-in fade-in" style={{ minHeight: '400px' }}>
                {activeTab === 'Overview' && (
                    <div className="row g-4">
                        <div className="col-12 col-lg-8">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body">
                                    <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                                        <PieChartIcon size={20} className="text-primary" /> Project Progress
                                    </h5>
                                    <div style={{ height: '280px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Completed', value: project.completedItems },
                                                        { name: 'Remaining', value: project.totalItems - project.completedItems }
                                                    ]}
                                                    innerRadius={80}
                                                    outerRadius={100}
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
                                    <div className="d-flex justify-content-center gap-5 mt-3">
                                        <div className="text-center">
                                            <h3 className="fw-bold mb-0 text-primary">{project.completedItems}</h3>
                                            <small className="text-muted text-uppercase fw-bold">Done</small>
                                        </div>
                                        <div className="text-center">
                                            <h3 className="fw-bold mb-0 text-secondary">{project.totalItems}</h3>
                                            <small className="text-muted text-uppercase fw-bold">Total</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-lg-4">
                            <div className="card border-0 shadow-sm">
                                <div className="card-body">
                                    <h5 className="fw-bold mb-3">Quick Actions</h5>
                                    <div className="d-grid gap-2">
                                        <Button variant="light" className="text-start d-flex justify-content-between align-items-center p-3 border bg-white" onClick={() => setIsImportModalOpen(true)}>
                                            <span className="d-flex align-items-center gap-2"><Upload size={18} className="text-primary" /> Import Dataset</span>
                                            <ChevronRight size={16} className="text-muted" />
                                        </Button>
                                        <Button variant="light" className="text-start d-flex justify-content-between align-items-center p-3 border bg-white" onClick={openGuidelines}>
                                            <span className="d-flex align-items-center gap-2"><FileText size={18} className="text-info" /> Guidelines</span>
                                            <ChevronRight size={16} className="text-muted" />
                                        </Button>
                                        <Button variant="light" className="text-start d-flex justify-content-between align-items-center p-3 border bg-white" onClick={openEditProject}>
                                            <span className="d-flex align-items-center gap-2"><Pencil size={18} className="text-warning" /> Edit Project</span>
                                            <ChevronRight size={16} className="text-muted" />
                                        </Button>
                                        <hr className="my-2" />
                                        <Button variant="outline-danger" onClick={() => setShowDeleteModal(true)}>
                                            <Trash2 size={18} className="me-2" /> Delete Project
                                        </Button>
                                        <p>In case of unable to delete an item:</p>
                                        <p>1. Item has associated tasks and dataset that must be deleted first.</p>
                                        <div>2. There is a server issue. Please contact support.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Dataset' && (
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                            <div className="d-flex gap-2">
                                <Button variant="outline-secondary" size="sm" className="d-flex align-items-center gap-2"><Filter size={14} /> Filter</Button>
                            </div>
                            <small className="text-muted">Showing {projectTasks.length} items</small>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4 border-bottom-0 text-muted small text-uppercase">Item</th>
                                        <th className="border-bottom-0 text-muted small text-uppercase">Annotator</th>
                                        <th className="border-bottom-0 text-muted small text-uppercase">Status</th>
                                        <th className="text-end pe-4 border-bottom-0 text-muted small text-uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projectTasks.length > 0 ? projectTasks.map(task => {
                                        const assignee = MOCK_USERS.find(u => u.id === task.assignedTo);
                                        return (
                                            <tr key={task.id}>
                                                <td className="ps-4">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <img src={task.imageUrl} alt="" className="rounded border" style={{ width: '60px', height: '40px', objectFit: 'cover' }} />
                                                        <div>
                                                            <div className="fw-medium text-dark">{task.itemName}</div>
                                                            <small className="text-muted">ID: {task.id}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {assignee ? (
                                                        <div className="d-flex align-items-center gap-2">
                                                            <img src={assignee.avatarUrl} alt="" className="rounded-circle" width="24" height="24" />
                                                            <span className="small fw-medium">{assignee.name}</span>
                                                        </div>
                                                    ) : <span className="badge bg-light text-muted border fw-normal">Unassigned</span>}
                                                </td>
                                                <td><StatusBadge status={task.status} /></td>
                                                <td className="text-end pe-4">
                                                    <Button variant="link" size="sm" className="text-decoration-none">Manage</Button>
                                                </td>
                                            </tr>
                                        )
                                    }) : <tr><td colSpan={4} className="text-center py-5 text-muted">No tasks found</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'Labels' && (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div><h5 className="fw-bold mb-0">Labels</h5><small className="text-muted">Manage object classes</small></div>
                            <Button variant="primary" size="sm" onClick={openAddLabel} className="d-flex align-items-center gap-2"><Plus size={16} /> Add Label</Button>
                        </div>
                        <div className="row g-3">
                            {listLabels && listLabels.length > 0 ? (
                                listLabels.map(cls => (
                                    <div key={cls.id} className="col-12 col-md-6 col-lg-3">
                                        <div className="card h-100 border-0 shadow-sm">
                                            <div className="card-body d-flex align-items-center justify-content-between">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="rounded shadow-sm" style={{ width: 36, height: 36, backgroundColor: cls.color }}></div>
                                                    <div>
                                                        <div className="fw-bold text-dark">{cls.name}</div>
                                                        {cls.hotkey && <small className="text-muted border px-1 rounded bg-light">Key: {cls.hotkey}</small>}
                                                    </div>
                                                </div>
                                                <div className="d-flex gap-1">
                                                    <Button variant="link" className="text-muted p-1" onClick={(e) => openEditLabelModal(cls, e)}><Pencil size={16} /></Button>
                                                    <Button variant="link" className="text-danger p-1" onClick={(e) => openDeleteLabelModal(cls, e)}><Trash2 size={16} /></Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-12">
                                    <div className="card border-0 shadow-sm">
                                        <div className="card-body text-center py-5 text-muted">No labels found</div>
                                    </div>
                                </div>
                            )}
                            {/* Nút thêm mới dạng card */}
                            <div className="col-12 col-md-6 col-lg-3">
                                <button onClick={openAddLabel} className="card border border-2 border-dashed bg-light h-100 w-100 p-0 text-muted hover-bg-light" style={{ minHeight: '80px' }}>
                                    <div className="card-body d-flex flex-column align-items-center justify-content-center">
                                        <Plus size={24} className="mb-1" />
                                        <span className="small fw-medium">Create New Label</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Tasks' && (
                    <div className="d-flex flex-column gap-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <h5 className="fw-bold mb-0">Task Assignments</h5>
                                <small className="text-muted">Track assignments</small>
                            </div>
                            <div className="d-flex gap-2">
                                <Button variant="outline-secondary" size="sm">Auto-Assign</Button>
                                <Button variant="primary" size="sm" className="d-flex align-items-center gap-2"><Plus size={16} /> Assign</Button>
                            </div>
                        </div>
                        {Object.entries(tasksByAssignee).map(([assigneeId, tasks]) => {
                            const assignee = MOCK_USERS.find(u => u.id === assigneeId);
                            const isExpanded = expandedTaskGroups[assigneeId] ?? true;
                            const completedCount = tasks.filter(t => t.status === DataItemStatus.COMPLETED || t.status === DataItemStatus.ACCEPTED).length;
                            const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

                            return (
                                <div key={assigneeId} className="card border-0 shadow-sm overflow-hidden">
                                    <div className="card-header bg-white py-3 d-flex align-items-center justify-content-between cursor-pointer border-bottom-0" onClick={() => toggleGroup(assigneeId)}>
                                        <div className="d-flex align-items-center gap-3">
                                            <Button variant="link" className="p-0 text-muted text-decoration-none" onClick={(e) => { e.stopPropagation(); toggleGroup(assigneeId); }}>
                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </Button>
                                            <div className="d-flex align-items-center gap-3">
                                                {assignee ? (
                                                    <img src={assignee.avatarUrl} alt="" className="rounded-circle border" width="36" height="36" />
                                                ) : <div className="rounded-circle bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center text-secondary small fw-bold" style={{ width: 36, height: 36 }}>?</div>}
                                                <div>
                                                    <div className="fw-bold mb-0 lh-1 text-dark">{assignee ? assignee.name : "Unassigned"}</div>
                                                    <small className="text-muted">{tasks.length} items</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-4">
                                            <div className="d-none d-md-block" style={{ width: '180px' }}>
                                                <div className="d-flex justify-content-between small text-muted mb-1">
                                                    <span>Progress</span>
                                                    <span className="fw-bold">{progress}%</span>
                                                </div>
                                                <ProgressBar now={progress} style={{ height: '6px' }} variant={progress === 100 ? 'success' : 'primary'} />
                                            </div>
                                            <span className="badge bg-light text-dark border px-3 py-2">{completedCount} / {tasks.length} Done</span>
                                        </div>
                                    </div>
                                    {isExpanded && <div className="card-body bg-light bg-opacity-50 p-3 border-top">
                                        <div className="d-flex flex-column gap-2">
                                            {tasks.map(t => (
                                                <div key={t.id} className="bg-white p-2 rounded shadow-sm d-flex justify-content-between align-items-center border-0">
                                                    <div className="d-flex gap-3 align-items-center">
                                                        <img src={t.imageUrl} width="48" height="36" className="rounded object-fit-cover border" />
                                                        <div>
                                                            <div className="small fw-bold text-dark">{t.itemName}</div>
                                                            <div className="d-flex gap-2 align-items-center text-muted" style={{ fontSize: '11px' }}>
                                                                <span>ID: {t.id}</span>
                                                                <span>•</span>
                                                                <span><Tag size={10} /> {t.annotations.length} Objects</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <StatusBadge status={t.status} />
                                                        <Button variant="link" className="text-muted p-0"><MoreHorizontal size={16} /></Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ================= MODALS SECTION (Giữ nguyên logic cũ) ================= */}

            {/* 1. Delete Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>Delete Project</Modal.Title></Modal.Header>
                <Modal.Body>Are you sure you want to delete this project? This action cannot be undone.</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Close</Button>
                    <Button variant="danger" onClick={handleDelete}>Delete</Button>
                </Modal.Footer>
            </Modal>

            {/* 2. Import Modal */}
            <Modal show={isImportModalOpen} onHide={() => !uploadProgress && setIsImportModalOpen(false)} centered size="lg">
                <Modal.Header closeButton={!uploadProgress}>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <Upload size={20} className="text-primary" /> Import Dataset
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {uploadProgress > 0 ? (
                        <div className="text-center py-4">
                            <h5 className="mb-3">Uploading Files...</h5>
                            <p className="text-muted small">{uploadProgress}% Complete</p>
                            <ProgressBar now={uploadProgress} striped variant="primary" animated className="mx-auto" style={{ maxWidth: '300px' }} />
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            <div className="border border-2 border-dashed rounded p-5 text-center bg-light position-relative">
                                <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer" />
                                <div className="rounded-circle bg-primary bg-opacity-10 d-inline-flex p-3 mb-2 text-primary">
                                    <ImageIcon size={24} />
                                </div>
                                <p className="mb-0 fw-medium">Drag & Drop or Click to Upload</p>
                                <small className="text-muted">Support JPG, PNG, JPEG (Max 10MB)</small>
                            </div>
                            {selectedFiles.length > 0 && (
                                <div className="border rounded">
                                    <div className="p-2 bg-light border-bottom d-flex justify-content-between align-items-center">
                                        <small className="fw-bold">Selected Files ({selectedFiles.length})</small>
                                        <Button variant="link" className="text-danger p-0 text-decoration-none small" onClick={() => setSelectedFiles([])}>Clear All</Button>
                                    </div>
                                    <div className="p-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                        {selectedFiles.map((f, i) => (
                                            <div key={i} className="d-flex justify-content-between align-items-center p-2 border-bottom last-border-0">
                                                <div className="d-flex align-items-center gap-2 text-truncate">
                                                    <img src={URL.createObjectURL(f)} width="30" height="30" className="rounded object-fit-cover" />
                                                    <div>
                                                        <div className="small fw-medium text-truncate" style={{ maxWidth: '200px' }}>{f.name}</div>
                                                        <div className="small text-muted" style={{ fontSize: '10px' }}>{(f.size / 1024).toFixed(1)} KB</div>
                                                    </div>
                                                </div>
                                                <Button variant="link" className="text-muted p-0" onClick={() => removeSelectedFile(i)}><X size={16} /></Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setIsImportModalOpen(false)} disabled={uploadProgress > 0}>Cancel</Button>
                    <Button variant="primary" onClick={handleImport} disabled={selectedFiles.length === 0 || uploadProgress > 0}>
                        {uploadProgress > 0 ? 'Uploading...' : `Upload ${selectedFiles.length} Images`}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* 3. Guidelines Modal */}
            <Modal show={isGuidelinesModalOpen} onHide={() => setIsGuidelinesModalOpen(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2"><FileText size={20} className="text-primary" /> Project Guidelines</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {isEditingGuidelines ? (
                        <div className="d-flex flex-column gap-2">
                            <label className="small fw-bold text-muted">EDIT CONTENT</label>
                            <Form.Control as="textarea" rows={10} value={guidelinesText} onChange={(e) => setGuidelinesText(e.target.value)} placeholder="Enter detailed instructions..." />
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-2">
                            <label className="small fw-bold text-muted">CURRENT GUIDELINES</label>
                            <div className="p-3 bg-light rounded border" style={{ minHeight: '200px', whiteSpace: 'pre-line' }}>
                                {guidelinesText || "No guidelines set for this project."}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {isEditingGuidelines ? (
                        <>
                            <Button variant="light" onClick={() => setIsEditingGuidelines(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleSaveGuidelines} className="d-flex align-items-center gap-2"><Save size={16} /> Save Changes</Button>
                        </>
                    ) : (
                        <Button variant="outline-primary" onClick={() => setIsEditingGuidelines(true)} className="w-100 d-flex align-items-center justify-content-center gap-2"><Pencil size={16} /> Edit Guidelines</Button>
                    )}
                </Modal.Footer>
            </Modal>

            {/* 4. Edit Project Modal */}
            <Modal show={isEditProjectOpen} onHide={() => setIsEditProjectOpen(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <div className="p-1 bg-primary bg-opacity-10 rounded text-primary"><Pencil size={20} /></div>
                        Edit Project
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="d-flex flex-column gap-3">
                    <Form.Group>
                        <Form.Label className="fw-semibold">Project Name</Form.Label>
                        <Form.Control value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className="fw-semibold">Description</Form.Label>
                        <Form.Control as="textarea" rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className="fw-semibold">Status</Form.Label>
                        <Form.Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                            {Object.keys(ProjectStatus).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className="fw-semibold">Deadline</Form.Label>
                        <Form.Control type="datetime-local" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setIsEditProjectOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSaveProjectUpdate} className="d-flex align-items-center gap-2"><Save size={16} /> Save Changes</Button>
                </Modal.Footer>
            </Modal>

            {/* 5. Add Label Modal */}
            <Modal show={isAddLabelOpen} onHide={() => setIsAddLabelOpen(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <div className="p-1 bg-primary bg-opacity-10 rounded text-primary"><Plus size={20} /></div>
                        Create New Label
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="d-flex flex-column gap-3">
                    <Form.Group>
                        <Form.Label className="small fw-bold text-muted">LABEL NAME</Form.Label>
                        <Form.Control required placeholder="Enter label name" value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className="small fw-bold text-muted">COLOR</Form.Label>
                        <div className="d-flex gap-2">
                            <Form.Control required type="color" value={newLabelColor} onChange={(e) => setNewLabelColor(e.target.value)} className="form-control-color" style={{ width: '3rem' }} title="Choose your color" />
                        </div>
                    </Form.Group>
                    {addLabelError && <div className="text-danger small">{addLabelError}</div>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setIsAddLabelOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSaveLabel}>Create Label</Button>
                </Modal.Footer>
            </Modal>
            {/* Edit Label Modal */}
            <Modal show={isEditLabelOpen} onHide={() => { setIsEditLabelOpen(false); setCurrentEditingLabel(null); }} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <div className="p-1 bg-primary bg-opacity-10 rounded text-primary"><Pencil size={20} /></div>
                        Edit Label
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="d-flex flex-column gap-3">
                    <Form.Group>
                        <Form.Label className="small fw-bold text-muted">LABEL NAME</Form.Label>
                        <Form.Control value={editLabelName} onChange={(e) => setEditLabelName(e.target.value)} />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className="small fw-bold text-muted">COLOR</Form.Label>
                        <div className="d-flex gap-2">
                            <Form.Control type="color" value={editLabelColor} onChange={(e) => setEditLabelColor(e.target.value)} className="form-control-color" style={{ width: '3rem' }} title="Choose your color" />
                            <Form.Control value={editLabelColor} onChange={(e) => setEditLabelColor(e.target.value)} />
                        </div>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => { setIsEditLabelOpen(false); setCurrentEditingLabel(null); }}>Cancel</Button>
                    <Button variant="primary" onClick={handleEditLabelSubmit}>Save</Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Label Confirmation Modal */}
            <Modal show={isDeleteLabelOpen} onHide={() => { setIsDeleteLabelOpen(false); setLabelToDelete(null); }} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete label "{labelToDelete?.name}"? This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => { setIsDeleteLabelOpen(false); setLabelToDelete(null); }}>Cancel</Button>
                    <Button variant="danger" onClick={handleDeleteLabelConfirm}>Delete</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};