import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getMyExamContext, checkInAttendance } from '../api';
import { useAuth } from '../context/AuthContext';
import { useBlinkLiveness } from '../hooks/useBlinkLiveness';
import { captureVideoFrame, CHECKIN_MAX_ATTEMPTS } from '../lib/faceBlink';

const STATUS_LABEL = {
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
  NEEDS_REVIEW: 'Chờ duyệt',
};

const STATUS_BANNER = {
  SUCCESS: {
    box: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    dot: 'bg-emerald-500',
    title: 'Điểm danh thành công',
  },
  NEEDS_REVIEW: {
    box: 'bg-amber-50 border-amber-300 text-amber-950',
    dot: 'bg-amber-500',
    title: 'Đã ghi nhận — chờ giám thị duyệt',
  },
  FAILED: {
    box: 'bg-red-50 border-red-300 text-red-900',
    dot: 'bg-red-500',
    title: 'Điểm danh thất bại',
  },
  BUSY: {
    box: 'bg-[var(--accent-bg)] border-[var(--accent-border)] text-[var(--primary-700)]',
    dot: 'bg-[var(--primary-500)] animate-pulse',
    title: 'Đang xử lý điểm danh...',
  },
};

function dataUrlToFile(dataUrl, filename = 'capture.jpg') {
  const [header, b64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

function ExamLink({ url }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
    >
      Vào phòng thi →
    </a>
  );
}

function StatusBanner({ busy, checkInResult, roomStatus, examUrl }) {
  let key = null;
  let message = '';
  let detail = '';
  let linkUrl = null;

  if (busy) {
    key = 'BUSY';
  } else if (checkInResult) {
    key = checkInResult.status;
    message = checkInResult.message;
    detail = `Khớp ${checkInResult.match_score ?? '—'} · Liveness ${checkInResult.liveness_score ?? '—'} · Lần ${checkInResult.attempt_count}/${CHECKIN_MAX_ATTEMPTS}`;
    if (checkInResult.status === 'SUCCESS') {
      linkUrl = checkInResult.exam_url;
    }
  } else if (roomStatus && roomStatus !== 'PENDING') {
    key = roomStatus;
    message = STATUS_BANNER[roomStatus]?.title || STATUS_LABEL[roomStatus] || roomStatus;
    if (roomStatus === 'SUCCESS') {
      linkUrl = examUrl;
    }
  }

  if (!key || !STATUS_BANNER[key]) return null;
  const cfg = STATUS_BANNER[key];

  return (
    <div className={`shrink-0 flex items-start gap-2.5 px-3 py-2.5 rounded-[var(--radius-sm)] border ${cfg.box}`}>
      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      <div className="min-w-0 text-left">
        <p className="text-sm font-semibold m-0 leading-snug">{message || cfg.title}</p>
        {detail && <p className="text-xs m-0 mt-0.5 opacity-80">{detail}</p>}
        <ExamLink url={linkUrl} />
      </div>
    </div>
  );
}

export default function LivenessDemo() {
  const { roomId: roomIdParam } = useParams();
  const roomIdFromUrl = roomIdParam ? String(roomIdParam) : '';
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENTS';
  const [videoEl, setVideoEl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [examCtx, setExamCtx] = useState(null);
  const [ctxLoading, setCtxLoading] = useState(true);
  const [checkInResult, setCheckInResult] = useState(null);

  const { phase, blinkCount, hint, runChallenge, cameraReady, requiredBlinks } = useBlinkLiveness(videoEl);

  const loadContext = useCallback(async () => {
    if (!isStudent) return;
    setCtxLoading(true);
    try {
      const res = await getMyExamContext();
      setExamCtx(res.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Không tải được thông tin thi');
    } finally {
      setCtxLoading(false);
    }
  }, [isStudent]);

  useEffect(() => { loadContext(); }, [loadContext]);

  const selectedRoom = examCtx?.rooms?.find((r) => String(r.room_id) === roomIdFromUrl);
  const checkInAttempts = selectedRoom?.check_in_attempt_count ?? 0;

  const handleCheckIn = async () => {
    if (!roomIdFromUrl) return;
    if (checkInAttempts >= CHECKIN_MAX_ATTEMPTS) {
      toast.error('Đã hết 3 lần — liên hệ giám thị');
      return;
    }

    setBusy(true);
    setCheckInResult(null);
    try {
      const livenessScore = await runChallenge();
      const shot = captureVideoFrame(videoEl);
      if (!shot) {
        toast.error('Chưa chụp được ảnh');
        return;
      }

      const res = await checkInAttendance(Number(roomIdFromUrl), dataUrlToFile(shot), livenessScore);
      setCheckInResult(res.data);

      if (res.data.status === 'SUCCESS') {
        if (res.data.exam_url) {
          toast.success(
            <div className="text-left">
              <p className="m-0 font-medium">{res.data.message}</p>
              <a
                href={res.data.exam_url}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-1.5 text-sm font-semibold underline"
              >
                Vào phòng thi →
              </a>
            </div>,
          );
        } else {
          toast.success(res.data.message);
        }
      } else if (res.data.status === 'NEEDS_REVIEW') {
        toast.info(res.data.message);
      } else {
        toast.error(res.data.message);
      }

      loadContext();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail) toast.error(typeof detail === 'string' ? detail : 'Điểm danh thất bại');
    } finally {
      setBusy(false);
    }
  };

  const attemptsLeft = CHECKIN_MAX_ATTEMPTS - checkInAttempts;
  const alreadyDone = ['SUCCESS', 'NEEDS_REVIEW'].includes(selectedRoom?.attendance_status);
  const canSubmit = isStudent
    && cameraReady
    && !busy
    && !alreadyDone
    && attemptsLeft > 0
    && examCtx?.has_face_vector
    && selectedRoom?.can_check_in;

  if (ctxLoading) {
    return <p className="text-sm text-[var(--text-muted)] m-0">Đang tải...</p>;
  }

  if (!selectedRoom) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-[var(--text-muted)] m-0 mb-4">Không tìm thấy phòng thi hoặc bạn không được gán vào phòng này.</p>
        <Link to="/dashboard" className="text-[var(--primary-600)] hover:underline text-sm font-medium">← Về tổng quan</Link>
      </div>
    );
  }

  return (
    <div className="card p-3 sm:p-4 flex flex-col gap-2.5 h-[calc(100dvh-4.75rem)] min-h-[480px]">
      <div className="shrink-0 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-h)] m-0 truncate">{selectedRoom.room_name}</p>
          <p className="text-xs text-[var(--text-muted)] m-0 truncate">{selectedRoom.exam_name}</p>
        </div>
        <Link to="/dashboard" className="text-xs text-[var(--primary-600)] hover:underline shrink-0 whitespace-nowrap">
          ← Tổng quan
        </Link>
      </div>

      <StatusBanner
        busy={busy}
        checkInResult={checkInResult}
        roomStatus={selectedRoom?.attendance_status}
        examUrl={selectedRoom?.exam_url}
      />

      <div className="shrink-0 flex justify-end">
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={!canSubmit}
          className="btn-primary-soft px-5 py-2 text-sm font-semibold whitespace-nowrap disabled:opacity-50"
        >
          {busy ? 'Đang xử lý...' : `Điểm danh (${Math.max(0, attemptsLeft)})`}
        </button>
      </div>

      {!examCtx?.has_face_vector && isStudent && (
        <p className="text-xs text-amber-700 m-0 shrink-0">Chưa có ảnh CCCD — liên hệ quản trị.</p>
      )}

      {!selectedRoom.can_check_in && !alreadyDone && (
        <p className="text-xs text-amber-700 m-0 shrink-0">
          {selectedRoom.attendance_status === 'FAILED'
            ? 'Điểm danh thất bại — liên hệ giám thị nếu cần hỗ trợ.'
            : 'Chưa đến giờ hoặc đã hết giờ điểm danh.'}
        </p>
      )}

      <div className="flex-1 min-h-0 relative rounded-[var(--radius)] overflow-hidden border border-[var(--border)] bg-black">
        <video
          ref={setVideoEl}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover -scale-x-100"
        />
        {phase === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm">
            Đang mở camera...
          </div>
        )}
        {phase === 'running' && (
          <div className="absolute inset-2 sm:inset-3 border-2 border-white/50 rounded-[var(--radius-sm)] pointer-events-none" />
        )}
        <div className="absolute top-0 inset-x-0 px-3 py-1.5 bg-black/45 text-white/90 text-[11px] text-center">
          Tháo kính · đủ sáng · một người trong khung
        </div>
        {hint && (
          <div className="absolute bottom-0 inset-x-0 px-3 py-2.5 bg-black/65 text-white text-sm text-center font-medium">
            {hint}
            {phase === 'running' && ` (${blinkCount}/${requiredBlinks})`}
          </div>
        )}
      </div>
    </div>
  );
}
