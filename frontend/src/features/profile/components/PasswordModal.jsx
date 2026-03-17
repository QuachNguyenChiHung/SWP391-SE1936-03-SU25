import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { KeyRound, X, Eye, EyeOff, Loader2, Lock } from 'lucide-react';

// Props:
// - isOpen: bool
// - onSubmit: func(passwordData)
// - onClose: func()
// Usage: <PasswordModal isOpen onSubmit={handle} onClose={close} />
const PasswordModal = ({ isOpen, onSubmit, onClose, isSubmitting }) => {
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

    if (!isOpen) return null;

    return (
        <div className="modal-overlay nl-modal-overlay" onClick={onClose}>
            <div className="modal-content-custom nl-modal-content nl-password-modal animate-slide-up shadow-lg" onClick={(e) => e.stopPropagation()}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-2">
                        <div className="nl-password-icon-wrap">
                            <KeyRound size={20} />
                        </div>
                        <div>
                            <h5 className="fw-bold mb-0">Update Password</h5>
                            <p className="nl-password-subtitle mb-0">Use at least 8 characters and keep it secure.</p>
                        </div>
                    </div>
                    <button className="btn-close-custom" onClick={onClose} aria-label="Close password modal"><X size={20} /></button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onSubmit(passwordData); }}>
                    <div className="mb-3 nl-password-field">
                        <label className="form-label small fw-bold text-slate-600" htmlFor="currentPassword">Current Password</label>
                        <div className="position-relative nl-password-input-wrap">
                            <span className="nl-password-leading-icon" aria-hidden="true"><Lock size={16} /></span>
                            <input
                                id="currentPassword"
                                type={showPass.current ? "text" : "password"}
                                className="form-control nl-password-input pe-5 ps-5"
                                required
                                value={passwordData.currentPassword}
                                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            />
                            <button
                                type="button"
                                className="btn-toggle-pass nl-password-toggle"
                                aria-label={showPass.current ? 'Hide current password' : 'Show current password'}
                                onClick={() => setShowPass({ ...showPass, current: !showPass.current })}
                            >
                                {showPass.current ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="mb-3 nl-password-field">
                        <label className="form-label small fw-bold text-slate-600" htmlFor="newPassword">New Password</label>
                        <div className="position-relative nl-password-input-wrap">
                            <span className="nl-password-leading-icon" aria-hidden="true"><Lock size={16} /></span>
                            <input
                                id="newPassword"
                                type={showPass.new ? "text" : "password"}
                                className="form-control nl-password-input pe-5 ps-5"
                                required
                                value={passwordData.newPassword}
                                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            />
                            <button
                                type="button"
                                className="btn-toggle-pass nl-password-toggle"
                                aria-label={showPass.new ? 'Hide new password' : 'Show new password'}
                                onClick={() => setShowPass({ ...showPass, new: !showPass.new })}
                            >
                                {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <div className="nl-password-hint">Tip: combine uppercase, lowercase, numbers, and symbols.</div>
                    </div>

                    <div className="mb-4 nl-password-field">
                        <label className="form-label small fw-bold text-slate-600" htmlFor="confirmNewPassword">Confirm New Password</label>
                        <div className="position-relative nl-password-input-wrap">
                            <span className="nl-password-leading-icon" aria-hidden="true"><Lock size={16} /></span>
                            <input
                                id="confirmNewPassword"
                                type={showPass.confirm ? "text" : "password"}
                                className="form-control nl-password-input pe-5 ps-5"
                                required
                                value={passwordData.confirmNewPassword}
                                onChange={e => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                            />
                            <button
                                type="button"
                                className="btn-toggle-pass nl-password-toggle"
                                aria-label={showPass.confirm ? 'Hide confirm password' : 'Show confirm password'}
                                onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })}
                            >
                                {showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="d-grid gap-2 nl-password-actions">
                        <button type="submit" className="btn btn-primary py-2 fw-bold" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Save Changes"}
                        </button>
                        <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

PasswordModal.propTypes = {
    isOpen: PropTypes.bool,
    onSubmit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool,
};

export default PasswordModal;
