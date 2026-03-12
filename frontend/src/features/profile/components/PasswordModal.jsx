import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { KeyRound, X, Eye, EyeOff, Loader2 } from 'lucide-react';

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
        <div className="modal-overlay">
            <div className="modal-content-custom animate-slide-up shadow-lg">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center gap-2">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                            <KeyRound size={20} />
                        </div>
                        <h5 className="fw-bold mb-0">Update Password</h5>
                    </div>
                    <button className="btn-close-custom" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onSubmit(passwordData); }}>
                    <div className="mb-3">
                        <label className="form-label small fw-bold text-slate-600">Current Password</label>
                        <div className="position-relative">
                            <input
                                type={showPass.current ? "text" : "password"}
                                className="form-control pe-5"
                                required
                                value={passwordData.currentPassword}
                                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            />
                            <button type="button" className="btn-toggle-pass" onClick={() => setShowPass({ ...showPass, current: !showPass.current })}>
                                {showPass.current ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label small fw-bold text-slate-600">New Password</label>
                        <div className="position-relative">
                            <input
                                type={showPass.new ? "text" : "password"}
                                className="form-control pe-5"
                                required
                                value={passwordData.newPassword}
                                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            />
                            <button type="button" className="btn-toggle-pass" onClick={() => setShowPass({ ...showPass, new: !showPass.new })}>
                                {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label small fw-bold text-slate-600">Confirm New Password</label>
                        <div className="position-relative">
                            <input
                                type={showPass.confirm ? "text" : "password"}
                                className="form-control pe-5"
                                required
                                value={passwordData.confirmNewPassword}
                                onChange={e => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                            />
                            <button type="button" className="btn-toggle-pass" onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })}>
                                {showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="d-grid gap-2">
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
