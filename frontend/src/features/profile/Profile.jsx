import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Shield, Calendar, Clock, CheckCircle, ArrowLeft,
    AlertCircle, Edit2, Check, X, Loader2, KeyRound, Eye, EyeOff
} from 'lucide-react';
import api from '../../shared/utils/api.js';
import { useAlert } from '../../shared/context/AlertContext.jsx';
import './Profile.css';
import ProfileHeader from './components/ProfileHeader';
import ProfileAvatar from './components/ProfileAvatar';
import ProfileDetails from './components/ProfileDetails';
import ProfileStats from './components/ProfileStats';
import ProfileActions from './components/ProfileActions';
import ProfileEditForm from './components/ProfileEditForm';
import PasswordModal from './components/PasswordModal';
import { formatDateTime } from '../../shared/utils/dateUtils.js';

export const Profile = () => {
    const navigate = useNavigate();
    const { showAlert } = useAlert();

    // --- States Dữ liệu ---
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- States Chỉnh sửa tên ---
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    // --- Specialize In ---
    const [specializeIn, setSpecializeIn] = useState('');
    const [isEditingSpecialize, setIsEditingSpecialize] = useState(false);

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
                setSpecializeIn(res.data.data.specializeIn || '');
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
        // proceed if either name or specializeIn changed
        if (!newName.trim() || (newName === profile.name && specializeIn === (profile.specializeIn || ''))) {
            setIsEditing(false);
            setIsEditingSpecialize(false);
            return;
        }

        setIsUpdating(true);
        try {
            const res = await api.put('/profile', { name: newName, specializeIn });
            if (res.data?.success) {
                setProfile({ ...profile, name: newName, specializeIn });
                setIsEditing(false);
                setIsEditingSpecialize(false);
            }
        } catch (e) {
            await showAlert(e?.response?.data?.message || 'Update failed', 'Error', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    // Xử lý Đổi mật khẩu (POST /api/profile/change-password)
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            await showAlert('New passwords do not match!', 'Validation', 'warning');
            return;
        }

        setIsChangingPassword(true);
        try {
            const res = await api.post('/profile/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
                confirmNewPassword: passwordData.confirmNewPassword
            });

            if (res.status === 200 || res.data.success) {
                await showAlert('Password changed successfully!', 'Success', 'success');
                setShowPasswordModal(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            }
        } catch (e) {
            await showAlert(e?.response?.data?.message || 'Failed to change password. Please check your current password.', 'Error', 'error');
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
                    <ProfileActions onChangePassword={() => setShowPasswordModal(true)} />
                </div>

                <div className="row g-4">
                    {/* Profile Card */}
                    <div className="col-lg-4">
                        <div className="card-custom p-4 text-center h-100">
                            <ProfileHeader
                                profile={profile}
                                isEditing={isEditing}
                                newName={newName}
                                setNewName={setNewName}
                                isUpdating={isUpdating}
                                onEditToggle={() => setIsEditing(!isEditing)}
                                onUpdateName={handleUpdateName}
                                getRoleBadgeColor={getRoleBadgeColor}
                            />

                            <ProfileDetails profile={profile} />

                            {/* Extra profile metadata and editable specializeIn */}
                            <div className="mt-3 text-start">
                                <div className="mb-2">
                                    <strong>Email:</strong> <span className="text-muted">{profile.email}</span>
                                </div>
                                <div className="mb-2">
                                    <strong>Role:</strong> <span className="text-muted">{profile.roleName || profile.role}</span>
                                </div>
                                <div className="mb-2">
                                    <strong>Status:</strong> <span className="text-muted">{profile.statusName || profile.status}</span>
                                </div>
                                <div className="mb-2">
                                    <strong>Created:</strong> <span className="text-muted">{formatDateTime(profile.createdAt)}</span>
                                </div>
                                <div className="mb-2">
                                    <strong>Last login:</strong> <span className="text-muted">{formatDateTime(profile.lastLoginAt)}</span>
                                </div>

                                <div className="mb-2 d-flex align-items-center gap-2">
                                    <strong>Specialize in:</strong>
                                    {!isEditingSpecialize ? (
                                        <>
                                            <span className="text-muted">{specializeIn || '-'}</span>
                                            <button className="btn btn-sm btn-link ms-2" onClick={() => setIsEditingSpecialize(true)}><Edit2 size={14} /></button>
                                        </>
                                    ) : (
                                        <div className="d-flex gap-2 align-items-center">
                                            <input className="form-control form-control-sm" style={{ minWidth: 200 }} value={specializeIn} onChange={(e) => setSpecializeIn(e.target.value)} />
                                            <button className="btn btn-sm btn-success" onClick={handleUpdateName} disabled={isUpdating}><Check size={14} /></button>
                                            <button className="btn btn-sm btn-secondary" onClick={() => { setSpecializeIn(profile.specializeIn || ''); setIsEditingSpecialize(false); }}><X size={14} /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Details Card */}
                    <div className="col-lg-8">
                        <div className="card-custom p-4 h-100">
                            <ProfileStats profile={profile} />
                        </div>
                    </div>
                </div>

                <PasswordModal
                    isOpen={showPasswordModal}
                    onSubmit={async (pwd) => {
                        // reuse previous password change logic adapted for modal
                        if (pwd.newPassword !== pwd.confirmNewPassword) {
                            await showAlert('New passwords do not match!', 'Validation', 'warning');
                            return;
                        }
                        setIsChangingPassword(true);
                        try {
                            const res = await api.post('/profile/change-password', {
                                currentPassword: pwd.currentPassword,
                                newPassword: pwd.newPassword,
                                confirmNewPassword: pwd.confirmNewPassword
                            });

                            if (res.status === 200 || res.data?.success) {
                                await showAlert('Password changed successfully!', 'Success', 'success');
                                setShowPasswordModal(false);
                                setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
                            }
                        } catch (e) {
                            await showAlert(e?.response?.data?.message || 'Failed to change password. Please check your current password.', 'Error', 'error');
                        } finally {
                            setIsChangingPassword(false);
                        }
                    }}
                    onClose={() => setShowPasswordModal(false)}
                    isSubmitting={isChangingPassword}
                />
            </div>
        </div>

    );
};