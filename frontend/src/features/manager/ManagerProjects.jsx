import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Calendar, Tag, Layers, Clock, CheckCircle2, AlertCircle, XCircle, Trash2 } from 'lucide-react';
import { ProjectStatus } from '../../shared/types/types.js';
import axios from 'axios';
import api from '../../shared/utils/api.js';
import getInforFromCookie from '../../shared/utils/getInfoFromCookie.js';
import StatusBadge from '../../shared/components/StatusBadge.jsx';
import ProjectList from './components/ProjectList';

export const ManagerProjects = ({ user }) => {
    const navigate = useNavigate();
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [projectType, setProjectType] = useState('Classification');
    const [projectDeadline, setProjectDeadline] = useState('');
    const [deadlineError, setDeadlineError] = useState('');
    const [projects, setProjects] = useState([]);
    const pageLength = 12;
    // State để xử lý hiệu ứng hover cho từng card
    const [hoveredProject, setHoveredProject] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const handleProjectClick = (project) => {
        const convertProjectId = project.id + "";
        navigate(`/manager/projects/${convertProjectId}`);
    };
    const [param] = useSearchParams();
    const page = param.get("page") || 1;
    useEffect(() => {
        (async () => {
            try {
                let url = `/Projects/?pageNumber=${page}&pageSize=${pageLength}`;
                if (statusFilter) {
                    url += `&status=${statusFilter}`;
                }
                if (searchTerm) {
                    url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
                }
                const p = await api.get(url);
                setProjects(p.data.data.items);
                console.log(p.data.data.items);
            } catch (e) {
                console.log(e);
            }
        })();
    }, [page, statusFilter, searchTerm]);

    const handleCreateProject = async () => {
        try {
            if (!projectDeadline.trim() || deadlineError) {
                alert('Please enter a valid deadline in dd/mm/yyyy format');
                return;
            }

            // Convert dd/mm/yyyy to yyyy-MM-dd string for backend (DateOnly)
            const [dd, mm, yyyy] = projectDeadline.split('/').map(Number);
            const mmStr = String(mm).padStart(2, '0');
            const ddStr = String(dd).padStart(2, '0');
            const deadlinePayload = `${yyyy}-${mmStr}-${ddStr}`;
            const payload = {
                name: projectName,
                description: projectDescription,
                type: projectType,
                deadline: deadlinePayload
            };
            console.log('Payload for API:', payload); // Debugging log
            const response = await api.post("/Projects", payload, {
                headers: {
                    'Authorization': `Bearer ${getInforFromCookie().token}`
                }
            });
            alert("Project created successfully");
            let url = `/Projects/?pageNumber=${page}&pageSize=${pageLength}`;
            if (statusFilter) {
                url += `&status=${statusFilter}`;
            }
            if (searchTerm) {
                url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
            }
            const p = await api.get(url);
            setProjects(p.data.data.items);
        } catch (error) {
            if (error.response) {
                alert(error.response.data.errors || 'Failed to create project');
            }

            console.error(error.response.data.errors || error.message);
        }

        setProjectName('');
        setProjectDescription('');
        setProjectType('Classification');
        setProjectDeadline('');
        setDeadlineError('');
        setIsCreateProjectModalOpen(false);
    };

    const handleDeleteProject = async (projectId, e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        const ok = window.confirm('Delete this project? This cannot be undone.');
        if (!ok) return;
        try {
            await api.delete(`/Projects/${projectId}`);
            setProjects(prev => prev.filter(p => p.id !== projectId));
            alert('Project deleted');
        } catch (err) {
            console.error('Delete project failed', err.response || err.message);
            alert('Failed to delete project');
        }
    };

    // Component Badge hiển thị trạng thái đẹp hơn với icon


    const validateDeadline = (value) => {
        if (!value) return 'Deadline is required';
        const regex = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
        if (!regex.test(value)) return 'Format must be dd/mm/yyyy';
        const [dd, mm, yyyy] = value.split('/').map(Number);
        const dt = new Date(yyyy, mm - 1, dd);
        if (dt.getFullYear() !== yyyy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) return 'Invalid date';
        return '';
    };

    return (
        <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>

            {/* Header Section */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-5">
                <div>
                    <h2 className="h3 fw-bold text-dark mb-1">All Projects</h2>
                    <p className="text-secondary mb-0">Manage annotation initiatives and datasets.</p>
                </div>
                <button
                    onClick={() => setIsCreateProjectModalOpen(true)}
                    className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 shadow-sm"
                    style={{ borderRadius: '10px', fontWeight: 500 }}
                >
                    <Plus size={18} />
                    <span className="d-none d-sm-inline">Create New Project</span>
                    <span className="d-inline d-sm-none">Create</span>
                </button>
            </div>

            {/* Filter Section */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                <div className="card-body p-4">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label fw-semibold small text-dark">Search Projects</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="form-control"
                                placeholder="Search by project name..."
                                style={{ borderRadius: '8px', padding: '10px' }}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold small text-dark">Filter by Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="form-select"
                                style={{ borderRadius: '8px', padding: '10px' }}
                            >
                                <option value="">All Status</option>
                                <option value="Draft">Draft</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="Archived">Archived</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Projects Grid */}
            <ProjectList projects={projects} onProjectClick={handleProjectClick} onDelete={handleDeleteProject} />

            {/* Create Project Modal */}
            {isCreateProjectModalOpen && (
                <>
                    <div className="modal-backdrop fade show" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}></div>
                    <div className="modal fade show d-block" tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                                <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
                                    <h5 className="modal-title fw-bold h5">Create New Project</h5>
                                    <button onClick={() => setIsCreateProjectModalOpen(false)} className="btn-close shadow-none"></button>
                                </div>

                                <div className="modal-body p-4">
                                    <div className="d-flex flex-column gap-3">
                                        <div>
                                            <label className="form-label fw-semibold small text-dark">Project Name</label>
                                            <input
                                                type="text"
                                                value={projectName}
                                                onChange={(e) => setProjectName(e.target.value)}
                                                className="form-control"
                                                placeholder="Enter project name..."
                                                style={{ borderRadius: '8px', padding: '10px' }}
                                            />
                                        </div>

                                        <div>
                                            <label className="form-label fw-semibold small text-dark">Description</label>
                                            <textarea
                                                value={projectDescription}
                                                onChange={(e) => setProjectDescription(e.target.value)}
                                                className="form-control"
                                                rows="3"
                                                placeholder="Describe the project objectives..."
                                                style={{ borderRadius: '8px', padding: '10px', resize: 'none' }}
                                            />
                                        </div>

                                        <div>
                                            <label className="form-label fw-semibold small text-dark">Project Type</label>
                                            <select
                                                value={projectType}
                                                onChange={(e) => setProjectType(e.currentTarget.value)}
                                                className="form-select"
                                                style={{ borderRadius: '8px', padding: '10px' }}
                                            >
                                                <option value="Classification">Classification</option>
                                                <option value="ObjectDetection">Object Detection</option>
                                                <option value="Segmentation">Segmentation</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="form-label fw-semibold small text-dark">Deadline (dd/mm/yyyy)</label>
                                            <input
                                                type="text"
                                                value={projectDeadline}
                                                onChange={(e) => {
                                                    setProjectDeadline(e.target.value);
                                                    setDeadlineError(validateDeadline(e.target.value));
                                                }}
                                                className="form-control"
                                                placeholder="dd/mm/yyyy"
                                                style={{ borderRadius: '8px', padding: '10px' }}
                                            />
                                            {deadlineError && <div className="text-danger small mt-1">{deadlineError}</div>}
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer border-top-0 px-4 pb-4 pt-0">
                                    <button
                                        onClick={() => setIsCreateProjectModalOpen(false)}
                                        className="btn btn-light text-muted fw-medium px-4"
                                        style={{ borderRadius: '8px' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateProject}
                                        disabled={!projectName.trim() || !projectDescription.trim() || !projectDeadline.trim() || Boolean(deadlineError)}
                                        className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm"
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <Plus size={18} />
                                        Create Project
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};