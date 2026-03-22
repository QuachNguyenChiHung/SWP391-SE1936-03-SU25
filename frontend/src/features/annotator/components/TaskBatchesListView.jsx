import { Calendar, Check, Layers } from 'lucide-react';
import { useUI } from '../../../shared/context/UIContext.jsx';

const formatDateOnly = (value) => {
    if (!value) return '-';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-');
        return `${day}/${month}/${year}`;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString();
};

const getPriorityBadgeClass = (priority) => {
    const normalized = String(priority || 'Medium').toLowerCase();
    if (normalized === 'high') return 'bg-danger-subtle text-danger border border-danger-subtle';
    if (normalized === 'low') return 'bg-success-subtle text-success border border-success-subtle';
    return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
};

const getDeadlineBadgeClass = (deadline) => {
    if (!deadline) return 'bg-light text-muted border';
    const date = new Date(deadline);
    if (Number.isNaN(date.getTime())) return 'bg-light text-muted border';
    const now = new Date();
    const diffDays = Math.ceil((date.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / 86400000);
    if (diffDays < 0) return 'bg-danger text-white border border-danger';
    if (diffDays <= 3) return 'bg-warning text-dark border border-warning';
    if (diffDays <= 7) return 'bg-info-subtle text-info border border-info-subtle';
    return 'bg-success-subtle text-success border border-success-subtle';
};

const BatchCard = ({ batch, onSelectBatch, t, projectDeadline }) => (
    <div key={batch.id} className="col">
        <div
            onClick={() => onSelectBatch(batch)}
            className="bg-white rounded-4 border border-slate-200 shadow-sm overflow-hidden h-100 d-flex flex-column"
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <div className="p-4 border-bottom border-slate-100">
                <div className="d-flex align-items-start gap-3">
                    <div className="p-2 bg-indigo-50 rounded-3 text-indigo-600">
                        <Layers size={20} />
                    </div>
                    <div className="flex-grow-1">
                        <h3 className="fw-bold text-slate-900 fs-6 mb-1">{batch.projectName}</h3>
                        <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>
                            {t.assignedBy} {batch.assignedByName || batch.annotatorName || t.manager}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 flex-grow-1">
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>{t.progress}</span>
                        <span className="fw-bold text-slate-900" style={{ fontSize: '0.875rem' }}>
                            {batch.progressPercent.toFixed(0)}%
                        </span>
                    </div>
                    <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                        <div
                            className="progress-bar bg-indigo-600"
                            role="progressbar"
                            style={{ width: `${batch.progressPercent}%` }}
                            aria-valuenow={batch.progressPercent}
                            aria-valuemin="0"
                            aria-valuemax="100"
                        ></div>
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>{t.totalItems}</p>
                        <p className="fw-bold text-slate-900 mb-0" style={{ fontSize: '1.25rem' }}>{batch.totalItems}</p>
                    </div>
                    <div className="text-end">
                        <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>{t.completed}</p>
                        <p className="fw-bold text-success mb-0" style={{ fontSize: '1.25rem' }}>{batch.completedItems}</p>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2 mb-2">
                    <Calendar size={12} className="text-muted" />
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {t.assigned}: {new Date(batch.assignedAt).toLocaleDateString()}
                    </span>
                </div>

                <div className="d-flex align-items-center gap-2 mb-2">
                    <Calendar size={12} className="text-muted" />
                    <span className={`badge ${getDeadlineBadgeClass(projectDeadline)}`} style={{ fontSize: '0.7rem' }}>
                        {t.projectDeadline}: {formatDateOnly(projectDeadline)}
                    </span>
                </div>

                <div className="d-flex align-items-center gap-2 mb-2">
                    <span className={`badge ${getPriorityBadgeClass(batch.priority)}`} style={{ fontSize: '0.7rem' }}>
                        {t.priority}: {batch.priority || 'Medium'}
                    </span>
                </div>

                {batch.completedAt && (
                    <div className="d-flex align-items-center gap-2">
                        <Check size={12} className="text-success" />
                        <span className="text-success" style={{ fontSize: '0.75rem' }}>
                            {t.completed}: {new Date(batch.completedAt).toLocaleDateString()}
                        </span>
                    </div>
                )}
            </div>

            <div className="p-3 bg-slate-50 border-top border-slate-100 d-flex justify-content-between align-items-center">
                <span className={`status-badge ${batch.status === 'Completed' ? 'completed' : batch.status === 'InProgress' ? 'in-progress' : 'pending'}`}>
                    {batch.status}
                </span>
            </div>
        </div>
    </div>
);

export const TaskBatchesListView = ({
    isLoadingBatches,
    taskBatches,
    filteredTaskBatches,
    paginatedTaskBatches,
    safeCurrentPage,
    totalPages,
    pageNumbers,
    searchKeyword,
    statusFilter,
    onSearchKeywordChange,
    onStatusFilterChange,
    onPageChange,
    onPreviousPage,
    onNextPage,
    onSelectBatch,
    onDeleteTask,
    projectMetaById
}) => {
    const { language } = useUI();
    const copy = {
        en: {
            title: 'My Assigned Task Batches',
            subtitle: 'Overview of annotation batches assigned to you',
            loading: 'Loading...',
            noAssigned: 'No Task Batches Assigned',
            noAssignedDesc: "You currently don't have any task batches assigned. Check back later or contact your manager.",
            searchByProject: 'Search by project name',
            typeProjectName: 'Type project name...',
            filterStatus: 'Filter by status',
            allStatuses: 'All statuses',
            assigned: 'Assigned',
            inProgress: 'In Progress',
            submitted: 'Submitted',
            completed: 'Completed',
            rejected: 'Rejected',
            taskCount: 'task',
            taskCountPlural: 'tasks',
            noMatching: 'No matching task batches',
            noMatchingDesc: 'Try another status filter or search keyword.',
            previous: 'Previous',
            next: 'Next',
            assignedBy: 'Assigned by',
            manager: 'Manager',
            progress: 'Progress',
            totalItems: 'Total Items',
            projectDeadline: 'Project deadline',
            priority: 'Priority',
            deleteAllItemsFirst: 'Delete all items first',
            deleteTask: 'Delete task',
            delete: 'Delete'
        },
        vi: {
            title: 'Danh sach task duoc giao',
            subtitle: 'Tong quan cac batch gan nhan duoc giao cho ban',
            loading: 'Dang tai...',
            noAssigned: 'Chua co batch duoc giao',
            noAssignedDesc: 'Hien tai ban chua co batch nao duoc giao. Vui long quay lai sau hoac lien he quan ly.',
            searchByProject: 'Tim theo ten du an',
            typeProjectName: 'Nhap ten du an...',
            filterStatus: 'Loc theo trang thai',
            allStatuses: 'Tat ca trang thai',
            assigned: 'Da giao',
            inProgress: 'Dang lam',
            submitted: 'Da nop',
            completed: 'Hoan thanh',
            rejected: 'Bi tu choi',
            taskCount: 'task',
            taskCountPlural: 'tasks',
            noMatching: 'Khong co batch phu hop',
            noMatchingDesc: 'Thu bo loc trang thai hoac tu khoa khac.',
            previous: 'Truoc',
            next: 'Tiep',
            assignedBy: 'Giao boi',
            manager: 'Quan ly',
            progress: 'Tien do',
            totalItems: 'Tong muc',
            projectDeadline: 'Han du an',
            priority: 'Uu tien',
            deleteAllItemsFirst: 'Xoa het muc truoc',
            deleteTask: 'Xoa task',
            delete: 'Xoa'
        }
    };
    const t = copy[language] || copy.en;

    return (
        <div className="animate-fade-in container-lg mx-auto">
            <div className="d-flex justify-content-between align-items-end mb-5">
                <div>
                    <h2 className="fs-4 fw-bold text-slate-900">{t.title}</h2>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>{t.subtitle}</p>
                </div>
            </div>

            {isLoadingBatches ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">{t.loading}</span>
                    </div>
                </div>
            ) : taskBatches.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Layers size={32} />
                    </div>
                    <h3 className="fs-5 fw-medium text-slate-900">{t.noAssigned}</h3>
                    <p className="text-muted mx-auto mt-2" style={{ maxWidth: '28rem' }}>{t.noAssignedDesc}</p>
                </div>
            ) : (
                <div>
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body p-3 p-md-4">
                            <div className="row g-3 align-items-end">
                                <div className="col-12 col-md-5">
                                    <label htmlFor="batch-search" className="form-label fw-semibold mb-1">{t.searchByProject}</label>
                                    <input
                                        id="batch-search"
                                        type="text"
                                        className="form-control"
                                        placeholder={t.typeProjectName}
                                        value={searchKeyword}
                                        onChange={(e) => onSearchKeywordChange(e.target.value)}
                                    />
                                </div>
                                <div className="col-12 col-md-4">
                                    <label htmlFor="batch-status-filter" className="form-label fw-semibold mb-1">{t.filterStatus}</label>
                                    <select
                                        id="batch-status-filter"
                                        className="form-select"
                                        value={statusFilter}
                                        onChange={(e) => onStatusFilterChange(e.target.value)}
                                    >
                                        <option value="all">{t.allStatuses}</option>
                                        <option value="assigned">{t.assigned}</option>
                                        <option value="inprogress">{t.inProgress}</option>
                                        <option value="submitted">{t.submitted}</option>
                                        <option value="completed">{t.completed}</option>
                                        <option value="rejected">{t.rejected}</option>
                                    </select>
                                </div>
                                <div className="col-12 col-md-3 text-md-end">
                                    <span className="badge bg-light text-dark border px-3 py-2" style={{ fontSize: '0.8rem' }}>
                                        {filteredTaskBatches.length} {filteredTaskBatches.length !== 1 ? t.taskCountPlural : t.taskCount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {filteredTaskBatches.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <Layers size={32} />
                            </div>
                            <h3 className="fs-5 fw-medium text-slate-900">{t.noMatching}</h3>
                            <p className="text-muted mx-auto mt-2" style={{ maxWidth: '28rem' }}>
                                {t.noMatchingDesc}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                                {paginatedTaskBatches.map((batch) => (
                                    <BatchCard
                                        key={batch.id}
                                        batch={batch}
                                        t={t}
                                        onSelectBatch={onSelectBatch}
                                        projectDeadline={projectMetaById?.[batch.projectId]?.deadline}
                                        onDeleteTask={onDeleteTask}
                                    />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <nav aria-label="Task batch pagination" className="d-flex justify-content-center mt-4">
                                    <ul className="pagination mb-0">
                                        <li className={`page-item ${safeCurrentPage === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={onPreviousPage}
                                                disabled={safeCurrentPage === 1}
                                            >
                                                {t.previous}
                                            </button>
                                        </li>

                                        {pageNumbers.map((pageNumber) => (
                                            <li key={pageNumber} className={`page-item ${safeCurrentPage === pageNumber ? 'active' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => onPageChange(pageNumber)}
                                                >
                                                    {pageNumber}
                                                </button>
                                            </li>
                                        ))}

                                        <li className={`page-item ${safeCurrentPage === totalPages ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={onNextPage}
                                                disabled={safeCurrentPage === totalPages}
                                            >
                                                {t.next}
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
