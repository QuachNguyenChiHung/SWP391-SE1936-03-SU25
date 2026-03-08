import { useState, useEffect, use } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Plus, MoreHorizontal, Tag, FileText,
    ChevronRight, Filter, ArrowLeft, Pencil, Trash2, ChevronDown, ChevronUp,
    Upload, X, Image as ImageIcon, Save, PieChart as PieChartIcon,
    LayoutDashboard, Database, Layers, Users
} from 'lucide-react'; // Đã thêm LayoutDashboard, Database, Layers
import TabsNav from './TabsNav.jsx';
import OverviewPanel from './OverviewPanel.jsx';
import DatasetPanel from './DatasetPanel.jsx';
import LabelsPanel from './LabelsPanel.jsx';
import TasksPanel from './TasksPanel.jsx';
import { ProjectStatus, DataItemStatus } from '../../shared/types/types.js';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Form from 'react-bootstrap/Form';
import api from '../../shared/utils/api.js';
import DataItemsPanel from './DatasetPanel.jsx';

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
    const [dataPage, setDataPage] = useState(1);
    const [dataLoading, setDataLoading] = useState(true);
    // Annotators
    const [annotators, setAnnotators] = useState([]);
    const [annotatorsLoading, setAnnotatorsLoading] = useState(false);
    const [externalAssignTarget, setExternalAssignTarget] = useState(null);
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
                const listLabelsResponse = await api.get(`/projects/${pid}/labels`);
                const projectData = response.data?.data ?? response.data;
                setProject(projectData);
                setListLabels(listLabelsResponse.data?.data ?? listLabelsResponse.data);
            } catch (error) {
                console.warn('Failed to fetch project details', error);
            }
        })();
    }, [pid]);

    // Fetch data-items with paging
    useEffect(() => {
        setDataLoading(true);
        (async () => {
            try {
                const res = await api.get(`/projects/${pid}/data-items?pageNumber=${dataPage}&pageSize=10`);
                const payload = res.data?.data ?? res.data;
                setDataSet(payload);
            } catch (err) {
                console.warn('Failed to fetch data items', err);
                setDataSet({ items: [], totalCount: 0, pageNumber: dataPage, pageSize: 10, totalPages: 0 });
            } finally {
                setDataLoading(false);
            }
        })();
    }, [pid, dataPage]);
    // --- LOGIC: Load Annotators when user opens Annotators tab ---
    useEffect(() => {
        if (activeTab !== 'Annotators') return;
        setAnnotatorsLoading(true);
        (async () => {
            try {
                const res = await api.get(`/Tasks/annotators`);
                const payload = res.data?.data ?? res.data;
                setAnnotators(payload);
            } catch (err) {
                console.warn('Failed to fetch annotators', err);
                setAnnotators([]);
            } finally {
                setAnnotatorsLoading(false);
            }
        })();
    }, [activeTab]);
    const handleBackToProjects = () => navigate('/manager/projects');
    const toggleGroup = (userId) => setExpandedTaskGroups(prev => ({ ...prev, [userId]: !prev[userId] }));

    // --- LOGIC: Delete data-item ---
    const handleDeleteDataItem = async (id) => {
        if (!id) return;
        const ok = window.confirm('Delete this data item? This cannot be undone.');
        if (!ok) return;
        try {
            await api.delete(`/data-items/${id}`);
            setDataSet(prev => {
                if (!prev) return prev;
                const items = (prev.items || []).filter(i => i.id !== id);
                const total = Math.max(0, (prev.totalCount || 0) - 1);
                return { ...prev, items, totalCount: total };
            });
            alert('Item deleted');
        } catch (err) {
            console.error('Delete data item failed', err);
            alert('Failed to delete item');
        }
    };

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
    const handleImport = async () => {
        if (!project || selectedFiles.length === 0) return;
        try {
            setUploadProgress(1);
            const form = new FormData();
            // append files - backend expects an array of images
            selectedFiles.forEach((f) => form.append('files', f));

            const res = await api.post(`/projects/${pid}/dataset/upload`, form, {
                // Let axios set Content-Type with boundary
                onUploadProgress: (e) => {
                    try {
                        if (e.lengthComputable || e.total) {
                            const percent = Math.round((e.loaded * 100) / (e.total || e.lengthComputable));
                            setUploadProgress(Math.min(100, percent));
                        }
                    } catch (err) {
                        // ignore progress errors
                    }
                }
            });

            // refresh dataset list after upload
            try {
                const listRes = await api.get(`/projects/${pid}/data-items?pageNumber=${dataPage}&pageSize=10`);
                const payload = listRes.data?.data ?? listRes.data;
                setDataSet(payload);
            } catch (err) {
                console.warn('Failed to refresh data items', err);
            }

            setUploadProgress(0);
            setSelectedFiles([]);
            setIsImportModalOpen(false);
            setActiveTab('Data Items');
            alert('Upload finished');
        } catch (err) {
            console.error('Upload failed', err);
            setUploadProgress(0);
            alert('Upload failed');
        }
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
        // Normalize backend deadline which may be null, DateOnly (yyyy-MM-dd) or ISO datetime
        console.log(project);
        if (project.deadline) {
            const d = String(project.deadline).slice(0, 10); // yyyy-MM-dd
            setEditDeadline(d);
        } else setEditDeadline('');
        setIsEditProjectOpen(true);
    };

    const handleSaveProjectUpdate = async () => {
        if (!editName.trim() || !editDescription.trim()) {
            alert('Name and description are required');
            return;
        }
        try {
            const payload = {
                name: editName,
                description: editDescription,

                // send DateOnly yyyy-MM-dd or null
                deadline: editDeadline ? String(editDeadline).slice(0, 10) : null
            };
            const res = await api.put(`/Projects/${pid}`, payload, { headers: { 'Content-Type': 'application/json' } });
            const statuspayload = {
                status: editStatus
            };
            const statusRes = await api.patch(`/Projects/${pid}/status`, statuspayload, { headers: { 'Content-Type': 'application/json' } });
            const updatedProject = res.data?.data ?? res.data ?? { ...project, ...payload };
            setProject(updatedProject);
            (async () => {
                try {
                    const response = await api.get(`/Projects/${pid}`);
                    const listLabelsResponse = await api.get(`/projects/${pid}/labels`);
                    const projectData = response.data?.data ?? response.data;
                    setProject(projectData);
                    setListLabels(listLabelsResponse.data?.data ?? listLabelsResponse.data);
                } catch (error) {
                    console.warn('Failed to fetch project details', error);
                }
            })();
            alert('Project updated');
        } catch (error) {
            console.warn('Update failed', error);
            alert('Failed to update project');
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
        { id: 'Data Items', icon: Database },
        { id: 'Labels', icon: Tag },
        { id: 'Tasks', icon: Layers },
    ];

    // TODO: Fetch project tasks from API
    const projectTasks = [];
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
                        {project.deadline && (
                            <span className="text-muted small ms-2">Deadline: {`${project.deadline.slice(8, 2 + 8)}/${project.deadline.slice(5, 7)}/${project.deadline.slice(0, 4)}`}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs navigation */}
            <TabsNav tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="bg-transparent animate-in fade-in" style={{ minHeight: '400px' }}>
                {activeTab === 'Overview' && (
                    <OverviewPanel project={project} openImportModal={() => setIsImportModalOpen(true)} openGuidelines={openGuidelines} openEditProject={openEditProject} />
                )}
                {activeTab === 'Data Items' && (
                    <DataItemsPanel dataSet={dataSet} dataLoading={dataLoading} dataPage={dataPage} setDataPage={setDataPage} onDeleteItem={handleDeleteDataItem} />
                )}
                {activeTab === 'Labels' && (
                    <LabelsPanel listLabels={listLabels} openAddLabel={openAddLabel} openEditLabelModal={openEditLabelModal} openDeleteLabelModal={openDeleteLabelModal} />
                )}
                {activeTab === 'Tasks' && (
                    <TasksPanel tasksByAssignee={tasksByAssignee} expandedTaskGroups={expandedTaskGroups} toggleGroup={toggleGroup} StatusBadge={StatusBadge} externalAssignTarget={externalAssignTarget} />
                )}
                {/* {activeTab === 'Annotators' && (
                    <div className="p-3">
                        <h5 className="mb-3">Annotators</h5>
                        {annotatorsLoading ? (
                            <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
                        ) : (
                            (annotators && annotators.length > 0) ? (
                                <div className="row g-3">
                                    {annotators.map((a) => (
                                        <div key={a.id} className="col-12 col-md-6 col-lg-4">
                                            <div className="border rounded p-3 d-flex justify-content-between align-items-center">
                                                <div>
                                                    <div className="fw-bold">{a.name}</div>
                                                    <div className="small text-muted">{a.email}</div>
                                                </div>
                                                <div className="text-center d-flex flex-column align-items-end gap-2">
                                                    <div className="small text-muted">Active</div>
                                                    <div className="h5 mb-0">{a.activeTaskCount ?? 0}</div>
                                                    <Button size="sm" className="mt-2" onClick={() => {
                                                        // ensure group expanded in Tasks tab and instruct TasksPanel to open assign modal
                                                        setExpandedTaskGroups(prev => ({ ...prev, [a.id]: true }));
                                                        setExternalAssignTarget({ ...a, __ts: Date.now() });
                                                        setActiveTab('Tasks');
                                                    }}>Assign</Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-muted">No annotators found.</div>
                            )
                        )}
                    </div>
                )} */}
            </div>

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
                        <Button variant="primary" onClick={() => setIsEditingGuidelines(true)} className="w-100 d-flex align-items-center justify-content-center gap-2"><Pencil size={16} /> Edit Guidelines</Button>
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
                        <Form.Control type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
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