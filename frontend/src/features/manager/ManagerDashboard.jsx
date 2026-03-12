import { useNavigate } from 'react-router-dom';
import { Layers, CheckCircle2, FileText, Users, Plus, ArrowUpRight, Calendar } from 'lucide-react';
import { StatsCard } from './components';
import api from '../../shared/utils/api.js';
import { useEffect, useState } from 'react';

export const ManagerDashboard = ({ user }) => {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // fetch dashboard data from backend
    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/dashboard/manager');
                const data = res.data?.data ?? null;
                setDashboard(data);
            } catch (err) {
                console.error('Failed to load dashboard', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);
    const totalProjects = dashboard?.stats?.totalProjects ?? 0;
    const totalTasks = dashboard?.stats?.totalItems ?? 0;
    const completedTasks = Math.round((dashboard?.stats?.completionRate ?? 0) * (dashboard?.stats?.totalItems ?? 0) / 100);
    const overallProgress = dashboard?.stats?.completionRate ?? 0;
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Cấu hình màu sắc cho Bootstrap (dùng style inline để có màu pastel đẹp)
    const stats = [
        { label: 'Total Projects', value: totalProjects, icon: Layers, color: '#2563eb', bg: '#eff6ff' },
        { label: 'Active Projects', value: dashboard?.stats?.activeProjects ?? 0, icon: CheckCircle2, color: '#059669', bg: '#ecfdf5' },
        { label: 'Total Items', value: totalTasks.toLocaleString(), icon: FileText, color: '#4f46e5', bg: '#eef2ff' },
        { label: 'Completion Rate', value: `${Math.floor(overallProgress)}%`, icon: Users, color: '#ea580c', bg: '#fff7ed' },
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
                        <small className="fw-bold text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>Role</small>
                        <div className="badge rounded-pill bg-light text-primary border px-3 py-2 d-block">
                            {user?.user.role || 'Manager'}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Stats Grid */}
            <div className="row g-4 mb-4">
                {stats.map((stat, index) => (
                    <div key={index} className="col-12 col-md-6 col-lg-3">
                        <StatsCard
                            title={stat.label}
                            value={stat.value}
                            icon={<stat.icon size={22} />}
                            color={{ bg: stat.bg, color: stat.color }}
                        />
                    </div>
                ))}
            </div>

            {/* 3. Main Content Area */}
            <div className="row g-4">
                {/* Project Overview Section (no chart) */}
                <div className="col-12">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h5 className="fw-bold mb-0">Projects Overview</h5>
                                    <small className="text-muted">Summary of recent projects</small>
                                </div>
                                <button onClick={() => navigate('/manager/projects')} className="btn btn-link text-decoration-none fw-bold small p-0">
                                    View All Projects
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-5">Loading...</div>
                            ) : error ? (
                                <div className="text-danger">Failed to load dashboard</div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr className="text-muted small text-uppercase">
                                                <th>Project</th>
                                                <th>Status</th>
                                                <th>Items</th>
                                                <th>Completed</th>
                                                <th>Progress</th>
                                                <th>Deadline</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dashboard?.projectOverview?.map(p => (
                                                <tr key={p.projectId} style={{ cursor: 'pointer' }} onClick={() => navigate(`/manager/projects/${p.projectId}`)}>
                                                    <td className="fw-bold text-dark">{p.projectName}</td>
                                                    <td className="text-muted">{p.status}</td>
                                                    <td className="text-muted">{p.totalItems}</td>
                                                    <td className="text-muted">{p.completedItems}</td>
                                                    <td className="text-dark fw-semibold">{Math.floor(p.progressPercent)}%</td>
                                                    <td className="text-muted">{p.deadline ? new Date(p.deadline).toLocaleDateString() : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};