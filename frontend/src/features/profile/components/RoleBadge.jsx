import React from 'react';
import PropTypes from 'prop-types';
import { Shield } from 'lucide-react';

// Props:
// - role: string
// - roleName: string
// - getRoleBadgeColor: func(role) => string
// - className: string
// Usage: <RoleBadge role={profile.role} roleName={profile.roleName} getRoleBadgeColor={getRoleBadgeColor} />
const RoleBadge = ({ role, roleName, getRoleBadgeColor, className }) => {
    const colorClass = getRoleBadgeColor ? getRoleBadgeColor(role) : 'bg-secondary';
    return (
        <span className={`${colorClass} px-3 py-2 rounded-pill ${className || ''}`}>
            <Shield size={12} className="me-1" /> {roleName || role}
        </span>
    );
};

RoleBadge.propTypes = {
    role: PropTypes.string,
    roleName: PropTypes.string,
    getRoleBadgeColor: PropTypes.func,
    className: PropTypes.string,
};

export default RoleBadge;
