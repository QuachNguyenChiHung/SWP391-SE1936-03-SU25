import React from 'react';
import PropTypes from 'prop-types';
import { MessageSquare } from 'lucide-react';

const HistoryPanel = ({ isAdmin }) => {
    if (!isAdmin) return null;

    return (
        <div className="bg-white border rounded shadow-sm p-4 d-flex flex-column" style={{ minHeight: '180px', flex: '0 0 auto' }}>
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
            <input type="text" placeholder="Add comment..." className="form-control" style={{ fontSize: '12px' }} />
        </div>
    );
};

HistoryPanel.propTypes = {
    isAdmin: PropTypes.bool
};

HistoryPanel.defaultProps = {
    isAdmin: false
};

export default HistoryPanel;
