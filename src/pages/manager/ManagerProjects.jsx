import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Tag, Layers } from 'lucide-react';
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
    const handleProjectClick = (project) => {
        navigate(`/manager/projects/${project.id}`);
    };
    useEffect(() => {
        (async () => {
            const p = await axios.get(import.meta.env.VITE_URL + "/api/Project/manager/" + user.user.id);
        })();
        //no /api/Project/manager/{managerId} endpoint in the backend yet (Chi Hung)
    }, []);

    const handleCreateProject = async () => {
        try {

            const response = await api.post("/Projects", {
                name: projectName,
                description: projectDescription,
                type: parseInt(projectType)
            }, {
                headers: {
                    'Authorization': `Bearer ${getInforFromCookie().token}`
                }
            });
            alert("Project created successfully");
            //there is no // /api/Project endpoint in the backend yet (Chi Hung)
        } catch (error) {
            alert("Failed to create project");
            console.error("Error creating project:", error.response || error.message);
        }

        //there is no // /api/Project endpoint in the backend yet(Chi Hung)
        setProjectName('');
        setProjectDescription('');
        setProjectType('1');
        setIsCreateProjectModalOpen(false);
    };
    const StatusBadge = ({ status }) => {
        const styles = {
            [ProjectStatus.PENDING]: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            [ProjectStatus.FINISHED]: 'bg-green-50 text-green-700 border-green-200',
            [ProjectStatus.NOT_STARTED]: 'bg-slate-50 text-slate-600 border-slate-200',
            [ProjectStatus.CANCELLED]: 'bg-red-50 text-red-700 border-red-200',
        };

        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
                {status.replace(/_/g, ' ')}
            </span>
        );
    };

    return (
        <div className="h-100 d-flex flex-column gap-4 animate-in fade-in duration-300">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
                <div>
                    <h2 className="h5 fw-semibold text-dark">All Projects</h2>
                    <p className="small text-muted">Manage annotation initiatives and datasets</p>
                </div>
                <button
                    onClick={() => setIsCreateProjectModalOpen(true)}
                    className="btn btn-primary d-flex align-items-center gap-2 w-100 w-sm-auto justify-content-center"
                >
                    <Plus size={16} />
                    Create Project
                </button>
            </div>

            <div className="row g-4">
                {MOCK_PROJECTS.map((project) => (
                    <div key={project.id} className="col-12 col-md-6 col-xl-4">
                        <div
                            onClick={() => handleProjectClick(project)}
                            className="card border shadow-sm h-100 cursor-pointer"
                            style={{ transition: 'all 0.3s', cursor: 'pointer' }}
                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0,0,0,0.15)'}
                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = ''}
                        >
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className={`p-2 rounded ${project.type === 'IMAGE_BOUNDING_BOX' ? 'bg-blue-light text-primary' : 'bg-purple-light text-purple'}`}>
                                        <Layers size={20} />
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <p style={{ marginBottom: 0 }}>Image</p>
                                        <StatusBadge status={project.status} />
                                    </div>
                                </div>

                                <h3 className="h6 fw-semibold mb-2">{project.name}</h3>
                                <p className="small text-muted mb-3" style={{ minHeight: '2.5rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    {project.description}
                                </p>

                                <div className="mb-3">
                                    <div className="d-flex justify-content-between small text-muted mb-2">
                                        <span>Progress</span>
                                        <span className="fw-medium text-dark">{Math.round((project.completedItems / project.totalItems) * 100) || 0}%</span>
                                    </div>
                                    <div className="progress" style={{ height: '6px' }}>
                                        <div
                                            className="progress-bar bg-primary"
                                            style={{ width: `${(project.completedItems / project.totalItems) * 100 || 0}%`, transition: 'width 1s' }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="pt-3 border-top d-flex justify-content-between align-items-center small text-muted">
                                    <div className="d-flex align-items-center gap-2">
                                        <Calendar size={14} />
                                        <span>{project.createdDate}</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <Tag size={14} />
                                        <span>{project.classes.length} Labels</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Project Modal */}
            {isCreateProjectModalOpen && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-light">
                                <div className="d-flex align-items-center gap-2">
                                    <Plus size={20} className="text-primary" />
                                    <h5 className="modal-title mb-0">Create New Project</h5>
                                </div>
                                <button onClick={() => setIsCreateProjectModalOpen(false)} className="btn-close"></button>
                            </div>

                            <div className="modal-body">
                                <div className="d-flex flex-column gap-3">
                                    <div>
                                        <label className="form-label fw-semibold">Project Name</label>
                                        <input
                                            type="text"
                                            value={projectName}
                                            onChange={(e) => setProjectName(e.target.value)}
                                            className="form-control"
                                            placeholder="Enter project name..."
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label fw-semibold">Description</label>
                                        <textarea
                                            value={projectDescription}
                                            onChange={(e) => setProjectDescription(e.target.value)}
                                            className="form-control"
                                            rows="3"
                                            placeholder="Describe the project objectives..."
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label fw-semibold">Project Type</label>
                                        <select
                                            value={projectType}
                                            onChange={(e) => setProjectType(e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="1">Classification</option>
                                            <option value="2">Object Detection</option>
                                            <option value="3">Segmentation</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer bg-light">
                                <button
                                    onClick={() => setIsCreateProjectModalOpen(false)}
                                    className="btn btn-light"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateProject}
                                    disabled={!projectName.trim() || !projectDescription.trim()}
                                    className="btn btn-primary d-flex align-items-center gap-2"
                                >
                                    <Plus size={16} />
                                    Create Project
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


