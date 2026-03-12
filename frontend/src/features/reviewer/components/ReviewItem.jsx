import React from 'react';
import PropTypes from 'prop-types';

const ReviewItem = ({ item, isSelected, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`p-3 border-bottom cursor-pointer transition-colors ${isSelected ? 'bg-info bg-opacity-10 border-left border-info border-3' : 'bg-white hover:bg-light'}`}
            style={{ cursor: 'pointer', borderLeft: isSelected ? '4px solid #0d6efd' : 'none' }}
        >
            <div className="d-flex align-items-start gap-2">
                {item.thumbnailPath && (
                    <img
                        src={item.thumbnailPath}
                        alt="Thumbnail"
                        className="rounded"
                        style={{ width: '40px', height: '40px', objectFit: 'cover', flexShrink: 0 }}
                        onError={(e) => e.target.style.display = 'none'}
                    />
                )}
                <div className="flex-fill" style={{ minWidth: 0 }}>
                    <p className="fw-medium text-dark mb-1" style={{ fontSize: '12px' }}>
                        {item.fileName}
                    </p>
                    <p className="text-muted mb-1" style={{ fontSize: '11px' }}>
                        Project: {item.projectName}
                    </p>
                    <div className="d-flex gap-3" style={{ fontSize: '10px' }}>
                        <span className="text-muted">Annotations: <strong>{item.annotationCount}</strong></span>
                        <span className="badge bg-secondary text-white">{item.annotatorName}</span>
                    </div>
                    <p className="text-muted mb-0" style={{ fontSize: '10px', marginTop: '4px' }}>
                        {new Date(item.submittedAt).toLocaleDateString()}
                    </p>
                </div>
            </div>
        </div>
    );
};

ReviewItem.propTypes = {
    item: PropTypes.object.isRequired,
    isSelected: PropTypes.bool,
    onClick: PropTypes.func
};

ReviewItem.defaultProps = {
    isSelected: false,
    onClick: () => { }
};

export default ReviewItem;
