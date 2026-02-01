import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Tag, Layers, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { MOCK_PROJECTS } from '../../services/mockData.js';
import { ProjectStatus } from '../../types.js';
import axios from 'axios';

export const ManagerProjects = ({ user }) => {
    const navigate = useNavigate();
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [projectType, setProjectType] = useState('1');
    const [projects, setProjects] = useState([]);
    
    // State để xử lý hiệu ứng hover cho từng card
    const [hoveredProject, setHoveredProject] = useState(null);

    const handleProjectClick = (project) => {
        navigate(`/manager/projects/${project.id}`);
    };

    useEffect(() => {
        (async () => {
            try {
                // Giữ nguyên logic API cũ của bạn
                const p = await axios.get(import.meta.env.VITE_URL + "/api/Project/manager/" + user.user.id);
                // setProjects(p.data); 
            } catch (e) {
                console.log(e);
            }
        })();
    }, []);

    const handleCreateProject = async () => {
        try {
            const response = await axios.post(import.meta.env.VITE_URL + "/Projects", {
                name: projectName,
                description: projectDescription,
                type: parseInt(projectType)
            }, {
                headers: {
                    'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user')).token}`
                }
            });
            alert("Project created successfully");
        } catch (error) {
            alert("Failed to create project");
            console.error("Error creating project:", error.response || error.message);
        }

        setProjectName('');
        setProjectDescription('');
        setProjectType('1');
        setIsCreateProjectModalOpen(false);
    };

    // Component Badge hiển thị trạng thái đẹp hơn với icon
    const StatusBadge = ({ status }) => {
        const config = {
            [ProjectStatus.PENDING]: { bg: '#fff7ed', text: '#c2410c', icon: Clock, label: 'Pending' }, 
            [ProjectStatus.FINISHED]: { bg: '#ecfdf5', text: '#047857', icon: CheckCircle2, label: 'Finished' },
            [ProjectStatus.NOT_STARTED]: { bg: '#f1f5f9', text: '#475569', icon: AlertCircle, label: 'Not Started' },
            [ProjectStatus.CANCELLED]: { bg: '#fef2f2', text: '#b91c1c', icon: XCircle, label: 'Cancelled' },
        };

        const style = config[status] || config[ProjectStatus.NOT_STARTED];
        const Icon = style.icon;

        return (
            <span className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill border" 
                  style={{ 
                      backgroundColor: style.bg, 
                      color: style.text, 
                      borderColor: 'transparent', 
                      fontSize: '0.75rem', 
                      fontWeight: 600 
                  }}>
                <Icon size={12} />
                {status ? status.replace(/_/g, ' ') : style.label}
            </span>
        );
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
                {MOCK_PROJECTS.map((project) => {
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
                                    <div className="pt-3 mt-3 border-top d-flex justify-content-between align-items-center text-muted" style={{ fontSize: '0.8rem' }}>
                                        <div className="d-flex align-items-center gap-1">
                                            <Calendar size={14} />
                                            <span>{new Date(project.createdDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-1 bg-light px-2 py-1 rounded">
                                            <Tag size={13} />
                                            <span className="fw-medium">{project.classes?.length || 0} Labels</span>
                                        </div>
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
                                                onChange={(e) => setProjectType(e.target.value)}
                                                className="form-select"
                                                style={{ borderRadius: '8px', padding: '10px' }}
                                            >
                                                <option value="1">Classification</option>
                                                <option value="2">Object Detection</option>
                                                <option value="3">Segmentation</option>
                                            </select>
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
                                        disabled={!projectName.trim() || !projectDescription.trim()}
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