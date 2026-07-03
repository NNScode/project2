import { useState } from 'react';
import { toast } from 'sonner';
import { updateRoom } from '../../api';
import DateTimeField from '../DateTimeField';

function toApiDatetime(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function fmtDatetime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function RoomInfoTab({ room, exam, proctor, exams, proctors, readOnly, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  const startEdit = () => {
    setForm({
      exam_id: String(room.exam_id),
      room_name: room.room_name,
      start_time: room.start_time ? new Date(room.start_time) : null,
      end_time: room.end_time ? new Date(room.end_time) : null,
      exam_url: room.exam_url || '',
      proctor_id: room.proctor_id ? String(room.proctor_id) : '',
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.start_time || !form.end_time) {
      toast.error('Vui lòng chọn thời gian');
      return;
    }
    if (form.start_time >= form.end_time) {
      toast.error('Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        exam_id: Number(form.exam_id),
        room_name: form.room_name.trim(),
        start_time: toApiDatetime(form.start_time),
        end_time: toApiDatetime(form.end_time),
        exam_url: form.exam_url.trim() || null,
        proctor_id: form.proctor_id ? Number(form.proctor_id) : null,
      };
      const res = await updateRoom(room.id, payload);
      toast.success('Cập nhật phòng thi thành công');
      setEditing(false);
      setForm(null);
      onSaved?.(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (editing && form) {
    return (
      <form onSubmit={handleSubmit} className="card p-6 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Kỳ thi</label>
          <select
            value={form.exam_id}
            onChange={(e) => setForm({ ...form, exam_id: e.target.value })}
            className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-sm"
            required
            disabled={saving}
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Tên phòng thi</label>
          <input
            type="text"
            value={form.room_name}
            onChange={(e) => setForm({ ...form, room_name: e.target.value })}
            className="input-field w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]"
            required
            disabled={saving}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Bắt đầu</label>
            <DateTimeField
              value={form.start_time}
              onChange={(date) => setForm((prev) => ({ ...prev, start_time: date }))}
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Kết thúc</label>
            <DateTimeField
              value={form.end_time}
              onChange={(date) => setForm((prev) => ({ ...prev, end_time: date }))}
              minDate={form.start_time ?? undefined}
              disabled={saving}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Giám thị phụ trách</label>
          <select
            value={form.proctor_id}
            onChange={(e) => setForm({ ...form, proctor_id: e.target.value })}
            className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-sm"
            disabled={saving}
          >
            <option value="">-- Chưa phân công --</option>
            {proctors.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}{u.role === 'ADMIN' ? ' (Quản trị)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Link phòng thi</label>
          <input
            type="url"
            value={form.exam_url}
            onChange={(e) => setForm({ ...form, exam_url: e.target.value })}
            className="input-field w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]"
            placeholder="https://..."
            disabled={saving}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn-primary-soft px-4 py-2 text-sm" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
          <button type="button" onClick={cancelEdit} className="btn-ghost px-4 py-2 text-sm" disabled={saving}>Hủy</button>
        </div>
      </form>
    );
  }

  return (
    <div className="card p-6 max-w-2xl">
      {!readOnly && (
        <div className="flex justify-end mb-4">
          <button type="button" onClick={startEdit} className="btn-primary-soft px-4 py-2 text-sm">Chỉnh sửa</button>
        </div>
      )}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm m-0">
        <div>
          <dt className="text-[var(--text-muted)] mb-1">Tên phòng</dt>
          <dd className="font-medium text-[var(--text-h)] m-0">{room.room_name}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)] mb-1">Kỳ thi</dt>
          <dd className="font-medium text-[var(--text-h)] m-0">{exam?.name || `#${room.exam_id}`}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)] mb-1">Bắt đầu</dt>
          <dd className="text-[var(--text-h)] m-0">{fmtDatetime(room.start_time)}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)] mb-1">Kết thúc</dt>
          <dd className="text-[var(--text-h)] m-0">{fmtDatetime(room.end_time)}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)] mb-1">Giám thị</dt>
          <dd className="text-[var(--text-h)] m-0">{proctor?.full_name || 'Chưa phân công'}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)] mb-1">Link thi</dt>
          <dd className="m-0">
            {room.exam_url ? (
              <a href={room.exam_url} target="_blank" rel="noreferrer" className="text-[var(--primary-600)] hover:underline break-all">
                {room.exam_url}
              </a>
            ) : '—'}
          </dd>
        </div>
      </dl>
    </div>
  );
}
