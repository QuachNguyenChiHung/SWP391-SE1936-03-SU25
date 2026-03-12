import React from 'react';
import PropTypes from 'prop-types';

// Props:
// - header: node
// - sidebar: node
// - main: node
const ManagerLayout = ({ header, sidebar, main }) => {
  return (
    <div className="manager-page container-fluid py-4">
      <div className="mb-4">{header}</div>
      <div className="row g-4">
        <div className="col-lg-3">{sidebar}</div>
        <div className="col-lg-9">{main}</div>
      </div>
    </div>
  );
};

ManagerLayout.propTypes = {
  header: PropTypes.node,
  sidebar: PropTypes.node,
  main: PropTypes.node,
};

export default ManagerLayout;
