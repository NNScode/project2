import { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../api';

const ROLES = [
  { value: 'ADMIN', label: 'Quản trị' },
  { value: 'PROCTOR', label: 'Cán bộ coi thi' },
  { value: 'STUDENTS', label: 'Thí sinh' },
];

const ROLE_BADGE = {
  ADMIN: 'bg-[var(--primary-100)] text-[var(--primary-800)]',
  PROCTOR: 'bg-amber-50 text-amber-800',
  STUDENTS: 'bg-slate-100 text-slate-700',
};

const emptyForm = {
  user_name: '',
  full_name: '',
  role: 'STUDENTS',
  password: '',
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const showNotice = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice({ type: '', text: '' }), 4000);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (e) {
      showNotice('error', e.response?.data?.detail || 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingId(user.id);
    setForm({
      user_name: user.user_name,
      full_name: user.full_name,
      role: user.role,
      password: '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const payload = {
          user_name: form.user_name.trim(),
          full_name: form.full_name.trim(),
          role: form.role,
        };
        if (form.password.trim()) payload.password = form.password;
        await updateUser(editingId, payload);
        showNotice('success', 'Cập nhật người dùng thành công');
      } else {
        if (!form.password.trim()) {
          showNotice('error', 'Vui lòng nhập mật khẩu');
          setSaving(false);
          return;
        }
        await createUser({
          user_name: form.user_name.trim(),
          full_name: form.full_name.trim(),
          role: form.role,
          password: form.password,
        });
        showNotice('success', 'Thêm người dùng thành công');
      }
      closeModal();
      loadUsers();
    } catch (err) {
      const detail = err.response?.data?.detail;
      showNotice('error', typeof detail === 'string' ? detail : 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Xóa người dùng "${user.full_name}" (${user.user_name})?`)) return;
    try {
      await deleteUser(user.id);
      showNotice('success', 'Đã xóa người dùng');
      loadUsers();
    } catch (err) {
      const detail = err.response?.data?.detail;
      showNotice('error', typeof detail === 'string' ? detail : 'Không xóa được');
    }
  };

  const roleLabel = (role) => ROLES.find((r) => r.value === role)?.label || role;

  return (
    <div className="text-left w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-h)] m-0">Quản lý người dùng</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1 m-0">
            Thêm, sửa, xóa tài khoản hệ thống
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary-soft px-4 py-2 text-sm font-medium shrink-0">
          + Thêm người dùng
        </button>
      </div>

      {notice.text && (
        <div
          className={`mb-4 px-4 py-3 rounded-[var(--radius-sm)] text-sm border ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="p-8 text-center text-[var(--text-muted)] text-sm m-0">Đang tải...</p>
        ) : users.length === 0 ? (
          <p className="p-8 text-center text-[var(--text-muted)] text-sm m-0">
            Chưa có người dùng. Bấm &quot;Thêm người dùng&quot; để tạo mới.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--accent-bg)] border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Tên đăng nhập</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Họ và tên</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Vai trò</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--text-h)]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-[var(--border-light)] hover:bg-[var(--accent-bg)]/40 transition"
                  >
                    <td className="px-4 py-3 text-[var(--text-muted)]">{u.id}</td>
                    <td className="px-4 py-3 font-medium text-[var(--text-h)]">{u.user_name}</td>
                    <td className="px-4 py-3 text-[var(--text-h)]">{u.full_name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[u.role] || ''}`}
                      >
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="text-[var(--primary-600)] hover:text-[var(--primary-800)] font-medium mr-3"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
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
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="card w-full max-w-md p-6 shadow-[var(--shadow-lg)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--text-h)] m-0 mb-4">
              {editingId ? 'Sửa người dùng' : 'Thêm người dùng'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={form.user_name}
                  onChange={(e) => setForm({ ...form, user_name: e.target.value })}
                  className="input-field w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)]"
                  required
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="input-field w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)]"
                  required
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">
                  Vai trò
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]"
                  disabled={saving}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">
                  Mật khẩu {editingId && <span className="text-[var(--text-muted)] font-normal">(để trống nếu không đổi)</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)]"
                  required={!editingId}
                  disabled={saving}
                />
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
