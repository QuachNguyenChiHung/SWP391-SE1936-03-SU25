import React from 'react';
import PropTypes from 'prop-types';
import { Edit2, Check, X, Loader2, Shield } from 'lucide-react';
import ProfileAvatar from './ProfileAvatar';
import AvatarUpload from './AvatarUpload';

// Props (comments):
// - profile: object
// - isEditing: bool
// - newName: string
// - setNewName: func
// - isUpdating: bool
// - onEditToggle: func
// - onUpdateName: func
// - getRoleBadgeColor: func(role) => string
const ProfileHeader = ({ profile, isEditing, newName, setNewName, isUpdating, onEditToggle, onUpdateName, getRoleBadgeColor, onAvatarUpload }) => {
    return (
        <>
            {onAvatarUpload ? <AvatarUpload name={profile.name} onUpload={onAvatarUpload} /> : <ProfileAvatar name={profile.name} />}

            {isEditing ? (
                <div className="d-flex gap-2 justify-content-center mb-1">
                    <input
                        className="form-control form-control-sm w-75 fw-bold"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        autoFocus
                    />
                    <button className="btn btn-sm btn-success" onClick={onUpdateName} disabled={isUpdating}>
                        {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    </button>
                    <button className="btn btn-sm btn-light border" onClick={onEditToggle} disabled={isUpdating}><X size={14} /></button>
                </div>
            ) : (
                <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                    <h2 className="fs-4 fw-bold text-slate-900 mb-0">{profile.name}</h2>
                    <button className="btn btn-edit-icon" onClick={onEditToggle}><Edit2 size={16} /></button>
                </div>
            )}

            <p className="text-muted small mb-3">{profile.email}</p>

            <div className="d-flex justify-content-center gap-2 mb-4">
                <span className={`badge ${getRoleBadgeColor(profile.role)} px-3 py-2 rounded-pill`}>
                    <Shield size={12} className="me-1" /> {profile.roleName || profile.role}
                </span>
            </div>
        </>
    );
};

ProfileHeader.propTypes = {
    profile: PropTypes.object.isRequired,
    isEditing: PropTypes.bool,
    newName: PropTypes.string,
    setNewName: PropTypes.func,
    isUpdating: PropTypes.bool,
    onEditToggle: PropTypes.func,
    onUpdateName: PropTypes.func,
    getRoleBadgeColor: PropTypes.func,
};

export default ProfileHeader;
