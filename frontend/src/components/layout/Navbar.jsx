import { useAuth } from '../../context/AuthContext';

const ROLE_LABEL = {
  ADMIN: 'Quản trị',
  PROCTOR: 'Cán bộ coi thi',
  STUDENTS: 'Thí sinh',
};

export default function Navbar({ title, subtitle, onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 shrink-0 flex items-center justify-between gap-4 px-4 sm:px-6 bg-[var(--surface)] border-b border-[var(--border)] shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent-bg)] hover:border-[var(--accent-border)] transition"
          aria-label="Mở menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <div className="text-left min-w-0">
          <h1 className="text-lg font-semibold text-[var(--text-h)] m-0 truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-[var(--text-muted)] truncate m-0 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-[var(--text-h)] m-0 leading-tight">{user?.full_name}</p>
          <p className="text-xs text-[var(--primary-600)] m-0">{ROLE_LABEL[user?.role] || user?.role}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--primary-700)] flex items-center justify-center text-sm font-semibold">
          {(user?.full_name?.split(' ')[2] || '?').charAt(0).toUpperCase()}
        </div>
        <button
          type="button"
          onClick={logout}
          className="btn-ghost px-3 py-1.5 text-sm text-[var(--text)] hover:text-red-600 hover:bg-red-50 hover:border-red-200"
        >
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
