import React from 'react';

export const Avatar = ({ name, email, size = 40, isActive = false }) => {
    // Extract initials from name
    const getInitials = (fullName) => {
        if (!fullName || typeof fullName !== 'string') return '?';
        
        const trimmed = fullName.trim();
        if (!trimmed) return '?';
        
        const words = trimmed.split(/\s+/).filter(Boolean);
        
        if (words.length === 0) return '?';
        if (words.length === 1) return words[0][0].toUpperCase();
        
        // Take first letter of first and last word
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    };

    // Generate consistent color based on name
    const getColorFromName = (fullName) => {
        if (!fullName) return '#6c757d'; // gray for empty names
        
        // Hash function to generate consistent number from string
        let hash = 0;
        for (let i = 0; i < fullName.length; i++) {
            hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Predefined color palette for better aesthetics
        const colors = [
            '#4f46e5', // indigo
            '#7c3aed', // purple
            '#db2777', // pink
            '#dc2626', // red
            '#ea580c', // orange
            '#ca8a04', // yellow
            '#16a34a', // green
            '#0891b2', // cyan
            '#0284c7', // blue
            '#6366f1', // violet
        ];
        
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    const initials = getInitials(name);
    const bgColor = getColorFromName(name);
    const fontSize = size > 48 ? '1.25rem' : size > 40 ? '1rem' : size > 32 ? '0.875rem' : '0.75rem';

    return (
        <div className="position-relative">
            <div
                className="rounded-circle border d-inline-flex align-items-center justify-content-center"
                style={{
                    width: size,
                    height: size,
                    fontSize: fontSize,
                    backgroundColor: bgColor,
                    color: '#ffffff',
                    fontWeight: '600',
                    flexShrink: 0,
                    userSelect: 'none',
                }}
                title={name || email}
                role="img"
                aria-label={`${name}'s avatar`}
            >
                {initials}
            </div>
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
