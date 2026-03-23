import { useEffect, useState } from 'react';
import {
    Bell, Check, CheckCheck, AlertCircle,
    CheckCircle2, Info, Clock, Inbox, Search
} from 'lucide-react';
import api from '../../shared/utils/api';

export const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            if (res.data.success) {
                const data = res.data.data;
                setNotifications(Array.isArray(data) ? data : (data?.items || []));
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) { console.error(error); }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) { console.error(error); }
    };

    const getStatusConfig = (type) => {
        switch (type) {
            case 'ItemRejected':
                return { icon: <AlertCircle size={20} />, color: '#ef4444', bg: '#fef2f2', label: 'Rejected' };
            case 'ItemApproved':
                return { icon: <CheckCircle2 size={20} />, color: '#10b981', bg: '#ecfdf5', label: 'Approved' };
            default:
                return { icon: <Bell size={20} />, color: '#6366f1', bg: '#eef2ff', label: 'System' };
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-white">
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    );

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="notifications-container">
            {/* Header Area */}
            <div className="page-header mb-5">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h1 className="header-title">Notifications</h1>
                        <p className="header-subtitle">
                            You have <span className="highlight">{unreadCount}</span> unread messages
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button className="btn-mark-all" onClick={markAllAsRead}>
                            <CheckCheck size={18} className="me-2" /> Mark all as read
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="notifications-list">
                {!notifications.length ? (
                    <div className="empty-state">
                        <div className="empty-icon-circle">
                            <Inbox size={40} />
                        </div>
                        <h3>No notifications yet</h3>
                        <p>We'll notify you when something important happens.</p>
                    </div>
                ) : (
                    notifications.map((notif) => {
                        const config = getStatusConfig(notif.type);
                        return (
                            <div
                                key={notif.id}
                                onClick={() => !notif.isRead && markAsRead(notif.id)}
                                className={`notif-card ${!notif.isRead ? 'unread' : 'read'}`}
                            >
                                <div className="card-content">
                                    <div className="icon-column">
                                        <div className="icon-box" style={{ backgroundColor: config.bg, color: config.color }}>
                                            {config.icon}
                                        </div>
                                    </div>

                                    <div className="info-column">
                                        <div className="info-top">
                                            <h5 className="notif-title">{notif.title}</h5>
                                            <span className="notif-time">
                                                <Clock size={14} className="me-1" />
                                                {new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>

                                        <p className="notif-body">{notif.content}</p>

                                        <div className="info-bottom">
                                            {notif.referenceId && (
                                                <span className="ref-badge">#{notif.referenceId}</span>
                                            )}
                                            <span className="type-label" style={{ color: config.color }}>
                                                {notif.type || 'SYSTEM'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="action-column">
                                        {!notif.isRead ? (
                                            <button className="btn-check unread" title="Mark as read">
                                                <Check size={18} />
                                            </button>
                                        ) : (
                                            <div className="btn-check read">
                                                <Check size={18} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <style>{`
                .notifications-container {
                    padding: 40px;
                    max-width: 1000px;
                    margin: 0 auto;
                    font-family: 'Inter', sans-serif;
                }

                /* Header Styling - SHARP & CLEAR */
                .header-title {
                    font-weight: 800;
                    color: #0f172a; /* Slate 900 - very sharp */
                    font-size: 2.25rem;
                    margin-bottom: 8px;
                }
                .header-subtitle {
                    color: #64748b; /* Slate 500 */
                    font-size: 1rem;
                }
                .highlight {
                    color: #6366f1;
                    font-weight: 700;
                }

                .btn-mark-all {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    color: #475569;
                    padding: 10px 20px;
                    border-radius: 10px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    transition: all 0.2s;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .btn-mark-all:hover {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                    color: #0f172a;
                }

                /* Card Styling - HIGH CONTRAST */
                .notif-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    margin-bottom: 16px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }
                
                .notif-card.unread {
                    border-left: 6px solid #6366f1;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
                }
                
                .notif-card.read {
                    background: #fcfcfd;
                    opacity: 0.8;
                }

                .notif-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    border-color: #cbd5e1;
                }

                .card-content {
                    display: flex;
                    padding: 24px;
                    gap: 20px;
                }

                .icon-box {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .info-column { flex-grow: 1; min-width: 0; }

                .info-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 6px;
                }

                .notif-title {
                    margin: 0;
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #1e293b; /* Tránh mờ bằng màu đậm */
                }

                .notif-time {
                    font-size: 0.85rem;
                    color: #94a3b8;
                    display: flex;
                    align-items: center;
                }

                .notif-body {
                    color: #475569; /* Slate 600 - Rõ ràng hơn màu cũ của bạn */
                    line-height: 1.5;
                    margin-bottom: 12px;
                    font-size: 0.95rem;
                }

                .info-bottom {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .ref-badge {
                    background: #f1f5f9;
                    color: #475569;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }

                .type-label {
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .btn-check {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    transition: all 0.2s;
                }
                .btn-check.unread {
                    background: #eef2ff;
                    color: #6366f1;
                }
                .btn-check.unread:hover {
                    background: #6366f1;
                    color: white;
                }
                .btn-check.read {
                    background: #f1f5f9;
                    color: #cbd5e1;
                }

                /* Empty State */
                .empty-state {
                    text-align: center;
                    padding: 80px 20px;
                }
                .empty-icon-circle {
                    width: 80px;
                    height: 80px;
                    background: #f8fafc;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    color: #cbd5e1;
                }
            `}</style>
        </div>
    );
};