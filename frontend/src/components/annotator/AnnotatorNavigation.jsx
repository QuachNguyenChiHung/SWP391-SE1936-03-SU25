import {
    LayoutDashboard, Target, Bell, User, Settings
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../../ultis/api';

export const AnnotatorNavigation = () => {
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                // Get unread notifications count
                const notifRes = await api.get('/notifications/unread-count');
                if (notifRes.data.success) {
                    setUnreadCount(notifRes.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch counts:', error);
            }
        };

        fetchCounts();
        // Refresh every 30 seconds
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, []);

    const menuItems = [
        {
            section: 'WORKSPACE',
            items: [
                { icon: LayoutDashboard, label: 'Dashboard', path: '/annotator/dashboard' },
                { icon: Target, label: 'My Tasks', path: '/annotator/workspace' }
            ]
        },
        {
            section: 'ACCOUNT',
            items: [
                { icon: Bell, label: 'Notifications', path: '/annotator/notifications', badge: unreadCount },
                { icon: User, label: 'Profile', path: '/profile' },
                { icon: Settings, label: 'Settings', path: '/annotator/settings' }
            ]
        }
    ];

    return (
        <nav className="d-flex flex-column" style={{ gap: '1.5rem', padding: '4px 0' }}>
            {menuItems.map((section, idx) => (
                <div key={idx} className="d-flex flex-column gap-1">
                    <p className="px-3 mb-1 text-uppercase fw-bold text-slate-500"
                        style={{ fontSize: '11px', letterSpacing: '0.6px' }}>
                        {section.section}
                    </p>
                    {section.items.map((item, i) => {
                        const Icon = item.icon;
                        const active = location.pathname === item.path;

                        return (
                            <Link
                                key={i}
                                to={item.path}
                                className={`w-100 d-flex align-items-center gap-3 px-3 py-2 rounded-3 small fw-medium text-decoration-none sidebar-link ${active ? 'bg-indigo-600 text-white sidebar-link-active' : 'text-slate-400'
                                    }`}
                            >
                                <Icon size={18} />
                                <span className="flex-fill">{item.label}</span>
                                {item.badge > 0 && (
                                    <span
                                        className="d-flex align-items-center justify-content-center fw-bold"
                                        style={{
                                            minWidth: '20px', height: '20px',
                                            padding: '0 6px', borderRadius: '10px',
                                            fontSize: '11px',
                                            backgroundColor: active ? '#ffffff' : '#ef4444',
                                            color: active ? '#4f46e5' : '#ffffff',
                                        }}
                                    >
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            ))}
        </nav>
    );
};
