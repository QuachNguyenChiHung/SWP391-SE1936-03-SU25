import React from 'react';

export const Avatar = ({ name, email, size = 40, isActive = false }) => {
    const seed = encodeURIComponent(email || name || 'default');
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

    return (
        <div className="position-relative">
            <img
                src={avatarUrl}
                alt={`${name}'s avatar`}
                className="rounded-circle border"
                width={size}
                height={size}
                role="img"
            />
            {isActive && (
                <span
                    className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle p-1"
                    style={{ width: 10, height: 10 }}
                    aria-label="Online"
                ></span>
            )}
        </div>
    );
};
