import React from 'react';
import PropTypes from 'prop-types';
import { User, Mail } from 'lucide-react';

// Props:
// - profile: object
const ProfileDetails = ({ profile }) => {
    return (
        <div className="border-top pt-4 text-start sys-info p-3 rounded-3">
            <h6 className="text-uppercase text-muted fw-bold small mb-3" style={{ letterSpacing: '0.05em' }}>System Info</h6>
            <div className="d-flex align-items-center gap-3 mb-3">
                <div className="icon-rounded"><User size={18} /></div>
                <div>
                    <p className="info-label">Account ID</p>
                    <p className="info-value">#{profile.id}</p>
                </div>
            </div>
            <div className="d-flex align-items-center gap-3">
                <div className="icon-rounded"><Mail size={18} /></div>
                <div className="min-w-0">
                    <p className="info-label">Primary Email</p>
                    <p className="info-value text-truncate">{profile.email}</p>
                </div>
            </div>
        </div>
    );
};

ProfileDetails.propTypes = {
    profile: PropTypes.object.isRequired,
};

export default ProfileDetails;
