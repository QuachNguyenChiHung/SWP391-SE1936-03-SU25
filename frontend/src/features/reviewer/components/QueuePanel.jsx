import React from 'react';
import PropTypes from 'prop-types';
import ReviewList from './ReviewList.jsx';
import { FileText } from 'lucide-react';

const QueuePanel = ({ items, selectedIndex, onSelect, isLoading, error, pagination, onFetchPage }) => {
    return (
        <div className="bg-white border rounded shadow-sm d-flex flex-column overflow-hidden">
            <div className="p-3 bg-info bg-opacity-10 border-bottom border-info border-opacity-25 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2 text-info fw-semibold" style={{ fontSize: '12px' }}>
                    <FileText size={14} />
                    <span>Queue ({selectedIndex + 1}/{items.length})</span>
                </div>
            </div>
            <ReviewList items={items} selectedIndex={selectedIndex} onSelect={onSelect} />

            {pagination && pagination.totalPages > 1 && (
                <div className="p-3 bg-light border-top d-flex align-items-center justify-content-between">
                    <button onClick={() => onFetchPage(pagination.pageNumber - 1)} disabled={!pagination.hasPreviousPage} className="btn btn-sm btn-outline-secondary">Prev</button>
                    <span style={{ fontSize: '12px' }} className="text-muted">Page {pagination.pageNumber} of {pagination.totalPages}</span>
                    <button onClick={() => onFetchPage(pagination.pageNumber + 1)} disabled={!pagination.hasNextPage} className="btn btn-sm btn-outline-secondary">Next</button>
                </div>
            )}
        </div>
    );
};

QueuePanel.propTypes = {
    items: PropTypes.array,
    selectedIndex: PropTypes.number,
    onSelect: PropTypes.func,
    isLoading: PropTypes.bool,
    error: PropTypes.string,
    pagination: PropTypes.object,
    onFetchPage: PropTypes.func
};

QueuePanel.defaultProps = {
    items: [],
    selectedIndex: 0,
    onSelect: () => { },
    isLoading: false,
    error: null,
    pagination: null,
    onFetchPage: () => { }
};

export default QueuePanel;
