import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/Dashboard';
import UsersPage from './pages/UsersPage';
import ExamsPage from './pages/ExamsPage';
import RoomsPage from './pages/RoomsPage';
import LivenessDemo from './components/LivenessDemo';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <p className="text-[var(--text-muted)] text-sm">Đang tải...</p>
    </div>
  );
}

/** Bảo vệ route: chưa đăng nhập → /login, sai role → /dashboard */
function ProtectedRoute({ children, roles }) {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Trang đăng nhập */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      {/* Layout chung — bảo vệ tất cả route con */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/exams"
          element={<ProtectedRoute roles={['ADMIN']}><ExamsPage /></ProtectedRoute>}
        />
        <Route
          path="/rooms"
          element={<ProtectedRoute roles={['ADMIN', 'PROCTOR']}><RoomsPage /></ProtectedRoute>}
        />
        <Route
          path="/users"
          element={<ProtectedRoute roles={['ADMIN']}><UsersPage /></ProtectedRoute>}
        />
        <Route path="/liveness" element={<LivenessDemo />} />
      </Route>

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
