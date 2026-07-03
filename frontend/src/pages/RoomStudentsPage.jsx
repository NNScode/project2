import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getRoomStudents, createRoomStudent, deleteRoomStudent, getRooms, getStudents } from '../api';
import ConfirmModal from '../components/ConfirmModal';

const emptyForm = { room_id: '', student_id: '' };

export default function RoomStudentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [filterRoom, setFilterRoom] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [rsRes, rRes, sRes] = await Promise.all([getRoomStudents(), getRooms(), getStudents()]);
      setAssignments(rsRes.data);
      setRooms(rRes.data);
      setStudents(sRes.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const assignedPairs = new Set(assignments.map((a) => `${a.student_id}-${a.room_id}`));

  const availableStudents = students.filter((s) => {
    if (!form.room_id) return true;
    return !assignedPairs.has(`${s.id}-${form.room_id}`);
  });

  const openCreate = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.room_id || !form.student_id) {
      toast.error('Vui lòng chọn phòng và thí sinh');
      return;
    }
    setSaving(true);
    try {
      await createRoomStudent({
        room_id: Number(form.room_id),
        student_id: Number(form.student_id),
      });
      toast.success('Gán thí sinh vào phòng thành công');
      closeModal();
      loadAll();
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (a) => {
    setConfirm({
      title: 'Xóa gán phòng',
      message: `Gỡ "${a.full_name}" khỏi phòng "${a.room_name}"?`,
      confirmLabel: 'Xóa',
      onConfirm: async () => {
        try {
          await deleteRoomStudent(a.id);
          toast.success('Đã xóa gán phòng');
          loadAll();
        } catch (err) {
          const detail = err.response?.data?.detail;
          toast.error(typeof detail === 'string' ? detail : 'Không xóa được');
        }
      },
    });
  };

  const displayed = assignments.filter((a) => {
    const q = search.trim().toLowerCase();
    const matchRoom = filterRoom === 'ALL' || String(a.room_id) === filterRoom;
    const matchSearch = !q
      || (a.full_name || '').toLowerCase().includes(q)
      || (a.student_number || '').toLowerCase().includes(q)
      || (a.room_name || '').toLowerCase().includes(q);
    return matchRoom && matchSearch;
  });

  return (
    <div className="text-left w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-h)] m-0">Gán thí sinh vào phòng</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1 m-0">
            Phân bổ thí sinh theo phòng thi
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary-soft px-4 py-2 text-sm font-medium shrink-0">
          + Gán thí sinh
        </button>
      </div>

      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm tên, mã SV, phòng..."
          className="input-field w-full pl-9 pr-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-sm"
        />
      </div>

      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <span className="text-xs text-[var(--text-muted)] font-medium">Lọc phòng:</span>
        <button type="button" onClick={() => setFilterRoom('ALL')}
          className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border transition-all ${
            filterRoom === 'ALL' ? 'bg-[var(--primary-600)] text-white border-[var(--primary-600)]'
              : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:border-[var(--accent-border)]'
          }`}
        >Tất cả ({assignments.length})</button>
        {rooms.map((room) => {
          const count = assignments.filter((a) => a.room_id === room.id).length;
          return (
            <button key={room.id} type="button" onClick={() => setFilterRoom(String(room.id))}
              className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border transition-all max-w-[180px] truncate ${
                filterRoom === String(room.id) ? 'bg-[var(--primary-600)] text-white border-[var(--primary-600)]'
                  : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:border-[var(--accent-border)]'
              }`}
              title={room.room_name}
            >{room.room_name} ({count})</button>
          );
        })}
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="p-8 text-center text-[var(--text-muted)] text-sm m-0">Đang tải...</p>
        ) : displayed.length === 0 ? (
          <p className="p-8 text-center text-[var(--text-muted)] text-sm m-0">
            {assignments.length === 0 ? 'Chưa có gán phòng nào.' : 'Không tìm thấy kết quả phù hợp.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--accent-bg)] border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Thí sinh</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Mã SV</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Phòng thi</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Kỳ thi</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--text-h)]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((a) => (
                  <tr key={a.id} className="border-b border-[var(--border-light)] hover:bg-[var(--accent-bg)]/40 transition">
                    <td className="px-4 py-3 text-[var(--text-muted)]">{a.id}</td>
                    <td className="px-4 py-3 font-medium text-[var(--text-h)]">{a.full_name || '—'}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{a.student_number || '—'}</td>
                    <td className="px-4 py-3 text-[var(--text-h)]">{a.room_name || '—'}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{a.exam_name || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => handleDelete(a)} className="text-red-500 hover:text-red-700 font-medium">Xóa</button>
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
          <div className="card w-full max-w-md p-6 shadow-[var(--shadow-lg)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[var(--text-h)] m-0 mb-4">Gán thí sinh vào phòng</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Phòng thi</label>
                <select value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value, student_id: '' })}
                  className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]" required disabled={saving}>
                  <option value="">-- Chọn phòng --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.room_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Thí sinh</label>
                <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]" required disabled={saving || !form.room_id}>
                  <option value="">-- Chọn thí sinh --</option>
                  {availableStudents.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.student_number})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2 justify-end">
                <button type="button" onClick={closeModal} className="btn-ghost px-4 py-2 text-sm" disabled={saving}>Hủy</button>
                <button type="submit" className="btn-primary-soft px-4 py-2 text-sm" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Gán phòng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
