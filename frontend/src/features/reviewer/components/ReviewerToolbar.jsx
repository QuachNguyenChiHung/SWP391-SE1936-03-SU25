import React from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff, ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';

const ReviewerToolbar = ({
    title,
    showLabels,
    onToggleLabels,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onToggleQueuePanel
}) => {
    return (
        <div className="d-flex align-items-center justify-content-between px-4 bg-light border-bottom" style={{ height: '3rem' }}>
            <div className="d-flex align-items-center gap-3">
                <span className="text-uppercase text-muted fw-bold" style={{ fontSize: '12px', letterSpacing: '0.05em' }}>{title || 'Item'}</span>
                <span className="vr" style={{ height: '1rem' }}></span>
                <button
                    onClick={onToggleLabels}
                    className="btn btn-link p-0 d-flex align-items-center gap-1 text-muted text-decoration-none"
                    style={{ fontSize: '12px' }}
                >
                    {showLabels ? <Eye size={14} /> : <EyeOff size={14} />}
                    {showLabels ? 'Hide Labels' : 'Show Labels'}
                </button>
            </div>
            <div className="d-flex align-items-center gap-2">
                <button className="btn btn-link p-0 text-muted" onClick={onZoomIn} title="Zoom In (Ctrl + Scroll)"><ZoomIn size={16} /></button>
                <button className="btn btn-link p-0 text-muted" onClick={onZoomOut} title="Zoom Out (Ctrl + Scroll)"><ZoomOut size={16} /></button>
                <button className="btn btn-link p-0 text-muted" onClick={onResetZoom} title="Reset Zoom (1:1)" style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>1:1</button>
                <span className="vr" style={{ height: '1rem' }}></span>
                <button className="btn btn-link p-0 text-muted"><Maximize2 size={16} /></button>
            </div>
        </div>
    );
};

ReviewerToolbar.propTypes = {
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    showLabels: PropTypes.bool,
    onToggleLabels: PropTypes.func,
    onZoomIn: PropTypes.func,
    onZoomOut: PropTypes.func,
    onResetZoom: PropTypes.func,
    onToggleQueuePanel: PropTypes.func
};

ReviewerToolbar.defaultProps = {
    showLabels: true,
    onToggleLabels: () => { },
    onZoomIn: () => { },
    onZoomOut: () => { },
    onResetZoom: () => { },
    onToggleQueuePanel: () => { }
};

export default ReviewerToolbar;
