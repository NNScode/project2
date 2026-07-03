import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api';

const STATUS_LABEL = {
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
  NEEDS_REVIEW: 'Cần duyệt',
  PENDING: 'Chờ xử lý',
};

function fmtDatetime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function isRoomActive(room) {
  const now = new Date();
  return new Date(room.start_time) <= now && now <= new Date(room.end_time);
}

function ReviewBanner({ count, message }) {
  if (!count || count <= 0) return null;
  return (
    <div className="p-4 rounded-[var(--radius)] bg-[var(--accent-bg)] border border-[var(--accent-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <p className="text-sm text-[var(--primary-700)] m-0">{message}</p>
      <Link
        to="/rooms"
        className="btn-primary-soft px-4 py-2 text-sm font-medium no-underline shrink-0 text-center"
      >
        Duyệt ngay
      </Link>
    </div>
  );
}

function StatCard({ value, label, to }) {
  const card = (
    <div className={`card p-5 h-full transition ${to ? 'hover:border-[var(--accent-border)] hover:shadow-[var(--shadow-md)]' : ''}`}>
      <div className="text-2xl font-semibold text-[var(--primary-700)]">{value ?? 0}</div>
      <div className="text-sm text-[var(--text-muted)] mt-1">{label}</div>
    </div>
  );
  if (to) {
    return <Link to={to} className="no-underline block h-full">{card}</Link>;
  }
  return card;
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] m-0 mb-3">
      {children}
    </h3>
  );
}

function AdminDashboard({ summary }) {
  return (
    <div className="space-y-6">
      <ReviewBanner
        count={summary.needs_review}
        message={<>Có <strong>{summary.needs_review}</strong> lượt điểm danh cần duyệt.</>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard value={summary.total_exams} label="Kỳ thi" to="/exams" />
        <StatCard value={summary.total_rooms} label="Phòng thi" to="/rooms" />
        <StatCard value={summary.total_users} label="Người dùng" to="/users" />
        <StatCard value={summary.total_students} label="Thí sinh" to="/students" />
      </div>
    </div>
  );
}

function ProctorDashboard({ summary }) {
  const activeRooms = summary.rooms?.filter((r) => r.is_active) ?? [];
  const upcomingRooms = summary.rooms?.filter((r) => !r.is_active && new Date(r.start_time) > new Date()) ?? [];

  return (
    <div className="space-y-6">
      <ReviewBanner
        count={summary.needs_review}
        message={<>Có <strong>{summary.needs_review}</strong> lượt điểm danh cần duyệt.</>}
      />

      {summary.rooms?.length === 0 ? (
        <div className="card p-6 text-sm text-[var(--text-muted)]">
          Bạn chưa được phân công phòng thi nào.
        </div>
      ) : (
        <section className="space-y-4">
          {activeRooms.length > 0 && (
            <div>
              <SectionTitle>Đang diễn ra</SectionTitle>
              <div className="space-y-3">
                {activeRooms.map((room) => (
                  <RoomCard key={room.room_id} room={room} showReview showView />
                ))}
              </div>
            </div>
          )}
          {upcomingRooms.length > 0 && (
            <div>
              <SectionTitle>Sắp diễn ra</SectionTitle>
              <div className="space-y-3">
                {upcomingRooms.map((room) => (
                  <RoomCard key={room.room_id} room={room} showReview />
                ))}
              </div>
            </div>
          )}
          {activeRooms.length === 0 && upcomingRooms.length === 0 && (
            <div>
              <SectionTitle>Phòng đã phân công</SectionTitle>
              <div className="space-y-3">
                {summary.rooms.map((room) => (
                  <RoomCard key={room.room_id} room={room} showReview />
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function RoomCard({ room, showReview, showView, children }) {
  return (
    <div className="card p-5">
      <div className="flex flex-wrap justify-between gap-2 mb-1">
        <h4 className="text-base font-semibold text-[var(--text-h)] m-0">{room.room_name}</h4>
        {room.is_active && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            Đang diễn ra
          </span>
        )}
      </div>
      <p className="text-sm text-[var(--text-muted)] m-0">{room.exam_name}</p>
      <p className="text-xs text-[var(--text-muted)] mt-1 m-0">
        {fmtDatetime(room.start_time)} → {fmtDatetime(room.end_time)}
      </p>
      {showReview && room.student_count != null && (
        <p className="text-xs text-[var(--text-muted)] mt-2 m-0">
          {room.student_count} thí sinh
          {room.needs_review > 0 && (
            <span className="text-[var(--primary-700)] font-medium"> · {room.needs_review} cần duyệt</span>
          )}
        </p>
      )}
      {(showView || children) && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {showView && (
            <Link
              to={`/rooms/${room.room_id}`}
              className="btn-primary-soft px-4 py-2 text-sm font-medium no-underline"
            >
              Xem
            </Link>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

function StudentDashboard({ summary }) {
  if (!summary.has_profile) {
    return (
      <div className="card p-6 text-sm text-[var(--text-muted)]">
        Chưa có hồ sơ thí sinh. Liên hệ quản trị viên.
      </div>
    );
  }

  const activeRooms = summary.rooms?.filter(isRoomActive) ?? [];

  if (activeRooms.length === 0) {
    return (
      <div className="card p-6 text-sm text-[var(--text-muted)]">
        Hiện không có phòng thi nào đang diễn ra.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeRooms.map((room) => (
        <RoomCard key={room.room_id} room={{ ...room, is_active: true }}>
          {room.attendance_status && (
            <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--accent-bg)] text-[var(--primary-700)]">
              {STATUS_LABEL[room.attendance_status] || room.attendance_status}
            </span>
          )}
          {room.can_check_in && summary.has_face_vector && (
            <Link
              to={`/liveness/${room.room_id}`}
              className="btn-primary-soft inline-block mt-3 px-4 py-2 text-sm font-medium no-underline"
            >
              Điểm danh
            </Link>
          )}
          {!summary.has_face_vector && (
            <p className="text-xs text-amber-700 mt-2 m-0">Chưa có ảnh CCCD — liên hệ quản trị.</p>
          )}
          {room.attendance_status === 'SUCCESS' && room.exam_url && (
            <a
              href={room.exam_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--primary-600)] mt-2 inline-block"
            >
              Vào phòng thi →
            </a>
          )}
        </RoomCard>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setError('');
      setLoading(true);
      try {
        const { data } = await getDashboard();
        setSummary(data);
      } catch (e) {
        setError(e.response?.data?.detail || e.message || 'Không tải được dữ liệu');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="text-left w-full">
      {error && (
        <div className="mb-4 p-3 rounded-[var(--radius-sm)] bg-red-50 border border-red-100 text-red-600 text-sm">
          {error}
        </div>
      )}

      {loading && !summary && (
        <p className="text-sm text-[var(--text-muted)] m-0">Đang tải...</p>
      )}

      {!loading && !error && summary?.role === 'ADMIN' && <AdminDashboard summary={summary} />}
      {!loading && !error && summary?.role === 'PROCTOR' && <ProctorDashboard summary={summary} />}
      {!loading && !error && summary?.role === 'STUDENTS' && <StudentDashboard summary={summary} />}
    </div>
  );
}
