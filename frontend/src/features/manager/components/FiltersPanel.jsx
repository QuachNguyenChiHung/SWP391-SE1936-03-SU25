import React from 'react';
import PropTypes from 'prop-types';

// Props:
// - filters: object
// - onChange: func(field, value)
const FiltersPanel = ({ filters, onChange }) => (
  <div className="card p-3">
    <div className="d-flex flex-column gap-2">
      {Object.keys(filters || {}).map(key => (
        <div key={key}>
          <label className="form-label small text-muted">{key}</label>
          <input className="form-control" value={filters[key]} onChange={(e) => onChange(key, e.target.value)} />
        </div>
      ))}
    </div>
  </div>
);

FiltersPanel.propTypes = {
  filters: PropTypes.object,
  onChange: PropTypes.func,
};

export default FiltersPanel;
