import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { fetchAllPages, getStudents, getRoomStudents, createRoomStudentsBulk } from '../../api';

export default function AssignStudentsModal({
  open,
  onClose,
  onSuccess,
  roomId: fixedRoomId,
  roomName,
  rooms,
}) {
  const [students, setStudents] = useState([]);
  const [assignedIds, setAssignedIds] = useState(new Set());
  const [roomId, setRoomId] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [pickerSearch, setPickerSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const effectiveRoomId = fixedRoomId ?? (roomId ? Number(roomId) : null);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setPickerSearch('');
    setRoomId('');
    setLoading(true);
    fetchAllPages(getStudents)
      .then(setStudents)
      .catch(() => {
        setStudents([]);
        toast.error('Không tải được danh sách thí sinh');
      })
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open || !effectiveRoomId) {
      setAssignedIds(new Set());
      return;
    }
    fetchAllPages(getRoomStudents, { room_id: effectiveRoomId })
      .then((items) => setAssignedIds(new Set(items.map((a) => a.student_id))))
      .catch(() => setAssignedIds(new Set()));
  }, [open, effectiveRoomId]);

  const availableStudents = useMemo(
    () => students.filter((s) => !assignedIds.has(s.id)),
    [students, assignedIds],
  );

  const filteredStudents = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return availableStudents;
    return availableStudents.filter(
      (s) => s.full_name?.toLowerCase().includes(q) || s.student_number?.toLowerCase().includes(q),
    );
  }, [availableStudents, pickerSearch]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      filteredStudents.forEach((s) => next.add(s.id));
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!effectiveRoomId) {
      toast.error('Vui lòng chọn phòng thi');
      return;
    }
    if (selected.size === 0) {
      toast.error('Vui lòng chọn ít nhất một thí sinh');
      return;
    }
    setSaving(true);
    try {
      const res = await createRoomStudentsBulk({
        room_id: effectiveRoomId,
        student_ids: [...selected],
      });
      const { created, skipped } = res.data;
      if (created > 0) {
        toast.success(`Đã gán ${created} thí sinh${skipped > 0 ? ` (${skipped} đã có sẵn)` : ''}`);
      } else {
        toast.info('Các thí sinh đã được gán vào phòng trước đó');
      }
      onClose();
      onSuccess?.();
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const title = fixedRoomId
    ? `Gán thí sinh vào ${roomName || 'phòng'}`
    : 'Gán thí sinh vào phòng';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={onClose} role="presentation">
      <div className="card w-full max-w-lg p-6 shadow-[var(--shadow-lg)] max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-[var(--text-h)] m-0 mb-4 shrink-0">{title}</h3>
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 space-y-4">
          {!fixedRoomId && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Phòng thi</label>
              <select
                value={roomId}
                onChange={(e) => { setRoomId(e.target.value); setSelected(new Set()); }}
                className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-sm"
                required
                disabled={saving}
              >
                <option value="">-- Chọn phòng --</option>
                {rooms?.map((r) => (
                  <option key={r.id} value={r.id}>{r.room_name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="min-h-0 flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="text-sm font-medium text-[var(--text-h)]">
                Thí sinh {selected.size > 0 && <span className="text-[var(--text-muted)] font-normal">({selected.size} đã chọn)</span>}
              </label>
              {filteredStudents.length > 0 && effectiveRoomId && (
                <div className="flex gap-2 text-xs">
                  <button type="button" onClick={selectAllFiltered} className="text-[var(--primary-600)] hover:underline" disabled={saving}>
                    Chọn tất cả
                  </button>
                  <button type="button" onClick={clearSelection} className="text-[var(--text-muted)] hover:underline" disabled={saving || selected.size === 0}>
                    Bỏ chọn
                  </button>
                </div>
              )}
            </div>
            <input
              type="text"
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              placeholder="Tìm tên, mã SV..."
              className="input-field w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-sm mb-2"
              disabled={saving || !effectiveRoomId}
            />
            <div className="border border-[var(--border)] rounded-[var(--radius-sm)] overflow-y-auto max-h-56 bg-[var(--surface)]">
              {!effectiveRoomId ? (
                <p className="p-4 text-sm text-[var(--text-muted)] text-center m-0">Chọn phòng thi trước</p>
              ) : loading ? (
                <p className="p-4 text-sm text-[var(--text-muted)] text-center m-0">Đang tải...</p>
              ) : filteredStudents.length === 0 ? (
                <p className="p-4 text-sm text-[var(--text-muted)] text-center m-0">
                  {students.length === 0
                    ? 'Chưa có thí sinh trong hệ thống.'
                    : availableStudents.length === 0
                      ? 'Không còn thí sinh để gán.'
                      : 'Không tìm thấy kết quả.'}
                </p>
              ) : (
                <ul className="divide-y divide-[var(--border-light)] m-0 p-0 list-none">
                  {filteredStudents.map((s) => (
                    <li key={s.id}>
                      <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[var(--accent-bg)]/50 text-sm">
                        <input
                          type="checkbox"
                          checked={selected.has(s.id)}
                          onChange={() => toggle(s.id)}
                          disabled={saving}
                          className="rounded border-[var(--border)] text-[var(--primary-600)] shrink-0"
                        />
                        <span className="font-medium text-[var(--text-h)]">{s.full_name}</span>
                        <span className="text-[var(--text-muted)] text-xs ml-auto">{s.student_number}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2 justify-end shrink-0">
            <button type="button" onClick={onClose} className="btn-ghost px-4 py-2 text-sm" disabled={saving}>Hủy</button>
            <button type="submit" className="btn-primary-soft px-4 py-2 text-sm" disabled={saving || !effectiveRoomId}>
              {saving ? 'Đang lưu...' : `Gán phòng${selected.size > 0 ? ` (${selected.size})` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
