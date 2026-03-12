import React, { useState, useEffect } from 'react';
import api from '../../shared/utils/api.js';
import getInforFromCookie from '../../shared/utils/getInfoFromCookie.js';
import { UserPlus, RefreshCw, X } from 'lucide-react';
import { Button } from 'react-bootstrap';
import { UserTable } from './components/UserTable';
import { FiltersBar } from './components/FiltersBar';
import { PaginationControls } from './components/PaginationControls';
import { CreateUserModal } from './components/CreateUserModal';
import { EditUserModal } from './components/EditUserModal';
import { DeleteUserModal } from './components/DeleteUserModal';
import { ActivityFeed } from './components/ActivityFeed';

export const AdminPanel = ({ user }) => {
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [creatingUser, setCreatingUser] = useState(false);
    const [deletingUser, setDeletingUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [usersError, setUsersError] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(12);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [activityLogs, setActivityLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const fetchActivityLogs = async () => {
        setLoadingLogs(true);
        try {
            const userInfo = getInforFromCookie();
            const token = userInfo?.token;

            const res = await api.get('/activity-logs?pageNumber=1&pageSize=10', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            console.log('Activity logs response:', res?.data);

            // Handle both response structures
            const items = res?.data?.data?.items || res?.data?.items || [];
            console.log('Activity logs items:', items);
            setActivityLogs(items);
        } catch (err) {
            console.error('Failed to load activity logs', err);
            console.error('Error details:', err?.response);
        } finally {
            setLoadingLogs(false);
        }
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        setUsersError(null);
        try {
            const userInfo = getInforFromCookie();
            const token = userInfo?.token;

            // Build query parameters
            const params = new URLSearchParams();
            params.append('pageNumber', pageNumber);
            params.append('pageSize', pageSize);
            if (searchQuery) params.append('search', searchQuery);
            if (roleFilter) params.append('role', roleFilter);
            if (statusFilter) params.append('status', statusFilter);

            const res = await api.get(`/Users?${params.toString()}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            const items = res?.data?.data?.items || [];
            const mapped = items.map(it => ({
                id: it.id,
                name: it.name,
                email: it.email,
                role: it.role,
                status: it.status,
                active: it.status === "Active",
                createdAt: it.createdAt,
                lastLoginAt: it.lastLoginAt,
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(it.email || it.name)}`
            }));

            setUsers(mapped);
            setTotalPages(res?.data?.data?.totalPages || 1);
            setTotalItems(res?.data?.data?.totalCount || items.length);
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
        fetchActivityLogs();
    }, [pageNumber, roleFilter, statusFilter]);

    const handleEditClick = async (user) => {
        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            const res = await api.get(`/Users/${user.id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const it = res?.data?.data;
            if (it) {
                setEditingUser({
                    id: it.id,
                    name: it.name,
                    email: it.email,
                    role: it.role,
                    status: it.status,
                    active: it.status === "Active",
                    createdAt: it.createdAt,
                    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(it.email || it.name)}`
                });
                return;
            }
        } catch (err) {
            console.warn('Fetching detail failed, falling back to list data', err);
        }
        setEditingUser({
            ...user,
            status: user.status || 'Active'
        });
    };

    const handleDelete = async () => {
        if (!deletingUser) return;
        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            await api.delete(`/Users/${deletingUser.id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            await fetchUsers();
            setDeletingUser(null);
        } catch (err) {
            console.error('Failed to delete user', err);
            alert('Failed to delete user: ' + (err?.response?.data?.message || err.message));
        }
    };

    return (
        <div className="container-fluid py-4 animate-in fade-in">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h2 className="h4 fw-bold text-dark mb-1">User Management</h2>
                    <p className="text-muted small mb-0">Manage access, roles, and user activity.</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="primary" className="border shadow-sm d-flex align-items-center gap-2 bg-white" onClick={() => { fetchUsers(); fetchActivityLogs(); }}>
                        <RefreshCw size={16} className={loadingUsers ? "spin-animation" : ""} /> Refresh
                    </Button>
                    <Button variant="primary" className="shadow-sm d-flex align-items-center gap-2" onClick={() => setCreatingUser(true)}>
                        <UserPlus size={18} /> Add New User
                    </Button>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-12 col-lg-8">
                    <div className="card border shadow-sm h-100 overflow-hidden">
                        <FiltersBar
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            roleFilter={roleFilter}
                            setRoleFilter={setRoleFilter}
                            statusFilter={statusFilter}
                            setStatusFilter={setStatusFilter}
                            onSearch={fetchUsers}
                            onClearFilters={() => {
                                setRoleFilter('');
                                setStatusFilter('');
                                setSearchQuery('');
                                setPageNumber(1);
                            }}
                        />

                        {usersError && (
                            <div className="alert alert-danger m-3 d-flex align-items-center gap-2">
                                <X size={18} /> {usersError}
                            </div>
                        )}

                        <UserTable
                            users={users}
                            isLoading={loadingUsers}
                            onEdit={handleEditClick}
                            onDelete={setDeletingUser}
                        />

                        <PaginationControls
                            pageNumber={pageNumber}
                            pageSize={pageSize}
                            totalItems={totalItems}
                            totalPages={totalPages}
                            onPageChange={setPageNumber}
                        />
                    </div>
                </div>

                <div className="col-12 col-lg-4">
                    <ActivityFeed
                        activities={activityLogs}
                        isLoading={loadingLogs}
                        onRefresh={fetchActivityLogs}
                    />
                </div>
            </div>

            <CreateUserModal
                show={creatingUser}
                onHide={() => setCreatingUser(false)}
                onSuccess={() => {
                    setCreatingUser(false);
                    fetchUsers();
                }}
                onError={(message) => {
                    setUsersError(message);
                    alert(message);
                }}
            />

            <EditUserModal
                show={!!editingUser}
                user={editingUser}
                onHide={() => setEditingUser(null)}
                onSuccess={() => {
                    setEditingUser(null);
                    fetchUsers();
                }}
            />

            <DeleteUserModal
                show={!!deletingUser}
                user={deletingUser}
                onHide={() => setDeletingUser(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
};