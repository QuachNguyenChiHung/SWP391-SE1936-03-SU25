import React from 'react';
import PropTypes from 'prop-types';
import { FileText } from 'lucide-react';

const GuidelinesPanel = ({ guidelines }) => (
    <div className="bg-white border rounded shadow-sm d-flex flex-column" style={{ flex: '0 0 auto' }}>
        <div className="p-3 bg-primary bg-opacity-10 border-bottom border-primary border-opacity-25 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2 text-primary fw-semibold" style={{ fontSize: '12px' }}>
                <FileText size={14} />
                <span>Guidelines</span>
            </div>
        </div>
        <div className="p-4 bg-white">
            <div className="text-muted" style={{ fontSize: '12px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{guidelines || 'No specific guidelines set for this project.'}</div>
        </div>
    </div>
);

GuidelinesPanel.propTypes = {
    guidelines: PropTypes.string
};

GuidelinesPanel.defaultProps = {
    guidelines: ''
};

export default GuidelinesPanel;
