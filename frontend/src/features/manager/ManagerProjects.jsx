import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Calendar, Tag, Layers, Clock, CheckCircle2, AlertCircle, XCircle, Trash2 } from 'lucide-react';
import { MOCK_PROJECTS } from '../../shared/services/mockData.js';
import { ProjectStatus } from '../../shared/types/types.js';
import axios from 'axios';
import api from '../../shared/utils/api.js';
import getInforFromCookie from '../../shared/utils/getInfoFromCookie.js';
import StatusBadge from '../../shared/components/StatusBadge.jsx';

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

    const handleProjectClick = (project) => {
        const convertProjectId = project.id + "";
        navigate(`/manager/projects/${convertProjectId}`);
    };
    const [param] = useSearchParams();
    const page = param.get("page") || 1;
    useEffect(() => {
        (async () => {
            try {
                const p = await api.get(`/Projects/?pageNumber=${page}&pageSize=${pageLength}`);
                setProjects(p.data.data.items);
                console.log(p.data.data.items);
            } catch (e) {
                console.log(e);
            }
        })();
    }, [page]);

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
            const p = await api.get(`/Projects/?pageNumber=${page}&pageSize=${pageLength}`);
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

            {/* Projects Grid */}
            <div className="row g-4">
                {projects.map((project) => {
                    const isHovered = hoveredProject === project.id;
                    const progress = project.totalItems > 0 ? Math.round((project.completedItems / project.totalItems) * 100) : 0;

                    return (
                        <div key={project.id} className="col-12 col-md-6 col-xl-4">
                            <div
                                onClick={() => handleProjectClick(project)}
                                onMouseEnter={() => setHoveredProject(project.id)}
                                onMouseLeave={() => setHoveredProject(null)}
                                className="card h-100 border-0 bg-white"
                                style={{
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
                                    boxShadow: isHovered
                                        ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                                        : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                <div className="card-body p-4 d-flex flex-column">
                                    {/* Card Header */}
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="p-2 rounded-3"
                                            style={{
                                                backgroundColor: project.type === 'IMAGE_BOUNDING_BOX' ? '#eff6ff' : '#f5f3ff', // Blue-50 or Violet-50
                                                color: project.type === 'IMAGE_BOUNDING_BOX' ? '#2563eb' : '#7c3aed'
                                            }}>
                                            <Layers size={22} />
                                        </div>
                                        <StatusBadge status={project.status} />
                                    </div>

                                    {/* Card Content */}
                                    <div className="mb-3">
                                        <h3 className="h6 fw-bold text-dark mb-2 text-truncate">{project.name}</h3>
                                        <h3 className="text-muted small mb-2">Id: {project.id}</h3>
                                        <p className="text-muted small mb-0" style={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            height: '2.6em',
                                            lineHeight: '1.3em'
                                        }}>
                                            {project.description}
                                        </p>
                                    </div>

                                    {/* Progress Section */}
                                    <div className="mt-auto">
                                        <div className='text-muted small mb-1 fw-medium'>
                                            <span>Type: {project.type === 'ObjectDetection' ? 'Object Detection' : project.type}</span>
                                        </div>
                                        <div className="d-flex justify-content-between text-muted small mb-1 fw-medium">
                                            <span>Progress</span>
                                            <span className="text-dark">{progress}%</span>
                                        </div>
                                        <div className="progress" style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '10px' }}>
                                            <div
                                                className="progress-bar"
                                                role="progressbar"
                                                style={{
                                                    width: `${progress}%`,
                                                    backgroundColor: progress === 100 ? '#10b981' : '#4f46e5',
                                                    borderRadius: '10px',
                                                    transition: 'width 0.5s ease'
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="pt-3 mt-3 border-top d-flex justify-content-between text-muted" style={{ fontSize: '0.8rem', flexDirection: 'column' }}>
                                        <div className="d-flex align-items-center gap-1">
                                            <Calendar size={14} />
                                            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="d-flex gap-3">
                                            <div className="d-flex align-items-center gap-1">
                                                <Calendar size={14} />
                                                <span>Deadline:{new Date(project.deadline).toLocaleDateString()}</span>
                                            </div>
                                            <div className="d-flex align-items-center gap-1 bg-light px-2 py-1 rounded">
                                                <Tag size={13} />
                                                <span className="fw-medium">{project.classes?.length || 0} Labels</span>
                                            </div>
                                        </div>

                                    </div>
                                    <div className="d-flex justify-content-end mt-2">
                                        <button onClick={(e) => handleDeleteProject(project.id, e)} className="btn btn-sm btn-danger d-flex align-items-center gap-2">
                                            <Trash2 size={14} />
                                            <span className="d-none d-sm-inline">Delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

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