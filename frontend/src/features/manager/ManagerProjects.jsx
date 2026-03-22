import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Calendar, Tag, Layers, Clock, CheckCircle2, AlertCircle, XCircle, Trash2 } from 'lucide-react';
import { ProjectStatus } from '../../shared/types/types.js';
import axios from 'axios';
import api from '../../shared/utils/api.js';
import getInforFromCookie from '../../shared/utils/getInfoFromCookie.js';
import StatusBadge from '../../shared/components/StatusBadge.jsx';
import ProjectList from './components/ProjectList';
import { useAlert } from '../../shared/context/AlertContext.jsx';
import { useConfirm } from '../../shared/context/ConfirmContext.jsx';
import { useUI } from '../../shared/context/UIContext.jsx';

const copy = {
    en: {
        title: 'All Projects',
        subtitle: 'Manage annotation initiatives and datasets.',
        create: 'Create New Project',
        createShort: 'Create',
        searchLabel: 'Search Projects',
        searchPlaceholder: 'Search by project name...',
        filterLabel: 'Filter by Status',
        allStatus: 'All Status',
        createModalTitle: 'Create New Project',
        projectName: 'Project Name',
        projectNamePlaceholder: 'Enter project name...',
        description: 'Description',
        descriptionPlaceholder: 'Describe the project objectives...',
        projectType: 'Project Type',
        deadline: 'Deadline',
        deadlinePlaceholder: 'Select a date',
        cancel: 'Cancel',
        save: 'Create Project',
        typeClassification: 'Classification',
        typeObjectDetection: 'Object Detection',
        typeSegmentation: 'Segmentation',
        validateDeadline: 'Please select a valid deadline',
        successCreate: 'Project created successfully',
        successDelete: 'Project deleted',
        deleteLabel: 'Delete',
    },
    vi: {
        title: 'Tat ca du an',
        subtitle: 'Quan ly cac du an gan nhan va tap du lieu.',
        create: 'Tao du an moi',
        createShort: 'Tao',
        searchLabel: 'Tim du an',
        searchPlaceholder: 'Tim theo ten du an...',
        filterLabel: 'Loc theo trang thai',
        allStatus: 'Tat ca trang thai',
        createModalTitle: 'Tao du an moi',
        projectName: 'Ten du an',
        projectNamePlaceholder: 'Nhap ten du an...',
        description: 'Mo ta',
        descriptionPlaceholder: 'Mo ta muc tieu du an...',
        projectType: 'Loai du an',
        deadline: 'Han chot',
        deadlinePlaceholder: 'Chon ngay',
        cancel: 'Huy',
        save: 'Tao du an',
        typeClassification: 'Phan loai',
        typeObjectDetection: 'Phat hien doi tuong',
        typeSegmentation: 'Phan vung',
        validateDeadline: 'Vui long chon han chot hop le',
        successCreate: 'Tao du an thanh cong',
        successDelete: 'Du an da xoa',
        deleteLabel: 'Xoa',
    },
};

