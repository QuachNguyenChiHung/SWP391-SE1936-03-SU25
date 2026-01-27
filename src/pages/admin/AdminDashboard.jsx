import { useNavigate } from 'react-router-dom';
import { MOCK_USERS, MOCK_PROJECTS } from '../../services/mockData.js';
import { Users, CheckCircle2, UserX, Layers, Plus, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminDashboard = ({ user }) => {
    const navigate = useNavigate();
    const totalUsers = MOCK_USERS.length;
    const activeUsers = MOCK_USERS.filter(u => u.active).length;
    const bannedUsers = MOCK_USERS.filter(u => !u.active).length;
    const totalProjects = MOCK_PROJECTS.length;

    const stats = [
        { label: 'Registered Users', value: totalUsers, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Active Users', value: activeUsers, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Banned / Inactive', value: bannedUsers, icon: UserX, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'Total Projects', value: totalProjects, icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50' },
    ];

    return (
        <div className="h-100 d-flex flex-column gap-4 animate-in fade-in duration-300">
            {/* Header / Welcome */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                <div>
                    <h2 className="h3 fw-bold text-dark">Welcome back, {user.name}</h2>
                    <p className="text-muted">System administration overview</p>
                </div>
                <div className="text-end d-none d-md-block">
                    <p className="text-uppercase fw-bold text-muted small">Current Role</p>
                    <span className="badge bg-purple-light text-purple rounded-pill">
                        {user.role}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="row g-3">
                {stats.map((stat) => (
                    <div key={stat.label} className="col-12 col-md-6 col-lg-3">
                        <div className="card border shadow-sm h-100">
                            <div className="card-body d-flex align-items-center gap-3">
                                <div className={`p-3 rounded ${stat.bg} ${stat.color}`}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <p className="small text-muted mb-1">{stat.label}</p>
                                    <p className="h4 fw-bold mb-0">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="row g-4">
                <div className="col-12 col-lg-6">
                    <div className="card border shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h3 className="h5 fw-semibold mb-0">Project Progress</h3>
                            </div>
                            <div style={{ height: '16rem' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={MOCK_PROJECTS}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={(value) => value.split(' ')[0]} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="completedItems" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Completed" />
                                        <Bar dataKey="totalItems" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Total" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-6">
                    <div className="card border shadow-sm h-100">
                        <div className="card-body">
                            <h3 className="h5 fw-semibold mb-4">Recent Activity</h3>
                            <div className="d-flex flex-column gap-3">
                                <div className="d-flex align-items-start gap-3 pb-3 border-bottom">
                                    <div className="mt-1 p-2 bg-blue-light text-primary rounded-circle">
                                        <Plus size={14} />
                                    </div>
                                    <div>
                                        <p className="small fw-medium mb-1">New Project "Lidar Scan 04" Created</p>
                                        <p className="text-muted" style={{ fontSize: '0.75rem' }}>2 hours ago by Morgan</p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-start gap-3 pb-3 border-bottom">
                                    <div className="mt-1 p-2 bg-success-light text-success rounded-circle">
                                        <CheckCircle2 size={14} />
                                    </div>
                                    <div>
                                        <p className="small fw-medium mb-1">Batch #203 Completed</p>
                                        <p className="text-muted" style={{ fontSize: '0.75rem' }}>5 hours ago by Sam</p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-start gap-3">
                                    <div className="mt-1 p-2 bg-danger-light text-danger rounded-circle">
                                        <AlertCircle size={14} />
                                    </div>
                                    <div>
                                        <p className="small fw-medium mb-1">Task Rejection Rate Spiked</p>
                                        <p className="text-muted" style={{ fontSize: '0.75rem' }}>Yesterday in Project Alpha</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card border shadow-sm">
                <div className="card-body">
                    <h3 className="h5 fw-semibold mb-3">Quick Actions</h3>
                    <div className="d-flex flex-wrap gap-3">
                        <button
                            onClick={() => navigate('/admin/users')}
                            className="btn btn-primary d-flex align-items-center gap-2">
                            <Users size={16} />
                            Manage Users
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};







