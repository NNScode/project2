import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getUsers, createUser, updateUser, deleteUser } from '../api';
import ConfirmModal from '../components/ConfirmModal';

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
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Không tải được danh sách');
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
        toast.success('Cập nhật người dùng thành công');
      } else {
        if (!form.password.trim()) {
          toast.error('Vui lòng nhập mật khẩu');
          setSaving(false);
          return;
        }
        await createUser({
          user_name: form.user_name.trim(),
          full_name: form.full_name.trim(),
          role: form.role,
          password: form.password,
        });
        toast.success('Thêm người dùng thành công');
      }
      closeModal();
      loadUsers();
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (user) => {
    setConfirm({
      title: 'Xóa người dùng',
      message: `Bạn có chắc muốn xóa "${user.full_name}" (${user.user_name})?`,
      confirmLabel: 'Xóa',
      onConfirm: async () => {
        try {
          await deleteUser(user.id);
          toast.success('Đã xóa người dùng');
          loadUsers();
        } catch (err) {
          const detail = err.response?.data?.detail;
          toast.error(typeof detail === 'string' ? detail : 'Không xóa được');
        }
      },
    });
  };

  const roleLabel = (role) => ROLES.find((r) => r.value === role)?.label || role;

  const displayed = users.filter((u) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q
      || u.user_name.toLowerCase().includes(q)
      || u.full_name.toLowerCase().includes(q);
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    return matchSearch && matchRole;
  });

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

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên hoặc tài khoản..."
            className="input-field w-full pl-9 pr-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-sm"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          {[{ v: 'ALL', l: 'Tất cả' }, ...ROLES.map((r) => ({ v: r.value, l: r.label }))].map(({ v, l }) => (
            <button key={v} type="button" onClick={() => setFilterRole(v)}
              className={`px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium border transition-all ${
                filterRole === v
                  ? 'bg-[var(--primary-600)] text-white border-[var(--primary-600)]'
                  : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:border-[var(--accent-border)] hover:text-[var(--primary-700)]'
              }`}
            >{l}</button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="p-8 text-center text-[var(--text-muted)] text-sm m-0">Đang tải...</p>
        ) : displayed.length === 0 ? (
          <p className="p-8 text-center text-[var(--text-muted)] text-sm m-0">
            {users.length === 0 ? 'Chưa có người dùng.' : 'Không tìm thấy kết quả phù hợp.'}
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
                {displayed.map((u) => (
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

      <ConfirmModal state={confirm} onClose={() => setConfirm(null)} />
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
