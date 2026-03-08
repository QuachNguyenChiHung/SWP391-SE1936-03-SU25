import React from 'react';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export const AnnotationSidebar = ({
    showGuidelines,
    setShowGuidelines,
    projectClasses = [],
    activeLabelId,
    setActiveLabelId,
    annotations = [],
    selectedAnnotationId,
    setSelectedAnnotationId,
    handleDeleteAnnotation
}) => {
    // Ensure projectClasses is always an array
    const classes = Array.isArray(projectClasses) ? projectClasses : [];
    const annotationsList = Array.isArray(annotations) ? annotations : [];

    return (
        <div className={`sidebar ${showGuidelines ? '' : 'hidden'}`} style={{ position: 'relative', right: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Mobile Toggle Handle */}
            <button
                onClick={() => setShowGuidelines(!showGuidelines)}
                className="sidebar-toggle d-md-none"
            >
                {showGuidelines ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            <div className="d-flex flex-column flex-grow-1 overflow-auto custom-scrollbar p-3" style={{ minHeight: 0 }}>
                {/* Class Selector */}
                <div className="mb-4">
                    <h4 className="text-uppercase fw-bold text-muted mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Label Classes</h4>
                    {classes.length === 0 ? (
                        <div>
                            <p className="text-muted fst-italic mb-2" style={{ fontSize: '0.75rem' }}>
                                {annotationsList.length > 0
                                    ? 'Available labels from annotations:'
                                    : 'No label classes available. Draw annotations to see labels.'}
                            </p>
                            {annotationsList.length > 0 && (
                                <div>
                                    {/* Show unique labels from existing annotations */}
                                    {Array.from(new Map(annotationsList.map(ann => [ann.labelId, ann])).values()).map((ann, idx) => (
                                        <button
                                            key={ann.labelId}
                                            onClick={() => setActiveLabelId(ann.labelId)}
                                            className={`label-class-btn mb-1 ${activeLabelId === ann.labelId ? 'active' : ''}`}
                                            style={{ fontSize: '0.875rem' }}
                                        >
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="rounded-circle" style={{ backgroundColor: ann.labelColor, width: '0.625rem', height: '0.625rem' }}></span>
                                                <span className={activeLabelId === ann.labelId ? 'text-slate-900 fw-medium' : 'text-slate-600'}>{ann.labelName}</span>
                                            </div>
                                            <span className="shortcut-badge">{idx + 1}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            {classes.map((cls, idx) => (
                                <button
                                    key={cls.id}
                                    onClick={() => setActiveLabelId(cls.id)}
                                    className={`label-class-btn mb-1 ${activeLabelId === cls.id ? 'active' : ''}`}
                                    style={{ fontSize: '0.875rem' }}
                                >
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="rounded-circle" style={{ backgroundColor: cls.color, width: '0.625rem', height: '0.625rem' }}></span>
                                        <span className={activeLabelId === cls.id ? 'text-slate-900 fw-medium' : 'text-slate-600'}>{cls.name}</span>
                                    </div>
                                    <span className="shortcut-badge">{idx + 1}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Annotation List */}
                <div className="mb-4">
                    <h4 className="text-uppercase fw-bold text-muted mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Annotations ({annotationsList.length})</h4>
                    <div className="overflow-auto" style={{ maxHeight: '12rem' }}>
                        {annotationsList.length === 0 ? (
                            <p className="text-muted fst-italic" style={{ fontSize: '0.75rem' }}>No annotations yet.</p>
                        ) : (
                            annotationsList.map((ann, i) => (
                                <div
                                    key={ann.id}
                                    onClick={() => setSelectedAnnotationId(ann.id)}
                                    className="d-flex align-items-start gap-2 px-3 py-2 rounded mb-2 border"
                                    style={{
                                        fontSize: '0.75rem',
                                        backgroundColor: selectedAnnotationId === ann.id ? '#dbeafe' : '#f1f5f9',
                                        borderColor: selectedAnnotationId === ann.id ? '#0284c7' : '#cbd5e1',
                                        borderWidth: '2px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div
                                        className="rounded-circle flex-shrink-0 mt-1"
                                        style={{
                                            backgroundColor: ann.labelColor || '#6366f1',
                                            width: '0.75rem',
                                            height: '0.75rem'
                                        }}
                                    ></div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex align-items-center justify-content-between mb-1">
                                            <span className="fw-semibold text-slate-900">{ann.labelName || 'Object'}</span>
                                            <span className="text-muted" style={{ fontSize: '0.625rem' }}>#{i + 1}</span>
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.625rem' }}>
                                            Confidence: {ann.confidence ? `${(ann.confidence * 100).toFixed(0)}%` : '100%'}
                                        </div>
                                        {/* Action buttons */}
                                        <div className="d-flex gap-1 mt-2">
                                            <button
                                                onClick={() => {
                                                    console.log('Delete annotation:', ann.id);
                                                    handleDeleteAnnotation(ann.id);
                                                }}
                                                className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                                                style={{ fontSize: '0.625rem', padding: '0.125rem 0.375rem' }}
                                                title="Delete annotation"
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                </svg>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Guidelines */}
                <div className="guidelines-box">
                    <div className="guidelines-title">
                        <AlertCircle size={14} />
                        <span>Labeling Guidelines</span>
                    </div>
                    <ul className="guidelines-list">
                        <li>Draw tight boxes around visible vehicles.</li>
                        <li>Include side mirrors, exclude antennas.</li>
                        <li>Ignore occluded vehicles less than 20% visible.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
