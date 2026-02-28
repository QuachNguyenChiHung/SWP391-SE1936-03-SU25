import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '../types.js';
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
  CreditCard,
  UserIcon
} from 'lucide-react';

export const Layout = ({ children, user, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
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
      <aside className="d-none d-md-flex flex-column bg-slate-900 text-slate-300 shadow-lg border-end border-slate-800" style={{ width: '16rem', zIndex: 50 }}>
        <div className="d-flex align-items-center gap-3 p-4 border-bottom border-slate-800">
          <div className="w-8 h-8 bg-indigo-600 rounded-3 d-flex align-items-center justify-content-center text-white fw-bold shadow-lg">
            L
          </div>
          <span className="fs-4 fw-semibold text-white tracking-tight">LabelNexus</span>
        </div>

        <div className="flex-fill py-4 px-3 overflow-y-auto custom-scrollbar">
          <p className="px-3 small fw-bold text-slate-500 text-uppercase tracking-wider mb-2">Workspace</p>
          <div className="d-flex flex-column gap-1">{renderSidebarLinks()}</div>
        </div>

        {/* User Profile Snippet */}
        <div className="p-3 border-top border-slate-800 bg-slate-900">
          <div className="d-flex align-items-center gap-2">
            {/* Clickable Area for Profile */}
            <div
              className="sidebar-link rounded-3 px-3 py-2 flex-fill"
              onClick={() => navigate('/profile')}
              style={{ cursor: 'pointer', margin: '-0.75rem -0.5rem -0.75rem -0.75rem', padding: '0.75rem' }}
              title="View Profile"
            >
              <div className="d-flex align-items-center gap-3">
                <img
                  src={user.avatarUrl}
                  alt="User"
                  style={{ width: '36px', height: '36px', flexShrink: 0 }}
                  className="rounded-circle border border-2 border-slate-700 bg-slate-800"
                />
                <div className="flex-fill text-start" style={{ minWidth: 0 }}>
                  <p className="small fw-medium text-white mb-0 text-truncate">{user.user.name}</p>
                  <p className="text-uppercase fw-bold text-slate-500 mb-0" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>{user.user.roleName}</p>
                </div>
              </div>
            </div>

            {/* Separate Logout Button */}
            <button 
              onClick={onLogout} 
              className="btn btn-link text-slate-500 rounded d-flex align-items-center justify-content-center" 
              title="Logout"
              style={{ 
                flexShrink: 0, 
                width: '36px', 
                height: '36px',
                padding: 0,
                minWidth: 'auto'
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {mobileMenuOpen && (
        <div className="position-fixed top-0 start-0 bottom-0 end-0 d-md-none backdrop-blur-sm" style={{ zIndex: 1050, backgroundColor: 'rgba(15, 23, 42, 0.5)' }} onClick={() => setMobileMenuOpen(false)}>
          <div className="position-absolute start-0 top-0 bottom-0 bg-slate-900 p-4 shadow-lg max-w-xs" style={{ width: '75%' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="d-flex align-items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-3 d-flex align-items-center justify-content-center text-white fw-bold">L</div>
                <span className="fs-4 fw-semibold text-white">LabelNexus</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="btn btn-link text-slate-400">
                <X size={24} />
              </button>
            </div>
            <div className="d-flex flex-column gap-2">
              {/* Mobile simplified logic - just close menu on click */}
              <div onClick={() => setMobileMenuOpen(false)}>
                {renderSidebarLinks()}
              </div>

              <div className="border-top border-slate-800 my-3" style={{ height: '1px' }}></div>

              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/profile'); }}
                className="w-100 d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-slate-400 fw-medium btn btn-link text-decoration-none text-start"
              >
                <UserIcon size={18} />
                My Profile
              </button>
              <button onClick={onLogout} className="w-100 d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-slate-400 fw-medium btn btn-link text-decoration-none text-start">
                <LogOut size={18} />
                Sign Out
              </button>
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
            <div className="d-none d-sm-flex position-relative align-items-center">
              <Search size={16} className="position-absolute text-slate-400" style={{ left: '0.75rem' }} />
              <input
                type="text"
                placeholder="Search..."
                className="form-control form-control-sm rounded-pill bg-slate-100s border"
                style={{ paddingLeft: '2.25rem', paddingRight: '1rem', width: '12rem' }}
              />
            </div>

            <div className="position-relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="btn btn-link position-relative p-2 text-slate-500 rounded-circle"
              >
                <Bell size={20} />
                <span className="position-absolute bg-danger rounded-circle border border-white" style={{ top: '0.375rem', right: '0.375rem', width: '0.5rem', height: '0.5rem' }}></span>
              </button>

              {notificationsOpen && (
                <div className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg border border-slate-200 py-2 animate-in fade-in slide-in-from-top-2" style={{ width: '20rem', zIndex: 1050 }}>
                  <div className="px-4 py-2 border-bottom border-slate-100 fw-semibold small text-slate-800">Notifications</div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="px-4 py-3 border-bottom border-slate-50 cursor-pointer">
                      <p className="small fw-medium text-slate-800 mb-1">New Batch Assigned</p>
                      <p className="small text-slate-500">You have been assigned 50 items in "Urban Traffic".</p>
                    </div>
                    <div className="px-4 py-3 cursor-pointer">
                      <p className="small fw-medium text-slate-800 mb-1">Review Rejected</p>
                      <p className="small text-slate-500">Task #2938 returned for revision.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="d-none d-md-block bg-slate-200" style={{ height: '2rem', width: '1px' }}></div>

            <div className="d-none d-md-flex align-items-center gap-2">
              <span className="badge bg-indigo-50 text-indigo-700 border border-indigo-100 text-uppercase fw-medium" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                {user.role}
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





