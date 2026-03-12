import React from 'react';
import PropTypes from 'prop-types';

// Props:
// - title: string
// - value: node
// - icon: node
// - color: string
const StatsCard = ({ title, value, icon, color }) => (
  <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
    <div className="card-body p-4">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <p className="text-muted small fw-bold text-uppercase mb-1">{title}</p>
          <h3 className="fw-bold mb-0 text-dark">{value}</h3>
        </div>
        <div className="p-3 rounded-3" style={{ backgroundColor: color?.bg || '#fff', color: color?.color || '#000' }}>{icon}</div>
      </div>
    </div>
  </div>
);

StatsCard.propTypes = {
  title: PropTypes.string,
  value: PropTypes.any,
  icon: PropTypes.node,
  color: PropTypes.object,
};

export default StatsCard;
