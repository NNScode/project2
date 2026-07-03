import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getRoomStudents, deleteRoomStudent } from '../../api';
import ConfirmModal from '../ConfirmModal';
import Pagination from '../Pagination';
import AssignStudentsModal from './AssignStudentsModal';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

export default function RoomStudentsTab({ roomId, roomName }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const rsRes = await getRoomStudents({
        page,
        page_size: pageSize,
        search: debouncedSearch || undefined,
        room_id: roomId,
      });
      setAssignments(rsRes.data.items);
      setTotal(rsRes.data.total);
      setTotalPages(rsRes.data.total_pages);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [debouncedSearch, roomId]);
  useEffect(() => { loadAssignments(); }, [page, pageSize, debouncedSearch, roomId]);

  const handleDelete = (a) => {
    setConfirm({
      title: 'Xóa gán phòng',
      message: `Gỡ "${a.full_name}" khỏi phòng "${roomName}"?`,
      confirmLabel: 'Xóa',
      onConfirm: async () => {
        try {
          await deleteRoomStudent(a.id);
          toast.success('Đã xóa gán phòng');
          loadAssignments();
        } catch (err) {
          const detail = err.response?.data?.detail;
          toast.error(typeof detail === 'string' ? detail : 'Không xóa được');
        }
      },
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <p className="text-sm text-[var(--text-muted)] m-0">
          Thí sinh được phân vào phòng này ({total})
        </p>
        <button type="button" onClick={() => setModalOpen(true)}
          className="btn-primary-soft px-4 py-2 text-sm font-medium shrink-0">
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
          placeholder="Tìm tên, mã SV..."
          className="input-field w-full pl-9 pr-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-sm"
        />
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="p-8 text-center text-[var(--text-muted)] text-sm m-0">Đang tải...</p>
        ) : assignments.length === 0 ? (
          <p className="p-8 text-center text-[var(--text-muted)] text-sm m-0">
            {total === 0 && !debouncedSearch ? 'Chưa có thí sinh nào trong phòng.' : 'Không tìm thấy kết quả phù hợp.'}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--accent-bg)] border-b border-[var(--border)]">
                    <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Thí sinh</th>
                    <th className="text-left px-4 py-3 font-medium text-[var(--text-h)]">Mã SV</th>
                    <th className="text-right px-4 py-3 font-medium text-[var(--text-h)]">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.id} className="border-b border-[var(--border-light)] hover:bg-[var(--accent-bg)]/40 transition">
                      <td className="px-4 py-3 font-medium text-[var(--text-h)]">{a.full_name || '—'}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{a.student_number || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => handleDelete(a)} className="text-red-500 hover:text-red-700 font-medium">Gỡ</button>
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
      <AssignStudentsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadAssignments}
        roomId={roomId}
        roomName={roomName}
      />
    </div>
  );
}
