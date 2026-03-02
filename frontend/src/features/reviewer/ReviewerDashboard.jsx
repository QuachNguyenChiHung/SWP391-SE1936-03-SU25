import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_TASKS } from '../../shared/services/mockData.js';
import { DataItemStatus, UserRole } from '../../shared/types/types.js';
import { Eye, ThumbsUp, ThumbsDown, PieChart, Plus, CheckCircle2, AlertCircle, ArrowRight, Activity } from 'lucide-react';
import getInforFromCookie from '../../shared/utils/getInfoFromCookie.js';
import api from '../../shared/utils/api.js';

export const ReviewerDashboard = ({ user }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statsFromApi, setStatsFromApi] = useState(null);

    // --- Giữ nguyên Logic cũ ---
    const reviewedTasks = MOCK_TASKS.filter(t =>
        t.status === DataItemStatus.ACCEPTED || t.status === DataItemStatus.REJECTED
    );
    const fallbackTotalReviewed = reviewedTasks.length;
    const fallbackCorrectItems = reviewedTasks.filter(t => t.status === DataItemStatus.ACCEPTED).length;

    const stats = (() => {
        const totalReviewed = statsFromApi?.totalReviewed ?? statsFromApi?.reviewedToday ?? fallbackTotalReviewed;
        const accuracy = typeof statsFromApi?.approvalRate === 'number'
            ? statsFromApi.approvalRate
            : Math.round((fallbackCorrectItems / Math.max(1, fallbackTotalReviewed)) * 100);

        const correctItems = statsFromApi?.correctItems ?? Math.round((totalReviewed * (accuracy / 100)));
        const incorrectItems = statsFromApi?.incorrectItems ?? (totalReviewed - correctItems);

        return [
            { label: 'Total Reviewed', value: totalReviewed, icon: Eye, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
            { label: 'Accepted', value: correctItems, icon: ThumbsUp, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
            { label: 'Rejected', value: incorrectItems, icon: ThumbsDown, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' },
            { label: 'Approval Rate', value: `${accuracy}%`, icon: PieChart, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)' },
        ];
    })();

    const cookieUser = getInforFromCookie();
    const currentRole = cookieUser?.user?.roleName || cookieUser?.user?.role || cookieUser?.role || null;
    const isAdmin = currentRole === UserRole.ADMIN || currentRole === 'Admin' || currentRole === 'ADMIN';

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        api.get('/Dashboard/reviewer')
            .then(res => {
                if (!mounted) return;
                const s = res?.data?.data?.stats ?? {};
                setStatsFromApi({
                    pendingReview: s.pendingReview ?? s.pending,
                    reviewedToday: s.reviewedToday ?? s.reviewed,
                    totalReviewed: s.totalReviewed ?? s.total,
                    approvalRate: s.approvalRate,
                });
            })
            .catch(err => { if (mounted) setError(err?.message); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    // --- Giao diện mới ---
    return (
        <div className="p-4 bg-light min-vh-100" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Header Section */}
            <div className="mb-5 d-flex justify-content-between align-items-end">
                <div>
                    <span className="badge bg-primary-subtle text-primary mb-2 px-3 py-2 rounded-pill fw-semibold">Reviewer Overview</span>
                    <h2 className="display-6 fw-bold text-dark mb-1">Hello, {user.name} 👋</h2>
                    <p className="text-secondary mb-0">Track your performance and manage task quality.</p>
                </div>
                <div className="d-none d-md-block text-end">
                    <div className="p-2 bg-white rounded-4 shadow-sm border px-4">
                        <small className="text-uppercase text-muted fw-bold d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Access Level</small>
                        <span className="fw-bold text-dark">{user.role}</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-4 mb-5">
                {stats.map((stat) => (
                    <div key={stat.label} className="col-12 col-md-6 col-lg-3">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden transition-all hover-up" style={{ transition: 'transform 0.2s' }}>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div className="rounded-3 p-3" style={{ backgroundColor: stat.bg, color: stat.color }}>
                                        <stat.icon size={24} strokeWidth={2.5} />
                                    </div>
                                    <Activity size={16} className="text-light-emphasis" />
                                </div>
                                <h6 className="text-secondary fw-medium mb-1">{stat.label}</h6>
                                <h3 className="fw-bold mb-0">{stat.value}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                {/* Progress Card */}
                <div className="col-12 col-lg-7">
                    <div className="card border-0 shadow-sm rounded-4 h-100 p-2">
                        <div className="card-body">
                            <h5 className="fw-bold text-dark mb-4">Review Progress</h5>
                            {(() => {
                                const total = MOCK_TASKS.length;
                                const pending = MOCK_TASKS.filter(t => t.status !== DataItemStatus.ACCEPTED && t.status !== DataItemStatus.REJECTED).length;
                                const progress = total ? Math.round(((total - pending) / total) * 100) : 0;

                                return (
                                    <div className="mt-2">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="text-secondary fw-medium">Completion Rate</span>
                                            <span className="fw-bold text-primary">{progress}%</span>
                                        </div>
                                        <div className="progress rounded-pill mb-4" style={{ height: '12px', backgroundColor: '#e9ecef' }}>
                                            <div
                                                className="progress-bar progress-bar-striped progress-bar-animated rounded-pill bg-primary"
                                                role="progressbar"
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>

                                        <div className="bg-light rounded-4 p-4 d-flex align-items-center justify-content-between">
                                            <div>
                                                <p className="small text-muted mb-1">Tasks waiting for you</p>
                                                <h4 className="fw-bold mb-0 text-dark">{pending} <span className="h6 text-muted fw-normal">Items</span></h4>
                                            </div>
                                            <button
                                                onClick={() => navigate('/reviewer/reviews')}
                                                className="btn btn-dark rounded-3 px-4 py-2 d-flex align-items-center gap-2 fw-semibold"
                                            >
                                                Start Reviewing <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Recent Activity (Admin Only) */}
                {isAdmin && (
                    <div className="col-12 col-lg-5">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">
                                <h5 className="fw-bold text-dark mb-4">System Activity</h5>
                                <div className="d-flex flex-column gap-4">
                                    <ActivityItem
                                        icon={<Plus size={16} />}
                                        title='New Project "Lidar Scan 04"'
                                        time="2 hours ago"
                                        user="Morgan"
                                        type="blue"
                                    />
                                    <ActivityItem
                                        icon={<CheckCircle2 size={16} />}
                                        title="Batch #203 Completed"
                                        time="5 hours ago"
                                        user="Sam"
                                        type="green"
                                    />
                                    <ActivityItem
                                        icon={<AlertCircle size={16} />}
                                        title="Rejection Rate Spike"
                                        time="Yesterday"
                                        user="System Alert"
                                        type="red"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Component con để code sạch hơn
const ActivityItem = ({ icon, title, time, user, type }) => {
    const colors = {
        blue: 'bg-primary-subtle text-primary',
        green: 'bg-success-subtle text-success',
        red: 'bg-danger-subtle text-danger'
    };

    return (
        <div className="d-flex align-items-start gap-3">
            <div className={`p-2 rounded-circle ${colors[type]}`}>
                {icon}
            </div>
            <div className="flex-grow-1 border-bottom pb-3">
                <p className="small fw-bold text-dark mb-0">{title}</p>
                <div className="d-flex justify-content-between">
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>By {user}</span>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>{time}</span>
                </div>
            </div>
        </div>
    );
};