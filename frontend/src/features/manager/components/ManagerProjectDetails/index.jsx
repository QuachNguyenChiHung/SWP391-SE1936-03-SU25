import React from 'react';
import TabsNav from '../../TabsNav.jsx';
import OverviewPanel from '../../OverviewPanel.jsx';
import DataItemsPanel from '../DatasetPanel.jsx';
import LabelsPanel from '../LabelsPanel.jsx';
import TasksPanel from '../../TasksPanel.jsx';
import ProjectHeader from '../ProjectHeader';
import ImportModal from '../ImportModal';
import GuidelinesModal from '../GuidelinesModal';
import EditProjectModal from '../EditProjectModal';
import ConfirmModal from '../ConfirmModal';
import { ProjectStatus, DataItemStatus } from '../../../../shared/types/types.js';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Form from 'react-bootstrap/Form';
import { LayoutDashboard, Database, Tag, Layers } from 'lucide-react';

export default function ManagerProjectDetails(props) {
    const {
        project = null,
        onBack,
        activeTab,
        setActiveTab,
        dataSet,
        dataLoading,
        dataPage,
        setDataPage,
        handleDeleteDataItem,

        // Import modal props
        isImportModalOpen,
        openImportModal,
        closeImportModal,
        uploadProgress,
        selectedFiles,
        onFileSelect,
        removeSelectedFile,
        handleImport,
        clearSelectedFiles,

        // Guidelines
        isGuidelinesModalOpen,
        openGuidelines,
        closeGuidelines,
        isEditingGuidelines,
        guidelinesText,
        setGuidelinesText,
        handleSaveGuidelines,

        // Edit project
        isEditProjectOpen,
        openEditProject,
        closeEditProject,
        editName,
        setEditName,
        editDescription,
        setEditDescription,
        editStatus,
        setEditStatus,
        editDeadline,
        setEditDeadline,
        handleSaveProjectUpdate,

        // Labels
        listLabels,
        isAddLabelOpen,
        openAddLabel,
        setIsAddLabelOpen,
        newLabelName,
        setNewLabelName,
        newLabelColor,
        setNewLabelColor,
        addLabelError,
        handleSaveLabel,
        // edit/delete label
        isEditLabelOpen,
        editLabelName,
        setEditLabelName,
        editLabelColor,
        setEditLabelColor,
        handleEditLabelSubmit,
        isDeleteLabelOpen,
        labelToDelete,
        openEditLabelModal,
        openDeleteLabelModal,
        handleDeleteLabelConfirm,
        // Tasks
        tasksByAssignee,
        expandedTaskGroups,
        toggleGroup,
        externalAssignTarget,
    } = props;

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

    return (
        <div className="d-flex flex-column gap-4 container-fluid p-0">
            <ProjectHeader project={project} onBack={onBack} />

            {/* Tabs navigation */}
            <TabsNav tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="bg-transparent animate-in fade-in" style={{ minHeight: '400px' }}>
                {activeTab === 'Overview' && (
                    <OverviewPanel project={project} openImportModal={openImportModal} openGuidelines={openGuidelines} openEditProject={openEditProject} />
                )}
                {activeTab === 'Data Items' && (
                    <DataItemsPanel dataSet={dataSet} dataLoading={dataLoading} dataPage={dataPage} setDataPage={setDataPage} onDeleteItem={handleDeleteDataItem} />
                )}
                {activeTab === 'Labels' && (
                    <LabelsPanel listLabels={listLabels} openAddLabel={openAddLabel} openEditLabelModal={openEditLabelModal} openDeleteLabelModal={openDeleteLabelModal} />
                )}
                {activeTab === 'Tasks' && (
                    <TasksPanel
                        tasksByAssignee={tasksByAssignee}
                        expandedTaskGroups={expandedTaskGroups}
                        toggleGroup={toggleGroup}
                        StatusBadge={StatusBadge}
                        externalAssignTarget={externalAssignTarget}
                    />
                )}
            </div>

            <ImportModal
                isOpen={isImportModalOpen}
                onHide={closeImportModal}
                uploadProgress={uploadProgress}
                selectedFiles={selectedFiles}
                onFileSelect={onFileSelect}
                removeSelectedFile={removeSelectedFile}
                handleImport={handleImport}
                clearSelectedFiles={clearSelectedFiles}
            />

            <GuidelinesModal
                isOpen={isGuidelinesModalOpen}
                onClose={closeGuidelines}
                isEditing={isEditingGuidelines}
                guidelinesText={guidelinesText}
                setGuidelinesText={setGuidelinesText}
                setIsEditing={() => { }}
                onSave={handleSaveGuidelines}
            />

            <EditProjectModal
                isOpen={isEditProjectOpen}
                onClose={closeEditProject}
                editName={editName}
                setEditName={setEditName}
                editDescription={editDescription}
                setEditDescription={setEditDescription}
                editStatus={editStatus}
                setEditStatus={setEditStatus}
                editDeadline={editDeadline}
                setEditDeadline={setEditDeadline}
                onSave={handleSaveProjectUpdate}
            />

            {/* Add/Edit/Delete Label modals */}
            <Modal show={isAddLabelOpen} onHide={() => setIsAddLabelOpen(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <div className="p-1 bg-primary bg-opacity-10 rounded text-primary"><span>+</span></div>
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

            <Modal show={isEditLabelOpen} onHide={() => setIsEditLabelOpen(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <div className="p-1 bg-primary bg-opacity-10 rounded text-primary">✏️</div>
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
                    <Button variant="light" onClick={() => setIsEditLabelOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleEditLabelSubmit}>Save</Button>
                </Modal.Footer>
            </Modal>

            {/* Deletion now uses native window.confirm in the parent component */}
        </div>
    );
}
