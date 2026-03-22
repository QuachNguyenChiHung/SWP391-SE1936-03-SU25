import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserRole } from '../shared/types/types.js';
import {
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Layers,
    LayoutDashboard,
    LogOut,
    Menu,
    PenTool,
    Settings,
    User,
    X,
} from 'lucide-react';
import { AnnotatorNavigation } from '../features/annotator/AnnotatorNavigation.jsx';
import { NotificationDropdown } from '../shared/components/NotificationDropdown.jsx';
import { useUI } from '../shared/context/UIContext.jsx';

const dictionary = {
    en: {
        dashboard: 'Dashboard',
        projects: 'Projects',
        workspace: 'Workspace',
        reviewQueue: 'Review Queue',
        userManagement: 'User Management',
        notifications: 'Notifications',
        settings: 'Settings',
        profile: 'Profile',
        myTasks: 'My Tasks',
        adminPanel: 'Admin Panel',
        account: 'Account',
        signOut: 'Sign Out',
        theme: 'Theme',
        language: 'Language',
        light: 'Light',
        dark: 'Dark',
    },
    vi: {
        dashboard: 'Bang dieu khien',
        projects: 'Du an',
        workspace: 'Khong gian lam viec',
        reviewQueue: 'Hang doi duyet',
        userManagement: 'Quan ly nguoi dung',
        notifications: 'Thong bao',
        settings: 'Cai dat',
        profile: 'Ho so',
        myTasks: 'Nhiem vu cua toi',
        adminPanel: 'Bang quan tri',
        account: 'Tai khoan',
        signOut: 'Dang xuat',
        theme: 'Giao dien',
        language: 'Ngon ngu',
        light: 'Sang',
        dark: 'Toi',
    },
};

const getInitial = (name) => (name?.charAt(0) || '?').toUpperCase();

const stringToBackground = (str) => {
    if (!str) {
        return 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)';
    }

    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    return `linear-gradient(135deg, hsl(${hue} 62% 42%) 0%, hsl(${(hue + 32) % 360} 58% 52%) 100%)`;
};

