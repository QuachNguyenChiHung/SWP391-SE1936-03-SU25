import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { Edit, AlertTriangle } from 'lucide-react';
import api from '../../../shared/utils/api.js';
import Avatar from '../../../shared/components/Avatar.jsx';

export default function DataItemsPanel({ dataSet, dataLoading, dataPage, setDataPage, onDeleteItem, onRefresh, searchTerm, setSearchTerm }) {
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateItem, setUpdateItem] = useState(null);
    const [updateFile, setUpdateFile] = useState(null);
    const [updateStatus, setUpdateStatus] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [comments, setComments] = useState([]);
    const [showAllComments, setShowAllComments] = useState(false);

    const getStatusClass = (status) => {
        const statusNum = typeof status === 'number' ? status : parseInt(status);
        switch (statusNum) {
            case 1: return 'bg-secondary text-white';      // Pending
            case 2: return 'bg-primary text-white';        // Assigned
            case 3: return 'bg-info text-white';           // InProgress
            case 4: return 'bg-warning text-dark';         // Submitted
            case 5: return 'bg-success text-white';        // Approved
            case 6: return 'bg-danger text-white';         // Rejected
            case 7: return 'bg-dark text-white';           // InReview
            case 8: return 'bg-warning text-dark';         // Reported
            case 9: return 'bg-success text-white';        // Resolved
            default: return 'bg-light text-muted';
        }
    };

    const getStatusLabel = (status) => {
        const statusNum = typeof status === 'number' ? status : parseInt(status);
        const labels = {
            1: 'Pending',
            2: 'Assigned',
            3: 'In Progress',
            4: 'Submitted',
            5: 'Approved',
            6: 'Rejected',
            7: 'In Review',
            8: 'Reported',
            9: 'Resolved'
        };
        return labels[statusNum] || status;
    };

    const openUpdateModal = async (item) => {
        console.log('Item status:', item.status, 'Type:', typeof item.status);
        setUpdateItem(item);
        setUpdateStatus(item.status?.toString() || '');
        setUpdateFile(null);
        setComments([]);
        setShowAllComments(false);

        // Fetch comments if item is flagged
        if (item.status === 8 || item.status === '8' || item.status === 'Reported') {
            try {
                const response = await api.get(`/data-items/${item.id}/comments`);
                const commentsData = response.data?.data || [];
                // Sort by createdAt descending (latest first)
                const sortedComments = commentsData.sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                setComments(sortedComments);
            } catch (error) {
                console.error('Failed to fetch comments:', error);
            }
        }

        setShowUpdateModal(true);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    const handleUpdateItem = async () => {
        if (!updateItem) return;

        setIsUpdating(true);
        try {
            // Update image if new file is selected
            if (updateFile) {
                const formData = new FormData();
                formData.append('file', updateFile);

                await api.put(`/data-items/${updateItem.id}/image`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            // Update status if changed
            if (updateStatus && updateStatus !== updateItem.status?.toString()) {
                await api.patch(`/data-items/${updateItem.id}/status`, {
                    status: parseInt(updateStatus)
                });
            }

            // Close modal and refresh
            setShowUpdateModal(false);
            setUpdateItem(null);
            setUpdateFile(null);
            setUpdateStatus('');

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Failed to update item:', error);
            alert('Failed to update item: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsUpdating(false);
        }
    };

    // Filter items based on search term
    const filteredItems = dataSet?.items || [];

    return (
        <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom py-3">
                <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">Showing {dataSet?.totalCount ?? 0} items</small>

                    <div className="d-flex gap-2">
                        <div className="input-group" style={{ width: '400px' }}>
                            <input
                                type="text"
                                className="form-control p-2"
                                placeholder="Search by image name or annotator..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        // Trigger search on Enter key
                                        if (onRefresh) onRefresh();
                                    }
                                }}
                            />
                            {searchTerm && (
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => {
                                        setSearchTerm('');
                                        if (onRefresh) onRefresh();
                                    }}
                                    title="Clear search"
                                >
                                    ×
                                </button>
                            )}
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    if (onRefresh) onRefresh();
                                }}
                                title="Search"
                            >
                                🔍
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                        <tr>
                            <th className="ps-4 border-bottom-0 text-muted small text-uppercase">Item</th>
                            <th className="border-bottom-0 text-muted small text-uppercase">Details</th>
                            <th className="border-bottom-0 text-muted small text-uppercase">Status</th>
                            <th className="text-end pe-4 border-bottom-0 text-muted small text-uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataLoading ? (
                            <tr><td colSpan={4} className="text-center py-5"><div className="spinner-border text-primary" /></td></tr>
                        ) : (filteredItems && filteredItems.length > 0) ? filteredItems.map(item => {
                            const base = (import.meta.env.VITE_URL_UPLOADS || '').replace(/\/$/, '');
                            const thumb = item.thumbnailPath ? `${base}/${item.thumbnailPath.replace(/^\//, '')}` : '';
                            const full = item.filePath ? `${base}/${item.filePath.replace(/^\//, '')}` : '';
                            return (
                                <tr key={item.id}>
                                    <td className="ps-4">
                                        <div className="d-flex align-items-center gap-3">
                                            <img src={thumb} alt={item.fileName} className="rounded border" style={{ width: '60px', height: '40px', objectFit: 'cover' }} />
                                            <div>
                                                <div className="fw-medium text-dark" title={item.fileName}>{item.fileName && item.fileName.length > 50 ? item.fileName.slice(0, 50) + '…' : item.fileName}</div>
                                                <small className="text-muted">ID: {item.id}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="small text-muted">Size: {item.fileSizeKB} KB</div>
                                        <div className="small text-muted">Dim: {item.width} x {item.height}</div>
                                        <div className="small text-muted">Added: {new Date(item.createdAt).toLocaleString()}</div>
                                        <div className="small text-muted">Assigned: {item.assignedAnnotatorName ? `${item.assignedAnnotatorName} (ID: ${item.assignedAnnotatorId})` : '-'}</div>
                                    </td>
                                    <td>
                                        <span className={`px-2 py-1 rounded-pill text-uppercase fw-bold border ${getStatusClass(item.status)}`} style={{ fontSize: '0.75rem' }}>
                                            {getStatusLabel(item.status)}
                                        </span>
                                    </td>
                                    <td className="text-end pe-4 ">
                                        <Button variant="primary" size="sm" className="mx-2 text-decoration-none" onClick={() => window.open(full, '_blank')}>View</Button>
                                        <Button
                                            variant="warning"
                                            size="sm"
                                            className="mx-2 text-decoration-none"
                                            onClick={() => openUpdateModal(item)}
                                            disabled={item.status === 5 || item.status === '5' || item.status === 'Approved'}
                                            title={item.status === 5 || item.status === '5' || item.status === 'Approved' ? 'Cannot edit approved items' : 'Update item'}
                                        >
                                            Update
                                        </Button>
                                        <Button variant="danger" size="sm" className="text-decoration-none" onClick={() => onDeleteItem ? onDeleteItem(item.id) : null}>Delete</Button>
                                    </td>
                                </tr>
                            )
                        }) : (
                            <tr>
                                <td colSpan={4} className="text-center py-5 text-muted">
                                    {searchTerm ? `No items found matching "${searchTerm}"` : 'No items found'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <div className="small text-muted">Total: {dataSet?.totalCount ?? 0}</div>
                <div>
                    <button className="btn btn-sm btn-secondary me-2" disabled={!dataSet?.hasPreviousPage} onClick={() => setDataPage(prev => Math.max(1, prev - 1))}>Prev</button>
                    <span className="small text-muted">Page {dataSet?.pageNumber ?? dataPage} / {dataSet?.totalPages ?? 1}</span>
                    <button className="btn btn-sm btn-secondary ms-2" disabled={!dataSet?.hasNextPage} onClick={() => setDataPage(prev => prev + 1)}>Next</button>
                </div>
            </div>

            {/* Update Modal */}
            {showUpdateModal && updateItem && (
                <>
                    <div className="modal-backdrop fade show" onClick={() => !isUpdating && setShowUpdateModal(false)} />
                    <div className="modal fade show d-block" tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        <Edit size={20} className="me-2" />
                                        Update Data Item
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowUpdateModal(false)}
                                        disabled={isUpdating}
                                    />
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <strong>File:</strong> {updateItem.fileName}
                                    </div>

                                    <div className="mb-3">
                                        <strong>Current Status:</strong>
                                        <span className={`badge ${getStatusClass(updateItem.status)} ms-2`}>
                                            {getStatusLabel(updateItem.status)}
                                        </span>
                                    </div>

                                    {(updateItem.status === 8 || updateItem.status === '8' || updateItem.status === 'Reported') && (
                                        <div className="alert alert-warning mb-3">
                                            <div className="d-flex align-items-start gap-2 mb-2">
                                                <AlertTriangle size={20} className="text-warning flex-shrink-0 mt-1" />
                                                <div>
                                                    <strong>Flagged Item</strong>
                                                    <p className="mb-0 small">This item was reported by an annotator as having issues.</p>
                                                </div>
                                            </div>

                                            {comments.length > 0 ? (
                                                <div className="mt-3 border-top pt-3">
                                                    <strong className="d-block mb-2">📝 Annotator Report:</strong>
                                                    {comments.slice(0, showAllComments ? comments.length : 4).map((comment, index) => (
                                                        <div key={comment.id || index} className="bg-white p-3 rounded border mb-2">
                                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <Avatar name={comment.authorName} size={32} />
                                                                    <div>
                                                                        <div className="small">
                                                                            <strong className="text-primary">{comment.authorName}</strong>
                                                                            <span className="badge bg-secondary ms-2">{comment.authorRole}</span>
                                                                        </div>
                                                                        <span className="text-muted small">
                                                                            {formatDate(comment.createdAt)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="mt-2 p-2 bg-light rounded">
                                                                <strong className="small text-muted d-block mb-1">Issue Description:</strong>
                                                                <div>{comment.content}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {comments.length > 4 && !showAllComments && (
                                                        <button
                                                            className="btn btn-sm btn-link text-decoration-none p-0"
                                                            onClick={() => setShowAllComments(true)}
                                                        >
                                                            Show {comments.length - 4} more comment{comments.length - 4 > 1 ? 's' : ''}...
                                                        </button>
                                                    )}
                                                    {showAllComments && comments.length > 4 && (
                                                        <button
                                                            className="btn btn-sm btn-link text-decoration-none p-0"
                                                            onClick={() => setShowAllComments(false)}
                                                        >
                                                            Show less
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="mt-3 text-muted small">
                                                    <em>No notes provided by the annotator.</em>
                                                </div>
                                            )}

                                            <div className="mt-3 pt-3 border-top">
                                                <p className="mb-0 small text-muted">
                                                    💡 <strong>Action:</strong> Upload a new image to replace it, or click "Mark as Resolved" if the flag was a mistake.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <label className="form-label">Replace Image (optional)</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*"
                                            onChange={(e) => setUpdateFile(e.target.files?.[0] || null)}
                                            disabled={isUpdating}
                                        />
                                        {updateFile && (
                                            <small className="text-success d-block mt-1">
                                                ✓ Selected: {updateFile.name}
                                            </small>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowUpdateModal(false)}
                                        disabled={isUpdating}
                                    >
                                        Cancel
                                    </button>
                                    {(updateItem.status === 8 || updateItem.status === '8' || updateItem.status === 'Reported') ? (
                                        <button
                                            type="button"
                                            className="btn btn-success"
                                            onClick={() => {
                                                setUpdateStatus('9');
                                                setTimeout(() => handleUpdateItem(), 0);
                                            }}
                                            disabled={isUpdating}
                                        >
                                            {isUpdating ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Resolving...
                                                </>
                                            ) : (
                                                <>
                                                    <Edit size={16} className="me-2" />
                                                    Mark as Resolved
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleUpdateItem}
                                            disabled={isUpdating || !updateFile}
                                        >
                                            {isUpdating ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Edit size={16} className="me-2" />
                                                    Update Image
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
