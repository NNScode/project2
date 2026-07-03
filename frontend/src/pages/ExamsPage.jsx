import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getExams, createExam, updateExam, deleteExam } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

const STATUSES = [
  { value: 'FUTURE', label: 'Sắp diễn ra' },
  { value: 'NOW',    label: 'Đang diễn ra' },
  { value: 'PAST',   label: 'Đã kết thúc' },
];

const STATUS_BADGE = {
  FUTURE: 'bg-[var(--accent-bg)] text-[var(--primary-700)] border-[var(--accent-border)]',
  NOW:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  PAST:   'bg-slate-100 text-slate-600 border-slate-200',
};

const emptyForm = { name: '', description: '', status: 'FUTURE' };

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export default function ExamsPage() {
  const [exams,    setExams]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form,     setForm]     = useState(emptyForm);
  const [saving,   setSaving]   = useState(false);
  const [confirm,  setConfirm]  = useState(null);
  const [filter,   setFilter]   = useState('ALL');
  const [search,   setSearch]   = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const loadExams = async () => {
    setLoading(true);
    try {
      const res = await getExams({
        page,
        page_size: pageSize,
        search: debouncedSearch || undefined,
        status: filter !== 'ALL' ? filter : undefined,
      });
      setExams(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [debouncedSearch, filter]);
  useEffect(() => { loadExams(); }, [page, pageSize, debouncedSearch, filter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (exam) => {
    setEditingId(exam.id);
    setForm({ name: exam.name, description: exam.description || '', status: exam.status });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingId(null); setForm(emptyForm); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        status: form.status,
      };
      if (editingId) {
        await updateExam(editingId, payload);
        toast.success('Cập nhật kỳ thi thành công');
      } else {
        await createExam(payload);
        toast.success('Thêm kỳ thi thành công');
      }
      closeModal();
      loadExams();
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (exam) => {
    setConfirm({
      title: 'Xóa kỳ thi',
      message: `Xóa "${exam.name}"? Tất cả phòng thi liên quan cũng sẽ bị xóa.`,
      confirmLabel: 'Xóa kỳ thi',
      onConfirm: async () => {
        try {
          await deleteExam(exam.id);
          toast.success('Đã xóa kỳ thi');
          loadExams();
        } catch (err) {
          const detail = err.response?.data?.detail;
          toast.error(typeof detail === 'string' ? detail : 'Không xóa được');
        }
      },
    });
  };

  return (
    <div className="text-left w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-h)] m-0">Quản lý kỳ thi</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1 m-0">
            Thêm, sửa, xóa kỳ thi và cập nhật trạng thái
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary-soft px-4 py-2 text-sm font-medium shrink-0"
        >
          + Thêm kỳ thi
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm tên hoặc mô tả kỳ thi..."
          className="input-field w-full pl-9 pr-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-sm"
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[{ v: 'ALL', l: 'Tất cả' }, ...STATUSES.map((s) => ({ v: s.value, l: s.label }))].map(({ v, l }) => (
          <button
            key={v}
            type="button"
            onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border transition-all ${
              filter === v
                ? 'bg-[var(--primary-600)] text-white border-[var(--primary-600)]'
                : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:border-[var(--accent-border)] hover:text-[var(--primary-700)]'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="p-8 text-center text-[var(--text-muted)] text-sm m-0">Đang tải...</p>
        ) : exams.length === 0 ? (
          <p className="p-8 text-center text-[var(--text-muted)] text-sm m-0">
            {total === 0 && !debouncedSearch && filter === 'ALL' ? 'Chưa có kỳ thi nào.' : 'Không tìm thấy kết quả phù hợp.'}
          </p>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--accent-bg)] border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Tên kỳ thi</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Trạng thái</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Ngày tạo</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Mô tả</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--text-h)]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr
                    key={exam.id}
                    className="border-b border-[var(--border-light)] hover:bg-[var(--accent-bg)]/40 transition"
                  >
                    <td className="px-4 py-3 text-[var(--text-muted)]">{exam.id}</td>
                    <td className="px-4 py-3 font-medium text-[var(--text-h)] max-w-[240px]">
                      <span className="line-clamp-2">{exam.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[exam.status]}`}>
                        {STATUSES.find((s) => s.value === exam.status)?.label || exam.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">
                      {fmtDate(exam.create_at)}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)] max-w-[200px]">
                      <span className="line-clamp-1">{exam.description || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(exam)}
                        className="text-[var(--primary-600)] hover:text-[var(--primary-800)] font-medium mr-3"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(exam)}
                        className="text-red-500 hover:text-red-700 font-medium"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
          />
          </>
        )}
      </div>

      <ConfirmModal state={confirm} onClose={() => setConfirm(null)} />

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="card w-full max-w-lg p-6 shadow-[var(--shadow-lg)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--text-h)] m-0 mb-5">
              {editingId ? 'Sửa kỳ thi' : 'Thêm kỳ thi mới'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">
                  Tên kỳ thi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]"
                  placeholder="VD: Thi cuối kỳ Toán học HK1 2025"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">
                  Mô tả
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] resize-none"
                  placeholder="Mô tả ngắn về kỳ thi..."
                  rows={3}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">
                  Trạng thái
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {STATUSES.map((s) => (
                    <label
                      key={s.value}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--radius-sm)] border text-sm cursor-pointer transition-all ${
                        form.status === s.value
                          ? `${STATUS_BADGE[s.value]} font-medium`
                          : 'border-[var(--border)] text-[var(--text)] hover:border-[var(--accent-border)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={s.value}
                        checked={form.status === s.value}
                        onChange={() => setForm({ ...form, status: s.value })}
                        className="sr-only"
                        disabled={saving}
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button type="button" onClick={closeModal} className="btn-ghost px-4 py-2 text-sm" disabled={saving}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary-soft px-4 py-2 text-sm" disabled={saving}>
                  {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
