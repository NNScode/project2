import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/Dashboard';
import UsersPage from './pages/UsersPage';
import ExamsPage from './pages/ExamsPage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailPage from './pages/RoomDetailPage';
import StudentsPage from './pages/StudentsPage';
import LivenessDemo from './components/LivenessDemo';
import { NotFoundPage, ForbiddenPage } from './pages/ErrorPages';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <p className="text-[var(--text-muted)] text-sm">Đang tải...</p>
    </div>
  );
}

/** Bảo vệ route: chưa đăng nhập → /login, sai role → /forbidden */
function ProtectedRoute({ children, roles }) {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/forbidden" replace />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Trang đăng nhập */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route path="/not-found" element={<NotFoundPage />} />
      {/* Alias số HTTP — redirect sang URL semantic */}
      <Route path="/403" element={<Navigate to="/forbidden" replace />} />
      <Route path="/404" element={<Navigate to="/not-found" replace />} />

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
          path="/rooms/:id"
          element={<ProtectedRoute roles={['ADMIN', 'PROCTOR']}><RoomDetailPage /></ProtectedRoute>}
        />
        <Route
          path="/users"
          element={<ProtectedRoute roles={['ADMIN']}><UsersPage /></ProtectedRoute>}
        />
        <Route
          path="/students"
          element={<ProtectedRoute roles={['ADMIN']}><StudentsPage /></ProtectedRoute>}
        />
        <Route
          path="/liveness"
          element={<ProtectedRoute roles={['STUDENTS']}><Navigate to="/dashboard" replace /></ProtectedRoute>}
        />
        <Route
          path="/liveness/:roomId"
          element={<ProtectedRoute roles={['STUDENTS']}><LivenessDemo /></ProtectedRoute>}
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
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
