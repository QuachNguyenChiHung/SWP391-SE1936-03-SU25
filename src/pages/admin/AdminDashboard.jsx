import { useNavigate } from 'react-router-dom';
import { MOCK_USERS, MOCK_PROJECTS } from '../../services/mockData.js';
import { Users, CheckCircle2, UserX, Layers, Plus, AlertCircle, ArrowUpRight, MoreVertical } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const AdminDashboard = ({ user }) => {
    const navigate = useNavigate();
    const totalUsers = MOCK_USERS.length;
    const activeUsers = MOCK_USERS.filter(u => u.active).length;
    const bannedUsers = MOCK_USERS.filter(u => !u.active).length;
    const totalProjects = MOCK_PROJECTS.length;

    const stats = [
        { label: 'Registered Users', value: totalUsers, icon: Users, color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.1)' },
        { label: 'Active Users', value: activeUsers, icon: CheckCircle2, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
        { label: 'Banned / Inactive', value: bannedUsers, icon: UserX, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
        { label: 'Total Projects', value: totalProjects, icon: Layers, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    ];

    return (
        <div className="container-fluid p-4 bg-light min-vh-100 animate-in fade-in duration-500">
            <div className="d-flex justify-content-between align-items-end mb-5">
                <div>
                    <span className="badge bg-primary-subtle text-primary mb-2 px-3 py-2 rounded-pill fw-semibold">
                        System Overview
                    </span>
                    <h2 className="display-6 fw-bold text-dark mb-0">Hello, {user.name} 👋</h2>
                    <p className="text-muted mb-0">Here's what's happening with your projects today.</p>
                </div>

            </div>

            <div className="row g-4 mb-5">
                {stats.map((stat) => (
                    <div key={stat.label} className="col-12 col-md-6 col-lg-3">
                        <div className="card border shadow-sm hover-lift transition-all" style={{ borderRadius: '16px' }}>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div className="p-3 rounded-3" style={{ backgroundColor: stat.bg, color: stat.color }}>
                                        <stat.icon size={24} />
                                    </div>
                                    <ArrowUpRight size={18} className="text-muted opacity-50" />
                                </div>
                                <p className="small text-muted fw-medium mb-1">{stat.label}</p>
                                <h3 className="fw-bold mb-0" style={{ letterSpacing: '-1px' }}>{stat.value.toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                {/* Chart Section */}
                <div className="col-12 col-lg-8">
                    <div className="card border shadow-sm h-100" style={{ borderRadius: '16px' }}>
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold mb-0">Project Performance</h5>
                                <button className="btn btn-light btn-sm rounded-circle"><MoreVertical size={16} /></button>
                            </div>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={MOCK_PROJECTS}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 8)}...` : value}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="completedItems" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={30} />
                                        <Bar dataKey="totalItems" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="col-12 col-lg-4">
                    <div className="card border shadow-sm h-100" style={{ borderRadius: '16px' }}>
                        <div className="card-body p-4">
                            <h5 className="fw-bold mb-4">Recent Activity</h5>
                            <div className="timeline-container">
                                {[
                                    { title: 'New Project Created', time: '2 hours ago', icon: <Plus size={14} />, color: 'bg-primary' },
                                    { title: 'Batch #203 Completed', time: '5 hours ago', icon: <CheckCircle2 size={14} />, color: 'bg-success' },
                                    { title: 'Rejection Rate Spike', time: 'Yesterday', icon: <AlertCircle size={14} />, color: 'bg-danger' }
                                ].map((item, idx) => (
                                    <div key={idx} className="d-flex gap-3 mb-4 position-relative">
                                        <div className={`${item.color} text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm`} style={{ width: '32px', height: '32px', flexShrink: 0, zIndex: 1 }}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="small fw-bold mb-0">{item.title}</p>
                                            <p className="text-muted small mb-0">{item.time}</p>
                                        </div>
                                        {idx !== 2 && <div className="position-absolute" style={{ width: '2px', height: '40px', background: '#f1f5f9', left: '15px', top: '32px' }}></div>}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => navigate('/admin/users')}
                                className="btn btn-dark w-100 py-2 rounded-3 mt-3 fw-medium d-flex align-items-center justify-content-center gap-2"
                            >
                                <Users size={18} /> Manage All Users
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};