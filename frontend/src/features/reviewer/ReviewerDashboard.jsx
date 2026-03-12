import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataItemStatus, UserRole } from '../../shared/types/types.js';
import { Eye, ThumbsUp, ThumbsDown, PieChart, Plus, CheckCircle2, AlertCircle, ArrowRight, Activity, Clock, X } from 'lucide-react';
import getInforFromCookie from '../../shared/utils/getInfoFromCookie.js';
import api from '../../shared/utils/api.js';
import ActivityItem from './components/ActivityItem.jsx';
import StatsCard from './components/StatsCard.jsx';

export const ReviewerDashboard = ({ user }) => {
    const navigate = useNavigate();
    const [statsFromApi, setStatsFromApi] = useState(null);
    const [pendingQueue, setPendingQueue] = useState([]);
    const [recentReviews, setRecentReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fallback values while API loads ---
    const fallbackTotalReviewed = 0;
    const fallbackCorrectItems = 0;

    const stats = (() => {
        const totalReviewed = statsFromApi?.totalReviewed ?? fallbackTotalReviewed;
        const accuracy = typeof statsFromApi?.approvalRate === 'number'
            ? statsFromApi.approvalRate
            : Math.round((fallbackCorrectItems / Math.max(1, fallbackTotalReviewed)) * 100);

        const correctItems = statsFromApi?.correctItems ?? Math.round((totalReviewed * (accuracy / 100)));
        const incorrectItems = statsFromApi?.incorrectItems ?? (totalReviewed - correctItems);

        return [
            { label: 'Total Reviewed', value: totalReviewed, icon: Eye, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
            { label: 'Accepted', value: correctItems, icon: ThumbsUp, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
            { label: 'Rejected', value: incorrectItems, icon: ThumbsDown, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' },
            { label: 'Pending Review', value: statsFromApi?.pendingReview ?? 0, icon: AlertCircle, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
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
                const data = res?.data?.data || res?.data;

                // Set stats
                if (data?.stats) {
                    setStatsFromApi({
                        pendingReview: data.stats.pendingReview ?? 0,
                        reviewedToday: data.stats.reviewedToday ?? 0,
                        totalReviewed: data.stats.totalReviewed ?? 0,
                        approvalRate: data.stats.approvalRate ?? 0,
                    });
                }

                // Set pending queue
                if (data?.pendingQueue && Array.isArray(data.pendingQueue)) {
                    setPendingQueue(data.pendingQueue);
                }

                // Set recent reviews
                if (data?.recentReviews && Array.isArray(data.recentReviews)) {
                    setRecentReviews(data.recentReviews);
                }
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
                        <StatsCard label={stat.label} value={stat.value} Icon={stat.icon} color={stat.color} bg={stat.bg} />
                    </div>
                ))}
            </div>

            <div className="row g-4">
                {/* Progress Card */}
                <div className="col-12 col-lg-7">
                    <div className="card border-0 shadow-sm rounded-4 h-100 p-2">
                        <div className="card-body">
                            <h5 className="fw-bold text-dark mb-4">Pending Items</h5>
                            {pendingQueue.length > 0 ? (
                                <div className="d-flex flex-column gap-3">
                                    {pendingQueue.map((item, idx) => (
                                        <div key={idx} className="bg-light rounded-3 p-3 d-flex align-items-start justify-content-between hover-shadow" style={{ transition: 'all 0.2s' }}>
                                            <div className="flex-grow-1">
                                                <p className="fw-bold text-dark mb-1" style={{ fontSize: '13px' }}>{item.fileName}</p>
                                                <p className="text-muted mb-2" style={{ fontSize: '12px' }}>
                                                    Project: <strong>{item.projectName}</strong>
                                                </p>
                                                <div className="d-flex gap-2" style={{ fontSize: '11px' }}>
                                                    <span className="badge bg-secondary text-white">{item.annotatorName}</span>
                                                    <span className="text-muted d-flex align-items-center gap-1">
                                                        <Clock size={12} /> {new Date(item.submittedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate('/reviewer/reviews')}
                                                className="btn btn-sm btn-outline-primary ms-2"
                                            >
                                                Review
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => navigate('/reviewer/reviews')}
                                        className="btn btn-dark rounded-3 px-4 py-2 d-flex align-items-center gap-2 fw-semibold mt-2"
                                    >
                                        View All ({pendingQueue.length}) <ArrowRight size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-5">
                                    <CheckCircle2 size={32} className="text-success mb-3" />
                                    <p className="text-muted mb-0">No items pending review!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Reviews */}
                <div className="col-12 col-lg-5">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-body p-4">
                            <h5 className="fw-bold text-dark mb-4">Recent Reviews</h5>
                            {recentReviews && recentReviews.length > 0 ? (
                                <div className="d-flex flex-column gap-4">
                                    {recentReviews.map((review, idx) => (
                                        <ActivityItem
                                            key={idx}
                                            icon={review.status === 'accepted' ? <CheckCircle2 size={16} /> : <X size={16} />}
                                            title={review.fileName || review.title}
                                            time={new Date(review.reviewedAt || review.submittedAt).toLocaleDateString()}
                                            user={review.annotatorName || review.reviewer || 'You'}
                                            type={review.status === 'accepted' ? 'green' : 'red'}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-3">
                                    <p className="text-muted mb-0">No recent reviews yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ActivityItem moved to components/ActivityItem.jsx