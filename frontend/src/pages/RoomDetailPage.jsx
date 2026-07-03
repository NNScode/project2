import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getRoom, getExams, getUsers, deleteRoom } from '../api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import RoomInfoTab from '../components/room/RoomInfoTab';
import RoomStudentsTab from '../components/room/RoomStudentsTab';
import RoomAttendanceTab from '../components/room/RoomAttendanceTab';

const TABS = [
  { id: 'info', label: 'Thông tin' },
  { id: 'students', label: 'Thí sinh', adminOnly: true },
  { id: 'attendance', label: 'Điểm danh' },
];

export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [room, setRoom] = useState(null);
  const [exams, setExams] = useState([]);
  const [proctors, setProctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const activeTab = searchParams.get('tab') || 'info';

  const setTab = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const loadRoom = async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const [roomRes, eRes, uRes] = await Promise.all([
        getRoom(id),
        getExams({ page_size: 100 }),
        getUsers({ page_size: 100 }),
      ]);
      setRoom(roomRes.data);
      setExams(eRes.data.items);
      setProctors(uRes.data.items.filter((u) => u.role === 'PROCTOR' || u.role === 'ADMIN'));
    } catch (e) {
      if (e.response?.status === 403) {
        setForbidden(true);
      } else if (e.response?.status === 404) {
        setRoom(null);
      } else {
        toast.error(e.response?.data?.detail || 'Không tải được phòng thi');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoom(); }, [id]);

  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  useEffect(() => {
    if (!loading && room && !visibleTabs.some((t) => t.id === activeTab)) {
      setTab(visibleTabs[0]?.id || 'info');
    }
  }, [loading, room, activeTab, isAdmin]);

  const handleDelete = () => {
    setConfirm({
      title: 'Xóa phòng thi',
      message: `Xóa phòng "${room.room_name}"? Hành động này không thể hoàn tác.`,
      confirmLabel: 'Xóa phòng',
      onConfirm: async () => {
        try {
          await deleteRoom(room.id);
          toast.success('Đã xóa phòng thi');
          navigate('/rooms');
        } catch (err) {
          const detail = err.response?.data?.detail;
          toast.error(typeof detail === 'string' ? detail : 'Không xóa được');
        }
      },
    });
  };

  if (forbidden) return <Navigate to="/forbidden" replace />;
  if (loading) {
    return <p className="text-center text-[var(--text-muted)] text-sm py-12">Đang tải...</p>;
  }
  if (!room) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-muted)] mb-4">Không tìm thấy phòng thi.</p>
        <Link to="/rooms" className="text-[var(--primary-600)] hover:underline">← Quay lại danh sách</Link>
      </div>
    );
  }

  const exam = exams.find((e) => e.id === room.exam_id);
  const proctor = proctors.find((u) => u.id === room.proctor_id);

  return (
    <div className="text-left w-full">
      <div className="mb-6">
        <Link to="/rooms" className="text-sm text-[var(--primary-600)] hover:underline no-underline">
          ← Quay lại danh sách phòng
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mt-3">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-h)] m-0">{room.room_name}</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1 m-0">
              {exam?.name || `Kỳ thi #${room.exam_id}`}
              {proctor ? ` · Giám thị: ${proctor.full_name}` : ''}
            </p>
          </div>
          {isAdmin && (
            <button type="button" onClick={handleDelete} className="text-red-500 hover:text-red-700 text-sm font-medium shrink-0">
              Xóa phòng
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-[var(--border)]">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[var(--primary-600)] text-[var(--primary-700)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-h)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <RoomInfoTab
          room={room}
          exam={exam}
          proctor={proctor}
          exams={exams}
          proctors={proctors}
          readOnly={!isAdmin}
          onSaved={(updated) => setRoom(updated)}
        />
      )}
      {activeTab === 'students' && isAdmin && (
        <RoomStudentsTab roomId={room.id} roomName={room.room_name} />
      )}
      {activeTab === 'attendance' && (
        <RoomAttendanceTab
          roomId={room.id}
          initialStatus={searchParams.get('status') || 'ALL'}
        />
      )}

      <ConfirmModal state={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}
