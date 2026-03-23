import React from 'react';
import PropTypes from 'prop-types';

// Props:
// - title: string
// - icon: React element
// - value: string|node
// - subtitle: string
// Usage: <StatItem title="Registration" icon={<Calendar/>} value="..." subtitle="..." />
const StatItem = ({ title, icon, value, subtitle }) => {
    return (
        <div className="stat-box sys-info">
            <div className="d-flex align-items-center gap-3 mb-3">
                <div className="icon-box-bg bg-indigo-50 text-indigo-600">{icon}</div>
                <h4 className="h6 fw-bold mb-0 text-slate-900">{title}</h4>
            </div>
            <p className="fs-5 fw-bold text-slate-700 mb-0">{value}</p>
            {subtitle && <p className="text-muted small">{subtitle}</p>}
        </div>
    );
};

StatItem.propTypes = {
    title: PropTypes.string.isRequired,
    icon: PropTypes.node,
    value: PropTypes.node,
    subtitle: PropTypes.string,
};

export default StatItem;
