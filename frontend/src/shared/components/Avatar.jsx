import React from 'react';
import PropTypes from 'prop-types';

/**
 * Avatar component that displays user initials with a colored background
 * @param {string} name - User's full name
 * @param {string} size - Size variant: 'sm', 'md', 'lg', 'xl'
 * @param {string} className - Additional CSS classes
 */
export const Avatar = ({ name = '', size = 'md', className = '' }) => {
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

    // Size configurations
    const sizeConfig = {
        sm: { width: '32px', height: '32px', fontSize: '0.75rem' },
        md: { width: '40px', height: '40px', fontSize: '0.875rem' },
        lg: { width: '48px', height: '48px', fontSize: '1rem' },
        xl: { width: '64px', height: '64px', fontSize: '1.25rem' },
    };

    const config = sizeConfig[size] || sizeConfig.md;
    const initials = getInitials(name);
    const bgColor = getColorFromName(name);

    const style = {
        width: config.width,
        height: config.height,
        fontSize: config.fontSize,
        backgroundColor: bgColor,
        color: '#ffffff',
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '600',
        flexShrink: 0,
        userSelect: 'none',
    };

    return (
        <div 
            className={`avatar ${className}`} 
            style={style}
            title={name}
        >
            {initials}
        </div>
    );
};

Avatar.propTypes = {
    name: PropTypes.string,
    size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
    className: PropTypes.string,
};

export default Avatar;
