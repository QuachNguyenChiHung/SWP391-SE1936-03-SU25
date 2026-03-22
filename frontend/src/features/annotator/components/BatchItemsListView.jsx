import { Calendar, Check, ChevronLeft, Layers } from 'lucide-react';
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

export const BatchItemsListView = ({
    selectedBatch,
    isLoadingItems,
    batchItems,
    onBackToBatchList,
    onSubmitTask,
    onSelectItem,
    taskDeadline,
    taskPriority
}) => {
    const { language } = useUI();
    const copy = {
        en: {
            backToBatches: 'Back to Batches',
            itemsCompleted: 'items completed',
            assignedBy: 'Assigned by',
            deadline: 'Deadline',
            priority: 'Priority',
            completeAllFirst: 'Complete all items first',
            submitForReview: 'Submit task for review',
            submitReview: 'Submit for Review',
            loading: 'Loading...',
            noItemsFound: 'No Items Found',
            emptyBatch: "This batch doesn't have any items yet.",
            item: 'Item',
            noImage: 'No+Image',
            imageError: 'Image+Error',
            pending: 'Pending',
            id: 'ID'
        },
        vi: {
            backToBatches: 'Quay lai danh sach task',
            itemsCompleted: 'muc da hoan thanh',
            assignedBy: 'Giao boi',
            deadline: 'Han',
            priority: 'Uu tien',
            completeAllFirst: 'Hoan thanh tat ca muc truoc',
            submitForReview: 'Nop task de review',
            submitReview: 'Nop de Review',
            loading: 'Dang tai...',
            noItemsFound: 'Khong tim thay muc',
            emptyBatch: 'Batch nay chua co muc nao.',
            item: 'Muc',
            noImage: 'Khong+co+anh',
            imageError: 'Loi+anh',
            pending: 'Cho xu ly',
            id: 'ID'
        }
    };
    const t = copy[language] || copy.en;

    return (
        <div className="animate-fade-in container-lg mx-auto">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                    <button onClick={onBackToBatchList} className="btn btn-link text-muted text-decoration-none d-flex align-items-center gap-1 p-0" title={t.backToBatches}>
                        <ChevronLeft size={16} />
                        {t.backToBatches}
                    </button>
                    <div className="bg-slate-200" style={{ height: '1.25rem', width: '1px' }}></div>
                    <div>
                        <h2 className="fs-4 fw-bold text-slate-900 mb-0">{selectedBatch.projectName}</h2>
                        <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
                            {selectedBatch.completedItems} / {selectedBatch.totalItems} {t.itemsCompleted} ({selectedBatch.progressPercent.toFixed(0)}%)
                            {selectedBatch.assignedByName && (
                                <span className="ms-2">- {t.assignedBy} {selectedBatch.assignedByName}</span>
                            )}
                        </p>
                        <div className="d-flex flex-wrap align-items-center gap-2 mt-2" style={{ fontSize: '0.75rem' }}>
                            <span className={`badge ${getDeadlineBadgeClass(taskDeadline)}`}>
                                <Calendar size={12} />
                                {t.deadline}: {formatDateOnly(taskDeadline)}
                            </span>
                            <span className={`badge ${getPriorityBadgeClass(taskPriority)}`}>
                                {t.priority}: {taskPriority || 'Medium'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    {selectedBatch.status !== 'Submitted' && selectedBatch.status !== 'Completed' && (
                        <button
                            onClick={() => onSubmitTask(selectedBatch.id)}
                            className="btn btn-primary d-flex align-items-center gap-2"
                            style={{ fontSize: '0.875rem' }}
                            disabled={selectedBatch.completedItems !== selectedBatch.totalItems}
                            title={selectedBatch.completedItems !== selectedBatch.totalItems ? t.completeAllFirst : t.submitForReview}
                        >
                            <Check size={16} />
                            {t.submitReview}
                        </button>
                    )}
                </div>
            </div>

            {isLoadingItems ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">{t.loading}</span>
                    </div>
                </div>
            ) : batchItems.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Layers size={32} />
                    </div>
                    <h3 className="fs-5 fw-medium text-slate-900">{t.noItemsFound}</h3>
                    <p className="text-muted">{t.emptyBatch}</p>
                </div>
            ) : (
                <div className="bg-white rounded-4 border border-slate-200 shadow-sm p-4">
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
                        {batchItems.map((item) => (
                            <div key={item.id} className="col">
                                <div className="position-relative">
                                    <div
                                        onClick={() => onSelectItem(item)}
                                        className="task-card bg-white rounded-3 border border-slate-200 d-flex flex-column h-100"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="position-relative bg-slate-100" style={{ height: '8rem' }}>
                                            <img
                                                src={item.thumbnailPath ? import.meta.env.VITE_URL_UPLOADS + "/" + item.thumbnailPath : item.filePath ? import.meta.env.VITE_URL_UPLOADS + "/" + item.filePath : `https://via.placeholder.com/300x200?text=${t.noImage}`}
                                                alt={item.fileName || `${t.item} ${item.id}`}
                                                className="w-100 h-100 task-card-image"
                                                onError={(e) => { e.target.src = `https://via.placeholder.com/300x200?text=${t.imageError}`; }}
                                            />
                                            {item.dataItemStatus && (
                                                <div className="position-absolute" style={{ top: '0.5rem', right: '0.5rem' }}>
                                                    <span className={`badge ${item.dataItemStatus === 'Approved' ? 'bg-success' : item.dataItemStatus === 'Rejected' ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '0.625rem' }}>
                                                        {item.dataItemStatus}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-3 flex-grow-1 d-flex flex-column">
                                            <div className="mb-2">
                                                <p className="mb-0 fw-medium text-slate-900 text-truncate" style={{ fontSize: '0.75rem' }} title={item.fileName}>
                                                    {item.fileName || `${t.item} ${item.id}`}
                                                </p>
                                                <p className="mb-0 text-slate-400" style={{ fontSize: '10px' }}>{t.id}: {item.id}</p>
                                            </div>

                                            <div className="mt-auto pt-2 border-top border-slate-100">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className={`status-badge ${item.status === 'Completed' ? 'completed' : item.status === 'InProgress' ? 'in-progress' : 'pending'}`}>
                                                        {item.status || t.pending}
                                                    </span>
                                                </div>
                                                <div className="d-flex flex-wrap gap-2 mb-1" style={{ fontSize: '0.7rem' }}>
                                                    <span className={`badge ${getDeadlineBadgeClass(taskDeadline)}`}>{t.deadline}: {formatDateOnly(taskDeadline)}</span>
                                                    <span className={`badge ${getPriorityBadgeClass(taskPriority)}`}>{t.priority}: {taskPriority || 'Medium'}</span>
                                                </div>
                                                {item.completedAt && (
                                                    <div className="d-flex align-items-center gap-1 text-success" style={{ fontSize: '10px' }}>
                                                        <Check size={10} />
                                                        {new Date(item.completedAt).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
