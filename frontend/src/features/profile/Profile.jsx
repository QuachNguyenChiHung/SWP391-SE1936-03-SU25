import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Shield, Calendar, Clock, CheckCircle, ArrowLeft,
    AlertCircle, Edit2, Check, X, Loader2, KeyRound, Eye, EyeOff
} from 'lucide-react';
import api from '../../shared/utils/api.js';
import './Profile.css';
import ProfileHeader from './components/ProfileHeader';
import ProfileAvatar from './components/ProfileAvatar';
import ProfileDetails from './components/ProfileDetails';
import ProfileStats from './components/ProfileStats';
import ProfileActions from './components/ProfileActions';
import ProfileEditForm from './components/ProfileEditForm';
import PasswordModal from './components/PasswordModal';

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
            const res = await api.put('/profile', { name: newName });
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
            const res = await api.post('/profile/change-password', {
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

    // Avatar upload handler (UI -> API)
    const handleAvatarUpload = async (file) => {
        if (!file) return;
        const form = new FormData();
        form.append('avatar', file);
        try {
            const res = await api.post('/profile/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res?.data?.success && res.data.data) {
                // refresh profile or update avatar field
                fetchProfile();
            }
        } catch (e) {
            console.error('Avatar upload failed', e);
            alert(e?.response?.data?.message || 'Failed to upload avatar');
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
                                onAvatarUpload={handleAvatarUpload}
                            />

                            <ProfileDetails profile={profile} />
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
                            alert("New passwords do not match!");
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
                                alert("Password changed successfully!");
                                setShowPasswordModal(false);
                                setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
                            }
                        } catch (e) {
                            alert(e?.response?.data?.message || "Failed to change password. Please check your current password.");
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