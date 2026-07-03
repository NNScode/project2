import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getAttendanceRecords, updateAttendanceRecord, deleteAttendanceRecord, getRooms } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'SUCCESS', label: 'Thành công' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'NEEDS_REVIEW', label: 'Cần duyệt' },
];

const STATUS_BADGE = {
  PENDING: 'bg-amber-50 text-amber-800',
  SUCCESS: 'bg-emerald-50 text-emerald-700',
  FAILED: 'bg-red-50 text-red-700',
  NEEDS_REVIEW: 'bg-violet-50 text-violet-700',
};

const STATUS_LABEL = {
  PENDING: 'Chờ xử lý',
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
  NEEDS_REVIEW: 'Cần duyệt',
};

function fmtDatetime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const emptyForm = { status: 'PENDING', proctor_note: '' };

export default function AttendancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [records, setRecords] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [viewingRec, setViewingRec] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterRoom, setFilterRoom] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [aRes, rRes] = await Promise.all([getAttendanceRecords(), getRooms()]);
      setRecords(aRes.data);
      setRooms(rRes.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const openEdit = (rec) => {
    setViewingRec(rec);
    setEditingId(rec.id);
    setForm({ status: rec.status, proctor_note: rec.proctor_note || '' });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setViewingRec(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAttendanceRecord(editingId, {
        status: form.status,
        proctor_note: form.proctor_note.trim() || null,
      });
      toast.success('Cập nhật bản ghi điểm danh thành công');
      closeModal();
      loadAll();
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (rec) => {
    setConfirm({
      title: 'Xóa bản ghi điểm danh',
      message: `Xóa bản ghi của "${rec.full_name}" tại phòng "${rec.room_name}"?`,
      confirmLabel: 'Xóa',
      onConfirm: async () => {
        try {
          await deleteAttendanceRecord(rec.id);
          toast.success('Đã xóa bản ghi');
          loadAll();
        } catch (err) {
          const detail = err.response?.data?.detail;
          toast.error(typeof detail === 'string' ? detail : 'Không xóa được');
        }
      },
    });
  };

  const displayed = records.filter((r) => {
    const q = search.trim().toLowerCase();
    const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const matchRoom = filterRoom === 'ALL' || String(r.room_id) === filterRoom;
    const matchSearch = !q
      || (r.full_name || '').toLowerCase().includes(q)
      || (r.student_number || '').toLowerCase().includes(q)
      || (r.room_name || '').toLowerCase().includes(q);
    return matchStatus && matchRoom && matchSearch;
  });

  return (
    <div className="text-left w-full">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--text-h)] m-0">Duyệt điểm danh</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1 m-0">
          Xem và xử lý bản ghi điểm danh khuôn mặt
        </p>
      </div>

      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm tên, mã SV, phòng..."
          className="input-field w-full pl-9 pr-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-sm" />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button key={value} type="button" onClick={() => setFilterStatus(value)}
            className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border transition-all ${
              filterStatus === value ? 'bg-[var(--primary-600)] text-white border-[var(--primary-600)]'
                : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:border-[var(--accent-border)]'
            }`}
          >{label}</button>
        ))}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <span className="text-xs text-[var(--text-muted)] font-medium">Phòng:</span>
        <button type="button" onClick={() => setFilterRoom('ALL')}
          className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border transition-all ${
            filterRoom === 'ALL' ? 'bg-[var(--primary-600)] text-white border-[var(--primary-600)]'
              : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)]'
          }`}
        >Tất cả</button>
        {rooms.map((room) => (
          <button key={room.id} type="button" onClick={() => setFilterRoom(String(room.id))}
            className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border transition-all ${
              filterRoom === String(room.id) ? 'bg-[var(--primary-600)] text-white border-[var(--primary-600)]'
                : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)]'
            }`}
          >{room.room_name}</button>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="p-8 text-center text-[var(--text-muted)] text-sm m-0">Đang tải...</p>
        ) : displayed.length === 0 ? (
          <p className="p-8 text-center text-[var(--text-muted)] text-sm m-0">Không có bản ghi phù hợp.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--accent-bg)] border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Thí sinh</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Phòng</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Trạng thái</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Giờ check-in</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Điểm</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Ghi chú</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--text-h)]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--border-light)] hover:bg-[var(--accent-bg)]/40 transition">
                    <td className="px-4 py-3 text-[var(--text-muted)]">{r.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text-h)]">{r.full_name || '—'}</div>
                      <div className="text-xs text-[var(--text-muted)]">{r.student_number || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-h)]">{r.room_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status] || ''}`}>
                        {STATUS_LABEL[r.status] || r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)] whitespace-nowrap">{fmtDatetime(r.check_in_time)}</td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                      {r.liveness_score != null || r.match_score != null
                        ? `${r.liveness_score ?? '—'} / ${r.match_score ?? '—'}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)] max-w-[120px] truncate" title={r.proctor_note || ''}>
                      {r.proctor_note || '—'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button type="button" onClick={() => openEdit(r)} className="text-[var(--primary-600)] hover:text-[var(--primary-800)] font-medium mr-3">Duyệt</button>
                      {isAdmin && (
                        <button type="button" onClick={() => handleDelete(r)} className="text-red-500 hover:text-red-700 font-medium">Xóa</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal state={confirm} onClose={() => setConfirm(null)} />
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={closeModal} role="presentation">
          <div className="card w-full max-w-lg p-6 shadow-[var(--shadow-lg)] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[var(--text-h)] m-0 mb-4">Duyệt điểm danh</h3>
            {viewingRec && (
              <div className="mb-4 p-3 rounded-[var(--radius-sm)] bg-[var(--accent-bg)] text-xs space-y-1">
                <p className="m-0"><strong>{viewingRec.full_name}</strong> · {viewingRec.room_name}</p>
                <p className="m-0 text-[var(--text-muted)]">
                  Liveness: {viewingRec.liveness_score ?? '—'} · Khớp mặt: {viewingRec.match_score ?? '—'}
                </p>
                {viewingRec.captured_image_url && (
                  <img
                    src={viewingRec.captured_image_url}
                    alt="Ảnh điểm danh"
                    className="mt-2 max-h-48 rounded border border-[var(--border)] object-contain w-full"
                  />
                )}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Trạng thái</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]" disabled={saving}>
                  {STATUS_OPTIONS.filter((s) => s.value !== 'ALL').map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Ghi chú giám thị</label>
                <textarea value={form.proctor_note} onChange={(e) => setForm({ ...form, proctor_note: e.target.value })}
                  rows={3} className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-sm resize-none"
                  disabled={saving} placeholder="Ghi chú (nếu có)..." />
              </div>
              <div className="flex gap-2 pt-2 justify-end">
                <button type="button" onClick={closeModal} className="btn-ghost px-4 py-2 text-sm" disabled={saving}>Hủy</button>
                <button type="submit" className="btn-primary-soft px-4 py-2 text-sm" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
