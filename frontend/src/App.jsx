import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/Dashboard';
import UsersPage from './pages/UsersPage';
import LivenessDemo from './components/LivenessDemo';

function AppShell() {
  const { user, loading, isAuthenticated } = useAuth();
  const [page, setPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <p className="text-[var(--text-muted)] text-sm">Đang tải...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const content = {
    dashboard: <Dashboard />,
    users: <UsersPage />,
    liveness: <LivenessDemo />,
  };

  return (
    <MainLayout page={page} onPageChange={setPage}>
      {content[page] || content.dashboard}
    </MainLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
