import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MOCK_ACTIVITY } from '../../services/mockData.js';
import { UserRole } from '../../types.js';
import { 
    Activity, UserPlus, Search, X, Check, Mail, Shield, User, 
    UserIcon, Filter, RefreshCw, Trash2, AlertTriangle, 
    Calendar, CheckCircle2, XCircle 
} from 'lucide-react';
import { Modal, Button, Form, InputGroup, Spinner, Row, Col } from 'react-bootstrap';

export const AdminPanel = ({ user }) => {
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [creatingUser, setCreatingUser] = useState(false);
    const [deletingUser, setDeletingUser] = useState(null);
    const [newUser, setNewUser] = useState({ username: '', password: '', email: '', role: UserRole.ANNOTATOR });
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [usersError, setUsersError] = useState(null);

    // --- 1. FETCH DATA ---
    const fetchUsers = async () => {
        setLoadingUsers(true);
        setUsersError(null);
        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            const res = await axios.get((import.meta.env.VITE_URL || '') + '/Users', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            const items = res?.data?.data?.items || [];
            const mapped = items.map(it => ({
                id: it.id,
                name: it.name,
                email: it.email,
                role: it.roleName || it.role,
                roleId: it.role,
                status: it.statusName || it.status,
                active: it.status === 1,
                createdAt: it.createdAt,
                lastLoginAt: it.lastLoginAt,
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(it.email || it.name)}`
            }));

            setUsers(mapped);
        } catch (err) {
            console.error('Failed to load users', err?.response || err.message || err);
            const apiErr = err?.response?.data || err?.message || 'Failed to load users';
            setUsersError(typeof apiErr === 'string' ? apiErr : JSON.stringify(apiErr));
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // --- 2. LOGIC FUNCTIONS ---
    
    // Helper: Chuyển đổi tên Role sang ID
    const roleNameToId = (roleName) => {
        switch ((roleName || '').toLowerCase()) {
            case 'admin': return 1;
            case 'manager': return 2;
            case 'annotator': return 3;
            case 'reviewer': return 4;
            default: return 3;
        }
    };

    // Xử lý khi bấm nút Edit -> Fetch chi tiết user
    const handleEditClick = async (user) => {
        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            // Gọi API lấy chi tiết user (nếu cần dữ liệu đầy đủ hơn từ list)
            const res = await axios.get((import.meta.env.VITE_URL || '') + `/Users/${user.id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const it = res?.data?.data;
            if (it) {
                setEditingUser({
                    id: it.id,
                    name: it.name,
                    email: it.email,
                    role: it.roleName || it.role, // Backend trả về roleName hoặc roleId
                    active: it.status === 1,
                    createdAt: it.createdAt,
                    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(it.email || it.name)}`
                });
                return;
            }
        } catch (err) {
            console.warn('Fetching detail failed, falling back to list data', err);
        }
        // Fallback: Dùng dữ liệu có sẵn từ bảng nếu API detail lỗi
        setEditingUser({ ...user });
    };

    // Lưu cập nhật User
    const handleSave = async (e) => {
        e.preventDefault();
        if (!editingUser) return;

        const payload = {
            name: editingUser.name,
            role: roleNameToId(editingUser.role),
            status: editingUser.active ? 1 : 0
        };

        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            await axios.put((import.meta.env.VITE_URL || '') + `/Users/${editingUser.id}`, payload, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            await fetchUsers();
            setEditingUser(null);
        } catch (err) {
            console.error('Failed to update user', err);
            alert('Failed to update user: ' + (err?.response?.data?.message || err.message));
        }
    };

    // Tạo User mới
    const handleCreate = async (e) => {
        e.preventDefault();
        setUsersError(null);
        const payload = {
            email: newUser.email,
            password: newUser.password,
            name: newUser.username,
            role: roleNameToId(newUser.role)
        };

        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            await axios.post((import.meta.env.VITE_URL || '') + '/Users', payload, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            await fetchUsers();
            setCreatingUser(false);
            setNewUser({ username: '', password: '', email: '', role: UserRole.ANNOTATOR });
        } catch (err) {
            console.error('Failed to create user', err);
            alert('Failed to create user: ' + (err?.response?.data?.message || err.message));
        }
    };

    // Xóa User
    const handleDelete = async () => {
        if (!deletingUser) return;
        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            await axios.delete((import.meta.env.VITE_URL || '') + `/Users/${deletingUser.id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            await fetchUsers();
            setDeletingUser(null);
        } catch (err) {
            console.error('Failed to delete user', err);
            alert('Failed to delete user: ' + (err?.response?.data?.message || err.message));
        }
    };

    // Lọc danh sách theo tìm kiếm
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- 3. UI COMPONENTS ---

    const RoleBadge = ({ role }) => {
        const styles = {
            ADMIN: 'bg-danger-subtle text-danger-emphasis border-danger-subtle',
            MANAGER: 'bg-primary-subtle text-primary-emphasis border-primary-subtle',
            ANNOTATOR: 'bg-secondary-subtle text-secondary-emphasis border-secondary-subtle',
            REVIEWER: 'bg-warning-subtle text-warning-emphasis border-warning-subtle',
        };
        const roleKey = role ? role.toUpperCase() : 'ANNOTATOR';
        const className = styles[roleKey] || styles.ANNOTATOR;
        return (
            <span className={`px-2 py-1 rounded-pill text-xs fw-bold border ${className}`} style={{ fontSize: '0.7rem' }}>
                {role}
            </span>
        );
    };

    const StatusBadge = ({ active }) => (
        <span className={`d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill text-xs fw-medium border ${
            active ? 'bg-success-subtle text-success-emphasis border-success-subtle' : 'bg-light text-muted border-light-subtle'
        }`} style={{ fontSize: '0.75rem' }}>
            <span className={`rounded-circle ${active ? 'bg-success' : 'bg-secondary'}`} style={{ width: '6px', height: '6px' }}></span>
            {active ? 'Active' : 'Inactive'}
        </span>
    );

    return (
        <div className="container-fluid py-4 animate-in fade-in">
            {/* Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h2 className="h4 fw-bold text-dark mb-1">User Management</h2>
                    <p className="text-muted small mb-0">Manage access, roles, and user activity.</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="light" className="border shadow-sm d-flex align-items-center gap-2 bg-white" onClick={fetchUsers}>
                        <RefreshCw size={16} className={loadingUsers ? "spin-animation" : ""} /> Refresh
                    </Button>
                    <Button variant="primary" className="shadow-sm d-flex align-items-center gap-2" onClick={() => setCreatingUser(true)}>
                        <UserPlus size={18} /> Add New User
                    </Button>
                </div>
            </div>

            <div className="row g-4">
                {/* --- Left Column: USER TABLE --- */}
                <div className="col-12 col-lg-8">
                    <div className="card border-0 shadow-sm h-100 overflow-hidden">
                        {/* Toolbar */}
                        <div className="card-header bg-white border-bottom py-3">
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-end-0">
                                    <Search size={16} className="text-muted" />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Search users by name or email..."
                                    className="bg-light border-start-0 ps-0 shadow-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Button variant="outline-secondary" className="border-start-0 d-flex align-items-center gap-2">
                                    <Filter size={16} /> Filter
                                </Button>
                            </InputGroup>
                        </div>

                        {/* Error Alert */}
                        {usersError && (
                            <div className="alert alert-danger m-3 d-flex align-items-center gap-2">
                                <X size={18} /> {usersError}
                            </div>
                        )}

                        {/* Table */}
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4 py-3 text-muted small text-uppercase fw-bold border-0">User Profile</th>
                                        <th className="py-3 text-muted small text-uppercase fw-bold border-0">Role</th>
                                        <th className="py-3 text-muted small text-uppercase fw-bold border-0">Status</th>
                                        <th className="py-3 text-muted small text-uppercase fw-bold border-0">Joined</th>
                                        <th className="pe-4 py-3 text-end text-muted small text-uppercase fw-bold border-0">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingUsers ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-5">
                                                <Spinner animation="border" variant="primary" size="sm" /> Loading users...
                                            </td>
                                        </tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-5 text-muted">
                                                No users found matching your search.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} className="border-bottom border-light group">
                                                <td className="ps-4 py-3">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="position-relative">
                                                            <img src={user.avatarUrl} alt="" className="rounded-circle border" width="40" height="40" />
                                                            {user.active && <span className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle p-1" style={{width: 10, height: 10}}></span>}
                                                        </div>
                                                        <div>
                                                            <div className="fw-semibold text-dark mb-0">{user.name}</div>
                                                            <div className="small text-muted">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><RoleBadge role={user.role} /></td>
                                                <td><StatusBadge active={user.active} /></td>
                                                <td className="text-muted small">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <Calendar size={14}/>
                                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="text-end pe-4">
                                                    {/* --- ACTION BUTTONS (Đã chỉnh sửa theo yêu cầu) --- */}
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <button 
                                                            className="btn border-0 fw-medium px-3 py-1 rounded"
                                                            style={{ 
                                                                backgroundColor: '#eff6ff', // Xanh nhạt
                                                                color: '#3b82f6',           // Xanh đậm
                                                                fontSize: '0.85rem'
                                                            }}
                                                            onClick={(e) => { e.stopPropagation(); handleEditClick(user); }}
                                                        >
                                                            Edit
                                                        </button>

                                                        <button 
                                                            className="btn border-0 p-1 rounded d-flex align-items-center justify-content-center"
                                                            style={{ 
                                                                backgroundColor: '#fef2f2', // Đỏ nhạt
                                                                color: '#ef4444',           // Đỏ đậm
                                                                width: '34px',
                                                                height: '34px'
                                                            }}
                                                            onClick={(e) => { e.stopPropagation(); setDeletingUser(user); }}
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="card-footer bg-white border-top py-3 text-muted small">
                            Showing {filteredUsers.length} users
                        </div>
                    </div>
                </div>

                {/* --- Right Column: ACTIVITY LOG --- */}
                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                                <Activity size={18} className="text-primary" /> Recent Activity
                            </h6>
                            <Button variant="link" size="sm" className="text-muted p-0 text-decoration-none">View All</Button>
                        </div>
                        <div className="card-body p-0">
                            <div className="list-group list-group-flush">
                                {MOCK_ACTIVITY.map((log, index) => (
                                    <div key={log.id} className="list-group-item border-0 d-flex gap-3 py-3">
                                        <div className="d-flex flex-column align-items-center">
                                            <div className="rounded-circle bg-light border d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                                                <User size={14} className="text-muted" />
                                            </div>
                                            {index !== MOCK_ACTIVITY.length - 1 && <div className="vr h-100 my-1 bg-secondary bg-opacity-25"></div>}
                                        </div>
                                        <div>
                                            <p className="small mb-1 text-dark fw-medium">{log.action}</p>
                                            <p className="text-muted small mb-1">{log.details}</p>
                                            <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.7rem' }}>
                                                <span>{new Date(log.timestamp).toLocaleString()}</span>
                                                <span>•</span>
                                                <span>User #{log.userId}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODALS SECTION --- */}

            {/* 1. Create User Modal */}
            <Modal show={creatingUser} onHide={() => setCreatingUser(false)} centered backdrop="static">
                <Modal.Header closeButton className="border-bottom-0 pb-0">
                    <Modal.Title className="fw-bold h5">Create New User</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreate}>
                    <Modal.Body className="d-flex flex-column gap-3 pt-3">
                        <Form.Group>
                            <Form.Label className="small fw-bold text-muted">USERNAME</Form.Label>
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-end-0"><UserIcon size={16} /></InputGroup.Text>
                                <Form.Control 
                                    className="border-start-0 ps-0 bg-light shadow-none"
                                    placeholder="Enter username" 
                                    value={newUser.username} 
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} 
                                    required 
                                />
                            </InputGroup>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className="small fw-bold text-muted">EMAIL</Form.Label>
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-end-0"><Mail size={16} /></InputGroup.Text>
                                <Form.Control 
                                    type="email"
                                    className="border-start-0 ps-0 bg-light shadow-none"
                                    placeholder="Enter email" 
                                    value={newUser.email} 
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} 
                                    required 
                                />
                            </InputGroup>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className="small fw-bold text-muted">PASSWORD</Form.Label>
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-end-0"><Shield size={16} /></InputGroup.Text>
                                <Form.Control 
                                    type="password"
                                    className="border-start-0 ps-0 bg-light shadow-none"
                                    placeholder="Enter password" 
                                    value={newUser.password} 
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} 
                                    required 
                                />
                            </InputGroup>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className="small fw-bold text-muted">ROLE</Form.Label>
                            <Form.Select 
                                className="bg-light shadow-none cursor-pointer"
                                value={newUser.role} 
                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            >
                                {Object.values(UserRole).map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-top-0 pt-0">
                        <Button variant="light" onClick={() => setCreatingUser(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" className="d-flex align-items-center gap-2">
                            <UserPlus size={16} /> Create User
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* 3. Delete Confirmation Modal */}
            <Modal show={!!deletingUser} onHide={() => setDeletingUser(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold h5">Delete User</Modal.Title>
                </Modal.Header>
                <Modal.Body className="d-flex gap-3 align-items-start">
                    <AlertTriangle size={36} className="text-warning" />
                    <div>
                        <p className="mb-1 fw-bold">Are you sure you want to delete this user?</p>
                        <p className="small text-muted mb-0">This action cannot be undone. User: <strong>{deletingUser?.name}</strong> ({deletingUser?.email})</p>
                    </div>
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <Button variant="light" onClick={() => setDeletingUser(null)}>Cancel</Button>
                    <Button variant="danger" onClick={async () => { await handleDelete(); }}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* 2. Edit User Modal (Giao diện mới) */}
            <Modal show={!!editingUser} onHide={() => setEditingUser(null)} centered size="lg">
                <Modal.Header closeButton className="border-bottom-0 pb-0 pt-4 px-4">
                    <div>
                        <Modal.Title className="fw-bold h5">Edit User Profile</Modal.Title>
                        <p className="text-muted small mb-0">Update personal details and permissions.</p>
                    </div>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body className="p-4">
                        {editingUser && (
                            <div className="row g-4">
                                {/* Avatar Header */}
                                <div className="col-12 d-flex align-items-center gap-3 p-3 bg-light rounded-3 border border-dashed">
                                    <img src={editingUser.avatarUrl} className="rounded-circle bg-white shadow-sm" width="64" height="64" alt="" />
                                    <div>
                                        <div className="fw-bold fs-5">{editingUser.name}</div>
                                        <div className="text-muted small">{editingUser.email}</div>
                                    </div>
                                </div>

                                <Col md={6}>
                                    <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Full Name</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text className="bg-white border-end-0 text-muted"><User size={16}/></InputGroup.Text>
                                        <Form.Control 
                                            className="border-start-0 ps-0 shadow-none"
                                            value={editingUser.name} 
                                            onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} 
                                            required
                                        />
                                    </InputGroup>
                                </Col>

                                <Col md={6}>
                                    <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Email</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text className="bg-light border-end-0 text-muted"><Mail size={16}/></InputGroup.Text>
                                        <Form.Control 
                                            className="border-start-0 ps-0 bg-light shadow-none"
                                            type="email" 
                                            value={editingUser.email} 
                                            onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} 
                                            required
                                        />
                                    </InputGroup>
                                </Col>

                                <Col md={6}>
                                    <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Role</Form.Label>
                                    <Form.Select 
                                        className="shadow-none cursor-pointer"
                                        value={editingUser.role} 
                                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                    >
                                        {Object.values(UserRole).map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </Form.Select>
                                </Col>

                                <Col md={6}>
                                    <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Account Status</Form.Label>
                                    <div className="d-flex gap-2 h-100 align-items-center">
                                        <div 
                                            className={`flex-fill border rounded p-2 d-flex align-items-center gap-2 cursor-pointer transition-all ${editingUser.active ? 'border-success bg-success-subtle' : 'border-light bg-light'}`}
                                            onClick={() => setEditingUser({ ...editingUser, active: true })}
                                        >
                                            <div className={`rounded-circle p-1 ${editingUser.active ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
                                                <CheckCircle2 size={12}/>
                                            </div>
                                            <span className={`small fw-medium ${editingUser.active ? 'text-success-emphasis' : 'text-muted'}`}>Active</span>
                                        </div>

                                        <div 
                                            className={`flex-fill border rounded p-2 d-flex align-items-center gap-2 cursor-pointer transition-all ${!editingUser.active ? 'border-danger bg-danger-subtle' : 'border-light bg-light'}`}
                                            onClick={() => setEditingUser({ ...editingUser, active: false })}
                                        >
                                            <div className={`rounded-circle p-1 ${!editingUser.active ? 'bg-danger text-white' : 'bg-secondary text-white'}`}>
                                                <XCircle size={12}/>
                                            </div>
                                            <span className={`small fw-medium ${!editingUser.active ? 'text-danger-emphasis' : 'text-muted'}`}>Inactive</span>
                                        </div>
                                    </div>
                                </Col>
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="border-0 px-4 pb-4 pt-0">
                        <Button variant="light" onClick={() => setEditingUser(null)} className="px-4">Cancel</Button>
                        <Button variant="primary" type="submit" className="px-4">Save Changes</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* 3. Delete Confirmation Modal */}
            <Modal show={!!deletingUser} onHide={() => setDeletingUser(null)} centered>
                <Modal.Header closeButton className="border-bottom-0">
                    <Modal.Title className="fw-bold h5 text-danger d-flex align-items-center gap-2">
                        <AlertTriangle size={24} /> Delete User
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-0">
                    {deletingUser && (
                        <div>
                            <p className="mb-3">Are you sure you want to delete this user? This action cannot be undone.</p>
                            <div className="d-flex align-items-center gap-3 p-3 bg-danger-subtle rounded border border-danger-subtle">
                                <img src={deletingUser.avatarUrl} className="rounded-circle bg-white" width="48" height="48" alt="" />
                                <div>
                                    <div className="fw-bold text-danger-emphasis">{deletingUser.name}</div>
                                    <div className="small text-danger-emphasis opacity-75">{deletingUser.email}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-top-0">
                    <Button variant="light" onClick={() => setDeletingUser(null)}>Cancel</Button>
                    <Button variant="danger" onClick={handleDelete}>Delete User</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};