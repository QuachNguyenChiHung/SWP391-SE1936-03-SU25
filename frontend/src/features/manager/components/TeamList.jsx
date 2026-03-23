import React from 'react';
import PropTypes from 'prop-types';

// Props:
// - teams: array
// - onSelectTeam: func(team)
// - renderItem: optional func(team)
const TeamList = ({ teams, onSelectTeam, renderItem }) => {
  return (
    <div className="list-group">
      {teams?.map(t => (
        <div key={t.id} className="list-group-item list-group-item-action" onClick={() => onSelectTeam?.(t)}>
          {renderItem ? renderItem(t) : (
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-bold">{t.name}</div>
                <div className="small text-muted">{t.memberCount || 0} members</div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

TeamList.propTypes = {
  teams: PropTypes.array,
  onSelectTeam: PropTypes.func,
  renderItem: PropTypes.func,
};

export default TeamList;
