import React from 'react';

export const StatusBadge = ({ status }) => {
    const isActive = status === "Active";

    return (
        <span
            className={`d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill text-xs fw-medium border ${isActive
                    ? 'bg-success-subtle text-success-emphasis border-success-subtle'
                    : 'bg-light text-muted border-light-subtle'
                }`}
            style={{ fontSize: '0.75rem' }}
            aria-label={`Status: ${status}`}
        >
            <span
                className={`rounded-circle ${isActive ? 'bg-success' : 'bg-secondary'}`}
                style={{ width: '6px', height: '6px' }}
            ></span>
            {status}
        </span>
    );
};
