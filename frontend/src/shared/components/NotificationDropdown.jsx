import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, AlertCircle, CheckCircle2, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './NotificationDropdown.css';

export const NotificationDropdown = () => {
    const [show, setShow] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Fetch notifications
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const [notifRes, countRes] = await Promise.all([
                api.get('/notifications', { params: { pageNumber: 1, pageSize: 10, unreadOnly: false } }),
                api.get('/notifications/unread-count')
            ]);

            if (notifRes.data.success) {
                setNotifications(notifRes.data.data.items || []);
            }
            if (countRes.data.success) {
                setUnreadCount(countRes.data.data || 0);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchNotifications();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShow(false);
            }
        };

        if (show) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [show]);

    // Mark single notification as read
    const markAsRead = async (id) => {
        try {
            const note = notifications.find(n => n.id === id);
            if (!note || note.isRead) return;

            await api.patch(`/notifications/${id}/read`);

            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');

            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);

        // Navigate based on notification type
        if (notification.referenceType === 'Task' && notification.referenceId) {
            navigate(`/annotator/workspace?taskId=${notification.referenceId}`);
            setShow(false);
        }
    };

    // Get notification icon
    const getNotificationIcon = (type) => {
        switch (type) {
            case 2: // ItemApproved
                return <CheckCircle2 size={16} className="text-success" />;
            case 3: // ItemRejected
                return <AlertCircle size={16} className="text-danger" />;
            default:
                return <Bell size={16} className="text-primary" />;
        }
    };

    // Get notification color
    const getNotificationColor = (type) => {
        switch (type) {
            case 2: return 'success';
            case 3: return 'danger';
            default: return 'primary';
        }
    };

    return (
        <div className="notification-dropdown" ref={dropdownRef}>
            {/* Bell Icon Button */}
            <button
                className="btn btn-link position-relative p-2"
                onClick={() => setShow(!show)}
                style={{ color: '#64748b' }}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {show && (
                <div className="notification-panel shadow-lg">
                    {/* Header */}
                    <div className="notification-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-bold">Notifications</h6>
                            <div className="d-flex align-items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="btn btn-sm btn-link text-primary p-0 text-decoration-none"
                                        style={{ fontSize: '0.75rem' }}
                                    >
                                        <CheckCheck size={14} className="me-1" />
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setShow(false)}
                                    className="btn btn-sm btn-link text-muted p-0"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="notification-list">
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-5">
                                <Bell size={32} className="text-muted mb-2" />
                                <p className="text-muted small mb-0">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="d-flex gap-3">
                                        <div className={`notification-icon bg-${getNotificationColor(notification.type)} bg-opacity-10`}>
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-grow-1 min-w-0">
                                            <p className="notification-title mb-1">
                                                {notification.title}
                                            </p>
                                            <p className="notification-content mb-1">
                                                {notification.content}
                                            </p>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="notification-time">
                                                    {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                {!notification.isRead && (
                                                    <div className="unread-dot"></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="notification-footer">
                            <button
                                className="btn btn-link w-100 text-decoration-none text-primary fw-semibold"
                                style={{ fontSize: '0.875rem' }}
                                onClick={() => {
                                    navigate('/notifications');
                                    setShow(false);
                                }}
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
