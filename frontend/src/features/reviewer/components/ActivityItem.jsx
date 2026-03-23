import React from 'react';
import PropTypes from 'prop-types';

const ActivityItem = ({ icon, title, time, user, type = 'blue' }) => {
    const colors = {
        blue: 'bg-primary-subtle text-primary',
        green: 'bg-success-subtle text-success',
        red: 'bg-danger-subtle text-danger'
    };

    return (
        <div className="d-flex align-items-start gap-3">
            <div className={`p-2 rounded-circle ${colors[type]}`}>
                {icon}
            </div>
            <div className="flex-grow-1 border-bottom pb-3">
                <p className="small fw-bold text-dark mb-0">{title}</p>
                <div className="d-flex justify-content-between">
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>By {user}</span>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>{time}</span>
                </div>
            </div>
        </div>
    );
};

ActivityItem.propTypes = {
    icon: PropTypes.node,
    title: PropTypes.string.isRequired,
    time: PropTypes.string,
    user: PropTypes.string,
    type: PropTypes.oneOf(['blue', 'green', 'red'])
};

ActivityItem.defaultProps = {
    icon: null,
    time: '',
    user: 'Unknown',
    type: 'blue'
};

export default ActivityItem;
