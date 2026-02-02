import { useNavigate } from 'react-router-dom';
import { MOCK_PROJECTS, MOCK_USERS } from '../../services/mockData.js';
import { Layers, CheckCircle2, FileText, Users, Plus, ArrowUpRight, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const ManagerDashboard = ({ user }) => {
    const navigate = useNavigate();

    // Logic tính toán (giữ nguyên)
    const totalProjects = MOCK_PROJECTS.length;
    const totalTasks = MOCK_PROJECTS.reduce((acc, p) => acc + p.totalItems, 0);
    const completedTasks = MOCK_PROJECTS.reduce((acc, p) => acc + p.completedItems, 0);
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Cấu hình màu sắc cho Bootstrap (dùng style inline để có màu pastel đẹp)
    const stats = [
        { label: 'Active Projects', value: totalProjects, icon: Layers, color: '#2563eb', bg: '#eff6ff' }, // Blue
        { label: 'Global Completion', value: `${overallProgress}%`, icon: CheckCircle2, color: '#059669', bg: '#ecfdf5' }, // Green
        { label: 'Total Tasks', value: totalTasks.toLocaleString(), icon: FileText, color: '#4f46e5', bg: '#eef2ff' }, // Indigo
        { label: 'Team Members', value: MOCK_USERS.length, icon: Users, color: '#ea580c', bg: '#fff7ed' }, // Orange
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="card shadow border-0 p-2" style={{ fontSize: '0.9rem' }}>
                    <p className="fw-bold mb-1">{label}</p>
                    <p className="text-primary mb-0 small">Completed: {payload[0].value}</p>
                    <p className="text-muted mb-0 small">Total: {payload[1].value}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            
            {/* 1. Header Section */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-5">
                <div>
                    <div className="text-muted small d-flex align-items-center gap-2 mb-1">
                        <Calendar size={14} />
                        <span>{currentDate}</span>
                    </div>
                    <h2 className="fw-bold text-dark mb-1">Welcome back, {user?.user?.name || 'Manager'} 👋</h2>
                    <p className="text-secondary mb-0">Here's an overview of your workspace performance.</p>
                </div>
                
                <div className="d-flex align-items-center gap-3">
                    <div className="d-none d-md-block text-end">
                        <small className="fw-bold text-muted text-uppercase" style={{fontSize: '0.7rem'}}>Role</small>
                        <div className="badge rounded-pill bg-light text-primary border px-3 py-2 d-block">
                            {user?.role || 'Admin'}
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/projects/new')}
                        className="btn btn-primary d-flex align-items-center gap-2 shadow-sm px-4 py-2"
                        style={{ borderRadius: '10px' }}
                    >
                        <Plus size={18} />
                        <span className="d-none d-sm-inline">New Project</span>
                    </button>
                </div>
            </div>

            {/* 2. Stats Grid */}
            <div className="row g-4 mb-4">
                {stats.map((stat, index) => (
                    <div key={index} className="col-12 col-md-6 col-lg-3">
                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px', transition: 'transform 0.2s' }}>
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <p className="text-muted small fw-bold text-uppercase mb-1">{stat.label}</p>
                                        <h3 className="fw-bold mb-0 text-dark">{stat.value}</h3>
                                    </div>
                                    <div className="p-3 rounded-3" style={{ backgroundColor: stat.bg, color: stat.color }}>
                                        <stat.icon size={22} />
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-1 small">
                                    <ArrowUpRight size={14} className="text-success" />
                                    <span className="text-success fw-bold">Updated just now</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. Main Content Area */}
            <div className="row g-4">
                {/* Chart Section */}
                <div className="col-12 col-lg-8">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h5 className="fw-bold mb-0">Project Progress</h5>
                                    <small className="text-muted">Completion rate across active projects</small>
                                </div>
                                <button onClick={() => navigate('/projects')} className="btn btn-link text-decoration-none fw-bold small p-0">
                                    View Report
                                </button>
                            </div>
                            
                            <div style={{ height: '320px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={MOCK_PROJECTS} barSize={30}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                                        <XAxis 
                                            dataKey="name" 
                                            tick={{ fontSize: 12, fill: '#6c757d' }} 
                                            axisLine={false} 
                                            tickLine={false} 
                                            dy={10}
                                            tickFormatter={(val) => val.length > 10 ? `${val.substring(0, 8)}...` : val}
                                        />
                                        <YAxis tick={{ fontSize: 12, fill: '#6c757d' }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8f9fa' }} />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar dataKey="completedItems" name="Completed" fill="#4f46e5" radius={[4, 4, 0, 0]} stackId="a" />
                                        <Bar dataKey="totalItems" name="Remaining" fill="#e9ecef" radius={[4, 4, 0, 0]} stackId="a" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Section */}
                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                        <div className="card-body p-4 d-flex flex-column">
                            <h5 className="fw-bold mb-4">Recent Activity</h5>
                            
                            <div className="flex-grow-1 overflow-auto pe-2">
                                {/* Activity Items - Dùng border-start để tạo đường kẻ timeline */}
                                <div className="position-relative ps-4 pb-4 border-start">
                                    <div className="position-absolute bg-white p-1" style={{ left: '-6px', top: '0' }}>
                                        <div className="rounded-circle bg-primary" style={{ width: '10px', height: '10px' }}></div>
                                    </div>
                                    <p className="fw-bold text-dark small mb-0">New Project Created</p>
                                    <p className="text-muted small mb-1">"Lidar Scan 04" by Morgan</p>
                                    <small className="text-secondary" style={{ fontSize: '0.75rem' }}>2 hours ago</small>
                                </div>

                                <div className="position-relative ps-4 pb-4 border-start">
                                    <div className="position-absolute bg-white p-1" style={{ left: '-6px', top: '0' }}>
                                        <div className="rounded-circle bg-success" style={{ width: '10px', height: '10px' }}></div>
                                    </div>
                                    <p className="fw-bold text-dark small mb-0">Batch #203 Completed</p>
                                    <p className="text-muted small mb-1">Approved by System</p>
                                    <small className="text-secondary" style={{ fontSize: '0.75rem' }}>5 hours ago</small>
                                </div>

                                <div className="position-relative ps-4 border-start border-0">
                                    <div className="position-absolute bg-white p-1" style={{ left: '-6px', top: '0' }}>
                                        <div className="rounded-circle bg-danger" style={{ width: '10px', height: '10px' }}></div>
                                    </div>
                                    <p className="fw-bold text-dark small mb-0">Alert: Rejection Rate</p>
                                    <p className="text-muted small mb-1">Spike detected in Project Alpha</p>
                                    <small className="text-secondary" style={{ fontSize: '0.75rem' }}>Yesterday</small>
                                </div>
                            </div>
                            
                            <button className="btn btn-light w-100 mt-3 text-muted fw-bold small border">
                                View All History
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Quick Actions Banner */}
            <div className="card border-0 shadow mt-4 text-white" 
                 style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
                <div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                    <div>
                        <h5 className="fw-bold mb-1">Ready to scale up?</h5>
                        <p className="mb-0 small text-white-50">Manage your projects or invite new labelers to the workspace.</p>
                    </div>
                    <div className="d-flex gap-2">
                        <button onClick={() => navigate('/projects')} className="btn btn-outline-light btn-sm px-3 fw-bold" style={{ borderRadius: '8px' }}>
                            View Projects
                        </button>
                        <button className="btn btn-light btn-sm px-3 fw-bold text-dark" style={{ borderRadius: '8px' }}>
                            Invite Members
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};