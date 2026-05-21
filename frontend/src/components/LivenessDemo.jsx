import { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';

export default function LivenessDemo() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [flashColor, setFlashColor] = useState('#f1f5f9');
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    const FaceMesh = window.FaceMesh;
    const Camera = window.Camera;
    const drawConnectors = window.drawConnectors;
    const FACEMESH_TESSELATION = window.FACEMESH_TESSELATION;

    if (!FaceMesh || !Camera) return;

    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => {
      setIsLoaded(true);
      if (!webcamRef.current?.video || !canvasRef.current) return;

      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const canvasCtx = canvasRef.current.getContext('2d');
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
          drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {
            color: '#0284c7',
            lineWidth: 1,
          });
        }
      }
      canvasCtx.restore();
    });

    if (webcamRef.current?.video) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current?.video) {
            await faceMesh.send({ image: webcamRef.current.video });
          }
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }
  }, []);

  const startFlashChallenge = () => {
    if (isFlashing) return;
    setIsFlashing(true);
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF'];
    let i = 0;
    const interval = setInterval(() => {
      if (i < colors.length) {
        setFlashColor(colors[i]);
        i++;
      } else {
        clearInterval(interval);
        setFlashColor('#f1f5f9');
        setIsFlashing(false);
      }
    }, 400);
  };

  const darkFlash = ['#121212', '#FF0000', '#00FF00', '#0000FF'].includes(flashColor) && flashColor !== '#f1f5f9';

  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--text-h)] m-0">Điểm danh khuôn mặt</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1 m-0">
          Kiểm tra liveness bằng webcam (demo MediaPipe)
        </p>
      </div>

      {!isLoaded && (
        <p className="text-sm text-[var(--primary-600)] mb-4 m-0">Đang khởi tạo camera...</p>
      )}

      <button
        type="button"
        onClick={startFlashChallenge}
        disabled={!isLoaded || isFlashing}
        className="btn-primary-soft mb-5 px-5 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {isFlashing ? 'Đang test...' : 'Bắt đầu test nháy sáng'}
      </button>

      <div
        className="rounded-[var(--radius)] overflow-hidden border border-[var(--border)] transition-colors duration-100"
        style={{ backgroundColor: flashColor }}
      >
        <div className="relative w-full max-w-[640px] mx-auto aspect-[4/3]">
          <Webcam
            ref={webcamRef}
            className="absolute inset-0 w-full h-full object-cover -scale-x-100 z-[9]"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full -scale-x-100 z-10 pointer-events-none"
          />
        </div>
      </div>

      <p
        className={`mt-4 text-sm max-w-lg m-0 ${darkFlash ? 'text-white/90' : 'text-[var(--text-muted)]'}`}
      >
        Đưa mặt vào khung hình, bấm test khi sẵn sàng.
      </p>
    </div>
  );
}
