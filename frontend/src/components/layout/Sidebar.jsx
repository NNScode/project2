import Logo from '../Logo';

const ICONS = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  data: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M12 9v6" />
    </svg>
  ),
  liveness: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
};

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Tổng quan', icon: 'dashboard', roles: ['ADMIN', 'PROCTOR', 'STUDENTS'] },
  { id: 'users', label: 'Người dùng', icon: 'data', roles: ['ADMIN'] },
  { id: 'liveness', label: 'Điểm danh', icon: 'liveness', roles: ['ADMIN', 'PROCTOR', 'STUDENTS'] },
];

export default function Sidebar({ activePage, onNavigate, userRole, mobileOpen, onCloseMobile }) {
  const items = MENU_ITEMS.filter((m) => m.roles.includes(userRole));

  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-40
        flex flex-col w-64 shrink-0
        bg-[var(--sidebar-bg)] text-[var(--text-h)]
        border-r border-[var(--border)]
        shadow-[var(--shadow-sm)]
        transition-transform duration-200 ease-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}
    >
      <div className="h-16 flex items-center px-5 border-b border-[var(--border-light)]">
        <Logo
          size="sm"
          showText
          textClassName="[&_p:first-child]:text-[var(--text-h)] [&_p:last-child]:text-[var(--primary-600)]"
        />
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-2 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
          Menu
        </p>
        {items.map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onNavigate(item.id);
                onCloseMobile?.();
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium text-left transition-all duration-150
                ${active
                  ? 'bg-[var(--accent-bg)] text-[var(--primary-700)] shadow-sm border border-[var(--accent-border)]'
                  : 'text-[var(--text)] hover:bg-[var(--accent-bg)]/60 hover:text-[var(--primary-700)] border border-transparent'}
              `}
            >
              <span className={active ? 'text-[var(--primary-600)]' : 'text-[var(--text-muted)]'}>
                {ICONS[item.icon]}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--border-light)] text-left">
        <p className="text-xs text-[var(--text-muted)] m-0">FacePass</p>
      </div>
    </aside>
  );
}
