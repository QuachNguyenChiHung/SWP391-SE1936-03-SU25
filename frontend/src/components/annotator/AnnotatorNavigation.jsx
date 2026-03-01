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
        <nav className="annotator-navigation">
            {menuItems.map((section, idx) => (
                <div key={idx} className="nav-section">
                    <div className="nav-section-title">{section.section}</div>
                    {section.items.map((item, i) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        
                        return (
                            <Link
                                key={i}
                                to={item.path}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                            >
                                <Icon size={18} />
                                <span className="nav-label">{item.label}</span>
                                {item.badge > 0 && (
                                    <span className="nav-badge">{item.badge > 9 ? '9+' : item.badge}</span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            ))}

            <style>{`
                .annotator-navigation {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    padding: 16px 0;
                }

                .nav-section {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .nav-section-title {
                    font-size: 11px;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    padding: 8px 16px;
                    margin-bottom: 4px;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 16px;
                    color: #94a3b8;
                    text-decoration: none;
                    border-radius: 8px;
                    margin: 0 8px;
                    transition: all 0.2s ease;
                    position: relative;
                }

                .nav-item:hover {
                    background: rgba(99, 102, 241, 0.1);
                    color: #6366f1;
                }

                .nav-item.active {
                    background: #6366f1;
                    color: white;
                }

                .nav-item.active:hover {
                    background: #4f46e5;
                }

                .nav-label {
                    flex: 1;
                    font-size: 14px;
                    font-weight: 500;
                }

                .nav-badge {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 20px;
                    height: 20px;
                    padding: 0 6px;
                    background: #ef4444;
                    color: white;
                    border-radius: 10px;
                    font-size: 11px;
                    font-weight: 700;
                }

                .nav-item.active .nav-badge {
                    background: white;
                    color: #6366f1;
                }
            `}</style>
        </nav>
    );
};
