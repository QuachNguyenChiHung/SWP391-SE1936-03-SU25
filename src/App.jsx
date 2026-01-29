import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { Login } from './components/Login.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { ManagerDashboard } from './pages/manager/ManagerDashboard.jsx';
import { ManagerProjects } from './pages/manager/ManagerProjects.jsx';
import { ManagerProjectDetails } from './pages/manager/ManagerProjectDetails.jsx';
import { AnnotatorDashboard } from './pages/annotator/AnnotatorDashboard.jsx';
import { AnnotatorWorkspace } from './pages/annotator/AnnotatorWorkspace.jsx';
import { ReviewerDashboard } from './pages/reviewer/ReviewerDashboard.jsx';
import { ReviewerInterface } from './pages/reviewer/ReviewerInterface.jsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.jsx';
import { AdminPanel } from './pages/admin/AdminPanel.jsx';
import { UserRole } from './types.js';
import getInforFromCookie from './ultis/getInfoFromCookie.js';

// Protected Route Component
const ProtectedRoute = ({ children, user, allowedRoles }) => {
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.user.roleName)) {
    // Redirect to user's default dashboard if they don't have access
    const defaultPath = getDefaultPath(user.user.roleName);
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
};

// Helper to get default path based on role
const getDefaultPath = (role) => {
  switch (role) {
    case UserRole.ADMIN:
      return '/admin/dashboard';
    case UserRole.MANAGER:
      return '/manager/dashboard';
    case UserRole.ANNOTATOR:
      return '/annotator/dashboard';
    case UserRole.REVIEWER:
      return '/reviewer/dashboard';
    default:
      return '/';
  }
};

// 404 Not Found Page
const NotFound = () => (
  <div className="d-flex flex-column align-items-center justify-content-center h-100">
    <h1 className="display-1 fw-bold text-slate-900 mb-4">404</h1>
    <p className="fs-4 text-slate-600 mb-4">Page not found</p>
    <a href="/" className="btn btn-primary px-4 py-3 rounded-3">
      Go Home
    </a>
  </div>
);

// Component wrapper for HomePage with navigation
const HomePageWrapper = () => {
  const navigate = useNavigate();
  return <HomePage onNavigateToLogin={() => navigate('/login')} />;
};

// Component wrapper for Login with navigation
const LoginWrapper = ({ onLogin }) => {
  const navigate = useNavigate();
  return <Login onLogin={onLogin} />;
};

// App Routes Component
const AppRoutes = ({ user, onLogout }) => {
  if (!user) {
    return <Routes>
      <Route path="/" element={<HomePageWrapper />} />
      <Route path="/login" element={<LoginWrapper onLogin={() => { }} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>;
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <Routes>
        {/* Default route - redirect to role-specific dashboard */}
        <Route path="/" element={<Navigate to={getDefaultPath(user.user.roleName)} replace />} />
        <Route path="/login" element={<Navigate to={getDefaultPath(user.user.roleName)} replace />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN]}>
            <AdminDashboard user={user} />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN]}>
            <AdminPanel user={user} />
          </ProtectedRoute>
        } />

        {/* Manager Routes */}
        <Route path="/manager/dashboard" element={
          <ProtectedRoute user={user} allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
            <ManagerDashboard user={user} />
          </ProtectedRoute>
        } />

        {/* Annotator Routes */}
        <Route path="/annotator/dashboard" element={
          <ProtectedRoute user={user} allowedRoles={[UserRole.ANNOTATOR]}>
            <AnnotatorDashboard user={user} />
          </ProtectedRoute>
        } />
        <Route path="/annotator/workspace" element={
          <ProtectedRoute user={user} allowedRoles={[UserRole.ANNOTATOR]}>
            <AnnotatorWorkspace user={user} />
          </ProtectedRoute>
        } />

        {/* Reviewer Routes */}
        <Route path="/reviewer/dashboard" element={
          <ProtectedRoute user={user} allowedRoles={[UserRole.REVIEWER]}>
            <ReviewerDashboard user={user} />
          </ProtectedRoute>
        } />
        <Route path="/reviewer/reviews" element={
          <ProtectedRoute user={user} allowedRoles={[UserRole.REVIEWER]}>
            <ReviewerInterface user={user} />
          </ProtectedRoute>
        } />

        {/* Shared Projects Route (Manager and Admin) */}
        <Route path="/manager/projects" element={
          <ProtectedRoute user={user} allowedRoles={[UserRole.MANAGER]}>
            <ManagerProjects user={user} />
          </ProtectedRoute>
        } />
        <Route path="/manager/projects/:pid" element={
          <ProtectedRoute user={user} allowedRoles={[UserRole.MANAGER]}>
            <ManagerProjectDetails user={user} />
          </ProtectedRoute>
        } />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khôi phục user từ cookie khi app khởi động
  useEffect(() => {

    try {
      const getUser = getInforFromCookie();
      if (getUser) {
        setCurrentUser(getUser);
      }

    } catch (error) {
      console.error('Error parsing saved user:', error);
      document.cookie = "user=; path=/; max-age=0";
    }
    setIsLoading(false);


  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    // Lưu user vào cookie
    document.cookie = `user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${60 * 60}`;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    // Xóa user khỏi cookie
    document.cookie = "user=; path=/; max-age=0";
  };

  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {!currentUser ? (
        <Routes>
          <Route path="/" element={<HomePageWrapper />} />
          <Route path="/login" element={<LoginWrapper onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <AppRoutes user={currentUser} onLogout={handleLogout} />
      )}
    </BrowserRouter>
  );
}

export default App;






