import React, { useState } from 'react';
import { MOCK_USERS, MOCK_ACTIVITY } from '../../services/mockData.js';
import { UserRole } from '../../types.js';
import { Activity, UserPlus, Search, X, Check, Mail, Shield, User, UserIcon } from 'lucide-react';
export const AdminPanel = ({ user }) => {
    const [users, setUsers] = useState(MOCK_USERS);
    const [editingUser, setEditingUser] = useState(null);
    const [creatingUser, setCreatingUser] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', email: '', role: UserRole.ANNOTATOR });
    const [searchQuery, setSearchQuery] = useState('');

    const handleEdit = (user) => {
        setEditingUser({ ...user });
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!editingUser) return;

        setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
        setEditingUser(null);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        const createdUser = {
            id: users.length + 1,
            name: newUser.username,
            email: newUser.email,
            role: newUser.role,
            active: true,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUser.username}`
        };
        setUsers([...users, createdUser]);
        setCreatingUser(false);
        setNewUser({ username: '', password: '', email: '', role: UserRole.ANNOTATOR });
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-100 d-flex flex-column gap-4 animate-in fade-in duration-500">

            <div className="row g-4">
                {/* Main User List */}
                <div className="col-12 col-lg-8">
                    <div className="card border shadow-sm h-100">
                        <div className="card-header bg-white border-bottom">
                            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
                                <div>
                                    <h3 className="h5 fw-semibold mb-1">User Management</h3>
                                    <p className="small text-muted mb-0">Active members of your labeling organization</p>
                                </div>
                                <div className="d-flex gap-2 w-100" style={{ maxWidth: '400px' }}>
                                    <div className="position-relative flex-grow-1">
                                        <Search size={16} className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '0.75rem' }} />
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="form-control form-control-sm ps-5"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setCreatingUser(true)}
                                        className="btn btn-dark btn-sm d-flex align-items-center gap-2 text-nowrap">
                                        <UserPlus size={16} />
                                        Create User
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="fw-semibold">User</th>
                                        <th className="fw-semibold">Role</th>
                                        <th className="fw-semibold">Status</th>
                                        <th className="fw-semibold text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-3">
                                                    <img src={user.avatarUrl} alt="" className="rounded-circle" style={{ width: '36px', height: '36px' }} />
                                                    <div>
                                                        <div className="fw-medium">{user.name}</div>
                                                        <div className="small text-muted">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge rounded-pill text-black
                                            ${user.role === 'ADMIN' ? 'bg-purple-light text-purple' : ''}
                                            ${user.role === 'MANAGER' ? 'bg-indigo-light text-indigo' : ''}
                                            ${user.role === 'ANNOTATOR' ? 'bg-blue-light text-primary' : ''}
                                            ${user.role === 'REVIEWER' ? 'bg-orange-light text-warning' : ''}
                                        `}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                {user.active ? (
                                                    <span className="d-inline-flex align-items-center gap-2 small text-success fw-medium">
                                                        <span className="rounded-circle bg-success" style={{ width: '6px', height: '6px' }}></span> Active
                                                    </span>
                                                ) : (
                                                    <span className="d-inline-flex align-items-center gap-2 small text-muted fw-medium">
                                                        <span className="rounded-circle bg-secondary" style={{ width: '6px', height: '6px' }}></span> Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-end">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="btn btn-link btn-sm text-primary p-0">
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Activity Timeline Sidebar */}
                <div className="col-12 col-lg-4">
                    <div className="card border shadow-sm">
                        <div className="card-header bg-light d-flex align-items-center justify-content-between">
                            <h3 className="h6 fw-semibold mb-0 d-flex align-items-center gap-2">
                                <Activity size={18} className="text-muted" />
                                Activity Log
                            </h3>
                            <button className="btn btn-link btn-sm text-primary p-0">View All</button>
                        </div>
                        <div className="card-body">
                            <div className="position-relative border-start ps-4">
                                {MOCK_ACTIVITY.map((log) => (
                                    <div key={log.id} className="position-relative mb-4">
                                        <div className="position-absolute bg-white border border-2 rounded-circle" style={{ left: '-21px', top: '6px', width: '10px', height: '10px' }}></div>
                                        <p className="small fw-medium mb-1">{log.action}</p>
                                        <p className="text-muted mb-2" style={{ fontSize: '0.75rem' }}>{log.details}</p>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="badge bg-light text-dark font-monospace" style={{ fontSize: '0.65rem' }}>
                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="text-muted" style={{ fontSize: '0.65rem' }}>by User #{log.userId}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Create User Modal */}
            {creatingUser && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setCreatingUser(false)}>
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content animate-in zoom-in-95 duration-200">
                            <div className="modal-header bg-light">
                                <h5 className="modal-title fw-semibold">Create User</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setCreatingUser(false)}
                                ></button>
                            </div>

                            <form onSubmit={handleCreate}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label small fw-medium">Username</label>
                                        <div className="position-relative">
                                            <UserIcon size={16} className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '0.75rem' }} />
                                            <input
                                                type="text"
                                                value={newUser.username}
                                                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                                className="form-control ps-5"
                                                required
                                                placeholder="Enter username"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-medium">Password</label>
                                        <div className="position-relative">
                                            <Shield size={16} className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '0.75rem' }} />
                                            <input
                                                type="password"
                                                value={newUser.password}
                                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                                className="form-control ps-5"
                                                required
                                                placeholder="Enter password"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-medium">Email Address</label>
                                        <div className="position-relative">
                                            <Mail size={16} className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '0.75rem' }} />
                                            <input
                                                type="email"
                                                value={newUser.email}
                                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                                className="form-control ps-5"
                                                required
                                                placeholder="Enter email address"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-medium">Role</label>
                                        <div className="position-relative">
                                            <Shield size={16} className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '0.75rem', pointerEvents: 'none' }} />
                                            <select
                                                value={newUser.role}
                                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                                className="form-select ps-5"
                                            >
                                                {Object.values(UserRole).map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer bg-light">
                                    <button
                                        type="button"
                                        onClick={() => setCreatingUser(false)}
                                        className="btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary">
                                        Create User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setEditingUser(null)}>
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content animate-in zoom-in-95 duration-200">
                            <div className="modal-header bg-light">
                                <h5 className="modal-title fw-semibold">Edit User</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setEditingUser(null)}
                                ></button>
                            </div>

                            <form onSubmit={handleSave}>
                                <div className="modal-body">
                                    <div className="d-flex align-items-center gap-3 mb-4">
                                        <img src={editingUser.avatarUrl} className="rounded-circle border" style={{ width: '64px', height: '64px' }} />
                                        <div>
                                            <p className="small text-muted mb-1">Profile Photo</p>
                                            <button type="button" className="btn btn-link btn-sm p-0 text-primary">Change</button>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-medium">Full Name</label>
                                        <div className="position-relative">
                                            <UserIcon size={16} className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '0.75rem' }} />
                                            <input
                                                type="text"
                                                value={editingUser.name}
                                                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                                className="form-control ps-5"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-medium">Email Address</label>
                                        <div className="position-relative">
                                            <Mail size={16} className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '0.75rem' }} />
                                            <input
                                                type="email"
                                                value={editingUser.email}
                                                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                                className="form-control ps-5"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="row g-3 mb-3">
                                        <div className="col-6">
                                            <label className="form-label small fw-medium">Role</label>
                                            <div className="position-relative">
                                                <Shield size={16} className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '0.75rem', pointerEvents: 'none' }} />
                                                <select
                                                    value={editingUser.role}
                                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                                    className="form-select ps-5"
                                                >
                                                    {Object.values(UserRole).map(role => (
                                                        <option key={role} value={role}>{role}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="col-6">
                                            <label className="form-label small fw-medium">Status</label>
                                            <div className="d-flex align-items-center gap-3 h-100">
                                                <div className="form-check">
                                                    <input
                                                        type="radio"
                                                        className="form-check-input"
                                                        id="statusActive"
                                                        checked={editingUser.active}
                                                        onChange={() => setEditingUser({ ...editingUser, active: true })}
                                                    />
                                                    <label className="form-check-label small" htmlFor="statusActive">Active</label>
                                                </div>
                                                <div className="form-check">
                                                    <input
                                                        type="radio"
                                                        className="form-check-input"
                                                        id="statusInactive"
                                                        checked={!editingUser.active}
                                                        onChange={() => setEditingUser({ ...editingUser, active: false })}
                                                    />
                                                    <label className="form-check-label small" htmlFor="statusInactive">Inactive</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer bg-light">
                                    <button
                                        type="button"
                                        onClick={() => setEditingUser(null)}
                                        className="btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};






