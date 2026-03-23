import React from 'react';
import PropTypes from 'prop-types';

// Props:
// - name: string
// - onUpload: function(file) optional
const ProfileAvatar = ({ name, onUpload }) => {
    const initial = name?.charAt(0)?.toUpperCase() || '?';
    const stringToColor = (str) => {
        if (!str) return '#64748b';
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        return `linear-gradient(135deg, hsl(${hue} 70% 45%) 0%, hsl(${(hue + 40) % 360} 65% 55%) 100%)`;
    };
    const bgStyle = { background: stringToColor(name) };

    return (
        <div className="mb-3">
            <div className="avatar-circle mb-3 mx-auto shadow-sm" aria-hidden style={bgStyle}>
                <span aria-hidden style={{ display: 'inline-block' }}>{initial}</span>
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
