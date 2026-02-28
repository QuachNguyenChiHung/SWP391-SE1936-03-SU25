import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FileStack, CheckCircle2, Target, AlertCircle, Bell, 
    ArrowUpRight, Clock, RefreshCcw, ChevronRight, PlusCircle,
    CheckCheck
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Cell 
} from 'recharts';
import api from '../../ultis/api.js';

export const AnnotatorDashboard = ({ user }) => {
    const navigate = useNavigate();
    const [statsData, setStatsData] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch all data from APIs
    const fetchData = async () => {
        try {
            const [dashboardRes, notifyRes] = await Promise.all([
                api.get('/Dashboard/annotator'),
                api.get('/notifications', { params: { pageNumber: 1, pageSize: 20, unreadOnly: false } })
            ]);

            if (dashboardRes.data.success) {
                setStatsData(dashboardRes.data.data);
            }
            if (notifyRes.data.success) {
                setNotifications(notifyRes.data.data.items);
            }
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

    // API Logic: Mark a single notification as read
    const markAsRead = async (id) => {
        try {
            const note = notifications.find(n => n.id === id);
            if (!note || note.isRead) return;

            const response = await api.patch(`/notifications/${id}/read`);
            if (response.data.success) {
                setNotifications(prev => 
                    prev.map(n => n.id === id ? { ...n, isRead: true } : n)
                );
            }
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    // API Logic: Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            const response = await api.patch('/notifications/read-all');
            if (response.data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            }
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchData();
    };

    if (loading) return (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100">
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <p className="text-muted fw-medium">Syncing your workspace...</p>
        </div>
    );

    const statCards = statsData ? [
        { label: 'Total Assigned', value: statsData.stats.totalAssigned, icon: FileStack, color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.08)' },
        { label: 'Completed', value: statsData.stats.completed, icon: CheckCircle2, color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
        { label: 'In Progress', value: statsData.stats.inProgress, icon: Target, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
        { label: 'Rejected', value: statsData.stats.pendingReview, icon: AlertCircle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' },
    ] : [];

    return (
        <div className="container-fluid py-4 animate__animated animate__fadeIn">
            {/* --- Header --- */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <div>
                    <h2 className="h3 fw-bold text-dark mb-1">Welcome back, {user?.name || 'Annotator'}! 👋</h2>
                    <p className="text-muted mb-0 small">
                        <Clock size={14} className="me-1" />
                        Last updated: {new Date().toLocaleTimeString('en-US')}
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-white border shadow-sm d-flex align-items-center gap-2" onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCcw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button className="btn btn-primary d-flex align-items-center gap-2 shadow-sm px-3">
                        <PlusCircle size={16} /> New Task
                    </button>
                </div>
            </div>

            {/* --- Stats Cards --- */}
            <div className="row g-3 mb-4">
                {statCards.map((stat) => (
                    <div key={stat.label} className="col-12 col-sm-6 col-xl-3">
                        <div className="card border-0 shadow-sm h-100 rounded-4 transition-up">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div className="p-3 rounded-3" style={{ backgroundColor: stat.bg, color: stat.color }}>
                                        <stat.icon size={24} />
                                    </div>
                                    <span className="badge bg-light text-success border rounded-pill">+12%</span>
                                </div>
                                <h6 className="text-muted small fw-bold text-uppercase mb-1">{stat.label}</h6>
                                <h2 className="fw-bold mb-0 text-dark">{stat.value}</h2>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                {/* --- Performance Chart --- */}
                <div className="col-12 col-xl-8">
                    <div className="card border-0 shadow-sm h-100 rounded-4">
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold text-dark mb-0">Work Performance</h5>
                                <select className="form-select form-select-sm border-0 bg-light w-auto fw-semibold">
                                    <option>This Month</option>
                                    <option>Last Month</option>
                                </select>
                            </div>
                            <div style={{ height: '350px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={statsData?.recentTasks || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="projectName" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 11, fill: '#94a3b8' }} 
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="progressPercent" radius={[6, 6, 0, 0]} barSize={40}>
                                            {(statsData?.recentTasks || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.progressPercent === 100 ? '#10b981' : '#6366f1'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Notifications Section --- */}
                <div className="col-12 col-xl-4">
                    <div className="card border-0 shadow-sm h-100 rounded-4">
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold text-dark mb-0">Notifications</h5>
                                <div className="d-flex align-items-center gap-2">
                                    {notifications.some(n => !n.isRead) && (
                                        <button 
                                            onClick={markAllAsRead}
                                            className="btn btn-sm btn-link text-primary p-0 text-decoration-none fw-bold"
                                            style={{ fontSize: '11px' }}
                                        >
                                            <CheckCheck size={14} className="me-1" /> Mark all read
                                        </button>
                                    )}
                                    <span className="badge bg-primary rounded-pill">
                                        {notifications.filter(n => !n.isRead).length} New
                                    </span>
                                </div>
                            </div>
                            
                            <div className="d-flex flex-column gap-3 overflow-auto" style={{ maxHeight: '400px', paddingRight: '4px' }}>
                                {notifications.length > 0 ? notifications.map((note) => (
                                    <div 
                                        key={note.id} 
                                        onClick={() => markAsRead(note.id)}
                                        className={`p-3 rounded-4 border-start border-4 transition-all ${
                                            !note.isRead 
                                            ? 'bg-primary bg-opacity-10 border-primary cursor-pointer' 
                                            : 'bg-light border-transparent shadow-none opacity-75'
                                        }`}
                                        style={{ cursor: !note.isRead ? 'pointer' : 'default' }}
                                    >
                                        <div className="d-flex gap-3">
                                            <div className={`p-2 h-fit rounded-circle ${
                                                note.type === 'ItemRejected' ? 'bg-danger text-danger' : 
                                                note.type === 'ItemApproved' ? 'bg-success text-success' : 'bg-primary text-primary'
                                            } bg-opacity-10`}>
                                                {note.type === 'ItemRejected' ? <AlertCircle size={14} /> : 
                                                 note.type === 'ItemApproved' ? <CheckCircle2 size={14} /> : 
                                                 <Bell size={14} />}
                                            </div>
                                            <div className="flex-grow-1 min-w-0">
                                                <p className={`small fw-bold mb-1 ${!note.isRead ? 'text-primary' : 'text-dark'}`}>
                                                    {note.title}
                                                </p>
                                                <p className="text-muted small mb-1 text-truncate-2" style={{ fontSize: '12px' }}>
                                                    {note.content}
                                                </p>
                                                <div className="d-flex justify-content-between align-items-center mt-2">
                                                    <span className="text-muted" style={{ fontSize: '10px' }}>
                                                        {new Date(note.createdAt).toLocaleDateString('en-US')}
                                                    </span>
                                                    {!note.isRead && <div className="bg-primary rounded-circle" style={{ width: '6px', height: '6px' }}></div>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-5">
                                        <Bell size={32} className="text-light mb-2" />
                                        <p className="text-muted small">No notifications yet</p>
                                    </div>
                                )}
                            </div>
                            <button className="btn btn-link w-100 mt-3 text-decoration-none fw-bold small text-primary">
                                View all <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .text-truncate-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .h-fit { height: fit-content; }
                .border-transparent { border-color: transparent !important; }
                .transition-up { transition: transform 0.2s ease; }
                .transition-up:hover { transform: translateY(-4px); }
                .cursor-pointer { cursor: pointer; }
                .btn-white { background: #fff; color: #333; }
            `}</style>
        </div>
    );
};