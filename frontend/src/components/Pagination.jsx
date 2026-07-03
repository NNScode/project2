const PAGE_SIZES = [10, 20, 50];

export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-[var(--border)] bg-[var(--surface)]">
      <p className="text-xs text-[var(--text-muted)] m-0">
        Hiển thị {from}–{to} / {total} bản ghi
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-2 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-xs"
          aria-label="Số bản ghi mỗi trang"
        >
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>{n} / trang</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border border-[var(--border)] bg-[var(--surface)] disabled:opacity-40 hover:border-[var(--accent-border)]"
        >
          Trước
        </button>
        <span className="text-xs text-[var(--text-muted)] px-1">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border border-[var(--border)] bg-[var(--surface)] disabled:opacity-40 hover:border-[var(--accent-border)]"
        >
          Sau
        </button>
      </div>
    </div>
  );
}
