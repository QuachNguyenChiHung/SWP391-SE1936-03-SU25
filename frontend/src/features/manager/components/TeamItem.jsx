import React from 'react';
import PropTypes from 'prop-types';

// Props:
// - team: object
// - onEdit: func
// - onDelete: func
const TeamItem = ({ team, onEdit, onDelete }) => (
  <div className="card mb-3">
    <div className="card-body d-flex justify-content-between align-items-center">
      <div>
        <div className="fw-bold">{team.name}</div>
        <div className="small text-muted">{team.memberCount || 0} members</div>
      </div>
      <div className="d-flex gap-2">
        <button className="btn btn-sm btn-outline-primary" onClick={() => onEdit?.(team)}>Edit</button>
        <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete?.(team)}>Delete</button>
      </div>
    </div>
  </div>
);

TeamItem.propTypes = {
  team: PropTypes.object.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

export default TeamItem;
