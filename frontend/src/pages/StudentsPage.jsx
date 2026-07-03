import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getStudents, createStudent, updateStudent, deleteStudent, uploadStudentCccd, getUsers,
} from '../api';
import ConfirmModal from '../components/ConfirmModal';
import ImageDropzone from '../components/ImageDropzone';

const emptyForm = {
  user_id: '',
  student_number: '',
  cccd_number: '',
};

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [studentUsers, setStudentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sRes, uRes] = await Promise.all([getStudents(), getUsers()]);
      setStudents(sRes.data);
      const assignedUserIds = new Set(sRes.data.map((s) => s.user_id));
      setStudentUsers(
        uRes.data.filter((u) => u.role === 'STUDENTS' && !assignedUserIds.has(u.id)),
      );
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const resetImageState = () => {
    setImageFile(null);
    setImageError('');
    setExistingImageUrl('');
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    resetImageState();
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditingId(s.id);
    setForm({
      user_id: String(s.user_id),
      student_number: s.student_number,
      cccd_number: s.cccd_number,
    });
    resetImageState();
    setExistingImageUrl(s.cccd_image_url || '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    resetImageState();
  };

  const handleFileChange = (file, err) => {
    setImageFile(file);
    setImageError(err || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (imageError) {
      toast.error(imageError);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        student_number: form.student_number.trim(),
        cccd_number: form.cccd_number.trim(),
      };
      let studentId = editingId;

      if (editingId) {
        await updateStudent(editingId, payload);
      } else {
        if (!form.user_id) {
          toast.error('Vui lòng chọn tài khoản thí sinh');
          setSaving(false);
          return;
        }
        const res = await createStudent({ ...payload, user_id: Number(form.user_id) });
        studentId = res.data.id;
      }

      if (imageFile && studentId) {
        await uploadStudentCccd(studentId, imageFile);
        toast.success(
          editingId
            ? 'Cập nhật hồ sơ và trích xuất khuôn mặt thành công'
            : 'Thêm thí sinh và trích xuất khuôn mặt thành công',
        );
      } else if (editingId) {
        toast.success('Cập nhật hồ sơ thí sinh thành công');
      } else {
        toast.success('Thêm hồ sơ thí sinh thành công');
      }

      closeModal();
      loadAll();
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (s) => {
    setConfirm({
      title: 'Xóa hồ sơ thí sinh',
      message: `Xóa hồ sơ "${s.full_name}" (${s.student_number})?`,
      confirmLabel: 'Xóa',
      onConfirm: async () => {
        try {
          await deleteStudent(s.id);
          toast.success('Đã xóa hồ sơ thí sinh');
          loadAll();
        } catch (err) {
          const detail = err.response?.data?.detail;
          toast.error(typeof detail === 'string' ? detail : 'Không xóa được');
        }
      },
    });
  };

  const displayed = students.filter((s) => {
    const q = search.trim().toLowerCase();
    return !q
      || s.student_number.toLowerCase().includes(q)
      || s.cccd_number.toLowerCase().includes(q)
      || (s.full_name || '').toLowerCase().includes(q)
      || (s.user_name || '').toLowerCase().includes(q);
  });

  return (
    <div className="text-left w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-h)] m-0">Quản lý thí sinh</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1 m-0">
            Hồ sơ thí sinh · upload ảnh CCCD (face_recognition, xoay 4 hướng)
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary-soft px-4 py-2 text-sm font-medium shrink-0">
          + Thêm thí sinh
        </button>
      </div>

      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm mã SV, CCCD, tên..."
          className="input-field w-full pl-9 pr-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-sm"
        />
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="p-8 text-center text-[var(--text-muted)] text-sm m-0">Đang tải...</p>
        ) : displayed.length === 0 ? (
          <p className="p-8 text-center text-[var(--text-muted)] text-sm m-0">
            {students.length === 0 ? 'Chưa có hồ sơ thí sinh.' : 'Không tìm thấy kết quả phù hợp.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--accent-bg)] border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Ảnh</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Mã SV</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Họ và tên</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Số CCCD</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Face</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--text-h)]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--border-light)] hover:bg-[var(--accent-bg)]/40 transition">
                    <td className="px-4 py-3 text-[var(--text-muted)]">{s.id}</td>
                    <td className="px-4 py-3">
                      {s.cccd_image_url ? (
                        <img
                          src={s.cccd_image_url}
                          alt=""
                          className="w-10 h-10 rounded object-cover border border-[var(--border)]"
                        />
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--text-h)]">{s.student_number}</td>
                    <td className="px-4 py-3 text-[var(--text-h)]">{s.full_name || '—'}</td>
                    <td className="px-4 py-3 text-[var(--text-h)]">{s.cccd_number}</td>
                    <td className="px-4 py-3">
                      {s.has_face_vector ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          Đã lưu
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          Chưa có
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button type="button" onClick={() => openEdit(s)} className="text-[var(--primary-600)] hover:text-[var(--primary-800)] font-medium mr-3">Sửa</button>
                      <button type="button" onClick={() => handleDelete(s)} className="text-red-500 hover:text-red-700 font-medium">Xóa</button>
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
            <h3 className="text-lg font-semibold text-[var(--text-h)] m-0 mb-4">
              {editingId ? 'Sửa hồ sơ thí sinh' : 'Thêm hồ sơ thí sinh'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Tài khoản thí sinh</label>
                  <select
                    value={form.user_id}
                    onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]"
                    required
                    disabled={saving}
                  >
                    <option value="">-- Chọn tài khoản --</option>
                    {studentUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.user_name})</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Mã sinh viên</label>
                <input type="text" value={form.student_number} onChange={(e) => setForm({ ...form, student_number: e.target.value })}
                  className="input-field w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)]" required disabled={saving} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Số CCCD</label>
                <input type="text" value={form.cccd_number} onChange={(e) => setForm({ ...form, cccd_number: e.target.value })}
                  className="input-field w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)]" required disabled={saving} />
              </div>

              <ImageDropzone
                file={imageFile}
                onFileChange={handleFileChange}
                previewUrl={existingImageUrl}
                disabled={saving}
              />
              {imageError && <p className="text-xs text-red-500 m-0">{imageError}</p>}
              <p className="text-xs text-[var(--text-muted)] m-0">
                Upload ảnh CCCD: hệ thống xoay 4 hướng, cắt vùng chân dung, nhận diện mặt và lưu encoding (face_recognition).
              </p>

              <div className="flex gap-2 pt-2 justify-end">
                <button type="button" onClick={closeModal} className="btn-ghost px-4 py-2 text-sm" disabled={saving}>Hủy</button>
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
