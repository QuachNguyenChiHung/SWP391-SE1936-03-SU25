import React from 'react';
import PropTypes from 'prop-types';

// Props:
// - name: string
// - onUpload: function(file) optional
const ProfileAvatar = ({ name, onUpload }) => {
    const initial = name?.charAt(0)?.toUpperCase() || '?';

    return (
        <div className="mb-3">
            <div className="avatar-circle mb-3 mx-auto shadow-sm" aria-hidden>
                {initial}
            </div>
            {/* optional upload control (UI only) */}
            {onUpload && (
                <div className="mt-2">
                    <input
                        type="file"
                        accept="image/*"
                        className="form-control form-control-sm"
                        onChange={(e) => onUpload(e.target.files?.[0])}
                    />
                </div>
            )}
        </div>
    );
};

ProfileAvatar.propTypes = {
    name: PropTypes.string,
    onUpload: PropTypes.func,
};

export default ProfileAvatar;
