import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../shared/utils/api.js';
import { useAlert } from '../../shared/context/AlertContext.jsx';
import { useConfirm } from '../../shared/context/ConfirmContext.jsx';
import ManagerProjectDetailsUI from './components/ManagerProjectDetails';

export const ManagerProjectDetails = ({ user }) => {
    const { pid } = useParams();
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const { showConfirm } = useConfirm();
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
    const [guidelineFile, setGuidelineFile] = useState(null);
    const [guidelineInfo, setGuidelineInfo] = useState({
        fileName: '',
        fileSize: 0,
        contentType: '',
        fileUrl: '',
        updatedAt: null,
    });
    const [isGuidelineSaving, setIsGuidelineSaving] = useState(false);
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
    const [editStatus, setEditStatus] = useState(null);
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
                const res = await api.get(`/projects/${pid}/data-items`, { params: { pageNumber: dataPage, pageSize: 10 } });
                const payload = res.data || {};
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
        const confirmed = await showConfirm('Delete this data item? This cannot be undone.', 'Confirm delete', 'danger', 'Delete', 'Cancel');
        if (!confirmed) return;
        try {
            await api.delete(`/data-items/${id}`);
            setDataSet(prev => {
                if (!prev) return prev;
                const items = (prev.items || []).filter(i => i.id !== id);
                const total = Math.max(0, (prev.totalCount || 0) - 1);
                return { ...prev, items, totalCount: total };
            });
            await showAlert('Item deleted', 'Success', 'success');
        } catch (err) {
            console.error('Delete data item failed', err);
            await showAlert('Failed to delete item', 'Error', 'error');
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
    const handleDeleteProject = async () => {
        if ((project?.taskCount || 0) > 0) {
            await showAlert('This project still has tasks, so it cannot be deleted.', 'Error', 'error');
            setShowDeleteModal(false);
            return;
        }
        try {
            await api.delete(`/Projects/${pid}`);
            await showAlert('Project deleted', 'Success', 'success');
            navigate('/manager/projects');
        } catch (error) {
            await showAlert('Failed to delete project. Read the note below the Delete button for more information.', 'Error', 'error');
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
                const listRes = await api.get(`/projects/${pid}/data-items`, { params: { pageNumber: dataPage, pageSize: 10 } });
                const payload = listRes.data || {};
                setDataSet(payload);
            } catch (err) {
                console.warn('Failed to refresh data items', err);
            }

            setUploadProgress(0);
            setSelectedFiles([]);
            setIsImportModalOpen(false);
            setActiveTab('Data Items');
            await showAlert('Upload finished', 'Success', 'success');
        } catch (err) {
            console.error('Upload failed', err);
            setUploadProgress(0);
            await showAlert('Upload failed', 'Error', 'error');
        }
    };

    // --- LOGIC: Guidelines ---
    const loadGuidelines = async () => {
        if (!pid) return;
        try {
            const response = await api.get(`/Projects/${pid}/guideline`);
            const guideline = response.data?.data ?? response.data ?? {};
            setGuidelinesText(guideline.content || '');
            setGuidelineInfo({
                fileName: guideline.fileName || '',
                fileSize: guideline.fileSize || 0,
                contentType: guideline.contentType || '',
                fileUrl: guideline.fileUrl || '',
                updatedAt: guideline.updatedAt || null,
            });
        } catch (error) {
            console.warn('Failed to load guideline', error);
            setGuidelinesText('');
            setGuidelineInfo({
                fileName: '',
                fileSize: 0,
                contentType: '',
                fileUrl: '',
                updatedAt: null,
            });
        }
    };

    const openGuidelines = async () => {
        if (!project) return;
        setIsEditingGuidelines(false);
        setGuidelineFile(null);
        await loadGuidelines();
        setIsGuidelinesModalOpen(true);
    };

    const handleGuidelineFileSelect = (event) => {
        const file = event.target.files?.[0] ?? null;
        setGuidelineFile(file);

        if (!file) return;

        const isTextLikeFile =
            (file.type && file.type.startsWith('text/')) ||
            /\.(txt|md|csv|json|xml|log)$/i.test(file.name);

        if (!isTextLikeFile) return;

        const reader = new FileReader();
        reader.onload = () => {
            const content = typeof reader.result === 'string' ? reader.result : '';
            setGuidelinesText(content);
        };
        reader.onerror = () => {
            console.warn('Failed to read guideline file content');
        };
        reader.readAsText(file);
    };

    const handleSaveGuidelines = async () => {
        if (!project) return;
        try {
            setIsGuidelineSaving(true);
            const fileName = guidelineFile?.name || `${project.name || 'guideline'}.txt`;
            const fileToUpload = guidelineFile || new File([guidelinesText || ''], fileName, { type: 'text/plain' });
            const form = new FormData();
            form.append('file', fileToUpload);
            await api.post(`/Projects/${pid}/guideline/upload`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await loadGuidelines();
            setGuidelineFile(null);
            setIsEditingGuidelines(false);
            await showAlert('Guideline saved', 'Success', 'success');
        } catch (error) {
            console.warn('Failed to save guideline', error);
            await showAlert('Failed to save guideline', 'Error', 'error');
        } finally {
            setIsGuidelineSaving(false);
        }
    };

    const handleDownloadGuideline = async () => {
        try {
            const downloadUrl = guidelineInfo.fileUrl || `/Projects/${pid}/guideline/download`;
            const response = await api.get(downloadUrl, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
            const objectUrl = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = objectUrl;
            anchor.download = guidelineInfo.fileName || 'guideline';
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(objectUrl);
        } catch (error) {
            console.warn('Failed to download guideline', error);
            await showAlert('Failed to download guideline', 'Error', 'error');
        }
    };

    // --- LOGIC: Edit Project ---
    const openEditProject = () => {
        if (!project) return;
        setEditName(project.name || '');
        setEditDescription(project.description || '');
        setEditStatus(project.status || null);
        // Normalize backend deadline which may be null, DateOnly (yyyy-MM-dd) or ISO datetime
        if (project.deadline) {
            const d = String(project.deadline).slice(0, 10); // yyyy-MM-dd
            setEditDeadline(d);
        } else setEditDeadline('');
        setIsEditProjectOpen(true);
    };

    const handleSaveProjectUpdate = async () => {
        if (!editName.trim() || !editDescription.trim()) {
            await showAlert('Name and description are required', 'Validation', 'warning');
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
            await showAlert('Project updated', 'Success', 'success');
        } catch (error) {
            console.warn('Update failed', error);
            await showAlert('Failed to update project', 'Error', 'error');
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
            const res = await api.post(`/projects/${pid}/labels`, { name: newLabelName, color: newLabelColor }, { headers: { 'Content-Type': 'application/json' } });
            const created = res.data?.data ?? res.data;
            if (created && created.id) {
                setListLabels(prev => [...prev, created]);
            } else {
                // Fallback to optimistic entry if API did not return id
                setListLabels(prev => [...prev, { id: `label-${Date.now()}`, name: newLabelName, color: newLabelColor }]);
            }
            setNewLabelName('');
            setNewLabelColor('#000000');
            setAddLabelError('');
        } catch (error) {
            console.error('Create label failed', error);
            await showAlert('Failed to create label', 'Error', 'error');
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

    const openDeleteLabelModal = async (label, e) => {
        if (e) e.stopPropagation();
        const confirmed = await showConfirm(`Are you sure you want to delete label "${label?.name}"? This action cannot be undone.`, 'Confirm delete', 'danger', 'Delete', 'Cancel');
        if (!confirmed) return;
        handleDeleteLabelConfirm(label);
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
            await showAlert('Failed to update label', 'Error', 'error');
        }
    };

    const handleDeleteLabelConfirm = async (labelParam) => {
        const label = labelParam || labelToDelete;
        if (!label) return;
        try {
            await api.delete(`/labels/${label.id}`);
            setListLabels(prev => prev.filter(l => l.id !== label.id));
            setIsDeleteLabelOpen(false);
            setLabelToDelete(null);
            await showAlert('Label deleted', 'Success', 'success');
        } catch (err) {
            console.error('Delete label failed', err);
            await showAlert('Failed to delete label', 'Error', 'error');
        }
    };

    // TODO: Fetch project tasks from API
    const projectTasks = [];
    const tasksByAssignee = projectTasks.reduce((acc, task) => {
        const key = task.assignedTo || 'Unassigned';
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
    }, {});

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

    // Tabs are defined in the presentational component.

    return (
        <ManagerProjectDetailsUI
            project={project}
            onBack={handleBackToProjects}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            dataSet={dataSet}
            dataLoading={dataLoading}
            dataPage={dataPage}
            setDataPage={setDataPage}
            handleDeleteDataItem={handleDeleteDataItem}

            // Delete project
            showDeleteModal={showDeleteModal}
            setShowDeleteModal={setShowDeleteModal}
            handleDeleteProject={handleDeleteProject}

            // Import modal handlers
            isImportModalOpen={isImportModalOpen}
            openImportModal={() => setIsImportModalOpen(true)}
            closeImportModal={() => setIsImportModalOpen(false)}
            uploadProgress={uploadProgress}
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            removeSelectedFile={removeSelectedFile}
            handleImport={handleImport}
            clearSelectedFiles={() => setSelectedFiles([])}

            // Guidelines
            isGuidelinesModalOpen={isGuidelinesModalOpen}
            openGuidelines={openGuidelines}
            closeGuidelines={() => setIsGuidelinesModalOpen(false)}
            isEditingGuidelines={isEditingGuidelines}
            guidelinesText={guidelinesText}
            setGuidelinesText={setGuidelinesText}
            setIsEditingGuidelines={setIsEditingGuidelines}
            guidelineInfo={guidelineInfo}
            guidelineFile={guidelineFile}
            onGuidelineFileSelect={handleGuidelineFileSelect}
            onDownloadGuideline={handleDownloadGuideline}
            isGuidelineSaving={isGuidelineSaving}
            handleSaveGuidelines={handleSaveGuidelines}

            // Edit project
            isEditProjectOpen={isEditProjectOpen}
            openEditProject={openEditProject}
            closeEditProject={() => setIsEditProjectOpen(false)}
            editName={editName}
            setEditName={setEditName}
            editDescription={editDescription}
            setEditDescription={setEditDescription}
            editStatus={editStatus}
            setEditStatus={setEditStatus}
            editDeadline={editDeadline}
            setEditDeadline={setEditDeadline}
            handleSaveProjectUpdate={handleSaveProjectUpdate}

            // Labels
            listLabels={listLabels}
            isAddLabelOpen={isAddLabelOpen}
            openAddLabel={openAddLabel}
            setIsAddLabelOpen={setIsAddLabelOpen}
            newLabelName={newLabelName}
            setNewLabelName={setNewLabelName}
            newLabelColor={newLabelColor}
            setNewLabelColor={setNewLabelColor}
            addLabelError={addLabelError}
            handleSaveLabel={handleSaveLabel}

            isEditLabelOpen={isEditLabelOpen}
            editLabelName={editLabelName}
            setEditLabelName={setEditLabelName}
            editLabelColor={editLabelColor}
            setEditLabelColor={setEditLabelColor}
            handleEditLabelSubmit={handleEditLabelSubmit}
            isDeleteLabelOpen={isDeleteLabelOpen}
            labelToDelete={labelToDelete}
            openEditLabelModal={openEditLabelModal}
            openDeleteLabelModal={openDeleteLabelModal}
            handleDeleteLabelConfirm={handleDeleteLabelConfirm}
            // Tasks
            tasksByAssignee={tasksByAssignee}
            expandedTaskGroups={expandedTaskGroups}
            toggleGroup={toggleGroup}
            externalAssignTarget={externalAssignTarget}
        />
    );
};