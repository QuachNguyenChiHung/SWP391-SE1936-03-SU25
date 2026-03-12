import React from 'react';
import PropTypes from 'prop-types';

// Props:
// - item: object
// - onAction: func(action, item)
const AssignmentItem = ({ item, onAction }) => (
  <div className="d-flex justify-content-between align-items-center">
    <div>
      <div className="fw-bold">{item.title}</div>
      <div className="small text-muted">{item.subtitle}</div>
    </div>
    <div className="d-flex gap-2">
      <button className="btn btn-sm btn-outline-primary" onClick={() => onAction?.('view', item)}>View</button>
      <button className="btn btn-sm btn-primary" onClick={() => onAction?.('claim', item)}>Claim</button>
    </div>
  </div>
);

AssignmentItem.propTypes = {
  item: PropTypes.object.isRequired,
  onAction: PropTypes.func,
};

export default AssignmentItem;
