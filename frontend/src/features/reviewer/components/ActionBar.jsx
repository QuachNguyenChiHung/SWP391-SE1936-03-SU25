import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Flag, Check } from 'lucide-react';
import { CommentInput } from '../../../shared/components/CommentInput.jsx';

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
    const [showCommentInput, setShowCommentInput] = useState(false);

    const handleRejectWithComment = () => {
        setShowCommentInput(true);
    };

    const handleCommentAdded = (comment, successMessage) => {
        if (onCommentAdded) {
            onCommentAdded(comment, successMessage);
        }
        // Keep comment input visible after adding comment
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

                    {/* Comment Input Section */}
                    {showCommentInput && taskItemId && (
                        <div className="mb-3">
                            <CommentInput
                                taskItemId={taskItemId}
                                userRole={userRole}
                                onCommentAdded={handleCommentAdded}
                                onError={(error) => {
                                    if (submitError !== error) {
                                        // Show error via parent component
                                        console.error('Comment error:', error);
                                    }
                                }}
                            />
                        </div>
                    )}

                    <div className="d-flex align-items-center gap-3">
                        <button 
                            onClick={() => {
                                setActionState('IDLE');
                                setShowCommentInput(false);
                            }} 
                            className="btn btn-link text-muted fw-medium" 
                            style={{ fontSize: '14px' }}
                        >
                            Cancel
                        </button>
                        {!showCommentInput && (
                            <button 
                                disabled={!rejectReason || isSubmittingReview} 
                                onClick={handleRejectWithComment}
                                className="btn btn-outline-primary flex-fill fw-semibold" 
                                style={{ fontSize: '14px' }}
                            >
                                Add Comment
                            </button>
                        )}
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
                    {submitError && <div className="alert alert-danger mb-3" role="alert">{submitError}</div>}
                    <div className="d-flex align-items-center gap-3" style={{ height: '3rem' }}>
                        <button onClick={() => setActionState('REJECTING')} disabled={isSubmittingReview} className="btn btn-danger flex-fill h-100 d-flex align-items-center justify-content-center gap-2 fw-semibold" style={{ fontSize: '14px' }}><X size={18} />Reject</button>
                        <button disabled={isSubmittingReview} className="btn btn-warning h-100 px-4 d-flex align-items-center justify-content-center gap-2 fw-semibold" title="Escalate to Manager" style={{ fontSize: '14px' }}><Flag size={18} /></button>
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
