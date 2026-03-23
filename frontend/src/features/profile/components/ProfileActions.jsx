import React from 'react';
import PropTypes from 'prop-types';
import { KeyRound } from 'lucide-react';

// Props:
// - onChangePassword: func
const ProfileActions = ({ onChangePassword }) => {
    return (
        <button
            className="btn btn-warning border shadow-sm d-flex align-items-center gap-2"
            onClick={onChangePassword}
        >
            <KeyRound size={16} className="text-white" />
            <span className="fw-semibold text-white">Change Password</span>
        </button>
    );
};

ProfileActions.propTypes = {
    onChangePassword: PropTypes.func,
};

export default ProfileActions;
