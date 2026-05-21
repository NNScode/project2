export default function PageContent({ children, className = '' }) {
  return (
    <div className={`flex-1 overflow-y-auto bg-[var(--bg)] p-4 sm:p-6 lg:p-8 ${className}`}>
      <div className="max-w-5xl mx-auto w-full">{children}</div>
    </div>
  );
}
