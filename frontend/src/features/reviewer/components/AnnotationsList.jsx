import React from 'react';
import PropTypes from 'prop-types';

const AnnotationsList = ({ annotations, classes }) => (
    <div className="bg-white border rounded shadow-sm p-4 overflow-auto" style={{ minHeight: '200px', flex: '1 1 0' }}>
        <h3 className="fw-semibold text-dark fs-6 mb-3">Annotations ({annotations.length})</h3>
        <div className="d-flex flex-column gap-2">
            {annotations.map((ann, i) => {
                const label = classes ? classes.find(c => c.id === ann.labelId) : null;
                return (
                    <div key={ann.id} className="d-flex align-items-center p-2 rounded border bg-light">
                        <span className="rounded-circle me-2" style={{ width: '8px', height: '8px', backgroundColor: label?.color }}></span>
                        <div className="flex-fill">
                            <p className="fw-medium text-dark mb-0" style={{ fontSize: '12px' }}>{label?.name}</p>
                            <p className="text-muted mb-0" style={{ fontSize: '10px' }}>Confidence: {ann.confidence ? (ann.confidence * 100).toFixed(0) : 100}%</p>
                        </div>
                        <span className="text-muted" style={{ fontSize: '12px' }}>#{i + 1}</span>
                    </div>
                );
            })}
        </div>
    </div>
);

AnnotationsList.propTypes = {
    annotations: PropTypes.array,
    classes: PropTypes.array
};

AnnotationsList.defaultProps = {
    annotations: [],
    classes: []
};

export default AnnotationsList;
