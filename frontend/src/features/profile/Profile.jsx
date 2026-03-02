import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Shield, Calendar, Clock, CheckCircle, ArrowLeft,
    AlertCircle, Edit2, Check, X, Loader2, KeyRound, Eye, EyeOff
} from 'lucide-react';
import api from '../../shared/utils/api.js';
import './Profile.css';

export const Profile = () => {
    const navigate = useNavigate();

    // --- States Dữ liệu ---
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- States Chỉnh sửa tên ---
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // --- States Thay đổi mật khẩu ---
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

    // Lấy thông tin Profile từ API
    const fetchProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get('/profile');
            if (res?.data?.success && res?.data?.data) {
                setProfile(res.data.data);
                setNewName(res.data.data.name);
            } else {
                setError('Failed to load profile data');
            }
        } catch (e) {
            console.error('Fetch error:', e);
            setError(e?.response?.data?.message || 'Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // Xử lý Cập nhật tên (PUT /api/profile)
    const handleUpdateName = async () => {
        if (!newName.trim() || newName === profile.name) {
            setIsEditing(false);
            return;
        }

        setIsUpdating(true);
        try {
            const res = await api.put('/api/profile', { name: newName });
            if (res.data.success) {
                setProfile({ ...profile, name: newName });
                setIsEditing(false);
            }
        } catch (e) {
            alert(e?.response?.data?.message || 'Update failed');
        } finally {
            setIsUpdating(false);
        }
    };

    // Xử lý Đổi mật khẩu (POST /api/profile/change-password)
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            alert("New passwords do not match!");
            return;
        }

        setIsChangingPassword(true);
        try {
            const res = await api.post('/api/profile/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
                confirmNewPassword: passwordData.confirmNewPassword
            });

            if (res.status === 200 || res.data.success) {
                alert("Password changed successfully!");
                setShowPasswordModal(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            }
        } catch (e) {
            alert(e?.response?.data?.message || "Failed to change password. Please check your current password.");
        } finally {
            setIsChangingPassword(false);
        }
    };

    // Helper: Badge Colors
    const getRoleBadgeColor = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin': return 'bg-danger';
            case 'manager': return 'bg-primary';
            case 'annotator': return 'bg-info';
            case 'reviewer': return 'bg-warning';
            default: return 'bg-secondary';
        }
    };

    if (isLoading) return (
        <div className="container py-5 text-center">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-3">Syncing profile...</p>
        </div>
    );

    if (error || !profile) return (
        <div className="container py-5">
            <div className="alert alert-danger d-flex align-items-center gap-3">
                <AlertCircle size={24} />
                <div>{error || 'Profile not found'}</div>
            </div>
            <button onClick={() => navigate(-1)} className="btn btn-primary"><ArrowLeft size={16} /> Back</button>
        </div>
    );

    return (
        <div className='profile'>
            <div className="container-fluid py-4 animate-fade-in">
                {/* Header Area */}
                <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                    <h2 className="fw-bold mb-0">Profile</h2>
                    <button
                        className="btn btn-white border shadow-sm d-flex align-items-center gap-2"
                        onClick={() => setShowPasswordModal(true)}
                    >
                        <KeyRound size={16} className="text-primary" />
                        <span className="fw-semibold">Security</span>
                    </button>
                </div>

                <div className="row g-4">
                    {/* Profile Card */}
                    <div className="col-lg-4">
                        <div className="card-custom p-4 text-center h-100">
                            <div className="avatar-circle mb-3 mx-auto shadow-sm">
                                {profile.name?.charAt(0).toUpperCase()}
                            </div>

                            {isEditing ? (
                                <div className="d-flex gap-2 justify-content-center mb-1">
                                    <input
                                        className="form-control form-control-sm w-75 fw-bold"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        autoFocus
                                    />
                                    <button className="btn btn-sm btn-success" onClick={handleUpdateName} disabled={isUpdating}>
                                        {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                    </button>
                                    <button className="btn btn-sm btn-light border" onClick={() => setIsEditing(false)} disabled={isUpdating}><X size={14} /></button>
                                </div>
                            ) : (
                                <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                                    <h2 className="fs-4 fw-bold text-slate-900 mb-0">{profile.name}</h2>
                                    <button className="btn btn-edit-icon" onClick={() => setIsEditing(true)}><Edit2 size={16} /></button>
                                </div>
                            )}
                            <p className="text-muted small mb-3">{profile.email}</p>

                            <div className="d-flex justify-content-center gap-2 mb-4">
                                <span className={`badge ${getRoleBadgeColor(profile.role)} px-3 py-2 rounded-pill`}>
                                    <Shield size={12} className="me-1" /> {profile.roleName || profile.role}
                                </span>
                            </div>

                            <div className="border-top pt-4 text-start">
                                <h6 className="text-uppercase text-muted fw-bold small mb-3" style={{ letterSpacing: '0.05em' }}>System Info</h6>
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <div className="icon-rounded"><User size={18} /></div>
                                    <div>
                                        <p className="info-label">Account ID</p>
                                        <p className="info-value">#{profile.id}</p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="icon-rounded"><Mail size={18} /></div>
                                    <div className="min-w-0">
                                        <p className="info-label">Primary Email</p>
                                        <p className="info-value text-truncate">{profile.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Details Card */}
                    <div className="col-lg-8">
                        <div className="card-custom p-4 h-100">
                            <h3 className="fs-5 fw-bold mb-4">Activity & Logs</h3>
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <div className="stat-box">
                                        <div className="d-flex align-items-center gap-3 mb-3">
                                            <div className="icon-box-bg bg-indigo-50 text-indigo-600"><Calendar size={20} /></div>
                                            <h4 className="h6 fw-bold mb-0 text-slate-900">Registration</h4>
                                        </div>
                                        <p className="fs-5 fw-bold text-slate-700 mb-0">{new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                        <p className="text-muted small">{new Date(profile.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="stat-box">
                                        <div className="d-flex align-items-center gap-3 mb-3">
                                            <div className="icon-box-bg bg-success-subtle text-green-600"><Clock size={20} /></div>
                                            <h4 className="h6 fw-bold mb-0 text-slate-900">Last Login</h4>
                                        </div>
                                        <p className="fs-5 fw-bold text-slate-700 mb-0">{profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString() : 'Initial Session'}</p>
                                        <p className="text-muted small">{profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleTimeString() : '-'}</p>
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="info-banner bg-slate-50 border">
                                        <h6 className="fw-bold mb-1">Permissions</h6>
                                        <p className="text-muted small mb-0">
                                            You are logged in as a <strong>{profile.role}</strong>.
                                            {profile.role === 'Annotator' && ' You have access to label data and submit tasks assigned to your queue.'}
                                            {profile.role === 'Admin' && ' Full system administrative privileges granted.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Change Password Modal */}
                {showPasswordModal && (
                    <div className="modal-overlay">
                        <div className="modal-content-custom animate-slide-up shadow-lg">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                                        <KeyRound size={20} />
                                    </div>
                                    <h5 className="fw-bold mb-0">Update Password</h5>
                                </div>
                                <button className="btn-close-custom" onClick={() => setShowPasswordModal(false)}><X size={20} /></button>
                            </div>

                            <form onSubmit={handleChangePassword}>
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
                                    <button type="submit" className="btn btn-primary py-2 fw-bold" disabled={isChangingPassword}>
                                        {isChangingPassword ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Save Changes"}
                                    </button>
                                    <button type="button" className="btn btn-light" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>

    );
};