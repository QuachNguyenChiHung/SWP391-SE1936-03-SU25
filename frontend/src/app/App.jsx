import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from './Layout.jsx';
import { Login } from '../features/auth/Login.jsx';
import { UserRole } from '../shared/types/types.js';
import getInforFromCookie from '../shared/utils/getInfoFromCookie.js';
import ModalAlert from '../shared/components/ModalAlert.jsx';
import ConfirmModal from '../shared/components/ConfirmModal.jsx';
import { useAlert } from '../shared/context/AlertContext.jsx';
import { useConfirm } from '../shared/context/ConfirmContext.jsx';

const lazyNamed = (loader, exportName) =>
    lazy(() => loader().then((module) => ({ default: module[exportName] })));

const ForgotPassword = lazy(() => import('../features/auth/ForgotPassword.jsx'));
const ChangePassword = lazy(() => import('../features/auth/ChangePassword.jsx'));
const HomePage = lazyNamed(() => import('../features/home/HomePage.jsx'), 'HomePage');
const ManagerDashboard = lazyNamed(() => import('../features/manager/ManagerDashboard.jsx'), 'ManagerDashboard');
const ManagerProjects = lazyNamed(() => import('../features/manager/ManagerProjects.jsx'), 'ManagerProjects');
const ManagerProjectDetails = lazyNamed(() => import('../features/manager/ManagerProjectDetails.jsx'), 'ManagerProjectDetails');
const AnnotatorDashboard = lazyNamed(() => import('../features/annotator/AnnotatorDashboard.jsx'), 'AnnotatorDashboard');
const AnnotatorWorkspace = lazyNamed(() => import('../features/annotator/AnnotatorWorkspace.jsx'), 'AnnotatorWorkspace');
const NotificationsPage = lazyNamed(() => import('../features/annotator/NotificationsPage.jsx'), 'NotificationsPage');
const Settings = lazyNamed(() => import('../features/annotator/Settings.jsx'), 'Settings');
const ReviewerDashboard = lazyNamed(() => import('../features/reviewer/ReviewerDashboard.jsx'), 'ReviewerDashboard');
const ReviewerContainer = lazyNamed(() => import('../features/reviewer/ReviewerContainer.jsx'), 'ReviewerContainer');
const AdminDashboard = lazyNamed(() => import('../features/admin/AdminDashboard.jsx'), 'AdminDashboard');
const AdminPanel = lazyNamed(() => import('../features/admin/AdminPanel.jsx'), 'AdminPanel');
const Profile = lazyNamed(() => import('../features/profile/Profile.jsx'), 'Profile');

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

const ProtectedRoute = ({ children, user, allowedRoles }) => {
    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.user.roleName)) {
        return <Navigate to={getDefaultPath(user.user.roleName)} replace />;
    }

    return <>{children}</>;
};

const LoadingShell = ({ compact = false, label = 'Loading...' }) => (
    <div
        className={`route-loading-shell ${compact ? 'route-loading-shell-compact' : 'route-loading-shell-full'}`}
        aria-busy="true"
        aria-live="polite"
    >
        <div className="route-loading-card">
            <div className="route-loading-spinner" />
            <div className="route-loading-text">
                <div className="route-loading-title">{label}</div>
                <div className="route-loading-subtitle">Preparing the workspace</div>
            </div>
        </div>
    </div>
);

const NotFound = () => (
    <div className="page-empty-state">
        <div className="page-empty-card">
            <div className="page-empty-eyebrow">Not Found</div>
            <h1 className="page-empty-title">404</h1>
            <p className="page-empty-copy">The page you requested does not exist or was moved.</p>
            <Link to="/" className="btn btn-primary px-4 py-3 rounded-3">
                Go Home
            </Link>
        </div>
    </div>
);

const HomePageWrapper = () => {
    const navigate = useNavigate();

    return <HomePage onNavigateToLogin={() => navigate('/login')} />;
};

const LoginWrapper = ({ onLogin }) => <Login onLogin={onLogin} />;

