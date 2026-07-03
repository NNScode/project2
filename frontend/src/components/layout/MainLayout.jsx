import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PageContent from './PageContent';
import { useAuth } from '../../context/AuthContext';

const PAGE_META = {
  '/dashboard':     { title: 'Tổng quan',       subtitle: 'Trang chủ FacePass' },
  '/exams':         { title: 'Kỳ thi',           subtitle: 'Quản lý kỳ thi' },
  '/rooms':         { title: 'Phòng thi',        subtitle: 'Quản lý phòng thi & giám thị' },
  '/users':         { title: 'Người dùng',       subtitle: 'Quản lý tài khoản hệ thống' },
  '/students':      { title: 'Thí sinh',         subtitle: 'Quản lý hồ sơ thí sinh' },
  '/room-students': { title: 'Gán phòng',        subtitle: 'Phân bổ thí sinh theo phòng thi' },
  '/attendance':    { title: 'Duyệt điểm danh',  subtitle: 'Xem và xử lý bản ghi điểm danh' },
  '/liveness':      { title: 'Điểm danh',        subtitle: 'Xác thực khuôn mặt & Liveness' },
};

export default function MainLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [mobileMenuOpen,   setMobileMenuOpen]   = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const meta = PAGE_META[pathname] || PAGE_META['/dashboard'];

  return (
    <div className="flex min-h-screen w-full max-w-none text-left bg-[var(--surface)]">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          aria-label="Đóng menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        userRole={user?.role || 'STUDENTS'}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <Navbar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <PageContent>
          <Outlet />
        </PageContent>
      </div>
    </div>
  );
}