export const ManagerProjects = ({ user }) => {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const { showConfirm } = useConfirm();
    const { language, theme } = useUI();
    const t = useMemo(() => copy[language] || copy.en, [language]);
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

    const hydrateLabelCounts = async (items) => {
        const list = Array.isArray(items) ? items : [];

        const enriched = await Promise.all(list.map(async (project) => {
            try {
                const detailResponse = await api.get(`/Projects/${project.id}`);
                const detail = detailResponse?.data?.data ?? detailResponse?.data ?? {};
                return {
                    ...project,
                    labelCount: detail.labelCount ?? project.labelCount ?? project.LabelCount ?? project.classes?.length ?? project.labels?.length ?? 0,
                };
            } catch (error) {
                return {
                    ...project,
                    labelCount: project.labelCount ?? project.LabelCount ?? project.classes?.length ?? project.labels?.length ?? 0,
                };
            }
        }));

        return enriched;
    };

    const handleProjectClick = (project) => {
        const convertProjectId = project.id + "";
        navigate(`/manager/projects/${convertProjectId}`);
    };
    const [param] = useSearchParams();
    const page = param.get("page") || 1;
    useEffect(() => {
        (async () => {
            let mounted = true;
            try {
                let url = `/Projects/?pageNumber=${page}&pageSize=${pageLength}`;
                if (statusFilter) {
                    url += `&status=${statusFilter}`;
                }
                if (searchTerm) {
                    url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
                }
                const p = await api.get(url);
                const items = p?.data?.data?.items || [];
                const enrichedItems = await hydrateLabelCounts(items);
                if (mounted) {
                    setProjects(enrichedItems);
                }
                console.log(enrichedItems);
            } catch (e) {
                console.log(e);
            }
            return () => {
                mounted = false;
            };
        })();
    }, [page, statusFilter, searchTerm]);

    const handleCreateProject = async () => {
        try {
            if (!projectDeadline.trim() || deadlineError) {
                await showAlert(t.validateDeadline, 'Validation', 'warning');
                return;
            }

            const deadlinePayload = projectDeadline;
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

            // Close modal and reset form immediately so the UI reflects success
            setIsCreateProjectModalOpen(false);
            setProjectName('');
            setProjectDescription('');
            setProjectType('Classification');
            setProjectDeadline('');
            setDeadlineError('');

            await showAlert(t.successCreate, 'Success', 'success');

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
                await showAlert(error.response.data.errors || 'Failed to create project', 'Error', 'error');
            }

            console.error(error.response.data.errors || error.message);
        }

        // Note: form reset and modal close handled on success above
    };

    const handleDeleteProject = async (projectId, e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        const confirmed = await showConfirm('Delete this project? This cannot be undone.', 'Confirm delete', 'danger', 'Delete', 'Cancel');
        if (!confirmed) return;
        try {
            await api.delete(`/Projects/${projectId}`);
            setProjects(prev => prev.filter(p => p.id !== projectId));
            await showAlert(t.successDelete, 'Success', 'success');
        } catch (err) {
            console.error('Delete project failed', err.response || err.message);
            await showAlert('Failed to delete project', 'Error', 'error');
        }
    };

    // Component Badge hiển thị trạng thái đẹp hơn với icon


    const validateDeadline = (value) => {
        if (!value) return 'Deadline is required';
        const dt = new Date(`${value}T00:00:00`);
        if (Number.isNaN(dt.getTime())) return 'Invalid date';
        
        // Check if date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dt < today) return 'Deadline cannot be in the past';
        
        // Check if date is in current year (2026)
        const currentYear = new Date().getFullYear();
        if (dt.getFullYear() !== currentYear) {
            return `Deadline must be in ${currentYear}`;
        }
        
        return '';
    };

    return (
        <div
            className="container-fluid py-4 manager-page-surface"
            data-theme={theme}
        >

            {/* Header Section */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-5">
                <div>
                    <h2 className="h3 fw-bold text-dark mb-1">{t.title}</h2>
                    <p className="text-secondary mb-0">{t.subtitle}</p>
                </div>
                <button
                    onClick={() => setIsCreateProjectModalOpen(true)}
                    className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 shadow-sm"
                    style={{ borderRadius: '10px', fontWeight: 500 }}
                >
                    <Plus size={18} />
                    <span className="d-none d-sm-inline">{t.create}</span>
                    <span className="d-inline d-sm-none">{t.createShort}</span>
                </button>
            </div>

            {/* Filter Section */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                <div className="card-body p-4">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label fw-semibold small text-dark">{t.searchLabel}</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="form-control"
                                placeholder={t.searchPlaceholder}
                                style={{ borderRadius: '8px', padding: '10px' }}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold small text-dark">{t.filterLabel}</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="form-select"
                                style={{ borderRadius: '8px', padding: '10px' }}
                            >
                                <option value="">{t.allStatus}</option>
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
                <div className="modal fade show d-block nl-modal-overlay" tabIndex="-1" onClick={() => setIsCreateProjectModalOpen(false)}>
                    <div className="modal-dialog modal-dialog-centered nl-modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content nl-modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                            <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
                                <h5 className="modal-title fw-bold h5">{t.createModalTitle}</h5>
                                <button onClick={() => setIsCreateProjectModalOpen(false)} className="btn-close shadow-none"></button>
                            </div>

                            <div className="modal-body p-4">
                                <div className="d-flex flex-column gap-3">
                                    <div>
                                        <label className="form-label fw-semibold small text-dark">{t.projectName}</label>
                                        <input
                                            type="text"
                                            value={projectName}
                                            onChange={(e) => setProjectName(e.target.value)}
                                            className="form-control"
                                            placeholder={t.projectNamePlaceholder}
                                            style={{ borderRadius: '8px', padding: '10px' }}
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label fw-semibold small text-dark">{t.description}</label>
                                        <textarea
                                            value={projectDescription}
                                            onChange={(e) => setProjectDescription(e.target.value)}
                                            className="form-control"
                                            rows="3"
                                            placeholder={t.descriptionPlaceholder}
                                            style={{ borderRadius: '8px', padding: '10px', resize: 'none' }}
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label fw-semibold small text-dark">{t.projectType}</label>
                                        <select
                                            value={projectType}
                                            onChange={(e) => setProjectType(e.currentTarget.value)}
                                            className="form-select"
                                            style={{ borderRadius: '8px', padding: '10px' }}
                                        >
                                            <option value="Classification">{t.typeClassification}</option>
                                            <option value="ObjectDetection">{t.typeObjectDetection}</option>
                                            <option value="Segmentation">{t.typeSegmentation}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label fw-semibold small text-dark">{t.deadline}</label>
                                        <input
                                            type="date"
                                            value={projectDeadline}
                                            onChange={(e) => {
                                                setProjectDeadline(e.target.value);
                                                setDeadlineError(validateDeadline(e.target.value));
                                            }}
                                            className={`form-control ${deadlineError ? 'is-invalid' : ''}`}
                                            placeholder={t.deadlinePlaceholder}
                                            style={{ borderRadius: '8px', padding: '10px' }}
                                            min={new Date().toISOString().split('T')[0]}
                                            max={`${new Date().getFullYear()}-12-31`}
                                        />
                                        {deadlineError ? (
                                            <div className="invalid-feedback d-block">{deadlineError}</div>
                                        ) : (
                                            <div className="form-text">Deadline must be in {new Date().getFullYear()} and not in the past</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer border-top-0 px-4 pb-4 pt-0">
                                <button
                                    onClick={() => setIsCreateProjectModalOpen(false)}
                                    className="btn btn-light text-muted fw-medium px-4"
                                    style={{ borderRadius: '8px' }}
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    onClick={handleCreateProject}
                                    disabled={!projectName.trim() || !projectDescription.trim() || !projectDeadline.trim() || Boolean(deadlineError)}
                                    className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm"
                                    style={{ borderRadius: '8px' }}
                                >
                                    <Plus size={18} />
                                    {t.save}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};