export const Layout = ({ children, user, onLogout }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
    const location = useLocation();
    const { language } = useUI();
    const t = (key) => dictionary[language]?.[key] || key;
    const roleName = user?.user?.roleName || user?.role || '';
    const pageTitle = useMemo(() => {
        const path = location.pathname;

        if (path.includes('/dashboard')) return t('dashboard');
        if (path.includes('/projects')) return t('projects');
        if (path.includes('/workspace')) return t('workspace');
        if (path.includes('/reviews')) return t('reviewQueue');
        if (path.includes('/users')) return t('userManagement');
        if (path.includes('/notifications')) return t('notifications');
        if (path.includes('/settings')) return t('settings');
        if (path.includes('/profile')) return t('profile');

        return t('dashboard');
    }, [location.pathname, language]);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const saved = window.localStorage.getItem('labelnexus.sidebarCollapsed');
        if (saved !== null) {
            setSidebarCollapsed(saved === 'true');
        }
    }, []);

    const toggleSidebarCollapsed = () => {
        setSidebarCollapsed((current) => {
            const nextValue = !current;
            window.localStorage.setItem('labelnexus.sidebarCollapsed', String(nextValue));
            return nextValue;
        });
    };

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

    const navLinkClass = (path) =>
        `sidebar-link ${isActive(path) ? 'sidebar-link-active' : 'sidebar-link-inactive'}`;

    const renderSidebarLink = (to, icon, label, ariaLabel) => (
        <Link to={to} className={navLinkClass(to)} aria-label={sidebarCollapsed ? ariaLabel : undefined} title={sidebarCollapsed ? ariaLabel : undefined}>
            {icon}
            {!sidebarCollapsed && <span className="sidebar-link-label">{label}</span>}
        </Link>
    );

    const renderSidebarLinks = () => {
        switch (user.user.roleName) {
            case UserRole.MANAGER:
                return (
                    <>
                        {renderSidebarLink('/manager/dashboard', <LayoutDashboard size={18} />, t('dashboard'), t('dashboard'))}
                        {renderSidebarLink('/manager/projects', <Layers size={18} />, t('projects'), t('projects'))}
                    </>
                );
            case UserRole.ANNOTATOR:
                return (
                    <>
                        {renderSidebarLink('/annotator/dashboard', <LayoutDashboard size={18} />, t('dashboard'), t('dashboard'))}
                        {renderSidebarLink('/annotator/workspace', <PenTool size={18} />, t('myTasks'), t('myTasks'))}
                    </>
                );
            case UserRole.REVIEWER:
                return (
                    <>
                        {renderSidebarLink('/reviewer/dashboard', <LayoutDashboard size={18} />, t('dashboard'), t('dashboard'))}
                        {renderSidebarLink('/reviewer/reviews', <CheckCircle size={18} />, t('reviewQueue'), t('reviewQueue'))}
                    </>
                );
            case UserRole.ADMIN:
                return (
                    <>
                        {renderSidebarLink('/admin/dashboard', <LayoutDashboard size={18} />, t('dashboard'), t('dashboard'))}
                        {renderSidebarLink('/admin/users', <Settings size={18} />, t('adminPanel'), t('adminPanel'))}
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className={`app-shell app-shell-light ${sidebarCollapsed ? 'app-shell-collapsed' : 'app-shell-expanded'}`}>
            <aside className="app-sidebar d-none d-md-flex flex-column">
                <div className="sidebar-brand">
                    <div className="d-flex align-items-center gap-2 min-w-0">
                        <div className="brand-mark">LN</div>
                        {!sidebarCollapsed && (
                            <div className="brand-copy">
                                <div className="brand-name">LabelNexus</div>
                                <div className="brand-subtitle">Annotation Platform</div>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={toggleSidebarCollapsed}
                        className="sidebar-icon-button sidebar-collapse-button"
                        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                <div className="sidebar-scroll flex-fill custom-scrollbar">
                    {user.user.roleName === UserRole.ANNOTATOR ? (
                        <AnnotatorNavigation collapsed={sidebarCollapsed} />
                    ) : (
                        <div className="sidebar-sections">
                            <div className="sidebar-section">
                                {!sidebarCollapsed && <div className="sidebar-section-label">{t('workspace')}</div>}
                                <div className="sidebar-link-group">{renderSidebarLinks()}</div>
                            </div>

                            <div className="sidebar-section">
                                {!sidebarCollapsed && (
                                    <>
                                        <div className="sidebar-section-label">{t('account')}</div>
                                        <Link to="/profile" className={navLinkClass('/profile')}>
                                            <User size={18} />
                                            <span className="sidebar-link-label">{t('profile')}</span>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="sidebar-user-card">
                    {!sidebarCollapsed && (
                        <Link to="/profile" className="sidebar-user-link">
                            <div className="sidebar-avatar-wrap">
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="User" className="sidebar-avatar" />
                                ) : (
                                    <div className="sidebar-avatar" style={{ background: stringToBackground(user?.user?.name) }}>
                                        {getInitial(user?.user?.name)}
                                    </div>
                                )}
                                <span className="sidebar-status-dot" />
                            </div>
                            <div className="sidebar-user-copy">
                                <div className="sidebar-user-name">{user.user.name}</div>
                                <div className="sidebar-user-role">{roleName}</div>
                            </div>
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={onLogout}
                        className="sidebar-icon-button sidebar-logout-button"
                        title={t('signOut')}
                        aria-label={t('signOut')}
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>

            {mobileMenuOpen && (
                <div className="mobile-drawer-overlay d-md-none" onClick={() => setMobileMenuOpen(false)}>
                    <div className="mobile-drawer" onClick={(event) => event.stopPropagation()}>
                        <div className="mobile-drawer-header">
                            <div className="d-flex align-items-center gap-3">
                                <div className="brand-mark brand-mark-sm">LN</div>
                                <div className="brand-name">LabelNexus</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(false)}
                                className="sidebar-icon-button"
                                aria-label="Close menu"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mobile-drawer-body custom-scrollbar">
                            {user.user.roleName === UserRole.ANNOTATOR ? (
                                <AnnotatorNavigation />
                            ) : (
                                <div className="sidebar-sections">
                                    <div className="sidebar-section">
                                        <div className="sidebar-section-label">{t('workspace')}</div>
                                        <div className="sidebar-link-group">{renderSidebarLinks()}</div>
                                    </div>

                                    <div className="sidebar-section">
                                        <div className="sidebar-section-label">{t('account')}</div>
                                        <Link to="/profile" className={navLinkClass('/profile')}>
                                            <User size={18} />
                                            {t('profile')}
                                        </Link>
                                        <button type="button" onClick={onLogout} className="sidebar-link sidebar-link-inactive text-start">
                                            <LogOut size={18} />
                                            {t('signOut')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="app-content-shell">
                <header className="app-topbar">
                    <div className="d-flex align-items-center gap-3 min-w-0">
                        <button
                            type="button"
                            className="sidebar-icon-button d-md-none"
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu size={22} />
                        </button>
                        <div className="topbar-title-wrap">
                            <div className="topbar-title">{pageTitle}</div>
                            <div className="topbar-subtitle">{roleName}</div>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 gap-sm-3">
                        <NotificationDropdown />

                        <div className="d-none d-md-flex align-items-center gap-2">
                            <span className="role-pill">{roleName}</span>
                        </div>
                    </div>
                </header>

                <main className="app-main">
                    <div key={location.pathname} className="page-transition-surface">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
