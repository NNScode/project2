/** MediaPipe Face Mesh — chỉ số landmark mắt */
const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];

export const BLINK_CONFIG = {
  REQUIRED_BLINKS: 2,
  CHALLENGE_MAX_TRIES: 3,
  CHALLENGE_TIMEOUT_MS: 12000,
  EAR_CLOSED: 0.21,
  EAR_OPEN: 0.24,
  MIN_CLOSED_MS: 100,
  MIN_BLINK_GAP_MS: 250,
};

export const CHECKIN_MAX_ATTEMPTS = 3;
export const LIVENESS_MIN_SCORE = 0.70;

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function eyeAspectRatio(landmarks, indices) {
  const p = indices.map((i) => landmarks[i]);
  const vertical1 = dist(p[1], p[5]);
  const vertical2 = dist(p[2], p[4]);
  const horizontal = dist(p[0], p[3]);
  if (horizontal < 1e-6) return 1;
  return (vertical1 + vertical2) / (2 * horizontal);
}

export function averageEar(landmarks) {
  if (!landmarks || landmarks.length < 400) return null;
  const left = eyeAspectRatio(landmarks, LEFT_EYE);
  const right = eyeAspectRatio(landmarks, RIGHT_EYE);
  return (left + right) / 2;
}

/** Tính liveness_score sau khi pass thử thách nháy mắt */
export function computeLivenessScore({ blinkCount, elapsedMs, faceDetectedRatio }) {
  const blinkPart = Math.min(1, blinkCount / BLINK_CONFIG.REQUIRED_BLINKS) * 0.45;
  const timePart = elapsedMs <= BLINK_CONFIG.CHALLENGE_TIMEOUT_MS ? 0.25 : 0.1;
  const stablePart = Math.min(1, faceDetectedRatio) * 0.3;
  return Math.round(Math.min(1, blinkPart + timePart + stablePart) * 1000) / 1000;
}

export function captureVideoFrame(video) {
  if (!video || video.readyState < 2) return null;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.92);
}
