import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { X, Check } from 'lucide-react';
import commentService from '../../../shared/services/commentService.js';

const ActionBar = ({
    actionState,
    setActionState,
    submitError,
    REJECT_REASONS,
    rejectReason,
    setRejectReason,
    submitReview,
    isSubmittingReview,
    taskItemId,
    userRole,
    onCommentAdded
}) => {
    const [rejectComment, setRejectComment] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);

    useEffect(() => {
        if (actionState !== 'REJECTING') {
            setRejectComment('');
        }
    }, [actionState]);

    const handleConfirmRejection = async () => {
        const trimmedComment = rejectComment.trim();
        if (!rejectReason || !trimmedComment || !taskItemId || isSubmittingReview || isPostingComment) {
            return;
        }

        try {
            setIsPostingComment(true);
            const newComment = await commentService.addComment(taskItemId, trimmedComment);
            if (onCommentAdded) {
                onCommentAdded(newComment, 'Comment attached to rejection');
            }
            await submitReview('Rejected', trimmedComment);
        } catch (error) {
            console.error('Failed to add comment before rejection:', error);
        } finally {
            setIsPostingComment(false);
        }
    };

    return (
        <div className="p-4 bg-white border-top">
            {actionState === 'REJECTING' ? (
                <div>
                    {submitError && <div className="alert alert-danger mb-3" role="alert">{submitError}</div>}
                    <p className="fs-6 fw-semibold text-dark mb-3">Select Rejection Reason:</p>
                    <div className="d-flex flex-wrap gap-2 mb-4">
                        {REJECT_REASONS.map(reason => (
                            <button
                                key={reason}
                                onClick={() => setRejectReason(reason)}
                                className={`btn px-3 py-2 fw-medium rounded ${rejectReason === reason ? 'btn-outline-danger border-danger-subtle bg-danger bg-opacity-10' : 'btn-outline-secondary'}`}
                                style={{ fontSize: '12px' }}
                            >
                                {reason}
                            </button>
                        ))}
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: '14px' }}>
                            Add a comment explaining the issue
                        </label>
                        <textarea
                            className="form-control"
                            rows={4}
                            placeholder="Add a comment explaining the issue..."
                            value={rejectComment}
                            onChange={(e) => setRejectComment(e.target.value)}
                            disabled={isSubmittingReview || isPostingComment}
                            style={{ fontSize: '14px' }}
                        />
                        <small className="text-muted d-block mt-2">
                            Ctrl+Enter to submit rejection with comment
                        </small>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        <button
                            onClick={() => {
                                setActionState('IDLE');
                                setRejectComment('');
                            }}
                            className="btn btn-link text-muted fw-medium"
                            style={{ fontSize: '14px' }}
                        >
                            Cancel
                        </button>
                        <button
                            disabled={!rejectReason || !rejectComment.trim() || isSubmittingReview || isPostingComment}
                            onClick={handleConfirmRejection}
                            className="btn btn-danger flex-fill fw-semibold shadow-sm"
                            style={{ fontSize: '14px' }}
                        >
                            {isSubmittingReview || isPostingComment ? 'Submitting...' : 'Confirm Rejection'}
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    {submitError && <div className="alert alert-danger mb-3" role="alert">{submitError}</div>}
                    <div className="d-flex align-items-center gap-3" style={{ height: '3rem' }}>
                        <button onClick={() => setActionState('REJECTING')} disabled={isSubmittingReview} className="btn btn-danger flex-fill h-100 d-flex align-items-center justify-content-center gap-2 fw-semibold" style={{ fontSize: '14px' }}><X size={18} />Reject</button>
                        <button disabled={isSubmittingReview} onClick={() => submitReview('Approved')} className="btn btn-success h-100 d-flex align-items-center justify-content-center gap-2 fw-bold shadow-sm" style={{ flex: '2', fontSize: '14px' }}><Check size={18} />{isSubmittingReview ? 'Submitting...' : 'Accept & Next'}</button>
                    </div>
                </div>
            )}
        </div>
    );
};

ActionBar.propTypes = {
    actionState: PropTypes.string,
    setActionState: PropTypes.func,
    submitError: PropTypes.string,
    REJECT_REASONS: PropTypes.array,
    rejectReason: PropTypes.string,
    setRejectReason: PropTypes.func,
    submitReview: PropTypes.func,
    isSubmittingReview: PropTypes.bool,
    taskItemId: PropTypes.number,
    userRole: PropTypes.string,
    onCommentAdded: PropTypes.func
};

ActionBar.defaultProps = {
    actionState: 'IDLE',
    setActionState: () => { },
    submitError: null,
    REJECT_REASONS: [],
    rejectReason: '',
    setRejectReason: () => { },
    submitReview: () => { },
    isSubmittingReview: false,
    taskItemId: null,
    userRole: null,
    onCommentAdded: null
};

export default ActionBar;
