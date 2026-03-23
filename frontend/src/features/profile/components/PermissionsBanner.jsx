import React from 'react';
import PropTypes from 'prop-types';

// Props:
// - role: string
// Usage: <PermissionsBanner role={profile.role} />
const PermissionsBanner = ({ role }) => {
    return (
        <div className="info-banner bg-slate-50 border">
            <h6 className="fw-bold mb-1">Permissions</h6>
            <p className="text-muted small mb-0">
                You are logged in as a <strong>{role}</strong>.
                {role === 'Annotator' && ' You have access to label data and submit tasks assigned to your queue.'}
                {role === 'Admin' && ' Full system administrative privileges granted.'}
            </p>
        </div>
    );
};

PermissionsBanner.propTypes = {
    role: PropTypes.string.isRequired,
};

export default PermissionsBanner;
