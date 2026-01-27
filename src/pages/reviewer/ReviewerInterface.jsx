import React, { useState, useEffect } from 'react';
import {
    Check,
    X,
    Flag,
    MessageSquare,
    Eye,
    EyeOff,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    AlertCircle,
    Pencil,
    Save,
    FileText
} from 'lucide-react';
import { MOCK_TASKS, MOCK_PROJECTS } from '../../services/mockData.js';
export const ReviewerInterface = ({ onTitleChange }) => {
    const task = MOCK_TASKS[0]; // In real app, this comes from a queue
    const project = MOCK_PROJECTS.find(p => p.id === task.projectId);

    const [showLabels, setShowLabels] = useState(true);
    const [rejectReason, setRejectReason] = useState('');
    const [actionState, setActionState] = useState('IDLE');

    // Guidelines State
    const [guidelines, setGuidelines] = useState('');
    const [isEditingGuidelines, setIsEditingGuidelines] = useState(false);

    useEffect(() => {
        if (onTitleChange) {
            onTitleChange('Review Queue');
        }
    }, [onTitleChange]);

    useEffect(() => {
        if (project?.guidelines) {
            setGuidelines(project.guidelines);
        }
    }, [project]);

    const REJECT_REASONS = [
        "Loose Bounding Box",
        "Wrong Class Label",
        "Missed Object",
        "Occlusion Error",
        "Other"
    ];

    return (
        <div className="d-flex flex-column" style={{ height: 'calc(100vh - 8rem)' }}>
            {/* Top Bar Stats */}
            <div className="d-flex justify-content-between align-items-center mb-4 px-1">
                <div>
                    <h2 className="fs-5 fw-bold text-dark">Review Queue</h2>
                    <p className="fs-6 text-muted">12 items pending validation</p>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <div className="text-end me-2">
                        <p className="fs-6 fw-bold text-dark">98.5% Accuracy</p>
                        <p className="text-muted" style={{ fontSize: '10px' }}>Your session score</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-center fw-bold text-primary bg-primary bg-opacity-10 border border-primary border-2 rounded-circle" style={{ width: '2.5rem', height: '2.5rem', fontSize: '12px' }}>
                        12
                    </div>
                </div>
            </div>

            <div className="flex-fill d-flex gap-4" style={{ minHeight: 0 }}>
                {/* Main Review Canvas */}
                <div className="flex-fill bg-white border border-light rounded shadow-sm d-flex flex-column overflow-hidden position-relative">

                    {/* Toolbar */}
                    <div className="d-flex align-items-center justify-content-between px-4 bg-light border-bottom border-light" style={{ height: '3rem' }}>
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
                        <div className="position-relative" style={{}}>
                            <img src={task.imageUrl} alt="Review" className="mw-100 mh-100 object-fit-contain d-block" />

                            {showLabels && task.annotations.map((ann) => {
                                const labelClass = project?.classes.find(c => c.id === ann.labelId);
                                return (
                                    <div
                                        key={ann.id}
                                        className="position-absolute border border-2 bg-white bg-opacity-10"
                                        style={{
                                            borderColor: labelClass?.color || '#000',
                                            left: Math.max(0, Math.min(ann.coordinates.x, window.innerWidth)),
                                            top: Math.max(0, Math.min(ann.coordinates.y, window.innerHeight)),
                                            width: ann.coordinates.width,
                                            height: ann.coordinates.height,
                                            pointerEvents: 'none'
                                        }}
                                    >
                                        {/* Label Name Tag on Box */}
                                        <div
                                            className="position-absolute px-2 py-1 fw-bold text-white rounded-top shadow-sm d-flex align-items-center gap-1 text-nowrap"
                                            style={{
                                                backgroundColor: labelClass?.color,
                                                top: ann.coordinates.y > 30 ? '-1.5rem' : '0',
                                                left: '-2px',
                                                fontSize: '10px'
                                            }}
                                        >
                                            {labelClass?.name}
                                            {ann.confidence && (
                                                <span className="opacity-75 fw-normal ms-1">{(ann.confidence * 100).toFixed(0)}%</span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Action Bar (Footer) */}
                    <div className="p-4 bg-white border-top border-light">
                        {actionState === 'REJECTING' ? (
                            <div>
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
                                        disabled={!rejectReason}
                                        className="btn btn-danger flex-fill fw-semibold shadow-sm"
                                        style={{ fontSize: '14px' }}
                                    >
                                        Confirm Rejection
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="d-flex align-items-center gap-3" style={{ height: '3rem' }}>
                                <button
                                    onClick={() => setActionState('REJECTING')}
                                    className="btn btn-outline-danger flex-fill h-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                                    style={{ fontSize: '14px' }}
                                >
                                    <X size={18} />
                                    Reject
                                </button>
                                <button className="btn btn-outline-warning h-100 px-4 d-flex align-items-center justify-content-center gap-2 fw-semibold" title="Escalate to Manager" style={{ fontSize: '14px' }}>
                                    <Flag size={18} />
                                </button>
                                <button className="btn btn-success h-100 d-flex align-items-center justify-content-center gap-2 fw-bold shadow-sm" style={{ flex: '2', fontSize: '14px' }}>
                                    <Check size={18} />
                                    Accept & Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Sidebar (Desktop Only) */}
                <div className="d-none d-lg-flex flex-column gap-4" style={{ width: '60%', maxHeight: '100%', overflowY: 'auto' }}>

                    {/* Guidelines Panel */}
                    <div className="bg-white border border-light rounded shadow-sm d-flex flex-column" style={{ flex: '0 0 auto' }}>
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
                    <div className="bg-white border border-light rounded shadow-sm p-4 overflow-auto" style={{ minHeight: '200px', flex: '1 1 0' }}>
                        <h3 className="fw-semibold text-dark fs-6 mb-3">Annotations ({task.annotations.length})</h3>
                        <div className="d-flex flex-column gap-2">
                            {task.annotations.map((ann, i) => {
                                const label = project?.classes.find(c => c.id === ann.labelId);
                                return (
                                    <div key={ann.id} className="d-flex align-items-center p-2 rounded border border-light bg-light">
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

                    {/* History / Comments */}
                    <div className="bg-white border border-light rounded shadow-sm p-4 d-flex flex-column" style={{ minHeight: '180px', flex: '0 0 auto' }}>
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
                </div>
            </div>
        </div>
    );
};






