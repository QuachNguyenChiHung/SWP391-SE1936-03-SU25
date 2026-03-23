import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// Props:
// - name: string
// - onUpload: func(file)
// - className: string (optional)
// Usage: <AvatarUpload name={profile.name} onUpload={handleFile} />
const AvatarUpload = ({ name, onUpload, className }) => {
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const handleFile = (file) => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreview(url);
        if (onUpload) onUpload(file);
    };

    const initial = name?.charAt(0)?.toUpperCase() || '?';
    const stringToColor = (str) => {
        if (!str) return '#94a3b8';
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        return `linear-gradient(135deg, hsl(${hue} 70% 45%) 0%, hsl(${(hue + 40) % 360} 65% 55%) 100%)`;
    };
    const bgStyle = { background: stringToColor(name) };

    return (
        <div className={className}>
            <div className="avatar-circle mb-3 mx-auto shadow-sm" aria-hidden style={bgStyle}>
                {preview ? <img src={preview} alt="avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : <span aria-hidden style={{ display: 'inline-block' }}>{initial}</span>}
            </div>

            <div className="mt-2">
                <input
                    type="file"
                    accept="image/*"
                    className="form-control form-control-sm"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                />
            </div>
        </div>
    );
};

AvatarUpload.propTypes = {
    name: PropTypes.string,
    onUpload: PropTypes.func,
    className: PropTypes.string,
};

export default AvatarUpload;
