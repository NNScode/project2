import { useEffect, useState } from 'react';
import { getDashboard, getHealth } from '../api';

const LABELS = {
  total_users: 'Người dùng',
  total_students: 'Thí sinh',
  total_exams: 'Kỳ thi',
  total_rooms: 'Phòng thi',
  total_room_students: 'Gán phòng',
  total_attendance_records: 'Lượt điểm danh',
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const [h, d] = await Promise.all([getHealth(), getDashboard()]);
      setHealth(h.data);
      setSummary(d.data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Không kết nối được API');
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="text-left w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-h)] m-0">Tổng quan</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1 m-0">Số liệu hệ thống FacePass</p>
        </div>
        <button type="button" onClick={load} className="btn-primary-soft px-4 py-2 text-sm font-medium">
          Làm mới
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-[var(--radius-sm)] bg-red-50 border border-red-100 text-red-600 text-sm">
          {error}
        </div>
      )}

      {health && (
        <div className="mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-sm text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          API đang hoạt động
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Object.entries(summary).map(([key, value]) => (
            <div key={key} className="card p-5 transition-all duration-200">
              <div className="text-2xl font-semibold text-[var(--primary-700)]">{value}</div>
              <div className="text-sm text-[var(--text-muted)] mt-1">{LABELS[key] || key}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
