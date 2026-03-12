import React from 'react';
import PropTypes from 'prop-types';
import { Calendar, Clock } from 'lucide-react';

// Props:
// - profile: object
const ProfileStats = ({ profile }) => {
    return (
        <>
            <h3 className="fs-5 fw-bold mb-4">Activity & Logs</h3>
            <div className="row g-4">
                <div className="col-md-6">
                    <div className="stat-box sys-info">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div className="icon-box-bg bg-indigo-50 text-indigo-600"><Calendar size={20} /></div>
                            <h4 className="h6 fw-bold mb-0 text-slate-900">Registration</h4>
                        </div>
                        <p className="fs-5 fw-bold text-slate-700 mb-0">{new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        <p className="text-muted small">{new Date(profile.createdAt).toLocaleTimeString()}</p>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="stat-box sys-info">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div className="icon-box-bg bg-success-subtle text-green-600"><Clock size={20} /></div>
                            <h4 className="h6 fw-bold mb-0 text-slate-900">Last Login</h4>
                        </div>
                        <p className="fs-5 fw-bold text-slate-700 mb-0">{profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString() : 'Initial Session'}</p>
                        <p className="text-muted small">{profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleTimeString() : '-'}</p>
                    </div>
                </div>
                <div className="col-12">
                    <div className="info-banner bg-slate-50 border">
                        <h6 className="fw-bold mb-1">Permissions</h6>
                        <p className="text-muted small mb-0">
                            You are logged in as a <strong>{profile.role}</strong>.
                            {profile.role === 'Annotator' && ' You have access to label data and submit tasks assigned to your queue.'}
                            {profile.role === 'Admin' && ' Full system administrative privileges granted.'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

ProfileStats.propTypes = {
    profile: PropTypes.object.isRequired,
};

export default ProfileStats;
