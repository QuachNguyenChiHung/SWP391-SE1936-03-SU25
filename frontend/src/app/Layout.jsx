import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '../shared/types/types.js';
import {
  LayoutDashboard,
  PenTool,
  CheckCircle,
  Settings,
  LogOut,
  Layers,
  Users,
  Bell,
  Menu,
  X,
  Search,
  PieChart,
  User,
  Mail,
  Shield,
  CreditCard
} from 'lucide-react';
import { AnnotatorNavigation } from '../features/annotator/AnnotatorNavigation.jsx';
import { SearchBar } from '../shared/components/SearchBar.jsx';
import { NotificationDropdown } from '../shared/components/NotificationDropdown.jsx';

export const Layout = ({ children, user, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Helper function to check if a path is active
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/projects')) return 'Projects';
    if (path.includes('/workspace')) return 'Workspace';
    if (path.includes('/reviews')) return 'Review Queue';
    if (path.includes('/users')) return 'User Management';
    if (path.includes('/notifications')) return 'Notifications';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/profile')) return 'Profile';
    return 'Dashboard';
  };

  // Render Sidebar Links based on Role
  const renderSidebarLinks = () => {
    const linkClass = (path) =>
      `w-100 d-flex align-items-center gap-3 px-3 py-2 rounded-3 small fw-medium text-decoration-none sidebar-link ${isActive(path)
        ? 'bg-indigo-600 text-white sidebar-link-active'
        : 'text-slate-400'
      }`;

    switch (user.user.roleName) {
      case UserRole.MANAGER:
        return (
          <>
            <Link to="/manager/dashboard" className={linkClass('/manager/dashboard')}>
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
            <Link to="/manager/projects" className={linkClass('/manager/projects')}>
              <Layers size={18} />
              Projects
            </Link>
          </>
        );
      case UserRole.ANNOTATOR:
        return (
          <>
            <Link to="/annotator/dashboard" className={linkClass('/annotator/dashboard')}>
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
            <Link to="/annotator/workspace" className={linkClass('/annotator/workspace')}>
              <PenTool size={18} />
              My Tasks
            </Link>
          </>
        );
      case UserRole.REVIEWER:
        return (
          <>
            <Link to="/reviewer/dashboard" className={linkClass('/reviewer/dashboard')}>
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
            <Link to="/reviewer/reviews" className={linkClass('/reviewer/reviews')}>
              <CheckCircle size={18} />
              Review Queue
            </Link>
          </>
        );
      case UserRole.ADMIN:
        return (
          <>
            <Link to="/admin/dashboard" className={linkClass('/admin/dashboard')}>
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
            <Link to="/admin/users" className={linkClass('/admin/users')}>
              <Settings size={18} />
              Admin Panel
            </Link>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="layout-container d-flex vh-100 bg-slate-50 overflow-hidden">

      {/* Desktop Sidebar */}
      <aside className="d-none d-md-flex flex-column text-slate-300" style={{ width: '16rem', zIndex: 50, background: 'linear-gradient(180deg, #0f172a 0%, #0f172a 100%)', boxShadow: '4px 0 24px rgba(0,0,0,0.18)', borderRight: '1px solid #1e293b' }}>
        {/* Logo */}
        <div className="d-flex align-items-center gap-3 px-4 border-bottom border-slate-800" style={{ paddingTop: '1.25rem', paddingBottom: '1.25rem' }}>
          <div className="d-flex align-items-center justify-content-center text-white fw-bold rounded-3" style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 4px 12px rgba(99,102,241,0.45)', flexShrink: 0, fontSize: '15px', letterSpacing: '-1px' }}>
            LN
          </div>
          <div>
            <span className="fw-bold text-white" style={{ fontSize: '1rem', letterSpacing: '-0.3px' }}>LabelNexus</span>
            <p className="mb-0 text-slate-500" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>ANNOTATION PLATFORM</p>
          </div>
        </div>

        <div className="flex-fill px-3 overflow-y-auto custom-scrollbar" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
          {user.user.roleName === UserRole.ANNOTATOR ? (
            <AnnotatorNavigation />
          ) : (
            <div className="d-flex flex-column" style={{ gap: '1.5rem' }}>
              <div className="d-flex flex-column gap-1">
                <p className="px-3 mb-1 fw-bold text-slate-500 text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>Workspace</p>
                {renderSidebarLinks()}
              </div>
              <div className="d-flex flex-column gap-1">
                <p className="px-3 mb-1 fw-bold text-slate-500 text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>Account</p>
                <Link to="/profile" className={`w-100 d-flex align-items-center gap-3 px-3 py-2 rounded-3 small fw-medium text-decoration-none sidebar-link ${isActive('/profile') ? 'bg-indigo-600 text-white sidebar-link-active' : 'text-slate-400'
                  }`}>
                  <User size={18} />
                  Profile
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Snippet */}
        <div className="border-top border-slate-800" style={{ padding: '0.75rem', background: 'rgba(15,23,42,0.8)' }}>
          <div className="d-flex align-items-center gap-2 rounded-3 px-2 py-2" style={{ background: 'rgba(30,41,59,0.6)' }}>
            <div
              className="d-flex align-items-center gap-2 flex-fill sidebar-link rounded-3"
              onClick={() => navigate('/profile')}
              style={{ cursor: 'pointer', padding: '0.375rem 0.5rem', minWidth: 0 }}
              title="View Profile"
            >
              <div className="position-relative" style={{ flexShrink: 0 }}>
                <img
                  src={user.avatarUrl}
                  alt="User"
                  style={{ width: '34px', height: '34px', display: 'block' }}
                  className="rounded-circle border border-2 border-slate-700 bg-slate-800"
                />
                <span className="position-absolute bottom-0 end-0 rounded-circle border border-2 border-slate-800" style={{ width: '10px', height: '10px', background: '#10b981' }}></span>
              </div>
              <div className="flex-fill text-start" style={{ minWidth: 0 }}>
                <p className="small fw-semibold text-white mb-0 text-truncate" style={{ lineHeight: 1.3 }}>{user.user.name}</p>
                <p className="text-uppercase fw-bold text-slate-500 mb-0" style={{ fontSize: '10px', letterSpacing: '0.06em', lineHeight: 1.3 }}>{user.user.roleName}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="btn btn-link text-slate-500 d-flex align-items-center justify-content-center rounded-2"
              title="Sign Out"
              style={{ flexShrink: 0, width: '32px', height: '32px', padding: 0, minWidth: 'auto' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {mobileMenuOpen && (
        <div className="position-fixed top-0 start-0 bottom-0 end-0 d-md-none" style={{ zIndex: 1050, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(2px)' }} onClick={() => setMobileMenuOpen(false)}>
          <div className="position-absolute start-0 top-0 bottom-0 shadow-lg" style={{ width: 'min(75%, 300px)', background: 'linear-gradient(180deg, #0f172a 0%, #0f172a 100%)', borderRight: '1px solid #1e293b' }} onClick={e => e.stopPropagation()}>
            {/* Mobile Header */}
            <div className="d-flex align-items-center justify-content-between px-4 border-bottom border-slate-800" style={{ paddingTop: '1.25rem', paddingBottom: '1.25rem' }}>
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center text-white fw-bold rounded-3" style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)', flexShrink: 0, fontSize: '13px' }}>LN</div>
                <span className="fw-bold text-white" style={{ fontSize: '0.95rem' }}>LabelNexus</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="btn btn-link text-slate-400 p-1">
                <X size={22} />
              </button>
            </div>
            {/* Mobile Nav */}
            <div className="px-3 overflow-y-auto custom-scrollbar" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
              <div onClick={() => setMobileMenuOpen(false)}>
                {user.user.roleName === UserRole.ANNOTATOR ? (
                  <AnnotatorNavigation />
                ) : (
                  <div className="d-flex flex-column" style={{ gap: '1.5rem' }}>
                    <div className="d-flex flex-column gap-1">
                      <p className="px-3 mb-1 fw-bold text-slate-500 text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>Workspace</p>
                      {renderSidebarLinks()}
                    </div>
                    <div className="d-flex flex-column gap-1">
                      <p className="px-3 mb-1 fw-bold text-slate-500 text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>Account</p>
                      <button
                        onClick={() => navigate('/profile')}
                        className="w-100 d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-slate-400 small fw-medium btn btn-link text-decoration-none text-start sidebar-link"
                      >
                        <User size={18} />
                        Profile
                      </button>
                      <button onClick={onLogout} className="w-100 d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-slate-400 small fw-medium btn btn-link text-decoration-none text-start sidebar-link">
                        <LogOut size={18} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-fill d-flex flex-column min-w-0 h-100 position-relative">
        {/* Header */}
        <header className="flex-shrink-0 bg-white border-bottom border-slate-200 d-flex align-items-center justify-content-between px-3 px-sm-4 shadow-sm" style={{ height: '4rem', zIndex: 30 }}>
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-link d-md-none text-slate-500 p-2" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="fs-5 fw-semibold text-slate-800 truncate mb-0">{getPageTitle()}</h1>
          </div>

          <div className="d-flex align-items-center gap-2 gap-sm-3">
            {/* Search Bar */}
            <div className="d-none d-sm-block">

            </div>

            {/* Notification Dropdown */}
            <NotificationDropdown />

            <div className="d-none d-md-block bg-slate-200" style={{ height: '2rem', width: '1px' }}></div>

            <div className="d-none d-md-flex align-items-center gap-2">
              <span className="badge text-uppercase fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.06em', padding: '0.35rem 0.75rem', background: 'linear-gradient(90deg, #eef2ff, #e0e7ff)', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '999px' }}>
                {user.user.roleName || user.role}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-fill overflow-auto bg-slate-50 p-3 p-sm-4 p-lg-5 position-relative" style={{ backgroundColor: 'rgba(248, 250, 252, 0.5)' }}>
          {children}
        </main>
      </div>
    </div>
  );
};





