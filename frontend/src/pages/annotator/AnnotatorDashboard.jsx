import { useEffect, useState } from 'react';
import { 
    FileStack, CheckCircle2, Target, AlertCircle,
    Clock, RefreshCcw, PlusCircle, Filter
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Cell
} from 'recharts';
import api from '../../ultis/api.js';

export const AnnotatorDashboard = ({ user }) => {
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const fetchData = async () => {
        try {
            const [dashboardRes, profileRes] = await Promise.all([
                api.get('/Dashboard/annotator'),
                api.get('/profile')
            ]);

            if (dashboardRes.data.success) setStatsData(dashboardRes.data.data);
            if (profileRes.data.success) setCurrentUser(profileRes.data.data);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchData();
    };

    if (loading) return (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
            <div className="spinner-dots mb-3">
                <div className="bounce1"></div>
                <div className="bounce2"></div>
                <div className="bounce3"></div>
            </div>
            <p className="text-secondary fw-medium animate__animated animate__pulse animate__infinite">Synchronizing your workspace...</p>
        </div>
    );

    const statCards = statsData ? [
        { label: 'Total Assigned', value: statsData.stats.totalAssigned, icon: FileStack, color: '#6366f1', bg: '#eef2ff', trend: '+12%' },
        { label: 'Completed', value: statsData.stats.completed, icon: CheckCircle2, color: '#10b981', bg: '#ecfdf5', trend: '+5%' },
        { label: 'In Progress', value: statsData.stats.inProgress, icon: Target, color: '#f59e0b', bg: '#fffbeb', trend: 'Active' },
        { label: 'Rejected', value: statsData.stats.pendingReview, icon: AlertCircle, color: '#ef4444', bg: '#fef2f2', trend: 'Attention' },
    ] : [];

    return (
        <div className="container-fluid py-4 px-xl-5 bg-dashboard min-vh-100">
            {/* Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <div className="flex-grow-1">
                    <h2 className="display-6 fw-bold text-dark mb-1">
                        Hello {currentUser?.name || user?.name || 'Annotator'}
                    </h2>
                    <div className="d-flex align-items-center gap-3">
                        <span className="badge bg-soft-primary text-primary px-3 py-2 rounded-pill">
                            <Clock size={14} className="me-1" /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-muted small">Everything looks good today.</span>
                    </div>
                </div>
                <div className="d-flex align-items-center gap-2 h-fit">
                    <button className="btn btn-glass border-0 shadow-sm d-flex align-items-center gap-2 px-3" onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCcw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                    <button className="btn btn-indigo d-flex align-items-center gap-2 shadow-sm px-4 py-2 rounded-3 hover-scale">
                        <PlusCircle size={18} /> <span className="fw-semibold">New Task</span>
                    </button>
                </div>
            </div>

            {/* --- Stats Cards --- */}
            <div className="row g-4 mb-5">
                {statCards.map((stat) => (
                    <div key={stat.label} className="col-12 col-sm-6 col-xl-3">
                        <div className="card border-0 shadow-soft h-100 rounded-4 overflow-hidden position-relative hover-lift">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-start mb-4">
                                    <div className="icon-box rounded-3" style={{ backgroundColor: stat.bg, color: stat.color }}>
                                        <stat.icon size={22} />
                                    </div>
                                    <span className={`small fw-bold ${stat.color === '#ef4444' ? 'text-danger' : 'text-success'}`}>
                                        {stat.trend}
                                    </span>
                                </div>
                                <h6 className="text-secondary small fw-bold text-uppercase ls-wide mb-1">{stat.label}</h6>
                                <h2 className="display-6 fw-black mb-0 text-dark">{stat.value}</h2>
                            </div>
                            <div className="progress-mini" style={{ backgroundColor: stat.color }}></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- Performance Chart --- */}
            <div className="row g-4">
                <div className="col-12">
                    <div className="card border-0 shadow-soft rounded-4 h-100">
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h5 className="fw-bold text-dark mb-0">Productivity Insights</h5>
                                    <p className="text-muted small mb-0">Tracking your task completion rate</p>
                                </div>
                                <div className="dropdown">
                                    <button className="btn btn-light btn-sm rounded-pill px-3 border" type="button">
                                        <Filter size={14} className="me-1" /> Filter
                                    </button>
                                </div>
                            </div>
                            <div style={{ height: '350px', width: '100%', minHeight: '350px', minWidth: '300px' }}>
                                {statsData?.recentTasks && statsData.recentTasks.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={350} minWidth={300}>
                                        <BarChart data={statsData.recentTasks}>
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="projectName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} unit="%" />
                                            <Tooltip 
                                                cursor={{ fill: '#f8fafc' }} 
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }} 
                                            />
                                            <Bar dataKey="progressPercent" radius={[8, 8, 0, 0]} barSize={32}>
                                                {statsData.recentTasks.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.progressPercent === 100 ? '#10b981' : 'url(#barGradient)'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="d-flex align-items-center justify-content-center h-100">
                                        <p className="text-muted">No recent tasks data available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                :root {
                    --primary-indigo: #6366f1;
                    --soft-shadow: 0 4px 20px -1px rgba(0, 0, 0, 0.05), 0 2px 10px -1px rgba(0, 0, 0, 0.03);
                }

                .bg-dashboard { background-color: #f8fafc; }
                .fw-black { font-weight: 900; }
                .ls-wide { letter-spacing: 0.05em; }
                
                .shadow-soft { box-shadow: var(--soft-shadow); }
                
                .btn-indigo { background: var(--primary-indigo); color: white; border: none; }
                .btn-indigo:hover { background: #4f46e5; color: white; }
                .btn-glass { background: rgba(255,255,255,0.7); backdrop-filter: blur(8px); border: 1px solid #fff; }

                .icon-box { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; }
                
                .progress-mini { height: 4px; width: 100%; position: absolute; bottom: 0; left: 0; opacity: 0.6; }

                .hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
                .hover-scale:active { transform: scale(0.98); }
                
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }

                /* Loading animation */
                .spinner-dots { width: 70px; text-align: center; }
                .spinner-dots > div {
                    width: 12px; height: 12px; background-color: var(--primary-indigo);
                    border-radius: 100%; display: inline-block;
                    animation: sk-bouncedelay 1.4s infinite ease-in-out both;
                }
                .spinner-dots .bounce1 { animation-delay: -0.32s; }
                .spinner-dots .bounce2 { animation-delay: -0.16s; }
                @keyframes sk-bouncedelay {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1.0); }
                }
            `}</style>
        </div>
    );
};