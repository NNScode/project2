import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BLINK_CONFIG,
  LIVENESS_MIN_SCORE,
  averageEar,
  computeLivenessScore,
} from '../lib/faceBlink';

const FACE_MESH_BASE = '/mediapipe/face_mesh';

function waitForMediaPipe(maxMs = 8000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.FaceMesh) {
        resolve({ FaceMesh: window.FaceMesh });
        return;
      }
      if (Date.now() - start > maxMs) {
        reject(new Error('MediaPipe chưa tải xong'));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

async function startCameraStream(video) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Trình duyệt không hỗ trợ camera');
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();
  return stream;
}

/**
 * phase: idle | loading | ready | running | passed | failed
 */
export function useBlinkLiveness(videoEl) {
  const [phase, setPhase] = useState('idle');
  const [blinkCount, setBlinkCount] = useState(0);
  const [hint, setHint] = useState('');

  const faceMeshRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const initGenRef = useRef(0);
  const processEarRef = useRef(() => {});
  const challengeResolverRef = useRef(null);

  const blinkStateRef = useRef({
    eyesClosed: false,
    closedSince: 0,
    lastBlinkAt: 0,
    blinks: 0,
    faceFrames: 0,
    totalFrames: 0,
    challengeStart: 0,
    running: false,
  });

  const resetBlinkCounters = useCallback(() => {
    blinkStateRef.current = {
      eyesClosed: false,
      closedSince: 0,
      lastBlinkAt: 0,
      blinks: 0,
      faceFrames: 0,
      totalFrames: 0,
      challengeStart: Date.now(),
      running: true,
    };
    setBlinkCount(0);
  }, []);

  const settleChallenge = useCallback((passed) => {
    blinkStateRef.current.running = false;
    const resolver = challengeResolverRef.current;
    challengeResolverRef.current = null;

    if (passed) {
      const s = blinkStateRef.current;
      const ratio = s.totalFrames > 0 ? s.faceFrames / s.totalFrames : 0;
      const score = computeLivenessScore({
        blinkCount: s.blinks,
        elapsedMs: Date.now() - s.challengeStart,
        faceDetectedRatio: ratio,
      });
      setPhase('ready');
      if (score >= LIVENESS_MIN_SCORE) {
        setHint('Đang gửi ảnh điểm danh...');
        resolver?.resolve(score);
      } else {
        setHint('Liveness chưa đạt — thử lại.');
        resolver?.reject(new Error('Liveness chưa đạt'));
      }
    } else {
      setPhase('ready');
      setHint('Chưa đủ nháy mắt — bấm Điểm danh để thử lại.');
      resolver?.reject(new Error('Chưa đủ nháy mắt'));
    }
  }, []);

  const processEar = useCallback((ear, now) => {
    const s = blinkStateRef.current;
    if (!s.running) return;

    s.totalFrames += 1;
    if (ear != null) s.faceFrames += 1;

    if (ear == null) {
      setHint('Đưa mặt vào khung hình.');
      return;
    }

    if (ear < BLINK_CONFIG.EAR_CLOSED) {
      if (!s.eyesClosed) {
        s.eyesClosed = true;
        s.closedSince = now;
      }
    } else if (ear >= BLINK_CONFIG.EAR_OPEN) {
      if (s.eyesClosed) {
        const closedMs = now - s.closedSince;
        const gapOk = now - s.lastBlinkAt >= BLINK_CONFIG.MIN_BLINK_GAP_MS;
        if (closedMs >= BLINK_CONFIG.MIN_CLOSED_MS && gapOk) {
          s.blinks += 1;
          s.lastBlinkAt = now;
          setBlinkCount(s.blinks);
          if (s.blinks >= BLINK_CONFIG.REQUIRED_BLINKS) {
            settleChallenge(true);
            return;
          }
          setHint(`Đã nháy ${s.blinks}/${BLINK_CONFIG.REQUIRED_BLINKS} — tiếp tục.`);
        }
      }
      s.eyesClosed = false;
      if (s.blinks < BLINK_CONFIG.REQUIRED_BLINKS) {
        setHint(`Nháy mắt ${BLINK_CONFIG.REQUIRED_BLINKS} lần (${s.blinks}/${BLINK_CONFIG.REQUIRED_BLINKS})`);
      }
    }

    if (now - s.challengeStart > BLINK_CONFIG.CHALLENGE_TIMEOUT_MS) {
      settleChallenge(s.blinks >= BLINK_CONFIG.REQUIRED_BLINKS);
    }
  }, [settleChallenge]);

  processEarRef.current = processEar;

  useEffect(() => {
    const video = videoEl;
    if (!video) return undefined;

    const gen = initGenRef.current + 1;
    initGenRef.current = gen;
    let active = true;

    const stopLoop = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const cleanup = () => {
      active = false;
      blinkStateRef.current.running = false;
      challengeResolverRef.current?.reject(new Error('Đã hủy'));
      challengeResolverRef.current = null;
      stopLoop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (video.srcObject) video.srcObject = null;
      faceMeshRef.current?.close?.();
      faceMeshRef.current = null;
    };

    setPhase('loading');
    setHint('Đang mở camera...');

    (async () => {
      try {
        const { FaceMesh } = await waitForMediaPipe();
        if (!active || initGenRef.current !== gen) return;

        const faceMesh = new FaceMesh({
          locateFile: (file) => `${FACE_MESH_BASE}/${file}`,
        });
        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        faceMesh.onResults((results) => {
          if (!active) return;
          const ear = results.multiFaceLandmarks?.[0]
            ? averageEar(results.multiFaceLandmarks[0])
            : null;
          processEarRef.current(ear, Date.now());
        });
        faceMeshRef.current = faceMesh;

        await startCameraStream(video);
        if (!active || initGenRef.current !== gen) return;
        streamRef.current = video.srcObject;

        await faceMesh.initialize();
        if (!active || initGenRef.current !== gen) return;

        const loop = async () => {
          if (!active || initGenRef.current !== gen) return;
          if (faceMeshRef.current && video.readyState >= 2) {
            try {
              await faceMeshRef.current.send({ image: video });
            } catch {
              /* bỏ qua frame lỗi */
            }
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        loop();

        setPhase('ready');
        setHint('Bấm Điểm danh — nháy mắt 2 lần khi được yêu cầu.');
      } catch (err) {
        if (!active || initGenRef.current !== gen) return;
        console.error('[liveness]', err);
        const name = err?.name || '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setHint('Chưa có quyền camera — cho phép và tải lại trang.');
        } else if (name === 'NotFoundError') {
          setHint('Không tìm thấy camera.');
        } else {
          setHint(`Lỗi: ${err?.message || 'không khởi tạo được'}`);
        }
        setPhase('failed');
      }
    })();

    return cleanup;
  }, [videoEl]);

  const runChallenge = useCallback(() => {
    if (phase === 'loading' || phase === 'failed' || phase === 'running') {
      return Promise.reject(new Error('Camera chưa sẵn sàng'));
    }
    if (challengeResolverRef.current) {
      return Promise.reject(new Error('Đang xử lý'));
    }

    return new Promise((resolve, reject) => {
      challengeResolverRef.current = { resolve, reject };
      resetBlinkCounters();
      setPhase('running');
      setHint(`Nháy mắt ${BLINK_CONFIG.REQUIRED_BLINKS} lần (0/${BLINK_CONFIG.REQUIRED_BLINKS})`);
    });
  }, [phase, resetBlinkCounters]);

  const cameraReady = phase === 'ready' || phase === 'running';

  return {
    phase,
    blinkCount,
    hint,
    runChallenge,
    cameraReady,
    requiredBlinks: BLINK_CONFIG.REQUIRED_BLINKS,
  };
}
