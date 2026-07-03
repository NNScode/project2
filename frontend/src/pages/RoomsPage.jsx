import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getRooms, createRoom, deleteRoom, getExams, getUsers } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import DateTimeField from '../components/DateTimeField';
import Pagination from '../components/Pagination';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useAuth } from '../context/AuthContext';

function toApiDatetime(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

const STATUS_BADGE = {
  FUTURE: 'bg-[var(--accent-bg)] text-[var(--primary-700)]',
  NOW:    'bg-emerald-50 text-emerald-700',
  PAST:   'bg-slate-100 text-slate-600',
};
const STATUS_LABEL = { FUTURE: 'Sắp diễn ra', NOW: 'Đang diễn ra', PAST: 'Đã kết thúc' };

function fmtDatetime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const emptyForm = {
  exam_id:    '',
  room_name:  '',
  start_time: null,
  end_time:   null,
  exam_url:   '',
  proctor_id: '',
};

export default function RoomsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [rooms,    setRooms]    = useState([]);
  const [exams,    setExams]    = useState([]);
  const [proctors, setProctors] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form,     setForm]     = useState(emptyForm);
  const [saving,   setSaving]   = useState(false);
  const [confirm,  setConfirm]  = useState(null);
  const [filterExam, setFilterExam] = useState('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const loadMeta = async () => {
    try {
      const [eRes, uRes] = await Promise.all([
        getExams({ page_size: 100 }),
        getUsers({ page_size: 100 }),
      ]);
      setExams(eRes.data.items);
      setProctors(uRes.data.items.filter((u) => u.role === 'PROCTOR' || u.role === 'ADMIN'));
    } catch {
      setExams([]);
      setProctors([]);
    }
  };

  const loadRooms = async () => {
    setLoading(true);
    try {
      const rRes = await getRooms({
        page,
        page_size: pageSize,
        search: debouncedSearch || undefined,
        exam_id: filterExam !== 'ALL' ? Number(filterExam) : undefined,
      });
      setRooms(rRes.data.items);
      setTotal(rRes.data.total);
      setTotalPages(rRes.data.total_pages);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const loadAll = async () => {
    await Promise.all([loadRooms(), loadMeta()]);
  };

  useEffect(() => { loadMeta(); }, []);
  useEffect(() => { setPage(1); }, [debouncedSearch, filterExam]);
  useEffect(() => { loadRooms(); }, [page, pageSize, debouncedSearch, filterExam]);

  const examMap  = Object.fromEntries(exams.map((e)  => [e.id, e]));
  const userMap  = Object.fromEntries(proctors.map((u) => [u.id, u]));

  const openCreate = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setForm(emptyForm); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.exam_id) { toast.error('Vui lòng chọn kỳ thi'); return; }
    if (!form.start_time || !form.end_time) { toast.error('Vui lòng chọn thời gian'); return; }
    if (form.start_time >= form.end_time) {
      toast.error('Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        exam_id:    Number(form.exam_id),
        room_name:  form.room_name.trim(),
        start_time: toApiDatetime(form.start_time),
        end_time: toApiDatetime(form.end_time),
        exam_url:   form.exam_url.trim() || null,
        proctor_id: form.proctor_id ? Number(form.proctor_id) : null,
      };
      await createRoom(payload);
      toast.success('Thêm phòng thi thành công');
      closeModal();
      loadAll();
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (room) => {
    const examName = examMap[room.exam_id]?.name || `Kỳ thi #${room.exam_id}`;
    setConfirm({
      title: 'Xóa phòng thi',
      message: `Xóa phòng "${room.room_name}" thuộc ${examName}?`,
      confirmLabel: 'Xóa phòng',
      onConfirm: async () => {
        try {
          await deleteRoom(room.id);
          toast.success('Đã xóa phòng thi');
          loadAll();
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
          <h2 className="text-xl font-semibold text-[var(--text-h)] m-0">Quản lý phòng thi</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1 m-0">
            Thêm, sửa, xóa phòng thi và phân công giám thị
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary-soft px-4 py-2 text-sm font-medium shrink-0"
        >
          + Thêm phòng thi
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
          placeholder="Tìm tên phòng thi..."
          className="input-field w-full pl-9 pr-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-sm"
        />
      </div>

      {/* Filter by exam */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <span className="text-xs text-[var(--text-muted)] font-medium">Lọc theo kỳ thi:</span>
        <button
          type="button"
          onClick={() => setFilterExam('ALL')}
          className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border transition-all ${
            filterExam === 'ALL'
              ? 'bg-[var(--primary-600)] text-white border-[var(--primary-600)]'
              : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:border-[var(--accent-border)]'
          }`}
        >
          Tất cả
        </button>
        {exams.map((exam) => (
          <button
            key={exam.id}
            type="button"
            onClick={() => setFilterExam(String(exam.id))}
              className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border transition-all max-w-[180px] truncate ${
                filterExam === String(exam.id)
                  ? 'bg-[var(--primary-600)] text-white border-[var(--primary-600)]'
                  : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:border-[var(--accent-border)]'
              }`}
              title={exam.name}
            >
              {exam.name.length > 28 ? exam.name.slice(0, 28) + '…' : exam.name}
            </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="p-8 text-center text-[var(--text-muted)] text-sm m-0">Đang tải...</p>
        ) : rooms.length === 0 ? (
          <p className="p-8 text-center text-[var(--text-muted)] text-sm m-0">
            {total === 0 && !debouncedSearch && filterExam === 'ALL' ? 'Chưa có phòng thi nào.' : 'Không tìm thấy kết quả phù hợp.'}
          </p>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--accent-bg)] border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Phòng thi</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Kỳ thi</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Bắt đầu</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Kết thúc</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Giám thị</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Link thi</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Cần duyệt</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--text-h)]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => {
                  const exam = examMap[room.exam_id];
                  const proctor = userMap[room.proctor_id];
                  return (
                    <tr
                      key={room.id}
                      className="border-b border-[var(--border-light)] hover:bg-[var(--accent-bg)]/40 transition"
                    >
                      <td className="px-4 py-3 text-[var(--text-muted)]">{room.id}</td>
                      <td className="px-4 py-3 font-medium text-[var(--text-h)]">
                        <Link to={`/rooms/${room.id}`} className="text-[var(--primary-600)] hover:text-[var(--primary-800)] hover:underline">
                          {room.room_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        {exam ? (
                          <div>
                            <span className="text-[var(--text-h)] line-clamp-1 text-xs leading-tight">
                              {exam.name}
                            </span>
                            <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_BADGE[exam.status]}`}>
                              {STATUS_LABEL[exam.status]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)]">#{room.exam_id}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap text-xs">
                        {fmtDatetime(room.start_time)}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap text-xs">
                        {fmtDatetime(room.end_time)}
                      </td>
                      <td className="px-4 py-3">
                        {proctor ? (
                          <span className="text-[var(--text-h)]">{proctor.full_name}</span>
                        ) : (
                          <span className="text-[var(--text-muted)] italic text-xs">Chưa phân công</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[120px]">
                        {room.exam_url ? (
                          <a
                            href={room.exam_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--primary-600)] hover:text-[var(--primary-800)] text-xs underline truncate block"
                          >
                            {room.exam_url.replace(/^https?:\/\//, '')}
                          </a>
                        ) : (
                          <span className="text-[var(--text-muted)] text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {room.needs_review > 0 ? (
                          <Link
                            to={`/rooms/${room.id}?tab=attendance&status=NEEDS_REVIEW`}
                            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-bg)] text-[var(--primary-700)] hover:bg-[var(--accent-border)]/30 no-underline"
                          >
                            {room.needs_review} lượt
                          </Link>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link
                          to={`/rooms/${room.id}`}
                          className="text-[var(--primary-600)] hover:text-[var(--primary-800)] font-medium mr-3 no-underline"
                        >
                          Xem
                        </Link>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDelete(room)}
                            className="text-red-500 hover:text-red-700 font-medium"
                          >
                            Xóa
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
            id="room-modal"
            className="card w-full max-w-lg p-6 shadow-[var(--shadow-lg)] max-h-[90vh] overflow-y-auto overflow-x-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--text-h)] m-0 mb-5">
              Thêm phòng thi mới
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">
                  Kỳ thi <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.exam_id}
                  onChange={(e) => setForm({ ...form, exam_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-sm"
                  required
                  disabled={saving}
                >
                  <option value="">-- Chọn kỳ thi --</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>{exam.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">
                  Tên phòng thi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.room_name}
                  onChange={(e) => setForm({ ...form, room_name: e.target.value })}
                  className="input-field w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]"
                  placeholder="VD: Phòng A101"
                  required
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">
                    Bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <DateTimeField
                    value={form.start_time}
                    onChange={(date) => setForm((prev) => ({ ...prev, start_time: date }))}
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">
                    Kết thúc <span className="text-red-500">*</span>
                  </label>
                  <DateTimeField
                    value={form.end_time}
                    onChange={(date) => setForm((prev) => ({ ...prev, end_time: date }))}
                    minDate={form.start_time ?? undefined}
                    disabled={saving}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">
                  Giám thị phụ trách
                </label>
                <select
                  value={form.proctor_id}
                  onChange={(e) => setForm({ ...form, proctor_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-sm"
                  disabled={saving}
                >
                  <option value="">-- Chưa phân công --</option>
                  {proctors.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">
                  Link phòng thi (URL)
                </label>
                <input
                  type="url"
                  value={form.exam_url}
                  onChange={(e) => setForm({ ...form, exam_url: e.target.value })}
                  className="input-field w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]"
                  placeholder="https://meet.google.com/..."
                  disabled={saving}
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button type="button" onClick={closeModal} className="btn-ghost px-4 py-2 text-sm" disabled={saving}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary-soft px-4 py-2 text-sm" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