const AuthRoutes = ({ onLogin }) => (
    <Suspense fallback={<LoadingShell compact label="Loading page" />}>
        <Routes>
            <Route path="/" element={<HomePageWrapper />} />
            <Route path="/login" element={<LoginWrapper onLogin={onLogin} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ChangePassword />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </Suspense>
);

const AppRoutes = ({ user, onLogout }) => (
    <Layout user={user} onLogout={onLogout}>
        <Suspense fallback={<LoadingShell label="Loading workspace" />}>
            <Routes>
                <Route path="/" element={<Navigate to={getDefaultPath(user.user.roleName)} replace />} />
                <Route path="/login" element={<Navigate to={getDefaultPath(user.user.roleName)} replace />} />

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute user={user}>
                            <Profile />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN]}>
                            <AdminDashboard user={user} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/users"
                    element={
                        <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN]}>
                            <AdminPanel user={user} />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/manager/dashboard"
                    element={
                        <ProtectedRoute user={user} allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
                            <ManagerDashboard user={user} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/manager/projects"
                    element={
                        <ProtectedRoute user={user} allowedRoles={[UserRole.MANAGER]}>
                            <ManagerProjects user={user} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/manager/projects/:pid"
                    element={
                        <ProtectedRoute user={user} allowedRoles={[UserRole.MANAGER]}>
                            <ManagerProjectDetails user={user} />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/annotator/dashboard"
                    element={
                        <ProtectedRoute user={user} allowedRoles={[UserRole.ANNOTATOR]}>
                            <AnnotatorDashboard user={user} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/annotator/workspace"
                    element={
                        <ProtectedRoute user={user} allowedRoles={[UserRole.ANNOTATOR]}>
                            <AnnotatorWorkspace user={user} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/annotator/notifications"
                    element={
                        <ProtectedRoute user={user} allowedRoles={[UserRole.ANNOTATOR]}>
                            <NotificationsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/annotator/settings"
                    element={
                        <ProtectedRoute user={user} allowedRoles={[UserRole.ANNOTATOR]}>
                            <Settings />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/reviewer/dashboard"
                    element={
                        <ProtectedRoute user={user} allowedRoles={[UserRole.REVIEWER]}>
                            <ReviewerDashboard user={user} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/reviewer/reviews"
                    element={
                        <ProtectedRoute user={user} allowedRoles={[UserRole.REVIEWER]}>
                            <ReviewerContainer user={user} />
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<NotFound />} />
            </Routes>
        </Suspense>
    </Layout>
);

function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { modalConfig, closeAlert } = useAlert();
    const { confirmConfig, closeConfirm } = useConfirm();
    const currentUserRef = useRef(currentUser);
    const pathnameRef = useRef('/');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        currentUserRef.current = currentUser;
    }, [currentUser]);

    useEffect(() => {
        pathnameRef.current = location.pathname;
    }, [location.pathname]);

    useEffect(() => {
        try {
            const restoredUser = getInforFromCookie();
            if (restoredUser) {
                setCurrentUser(restoredUser);
            }
        } catch (error) {
            console.error('Error parsing saved user:', error);
            document.cookie = 'user=; path=/; max-age=0';
        }

        setIsLoading(false);
    }, []);

    useEffect(() => {
        const syncSession = () => {
            const cookieUser = getInforFromCookie();

            if (!cookieUser) {
                if (currentUserRef.current) {
                    setCurrentUser(null);
                }

                if (
                    pathnameRef.current !== '/' &&
                    pathnameRef.current !== '/login' &&
                    pathnameRef.current !== '/forgot-password' &&
                    pathnameRef.current !== '/reset-password'
                ) {
                    navigate('/login', { replace: true });
                }

                return;
            }

            if (!currentUserRef.current) {
                setCurrentUser(cookieUser);
            }
        };

        syncSession();
        const interval = setInterval(syncSession, 10000);

        return () => clearInterval(interval);
    }, [navigate]);

    const handleLogin = (user) => {
        setCurrentUser(user);
        document.cookie = `user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${60 * 60}`;
    };

    const handleLogout = () => {
        setCurrentUser(null);
        document.cookie = 'user=; path=/; max-age=0';
    };

    if (isLoading) {
        return (
            <div className="app-bootstrap-loader">
                <div className="app-bootstrap-loader-card">
                    <div className="route-loading-spinner" />
                    <div className="route-loading-title">Starting application</div>
                    <div className="route-loading-subtitle">Restoring your session</div>
                </div>
            </div>
        );
    }

    return (
        <>
            <ModalAlert
                show={modalConfig.show}
                title={modalConfig.title}
                message={modalConfig.message}
                alertType={modalConfig.alertType}
                onClose={closeAlert}
            />
            <ConfirmModal
                show={confirmConfig.show}
                title={confirmConfig.title}
                message={confirmConfig.message}
                variant={confirmConfig.variant}
                confirmText={confirmConfig.confirmText}
                cancelText={confirmConfig.cancelText}
                onConfirm={() => closeConfirm(true)}
                onCancel={() => closeConfirm(false)}
            />
            {currentUser ? <AppRoutes user={currentUser} onLogout={handleLogout} /> : <AuthRoutes onLogin={handleLogin} />}
        </>
    );
}

export default App;
