import React from 'react';
import PropTypes from 'prop-types';

// Props:
// - items: array
// - onClaim: func(item)
// - onRelease: func(item)
const AssignmentQueue = ({ items, onClaim, onRelease, renderItem }) => (
  <div className="list-group">
    {items?.map(it => (
      <div key={it.id} className="list-group-item d-flex justify-content-between align-items-center">
        {renderItem ? renderItem(it) : <div className="flex-grow-1">{it.title || `Item ${it.id}`}</div>}
        <div className="d-flex gap-2 ms-3">
          <button className="btn btn-sm btn-primary" onClick={() => onClaim?.(it)}>Claim</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => onRelease?.(it)}>Release</button>
        </div>
      </div>
    ))}
  </div>
);

AssignmentQueue.propTypes = {
  items: PropTypes.array,
  onClaim: PropTypes.func,
  onRelease: PropTypes.func,
  renderItem: PropTypes.func,
};

export default AssignmentQueue;
