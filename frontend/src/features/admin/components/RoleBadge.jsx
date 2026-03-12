import React from 'react';

export const RoleBadge = ({ role }) => {
    const styles = {
        ADMIN: 'bg-danger-subtle text-danger-emphasis border-danger-subtle',
        MANAGER: 'bg-primary-subtle text-primary-emphasis border-primary-subtle',
        ANNOTATOR: 'bg-secondary-subtle text-secondary-emphasis border-secondary-subtle',
        REVIEWER: 'bg-warning-subtle text-warning-emphasis border-warning-subtle',
    };
    const roleKey = role ? role.toUpperCase() : 'ANNOTATOR';
    const className = styles[roleKey] || styles.ANNOTATOR;

    return (
        <span
            className={`px-2 py-1 rounded-pill text-xs fw-bold border ${className}`}
            style={{ fontSize: '0.7rem' }}
            aria-label={`Role: ${role}`}
        >
            {role}
        </span>
    );
};
