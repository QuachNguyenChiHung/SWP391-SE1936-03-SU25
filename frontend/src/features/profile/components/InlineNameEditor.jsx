import React, { useState } from 'react';
import PropTypes from 'prop-types';

// Props:
// - initialName: string
// - onSave: func(name)
// - onCancel: func()
// - isSaving: bool
// Usage: <InlineNameEditor initialName={profile.name} onSave={save} onCancel={cancel} />
const InlineNameEditor = ({ initialName, onSave, onCancel, isSaving }) => {
    const [name, setName] = useState(initialName || '');

    const handleSave = () => {
        if (onSave) onSave(name);
    };

    return (
        <div className="d-flex gap-2 justify-content-center mb-1">
            <input
                className="form-control form-control-sm w-75 fw-bold"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
            />
            <button className="btn btn-sm btn-success" onClick={handleSave} disabled={isSaving}>Save</button>
            <button className="btn btn-sm btn-light border" onClick={onCancel} disabled={isSaving}>Cancel</button>
        </div>
    );
};

InlineNameEditor.propTypes = {
    initialName: PropTypes.string,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    isSaving: PropTypes.bool,
};

export default InlineNameEditor;
