import React from 'react';
import PropTypes from 'prop-types';

// Props:
// - header: node
// - left: node
// - right: node
// Usage: <ProfileLayout header={<Header/>} left={<Left/>} right={<Right/>} />
const ProfileLayout = ({ header, left, right }) => {
    return (
        <div className='profile'>
            <div className="container-fluid py-4 animate-fade-in">
                <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                    {header}
                </div>

                <div className="row g-4">
                    <div className="col-lg-4">{left}</div>
                    <div className="col-lg-8">{right}</div>
                </div>
            </div>
        </div>
    );
};

ProfileLayout.propTypes = {
    header: PropTypes.node,
    left: PropTypes.node,
    right: PropTypes.node,
};

export default ProfileLayout;
