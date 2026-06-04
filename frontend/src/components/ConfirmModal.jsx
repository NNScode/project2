/**
 * ConfirmModal — thay thế window.confirm()
 *
 * Usage:
 *   const [confirm, setConfirm] = useState(null);
 *   // mở:   setConfirm({ message: '...', onConfirm: () => doDelete() });
 *   // đóng: setConfirm(null)
 *
 *   <ConfirmModal state={confirm} onClose={() => setConfirm(null)} />
 */
export default function ConfirmModal({ state, onClose }) {
  if (!state) return null;

  const { title = 'Xác nhận', message, confirmLabel = 'Xóa', confirmClass = 'bg-red-600 hover:bg-red-700', onConfirm } = state;

  const handleConfirm = () => {
    onClose();
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="card w-full max-w-sm p-6 shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </span>
          <div>
            <h3 className="text-base font-semibold text-[var(--text-h)] m-0">{title}</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)] m-0">{message}</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost px-4 py-2 text-sm"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-[var(--radius-sm)] transition-all duration-150 ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
