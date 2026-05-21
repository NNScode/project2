import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PageContent from './PageContent';
import { useAuth } from '../../context/AuthContext';

const PAGE_META = {
  dashboard: { title: 'Tổng quan', subtitle: 'Thống kê FacePass' },
  users: { title: 'Người dùng', subtitle: 'Quản lý tài khoản hệ thống' },
  liveness: { title: 'Điểm danh', subtitle: 'Xác thực khuôn mặt & Liveness' },
};

export default function MainLayout({ page, onPageChange, children }) {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const meta = PAGE_META[page] || PAGE_META.dashboard;

  return (
    <div className="flex min-h-screen w-full max-w-none text-left bg-[var(--surface)]">
      {mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          aria-label="Đóng menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        activePage={page}
        onNavigate={onPageChange}
        userRole={user?.role || 'STUDENTS'}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 lg:ml-0">
        <Navbar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <PageContent>{children}</PageContent>
      </div>
    </div>
  );
}
