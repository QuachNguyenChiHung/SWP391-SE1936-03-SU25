import React from 'react';
import PropTypes from 'prop-types';

// Props:
// - title: string
// - value: node
// - icon: node
// - color: string
const StatsCard = ({ title, value, icon, color }) => {
  return (
    <div className="card border-0 shadow-sm h-100 manager-surface-card" style={{ borderRadius: '16px' }}>
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <p className="manager-text-muted small fw-bold text-uppercase mb-1">{title}</p>
            <h3 className="fw-bold mb-0 manager-text-primary">{value}</h3>
          </div>
          <div className="p-3 rounded-3 manager-stat-icon" style={{ backgroundColor: color?.bg || 'var(--surface-hover)', color: color?.color || 'var(--text-primary)' }}>{icon}</div>
        </div>
      </div>
    </div>
  );
};

StatsCard.propTypes = {
  title: PropTypes.string,
  value: PropTypes.any,
  icon: PropTypes.node,
  color: PropTypes.object,
};

export default StatsCard;
