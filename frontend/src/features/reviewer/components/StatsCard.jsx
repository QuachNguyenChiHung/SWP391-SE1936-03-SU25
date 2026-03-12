import React from 'react';
import PropTypes from 'prop-types';

const StatsCard = ({ label, value, Icon, color, bg }) => {
    return (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ transition: 'transform 0.2s' }}>
            <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="rounded-3 p-3" style={{ backgroundColor: bg, color }}>
                        {Icon ? <Icon size={24} strokeWidth={2.5} /> : null}
                    </div>
                </div>
                <h6 className="text-secondary fw-medium mb-1">{label}</h6>
                <h3 className="fw-bold mb-0">{value}</h3>
            </div>
        </div>
    );
};

StatsCard.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    Icon: PropTypes.elementType,
    color: PropTypes.string,
    bg: PropTypes.string
};

StatsCard.defaultProps = {
    Icon: null,
    color: '#000',
    bg: 'transparent'
};

export default StatsCard;
