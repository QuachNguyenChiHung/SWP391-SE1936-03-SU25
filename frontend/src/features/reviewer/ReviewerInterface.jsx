import React, { useState, useEffect } from 'react';
import {
    Check,
    X,
    Flag,
    MessageSquare,
    Eye,
    EyeOff,
    Maximize2,
    FileText,
    ChevronLeft,
    ChevronRight,
    Loader
} from 'lucide-react';
import getInforFromCookie from '../../shared/utils/getInfoFromCookie.js';
import { UserRole } from '../../shared/types/types.js';
import api from '../../shared/utils/api.js';

export const ReviewerInterface = ({ onTitleChange }) => {
    // Queue states
    const [queueItems, setQueueItems] = useState([]);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [isLoadingQueue, setIsLoadingQueue] = useState(false);
    const [queueError, setQueueError] = useState(null);
    const [pagination, setPagination] = useState({
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false
    });

    // Detailed review data states
    const [reviewData, setReviewData] = useState(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [detailError, setDetailError] = useState(null);

    const [showQueuePanel, setShowQueuePanel] = useState(true);

    // Fetch review queue items
    const fetchReviewQueue = async (pageNumber = 1) => {
        setIsLoadingQueue(true);
        setQueueError(null);
        try {
            const res = await api.get('/reviews/pending', {
                params: {
                    pageNumber,
                    pageSize: 10
                }
            });
            const itemsList = res?.data?.items || [];

            if (Array.isArray(itemsList)) {
                setQueueItems(itemsList);
                setPagination({
                    pageNumber: res?.data?.pageNumber || pageNumber,
                    pageSize: res?.data?.pageSize || 10,
                    totalCount: res?.data?.totalCount || itemsList.length,
                    totalPages: res?.data?.totalPages || 1,
                    hasPreviousPage: res?.data?.hasPreviousPage || false,
                    hasNextPage: res?.data?.hasNextPage || false
                });
                setCurrentItemIndex(0);

                // Load detailed data for first item
                if (itemsList.length > 0) {
                    fetchReviewDetail(itemsList[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to load review queue:', error);
            setQueueError(error?.response?.data?.message || 'Failed to load items');
        } finally {
            setIsLoadingQueue(false);
        }
    };

    // Fetch detailed review data for a specific item
    const fetchReviewDetail = async (dataItemId) => {
        setIsLoadingDetail(true);
        setDetailError(null);
        try {
            const res = await api.get(`/data-items/${dataItemId}/review-editor`);
            setReviewData(res?.data || null);
        } catch (error) {
            console.error('Failed to load review detail:', error);
            setDetailError(error?.response?.data?.message || 'Failed to load review details');
        } finally {
            setIsLoadingDetail(false);
        }
    };

    // Handle item selection from queue
    const handleSelectQueueItem = (index) => {
        setCurrentItemIndex(index);
        if (queueItems[index]) {
            fetchReviewDetail(queueItems[index].id);
        }
    };

    // Mock task as current selected item
    const currentQueueItem = queueItems[currentItemIndex];

    // Use detailed review data for annotations and metadata
    const task = currentQueueItem ? {
        id: currentQueueItem.id,
        imageUrl: currentQueueItem.filePath ||
            (reviewData?.filePath ? process.env.VITE_URL_UPLOADS + '/' + reviewData.filePath : ''),
        projectId: currentQueueItem.projectId,
        annotations: reviewData?.annotations?.map(ann => ({
            ...ann,
            coordinates: typeof ann.coordinates === 'string'
                ? JSON.parse(ann.coordinates)
                : ann.coordinates,
            labelId: ann.labelId,
            confidence: ann.confidence
        })) || [],
        errorTypes: reviewData?.errorTypes || [],
        navigation: reviewData?.navigation || {},
        annotatorName: currentQueueItem.annotatorName,
        submittedAt: currentQueueItem.submittedAt,
        ...currentQueueItem
    } : { id: null, projectId: null, annotations: [] };

    const project = null;

    const [showLabels, setShowLabels] = useState(true);
    const [rejectReason, setRejectReason] = useState('');
    const [actionState, setActionState] = useState('IDLE');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // Guidelines State
    const [guidelines, setGuidelines] = useState('');

    useEffect(() => {
        if (onTitleChange) {
            onTitleChange('Review Queue');
        }
        // Fetch review queue on component mount
        fetchReviewQueue();
    }, [onTitleChange]);

    useEffect(() => {
        if (project?.guidelines) {
            setGuidelines(project.guidelines);
        }
    }, [project]);

    // determine current user role from cookie (robust to shape)
    const cookieUser = getInforFromCookie();
    const currentRole = cookieUser?.user?.roleName || cookieUser?.user?.role || cookieUser?.role || null;
    const isAdmin = currentRole === UserRole.ADMIN || currentRole === 'Admin' || currentRole === 'ADMIN';

    // Get error types from review data or fallback to defaults
    const REJECT_REASONS = task.errorTypes && task.errorTypes.length > 0
        ? task.errorTypes.map(et => et.name)
        : [
            "Loose Bounding Box",
            "Wrong Class Label",
            "Missed Object",
            "Occlusion Error",
            "Other"
        ];

    // Navigation handlers
    const handleNextItem = () => {
        if (task.navigation?.nextDataItemId) {
            handleSelectQueueItem(currentItemIndex + 1);
        }
    };

    const handlePreviousItem = () => {
        if (task.navigation?.previousDataItemId) {
            handleSelectQueueItem(currentItemIndex - 1);
        }
    };

    // Submit review handler
    const submitReview = async (decision, feedback = '') => {
        if (!currentQueueItem?.id) {
            setSubmitError('No item selected');
            return;
        }

        setIsSubmittingReview(true);
        setSubmitError(null);

        try {
            // Get error type IDs if rejecting
            let errorTypeIds = [];
            if (decision === 'Rejected' && rejectReason) {
                const selectedErrorType = task.errorTypes?.find(et => et.name === rejectReason);
                if (selectedErrorType) {
                    errorTypeIds = [selectedErrorType.id];
                }
            }

            const payload = {
                decision,
                feedback: feedback || rejectReason || '',
                errorTypeIds
            };

            const res = await api.post(`/data-items/${currentQueueItem.id}/reviews`, payload);

            console.log('Review submitted successfully:', res.data);

            // Reset state
            setActionState('IDLE');
            setRejectReason('');

            // Move to next item if available
            if (task.navigation?.hasNextPage || currentItemIndex < queueItems.length - 1) {
                handleNextItem();
            } else {
                // Reload queue if no more items
                fetchReviewQueue();
            }
        } catch (error) {
            console.error('Failed to submit review:', error);
            setSubmitError(error?.response?.data?.message || 'Failed to submit review');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    return (
        <div className="d-flex flex-column" style={{ height: 'calc(100vh - 8rem)' }}>
            {/* Top Bar Stats */}
            <div className="d-flex justify-content-between align-items-center mb-4 px-1">
                <div>
                    <h2 className="fs-5 fw-bold text-dark">Review Queue</h2>
                    <p className="fs-6 text-muted">{pagination.totalCount} items pending validation</p>
                </div>
                <button
                    onClick={() => setShowQueuePanel(!showQueuePanel)}
                    className="btn btn-light border d-lg-none"
                    title="Toggle queue list"
                >
                    {showQueuePanel ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <div className="flex-fill d-flex gap-4" style={{ minHeight: 0 }}>
                {/* Main Review Canvas */}
                <div className="flex-fill bg-white border  rounded shadow-sm d-flex flex-column overflow-hidden position-relative">

                    {queueItems.length > 0 ? (
                        <>
                            {/* Toolbar */}
                            <div className="d-flex align-items-center justify-content-between px-4 bg-light border-bottom " style={{ height: '3rem' }}>
                                <div className="d-flex align-items-center gap-3">
                                    <span className="text-uppercase text-muted fw-bold" style={{ fontSize: '12px', letterSpacing: '0.05em' }}>Item #{task.id}</span>
                                    <span className="vr" style={{ height: '1rem' }}></span>
                                    <button
                                        onClick={() => setShowLabels(!showLabels)}
                                        className="btn btn-link p-0 d-flex align-items-center gap-1 text-muted text-decoration-none"
                                        style={{ fontSize: '12px' }}
                                    >
                                        {showLabels ? <Eye size={14} /> : <EyeOff size={14} />}
                                        {showLabels ? 'Hide Labels' : 'Show Labels'}
                                    </button>
                                </div>
                                <button className="btn btn-link p-0 text-muted">
                                    <Maximize2 size={16} />
                                </button>
                            </div>

                            {/* Image Viewer */}
                            <div className="flex-fill bg-dark d-flex align-items-center justify-content-center position-relative overflow-hidden">
                                {isLoadingDetail ? (
                                    <div className="d-flex flex-column align-items-center justify-content-center">
                                        <Loader className="spinner" size={40} style={{ color: '#fff' }} />
                                        <p className="text-white mt-2">Loading review...</p>
                                    </div>
                                ) : (
                                    <div className="position-relative" style={{}}>
                                        <img
                                            src={task.imageUrl ? (task.imageUrl.startsWith('http')
                                                ? task.imageUrl
                                                : (import.meta.env.VITE_URL_UPLOADS + '/' + task.imageUrl))
                                                : 'https://via.placeholder.com/800x600?text=No+Image'}
                                            alt="Review"
                                            className="mw-100 mh-100 object-fit-contain d-block"
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/800x600?text=Image+Error'; }}
                                        />

                                        {showLabels && task.annotations.map((ann) => {
                                            const coords = ann.coordinates;
                                            const coordType = coords?.type || (coords?.points ? 'polygon' : 'bbox');

                                            // Handle new bbox format: {type: 'bbox', points: [{x1, y1}, {x2, y2}]}
                                            if (coordType === 'bbox' && coords?.points && coords.points.length === 2) {
                                                const [p1, p2] = coords.points;
                                                const x1 = Math.min(p1.x, p2.x);
                                                const y1 = Math.min(p1.y, p2.y);
                                                const x2 = Math.max(p1.x, p2.x);
                                                const y2 = Math.max(p1.y, p2.y);
                                                const width = x2 - x1;
                                                const height = y2 - y1;
                                                const labelAbove = y1 > 30;

                                                return (
                                                    <div key={ann.id}>
                                                        {/* Bbox outline */}
                                                        <div
                                                            className="position-absolute bg-white bg-opacity-10"
                                                            style={{
                                                                border: `2px solid ${ann.labelColor || '#000'}`,
                                                                left: `${x1}px`,
                                                                top: `${y1}px`,
                                                                width: `${width}px`,
                                                                height: `${height}px`,
                                                                pointerEvents: 'none',
                                                                boxSizing: 'border-box'
                                                            }}
                                                        />
                                                        {/* Label tag */}
                                                        <div
                                                            className="position-absolute px-2 py-1 fw-bold text-white rounded-top shadow-sm d-flex align-items-center gap-1 text-nowrap"
                                                            style={{
                                                                backgroundColor: ann.labelColor || '#000',
                                                                left: `${x1}px`,
                                                                top: `${labelAbove ? y1 : y1 + height}px`,
                                                                transform: labelAbove ? 'translateY(-100%)' : 'none',
                                                                fontSize: '10px',
                                                                pointerEvents: 'none',
                                                                zIndex: 10
                                                            }}
                                                        >
                                                            <span>{ann.labelName || 'Unknown'}</span>
                                                            {ann.confidence && (
                                                                <span className="opacity-75 fw-normal ms-1">{(ann.confidence * 100).toFixed(0)}%</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Handle polygon format: {type: 'polygon', points: [{x, y}, {x, y}, ...]}
                                            if (coordType === 'polygon' && coords?.points && coords.points.length > 0) {
                                                const points = coords.points.map((p, i) => `${p.x},${p.y}`).join(' ');
                                                const xValues = coords.points.map(p => p.x);
                                                const yValues = coords.points.map(p => p.y);
                                                const minX = Math.min(...xValues);
                                                const minY = Math.min(...yValues);
                                                const maxX = Math.max(...xValues);
                                                const maxY = Math.max(...yValues);

                                                // Find the highest point (minimum Y)
                                                const highestPoint = coords.points.reduce((min, p) => p.y < min.y ? p : min, coords.points[0]);

                                                return (
                                                    <div key={ann.id}>
                                                        {/* Polygon outline using SVG */}
                                                        <svg
                                                            className="position-absolute"
                                                            style={{
                                                                left: 0,
                                                                top: 0,
                                                                pointerEvents: 'none',
                                                                overflow: 'visible'
                                                            }}
                                                            width="100%"
                                                            height="100%"
                                                        >
                                                            <polygon
                                                                points={points}
                                                                fill="rgba(255, 255, 255, 0.1)"
                                                                stroke={ann.labelColor || '#000'}
                                                                strokeWidth="2"
                                                            />
                                                        </svg>
                                                        {/* Label tag - bottom-left snapped to highest point */}
                                                        <div
                                                            className="position-absolute px-2 py-1 fw-bold text-white rounded-top shadow-sm d-flex align-items-center gap-1 text-nowrap"
                                                            style={{
                                                                backgroundColor: ann.labelColor || '#000',
                                                                left: `${highestPoint.x}px`,
                                                                top: `${highestPoint.y}px`,
                                                                transform: 'translateY(-100%)',
                                                                fontSize: '10px',
                                                                pointerEvents: 'none',
                                                                zIndex: 10
                                                            }}
                                                        >
                                                            <span>{ann.labelName || 'Unknown'}</span>
                                                            {ann.confidence && (
                                                                <span className="opacity-75 fw-normal ms-1">{(ann.confidence * 100).toFixed(0)}%</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Handle old bbox format: {x, y, width, height}
                                            if (coords?.x !== undefined && coords?.y !== undefined && coords?.width !== undefined && coords?.height !== undefined) {
                                                const labelAbove = coords.y > 30;

                                                return (
                                                    <div key={ann.id}>
                                                        {/* Bbox outline */}
                                                        <div
                                                            className="position-absolute bg-white bg-opacity-10"
                                                            style={{
                                                                border: `2px solid ${ann.labelColor || '#000'}`,
                                                                left: `${coords.x}px`,
                                                                top: `${coords.y}px`,
                                                                width: `${coords.width}px`,
                                                                height: `${coords.height}px`,
                                                                pointerEvents: 'none',
                                                                boxSizing: 'border-box'
                                                            }}
                                                        />
                                                        {/* Label tag */}
                                                        <div
                                                            className="position-absolute px-2 py-1 fw-bold text-white rounded-top shadow-sm d-flex align-items-center gap-1 text-nowrap"
                                                            style={{
                                                                backgroundColor: ann.labelColor || '#000',
                                                                left: `${coords.x}px`,
                                                                top: `${labelAbove ? coords.y : coords.y + coords.height}px`,
                                                                transform: labelAbove ? 'translateY(-100%)' : 'none',
                                                                fontSize: '10px',
                                                                pointerEvents: 'none',
                                                                zIndex: 10
                                                            }}
                                                        >
                                                            <span>{ann.labelName || 'Unknown'}</span>
                                                            {ann.confidence && (
                                                                <span className="opacity-75 fw-normal ms-1">{(ann.confidence * 100).toFixed(0)}%</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return null;
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Action Bar (Footer) */}
                            <div className="p-4 bg-white border-top ">
                                {actionState === 'REJECTING' ? (
                                    <div>
                                        {submitError && (
                                            <div className="alert alert-danger mb-3" role="alert">
                                                {submitError}
                                            </div>
                                        )}
                                        <p className="fs-6 fw-semibold text-dark mb-3">Select Rejection Reason:</p>
                                        <div className="d-flex flex-wrap gap-2 mb-4">
                                            {REJECT_REASONS.map(reason => (
                                                <button
                                                    key={reason}
                                                    onClick={() => setRejectReason(reason)}
                                                    className={`btn px-3 py-2 fw-medium rounded ${rejectReason === reason
                                                        ? 'btn-outline-danger border-danger-subtle bg-danger bg-opacity-10'
                                                        : 'btn-outline-secondary'
                                                        }`}
                                                    style={{ fontSize: '12px' }}
                                                >
                                                    {reason}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <button
                                                onClick={() => setActionState('IDLE')}
                                                className="btn btn-link text-muted fw-medium"
                                                style={{ fontSize: '14px' }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                disabled={!rejectReason || isSubmittingReview}
                                                onClick={() => submitReview('Rejected')}
                                                className="btn btn-danger flex-fill fw-semibold shadow-sm"
                                                style={{ fontSize: '14px' }}
                                            >
                                                {isSubmittingReview ? 'Submitting...' : 'Confirm Rejection'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {submitError && (
                                            <div className="alert alert-danger mb-3" role="alert">
                                                {submitError}
                                            </div>
                                        )}
                                        <div className="d-flex align-items-center gap-3" style={{ height: '3rem' }}>
                                            <button
                                                onClick={() => setActionState('REJECTING')}
                                                disabled={isSubmittingReview}
                                                className="btn btn-danger flex-fill h-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                                                style={{ fontSize: '14px' }}
                                            >
                                                <X size={18} />
                                                Reject
                                            </button>
                                            <button
                                                disabled={isSubmittingReview}
                                                className="btn btn-warning h-100 px-4 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                                                title="Escalate to Manager"
                                                style={{ fontSize: '14px' }}
                                            >
                                                <Flag size={18} />
                                            </button>
                                            <button
                                                disabled={isSubmittingReview}
                                                onClick={() => submitReview('Approved')}
                                                className="btn btn-success h-100 d-flex align-items-center justify-content-center gap-2 fw-bold shadow-sm"
                                                style={{ flex: '2', fontSize: '14px' }}
                                            >
                                                <Check size={18} />
                                                {isSubmittingReview ? 'Submitting...' : 'Accept & Next'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="w-100 flex-fill d-flex align-items-center justify-content-center bg-white">
                            <div className="text-center">
                                <h3 className="fs-5 fw-bold text-muted mb-2">No pending items</h3>
                                <p className="text-muted" style={{ fontSize: '14px' }}>All items have been reviewed</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Sidebar (Desktop Only) */}
                <div className="d-none d-lg-flex flex-column gap-4" style={{ width: '60%', maxHeight: '100%', overflowY: 'auto' }}>

                    {/* Review Queue List */}
                    {
                        // <div className="bg-white border rounded shadow-sm d-flex flex-column overflow-hidden">
                        //     <div className="p-3 bg-info bg-opacity-10 border-bottom border-info border-opacity-25 d-flex align-items-center justify-content-between">
                        //         <div className="d-flex align-items-center gap-2 text-info fw-semibold" style={{ fontSize: '12px' }}>
                        //             <FileText size={14} />
                        //             <span>Queue ({currentItemIndex + 1}/{queueItems.length})</span>
                        //         </div>
                        //     </div>
                        //     <div className="overflow-auto" style={{ flex: '1', minHeight: '280px' }}>
                        //         {isLoadingQueue && (
                        //             <div className="p-4 text-center text-muted">
                        //                 <Loader size={20} className="d-inline-block me-2 animate-spin" />
                        //                 Loading items...
                        //             </div>
                        //         )}
                        //         {queueError && (
                        //             <div className="p-3 bg-danger bg-opacity-10 border-bottom border-danger text-danger" style={{ fontSize: '12px' }}>
                        //                 {queueError}
                        //             </div>
                        //         )}
                        //         {!isLoadingQueue && queueItems.length === 0 && (
                        //             <div className="p-4 text-center text-muted">
                        //                 No items to review
                        //             </div>
                        //         )}
                        //         {!isLoadingQueue && queueItems.map((item, idx) => (
                        //             <div
                        //                 key={item.id}
                        //                 onClick={() => setCurrentItemIndex(idx)}
                        //                 className={`p-3 border-bottom cursor-pointer transition-colors ${idx === currentItemIndex
                        //                     ? 'bg-info bg-opacity-10 border-left border-info border-3'
                        //                     : 'bg-white hover:bg-light'}`}
                        //                 style={{
                        //                     cursor: 'pointer',
                        //                     borderLeft: idx === currentItemIndex ? '4px solid #0d6efd' : 'none',
                        //                     paddingLeft: idx === currentItemIndex ? 'calc(0.75rem - 3px)' : '0.75rem'
                        //                 }}
                        //             >
                        //                 <div className="d-flex align-items-start gap-2">
                        //                     {item.thumbnailPath && (
                        //                         <img
                        //                             src={item.thumbnailPath}
                        //                             alt="Thumbnail"
                        //                             className="rounded"
                        //                             style={{ width: '40px', height: '40px', objectFit: 'cover', flexShrink: 0 }}
                        //                             onError={(e) => e.target.style.display = 'none'}
                        //                         />
                        //                     )}
                        //                     <div className="flex-fill" style={{ minWidth: 0 }}>
                        //                         <p className="fw-medium text-dark mb-1" style={{ fontSize: '12px' }}>
                        //                             {item.fileName}
                        //                         </p>
                        //                         <p className="text-muted mb-1" style={{ fontSize: '11px' }}>
                        //                             Project: {item.projectName}
                        //                         </p>
                        //                         <div className="d-flex gap-3" style={{ fontSize: '10px' }}>
                        //                             <span className="text-muted">
                        //                                 Annotations: <strong>{item.annotationCount}</strong>
                        //                             </span>
                        //                             <span className="badge bg-secondary text-white">{item.annotatorName}</span>
                        //                         </div>
                        //                         <p className="text-muted mb-0" style={{ fontSize: '10px', marginTop: '4px' }}>
                        //                             {new Date(item.submittedAt).toLocaleDateString()}
                        //                         </p>
                        //                     </div>
                        //                 </div>
                        //             </div>
                        //         ))}
                        //     </div>
                        //     {/* Pagination Controls */}
                        //     {pagination.totalPages > 1 && (
                        //         <div className="p-3 bg-light border-top d-flex align-items-center justify-content-between">
                        //             <button
                        //                 onClick={() => fetchReviewQueue(pagination.pageNumber - 1)}
                        //                 disabled={!pagination.hasPreviousPage}
                        //                 className="btn btn-sm btn-outline-secondary"
                        //             >
                        //                 <ChevronLeft size={14} />
                        //             </button>
                        //             <span style={{ fontSize: '12px' }} className="text-muted">
                        //                 Page {pagination.pageNumber} of {pagination.totalPages}
                        //             </span>
                        //             <button
                        //                 onClick={() => fetchReviewQueue(pagination.pageNumber + 1)}
                        //                 disabled={!pagination.hasNextPage}
                        //                 className="btn btn-sm btn-outline-secondary"
                        //             >
                        //                 <ChevronRight size={14} />
                        //             </button>
                        //         </div>
                        //     )}
                        // </div>
                    }
                    {/* Guidelines Panel */}
                    <div className="bg-white border  rounded shadow-sm d-flex flex-column" style={{ flex: '0 0 auto' }}>
                        <div className="p-3 bg-primary bg-opacity-10 border-bottom border-primary border-opacity-25 d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2 text-primary fw-semibold" style={{ fontSize: '12px' }}>
                                <FileText size={14} />
                                <span>Guidelines</span>
                            </div>
                        </div>

                        <div className="p-4 bg-white">
                            <div className="text-muted" style={{ fontSize: '12px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                                {guidelines || "No specific guidelines set for this project."}
                            </div>
                        </div>
                    </div>

                    {/* Annotations List */}
                    <div className="bg-white border  rounded shadow-sm p-4 overflow-auto" style={{ minHeight: '200px', flex: '1 1 0' }}>
                        <h3 className="fw-semibold text-dark fs-6 mb-3">Annotations ({task.annotations.length})</h3>
                        <div className="d-flex flex-column gap-2">
                            {task.annotations.map((ann, i) => {
                                const label = project?.classes.find(c => c.id === ann.labelId);
                                return (
                                    <div key={ann.id} className="d-flex align-items-center p-2 rounded border  bg-light">
                                        <span className="rounded-circle me-2" style={{ width: '8px', height: '8px', backgroundColor: label?.color }}></span>
                                        <div className="flex-fill">
                                            <p className="fw-medium text-dark mb-0" style={{ fontSize: '12px' }}>{label?.name}</p>
                                            <p className="text-muted mb-0" style={{ fontSize: '10px' }}>Confidence: {ann.confidence ? (ann.confidence * 100).toFixed(0) : 100}%</p>
                                        </div>
                                        <span className="text-muted" style={{ fontSize: '12px' }}>#{i + 1}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* History / Comments - only visible to Admin */}
                    {isAdmin && (
                        <div className="bg-white border  rounded shadow-sm p-4 d-flex flex-column" style={{ minHeight: '180px', flex: '0 0 auto' }}>
                            <div className="d-flex align-items-center gap-2 mb-2 text-dark fw-semibold fs-6">
                                <MessageSquare size={14} />
                                <span>Item History</span>
                            </div>
                            <div className="flex-fill bg-light rounded p-3 overflow-auto mb-3">
                                <div className="text-muted d-flex flex-column gap-3" style={{ fontSize: '12px' }}>
                                    <div className="d-flex gap-2">
                                        <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-25 text-primary fw-bold rounded-circle" style={{ width: '1.25rem', height: '1.25rem', fontSize: '10px' }}>S</div>
                                        <div>
                                            <p className="fw-medium text-dark mb-0">Sarah A.</p>
                                            <p className="mb-0">Submitted initial annotation.</p>
                                            <p className="text-muted mb-0" style={{ fontSize: '10px', marginTop: '2px' }}>2 hours ago</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <input
                                type="text"
                                placeholder="Add comment..."
                                className="form-control"
                                style={{ fontSize: '12px' }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};






