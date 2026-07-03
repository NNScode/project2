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
  '/liveness':      { title: 'Điểm danh',        subtitle: 'Nháy mắt & so khớp CCCD' },
};

export default function MainLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [mobileMenuOpen,   setMobileMenuOpen]   = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const roomDetailMatch = pathname.match(/^\/rooms\/(\d+)$/);
  const livenessMatch = pathname.match(/^\/liveness\/(\d+)$/);
  const meta = roomDetailMatch
    ? { title: 'Chi tiết phòng thi', subtitle: `Phòng #${roomDetailMatch[1]}` }
    : livenessMatch
      ? { title: 'Điểm danh', subtitle: 'Nháy mắt & so khớp CCCD' }
      : (PAGE_META[pathname] || PAGE_META['/dashboard']);

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
