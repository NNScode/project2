import { useLocation } from 'react-router-dom';

export default function PageContent({ children, className = '' }) {
  const { pathname } = useLocation();
  const compact = /^\/liveness\/\d+$/.test(pathname);

  return (
    <div
      className={`flex-1 overflow-y-auto bg-[var(--bg)] ${
        compact ? 'p-2 sm:p-3' : 'p-4 sm:p-6 lg:p-8'
      } ${className}`}
    >
      <div className={`mx-auto w-full ${compact ? 'max-w-4xl' : 'max-w-5xl'}`}>{children}</div>
    </div>
  );
}
