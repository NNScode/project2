import { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { toast } from 'sonner';
import { getMyExamContext, checkInAttendance } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_LABEL = {
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
  NEEDS_REVIEW: 'Cần duyệt',
  PENDING: 'Chờ xử lý',
};

function dataUrlToFile(dataUrl, filename = 'capture.jpg') {
  const [header, b64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

function fmtDatetime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function LivenessDemo() {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENTS';
  const webcamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [flashColor, setFlashColor] = useState('#f1f5f9');
  const [isFlashing, setIsFlashing] = useState(false);
  const [flashDone, setFlashDone] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [examCtx, setExamCtx] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [checkInResult, setCheckInResult] = useState(null);

  const loadContext = useCallback(async () => {
    if (!isStudent) return;
    try {
      const res = await getMyExamContext();
      setExamCtx(res.data);
      const canCheckIn = res.data.rooms?.filter((r) => r.can_check_in) || [];
      if (canCheckIn.length === 1) {
        setSelectedRoomId(String(canCheckIn[0].room_id));
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Không tải được thông tin thi');
    }
  }, [isStudent]);

  useEffect(() => { loadContext(); }, [loadContext]);

  const startFlashChallenge = () => {
    if (isFlashing) return;
    setFlashDone(false);
    setIsFlashing(true);
    setCheckInResult(null);
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF'];
    let i = 0;
    const interval = setInterval(() => {
      if (i < colors.length) {
        setFlashColor(colors[i]);
        i += 1;
      } else {
        clearInterval(interval);
        setFlashColor('#f1f5f9');
        setIsFlashing(false);
        setFlashDone(true);
      }
    }, 400);
  };

  const submitCheckIn = async () => {
    if (!selectedRoomId) {
      toast.error('Vui lòng chọn phòng thi');
      return;
    }
    if (!flashDone) {
      toast.error('Hoàn thành thử thách nháy sáng trước');
      return;
    }
    const shot = webcamRef.current?.getScreenshot();
    if (!shot) {
      toast.error('Chưa chụp được ảnh từ camera');
      return;
    }
    setCheckingIn(true);
    setCheckInResult(null);
    try {
      const file = dataUrlToFile(shot);
      const res = await checkInAttendance(Number(selectedRoomId), file, 0.92);
      setCheckInResult(res.data);
      toast.success(res.data.message);
      loadContext();
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Điểm danh thất bại');
    } finally {
      setCheckingIn(false);
    }
  };

  const checkableRooms = examCtx?.rooms?.filter((r) => r.can_check_in) || [];

  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--text-h)] m-0">Điểm danh khuôn mặt</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1 m-0">
          Thử thách liveness → chụp mặt → so khớp với CCCD
        </p>
      </div>

      {isStudent && examCtx && (
        <div className="mb-5 p-4 rounded-[var(--radius-sm)] bg-[var(--accent-bg)] border border-[var(--accent-border)]">
          <p className="text-sm font-medium text-[var(--text-h)] m-0 mb-2">
            Xin chào, {examCtx.full_name}
          </p>
          {!examCtx.has_face_vector && (
            <p className="text-xs text-amber-700 m-0">Chưa có ảnh CCCD — liên hệ quản trị.</p>
          )}
          {examCtx.rooms?.length > 0 && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-[var(--text-h)] mb-1">Phòng thi</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full max-w-md px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-sm"
              >
                <option value="">-- Chọn phòng --</option>
                {examCtx.rooms.map((r) => (
                  <option key={r.room_id} value={r.room_id} disabled={!r.can_check_in}>
                    {r.room_name} — {r.exam_name}
                    {r.attendance_status ? ` (${STATUS_LABEL[r.attendance_status] || r.attendance_status})` : ''}
                    {!r.can_check_in ? ' [không trong giờ]' : ''}
                  </option>
                ))}
              </select>
              {checkableRooms.length === 0 && (
                <p className="text-xs text-[var(--text-muted)] mt-1 m-0">
                  Không có phòng nào trong khung giờ điểm danh.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!cameraReady && (
        <p className="text-sm text-[var(--primary-600)] mb-4 m-0">Đang khởi tạo camera...</p>
      )}

      <div className="flex flex-wrap gap-2 mb-5">
        <button
          type="button"
          onClick={startFlashChallenge}
          disabled={!cameraReady || isFlashing}
          className="btn-ghost px-5 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {isFlashing ? 'Đang nháy sáng...' : flashDone ? 'Làm lại liveness' : '1. Thử thách nháy sáng'}
        </button>
        {isStudent && (
          <button
            type="button"
            onClick={submitCheckIn}
            disabled={!cameraReady || checkingIn || !flashDone}
            className="btn-primary-soft px-5 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {checkingIn ? 'Đang điểm danh...' : '2. Điểm danh'}
          </button>
        )}
      </div>

      {checkInResult && (
        <div
          className={`mb-5 p-4 rounded-[var(--radius-sm)] border text-sm ${
            checkInResult.status === 'SUCCESS'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : checkInResult.status === 'NEEDS_REVIEW'
                ? 'bg-violet-50 border-violet-200 text-violet-800'
                : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <p className="font-semibold m-0 mb-1">{checkInResult.message}</p>
          <p className="m-0 text-xs opacity-90">
            Độ lệch: {checkInResult.distance} (ngưỡng ≤ {checkInResult.tolerance})
            {' · '}
            Điểm khớp: {checkInResult.match_score ?? '—'}
            {' · '}
            Liveness: {checkInResult.liveness_score ?? '—'}
          </p>
        </div>
      )}

      <div
        className="rounded-[var(--radius)] overflow-hidden border border-[var(--border)] transition-colors duration-100"
        style={{ backgroundColor: flashColor }}
      >
        <div className="relative w-full max-w-[640px] mx-auto aspect-[4/3]">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            onUserMedia={() => setCameraReady(true)}
            onUserMediaError={() => toast.error('Không mở được camera')}
            className="absolute inset-0 w-full h-full object-cover -scale-x-100 z-[9]"
          />
        </div>
      </div>
    </div>
  );
}
