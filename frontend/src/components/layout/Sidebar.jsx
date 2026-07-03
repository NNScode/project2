import { Link, useLocation } from 'react-router-dom';
import Logo from '../Logo';

const ICONS = {
  dashboard: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  exams: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  rooms: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  students: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  ),
  assign: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  attendance: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  liveness: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
};

export const MENU_ITEMS = [
  { path: '/dashboard',     label: 'Tổng quan',      icon: 'dashboard',  roles: ['ADMIN', 'PROCTOR', 'STUDENTS'] },
  { path: '/exams',         label: 'Kỳ thi',          icon: 'exams',      roles: ['ADMIN'] },
  { path: '/rooms',         label: 'Phòng thi',       icon: 'rooms',      roles: ['ADMIN', 'PROCTOR'] },
  { path: '/users',         label: 'Người dùng',      icon: 'users',      roles: ['ADMIN'] },
  { path: '/students',      label: 'Thí sinh',        icon: 'students',   roles: ['ADMIN'] },
  { path: '/room-students', label: 'Gán phòng',       icon: 'assign',     roles: ['ADMIN'] },
  { path: '/attendance',    label: 'Duyệt điểm danh', icon: 'attendance', roles: ['ADMIN', 'PROCTOR'] },
  { path: '/liveness',      label: 'Điểm danh',       icon: 'liveness',   roles: ['STUDENTS'] },
];

function ChevronLeft() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function Sidebar({
  userRole,
  mobileOpen, onCloseMobile,
  collapsed, onToggleCollapse,
}) {
  const { pathname } = useLocation();
  const items = MENU_ITEMS.filter((m) => m.roles.includes(userRole));

  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-40
        flex flex-col shrink-0
        bg-[var(--sidebar-bg)] text-[var(--text-h)]
        border-r border-[var(--border)]
        shadow-[var(--shadow-sm)]
        transition-all duration-200 ease-out
        ${collapsed ? 'w-16' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}
    >
      {/* Header: logo + toggle */}
      <div className="h-16 flex items-center justify-between px-3 border-[var(--border-light)] shrink-0">
        <div className={`overflow-hidden transition-all duration-200 ${collapsed ? 'w-0 opacity-0' : 'flex-1 opacity-100'}`}>
          <Logo
            size="sm"
            showText
            textClassName="[&_p:first-child]:text-[var(--text-h)] [&_p:last-child]:text-[var(--primary-600)]"
          />
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          className={`
            hidden lg:flex items-center justify-center
            w-7 h-7 rounded-[var(--radius-sm)]
            text-[var(--text-muted)] hover:text-[var(--primary-600)]
            hover:bg-[var(--accent-bg)] border border-transparent
            hover:border-[var(--accent-border)]
            transition-all duration-150 shrink-0
            ${collapsed ? 'mx-auto' : 'ml-1'}
          `}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="px-3 py-2 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
            Menu
          </p>
        )}

        {items.map((item) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              onClick={() => onCloseMobile?.()}
              className={`
                flex items-center rounded-[var(--radius-sm)] text-sm font-medium
                transition-all duration-150 no-underline
                ${collapsed ? 'px-0 py-2.5 justify-center gap-0' : 'px-3 py-2.5 gap-3'}
                ${active
                  ? 'bg-[var(--accent-bg)] text-[var(--primary-700)] shadow-sm border border-[var(--accent-border)]'
                  : 'text-[var(--text)] hover:bg-[var(--accent-bg)]/60 hover:text-[var(--primary-700)] border border-transparent'
                }
              `}
            >
              <span className={active ? 'text-[var(--primary-600)]' : 'text-[var(--text-muted)]'}>
                {ICONS[item.icon]}
              </span>
              <span className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${collapsed ? 'w-0 opacity-0' : 'opacity-100'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
