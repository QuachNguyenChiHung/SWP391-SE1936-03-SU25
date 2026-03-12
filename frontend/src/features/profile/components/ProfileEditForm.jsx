import React from 'react';
import PropTypes from 'prop-types';

// Small reusable edit form for profile fields (currently name).
// Props:
// - values: object
// - onChange: func(field, value)
// - onSubmit: func()
// - onCancel: func()
const ProfileEditForm = ({ values, onChange, onSubmit, onCancel, isSubmitting }) => {
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
            <div className="d-flex gap-2 justify-content-center mb-1">
                <input
                    className="form-control form-control-sm w-75 fw-bold"
                    value={values.name}
                    onChange={(e) => onChange('name', e.target.value)}
                    autoFocus
                />
                <button className="btn btn-sm btn-success" type="submit" disabled={isSubmitting}>Save</button>
                <button className="btn btn-sm btn-light border" type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
            </div>
        </form>
    );
};

ProfileEditForm.propTypes = {
    values: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool,
};

export default ProfileEditForm;
