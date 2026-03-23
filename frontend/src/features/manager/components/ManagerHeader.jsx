import React from 'react';
import PropTypes from 'prop-types';

// Props:
// - title: string
// - subtitle: string
// - actions: node
const ManagerHeader = ({ title, subtitle, actions }) => (
  <div className="d-flex justify-content-between align-items-center">
    <div>
      <h2 className="h3 fw-bold mb-1">{title}</h2>
      {subtitle && <p className="text-secondary mb-0">{subtitle}</p>}
    </div>
    <div>{actions}</div>
  </div>
);

ManagerHeader.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
};

export default ManagerHeader;
