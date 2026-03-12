import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Flag, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import getInforFromCookie from '../../shared/utils/getInfoFromCookie.js';
import { UserRole } from '../../shared/types/types.js';
import api from '../../shared/utils/api.js';
import ReviewerToolbar from './components/ReviewerToolbar.jsx';
import ImageViewer from './components/ImageViewer.jsx';
import ActionBar from './components/ActionBar.jsx';
import QueuePanel from './components/QueuePanel.jsx';
import GuidelinesPanel from './components/GuidelinesPanel.jsx';
import AnnotationsList from './components/AnnotationsList.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';

export const ReviewerContainer = ({ onTitleChange, user }) => {
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

    // Zoom and Pan State
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const panStartRef = useRef(null);
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    // Fetch review queue items
    const fetchReviewQueue = async (pageNumber = 1) => {
        setIsLoadingQueue(true);
        setQueueError(null);
        try {
            const res = await api.get('/reviews/pending', {
                params: { pageNumber, pageSize: 10 }
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
        if (queueItems[index]) fetchReviewDetail(queueItems[index].id);
    };

    const currentQueueItem = queueItems[currentItemIndex];

    const task = currentQueueItem ? {
        id: currentQueueItem.id,
        imageUrl: currentQueueItem.filePath || (reviewData?.filePath ? process.env.VITE_URL_UPLOADS + '/' + reviewData.filePath : ''),
        projectId: currentQueueItem.projectId,
        annotations: reviewData?.annotations?.map(ann => ({
            ...ann,
            coordinates: typeof ann.coordinates === 'string' ? JSON.parse(ann.coordinates) : ann.coordinates,
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

    // Pan functions
    const handlePanStart = (e) => {
        if (e.button === 1 || (e.button === 0 && e.shiftKey) || (e.button === 0 && isSpacePressed)) {
            e.preventDefault();
            setIsPanning(true);
            panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
        }
    };

    const handlePanMove = (e) => {
        if (isPanning && panStartRef.current) {
            setPanOffset({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y });
        }
    };

    const handlePanEnd = () => { setIsPanning(false); panStartRef.current = null; };

    // Mouse wheel zoom
    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)));
        }
    };

    const handleResetZoom = () => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); };
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));

    useEffect(() => {
        if (onTitleChange) onTitleChange('Review Queue');
        fetchReviewQueue();
    }, [onTitleChange]);

    // Keyboard event listeners for spacebar panning
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' && !isSpacePressed && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault(); setIsSpacePressed(true);
            }
        };
        const handleKeyUp = (e) => { if (e.code === 'Space') { e.preventDefault(); setIsSpacePressed(false); if (isPanning) { setIsPanning(false); panStartRef.current = null; } } };
        window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, [isSpacePressed, isPanning]);

    useEffect(() => { if (project?.guidelines) setGuidelines(project.guidelines); }, [project]);

    // determine current user role from cookie
    const cookieUser = getInforFromCookie();
    const currentRole = cookieUser?.user?.roleName || cookieUser?.user?.role || cookieUser?.role || null;
    const isAdmin = currentRole === UserRole.ADMIN || currentRole === 'Admin' || currentRole === 'ADMIN';

    const REJECT_REASONS = task.errorTypes && task.errorTypes.length > 0 ? task.errorTypes.map(et => et.name) : [
        'Loose Bounding Box', 'Wrong Class Label', 'Missed Object', 'Occlusion Error', 'Other'
    ];

    const handleNextItem = () => { if (task.navigation?.nextDataItemId) handleSelectQueueItem(currentItemIndex + 1); };
    const handlePreviousItem = () => { if (task.navigation?.previousDataItemId) handleSelectQueueItem(currentItemIndex - 1); };

    // Submit review handler
    const submitReview = async (decision, feedback = '') => {
        if (!currentQueueItem?.id) { setSubmitError('No item selected'); return; }
        setIsSubmittingReview(true); setSubmitError(null);
        try {
            let errorTypeIds = [];
            if (decision === 'Rejected' && rejectReason) {
                const selectedErrorType = task.errorTypes?.find(et => et.name === rejectReason);
                if (selectedErrorType) errorTypeIds = [selectedErrorType.id];
            }
            const payload = { decision, feedback: feedback || rejectReason || '', errorTypeIds };
            const res = await api.post(`/data-items/${currentQueueItem.id}/reviews`, payload);
            console.log('Review submitted successfully:', res.data);
            setActionState('IDLE'); setRejectReason('');
            const updatedQueue = queueItems.filter((_, idx) => idx !== currentItemIndex);
            if (updatedQueue.length > 0) {
                setQueueItems(updatedQueue); setPagination(prev => ({ ...prev, totalCount: Math.max(0, prev.totalCount - 1) }));
                const nextIndex = currentItemIndex >= updatedQueue.length ? Math.max(0, updatedQueue.length - 1) : currentItemIndex;
                setCurrentItemIndex(nextIndex); if (updatedQueue[nextIndex]) fetchReviewDetail(updatedQueue[nextIndex].id);
            } else {
                const nextPage = pagination.hasNextPage ? pagination.pageNumber : 1; fetchReviewQueue(nextPage);
            }
        } catch (error) {
            console.error('Failed to submit review:', error); setSubmitError(error?.response?.data?.message || 'Failed to submit review');
        } finally { setIsSubmittingReview(false); }
    };

    return (
        <div className="d-flex flex-column" style={{ height: 'calc(100vh - 8rem)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4 px-1">
                <div>
                    <h2 className="fs-5 fw-bold text-dark">Review Queue</h2>
                    <p className="fs-6 text-muted">{pagination.totalCount} items pending validation</p>
                </div>
                <button onClick={() => setShowQueuePanel(!showQueuePanel)} className="btn btn-light border d-lg-none" title="Toggle queue list">{showQueuePanel ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}</button>
            </div>

            <div className="flex-fill d-flex gap-4 flex-wrap" style={{ minHeight: 0 }}>
                <div style={{ aspectRatio: '2/1' }} className="flex-fill bg-white border rounded shadow-sm d-flex flex-column overflow-hidden position-relative">
                    {queueItems.length > 0 ? (
                        <>
                            <ReviewerToolbar title={`Item #${task.id}`} showLabels={showLabels} onToggleLabels={() => setShowLabels(!showLabels)} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onResetZoom={handleResetZoom} />
                            <ImageViewer isLoadingDetail={isLoadingDetail} task={task} showLabels={showLabels} zoomLevel={zoomLevel} panOffset={panOffset} isPanning={isPanning} isSpacePressed={isSpacePressed} containerRef={containerRef} imageRef={imageRef} onPanStart={handlePanStart} onPanMove={handlePanMove} onPanEnd={handlePanEnd} onWheel={handleWheel} />
                            <ActionBar actionState={actionState} setActionState={setActionState} submitError={submitError} REJECT_REASONS={REJECT_REASONS} rejectReason={rejectReason} setRejectReason={setRejectReason} submitReview={submitReview} isSubmittingReview={isSubmittingReview} />
                        </>
                    ) : (
                        <div className="w-100 flex-fill d-flex align-items-center justify-content-center bg-white">
                            <div className="text-center"><h3 className="fs-5 fw-bold text-muted mb-2">No pending items</h3><p className="text-muted" style={{ fontSize: '14px' }}>All items have been reviewed</p></div>
                        </div>
                    )}
                </div>

                <div className="d-none d-lg-flex flex-wrap flex-column gap-4" style={{ width: '100%', maxHeight: '100%', overflowY: 'auto' }}>

                    <AnnotationsList annotations={task.annotations} classes={project?.classes || []} />
                    <HistoryPanel isAdmin={isAdmin} />
                </div>
            </div>
        </div>
    );
};

export default ReviewerContainer;
