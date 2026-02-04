import { useNavigate } from 'react-router-dom';
import { MOCK_TASKS, MOCK_PROJECTS } from '../../services/mockData.js';
import { DataItemStatus } from '../../types.js';
import { Eye, ThumbsUp, ThumbsDown, PieChart, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import getInforFromCookie from '../../ultis/getInfoFromCookie.js';
import { UserRole } from '../../types.js';

export const ReviewerDashboard = ({ user }) => {
    const navigate = useNavigate();
    const reviewedTasks = MOCK_TASKS.filter(t =>
        t.status === DataItemStatus.ACCEPTED || t.status === DataItemStatus.REJECTED
    );
    const totalReviewed = reviewedTasks.length;
    const correctItems = reviewedTasks.filter(t => t.status === DataItemStatus.ACCEPTED).length;
    const incorrectItems = reviewedTasks.filter(t => t.status === DataItemStatus.REJECTED).length;

    const accuracy = totalReviewed > 0
        ? Math.round((correctItems / totalReviewed) * 100)
        : 100;

    const stats = [
        { label: 'Total Reviewed', value: totalReviewed, icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Accepted (Correct)', value: correctItems, icon: ThumbsUp, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Rejected (Incorrect)', value: incorrectItems, icon: ThumbsDown, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'Approval Rate', value: `${accuracy}%`, icon: PieChart, color: 'text-blue-600', bg: 'bg-blue-50' },
    ];

    // determine current user role from cookie
    const cookieUser = getInforFromCookie();
    const currentRole = cookieUser?.user?.roleName || cookieUser?.user?.role || cookieUser?.role || null;
    const isAdmin = currentRole === UserRole.ADMIN || currentRole === 'Admin' || currentRole === 'ADMIN';

    return (
        <div className="h-100 d-flex flex-column gap-4 animate-in fade-in duration-300">
            {/* Header / Welcome */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                <div>
                    <h2 className="h3 fw-bold text-dark">Welcome back, {user.name}</h2>
                    <p className="text-muted">Quality assurance and review overview</p>
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
                                <h3 className="h5 fw-semibold mb-0">Progress Info</h3>
                            </div>
                            {(() => {
                                const total = MOCK_TASKS.length;
                                const pending = MOCK_TASKS.filter(t => t.status !== DataItemStatus.ACCEPTED && t.status !== DataItemStatus.REJECTED).length;
                                const pendingPct = total ? Math.round((pending / total) * 100) : 0;
                                return (
                                    <div>
                                        <div className="d-flex gap-3 mb-3">
                                            <div className="card flex-fill border-0 shadow-sm">
                                                <div className="card-body">
                                                    <p className="small text-muted mb-1">Pending</p>
                                                    <p className="h4 fw-bold mb-0 text-warning">{pending}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="d-flex justify-content-between small text-muted mt-2 align-items-center">
                                                <span className="fw-semibold">Pending: {pending} left</span>
                                                <button onClick={() => navigate('/reviewer/reviews')} className="btn btn-sm btn-outline-primary">Open review queue</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {isAdmin && (
                    <div className="col-12 col-lg-6">
                        <div className="card border shadow-sm h-100">
                            <div className="card-body">
                                <h3 className="h5 fw-semibold mb-4">Recent Activity</h3>
                                <div className="d-flex flex-column gap-3">
                                    <div className="d-flex align-items-start gap-3 pb-3 border-bottom">
                                        <div className="p-2 bg-blue-light text-blue rounded-circle mt-1">
                                            <Plus size={14} />
                                        </div>
                                        <div>
                                            <p className="small fw-medium text-dark mb-1">New Project "Lidar Scan 04" Created</p>
                                            <p className="text-muted" style={{ fontSize: '0.75rem' }}>2 hours ago by Morgan</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-start gap-3 pb-3 border-bottom">
                                        <div className="p-2 bg-green-light text-green rounded-circle mt-1">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <div>
                                            <p className="small fw-medium text-dark mb-1">Batch #203 Completed</p>
                                            <p className="text-muted" style={{ fontSize: '0.75rem' }}>5 hours ago by Sam</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-start gap-3">
                                        <div className="p-2 bg-red-light text-red rounded-circle mt-1">
                                            <AlertCircle size={14} />
                                        </div>
                                        <div>
                                            <p className="small fw-medium text-dark mb-1">Task Rejection Rate Spiked</p>
                                            <p className="text-muted" style={{ fontSize: '0.75rem' }}>Yesterday in Project Alpha</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};







