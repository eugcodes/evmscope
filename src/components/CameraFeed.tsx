import { useEffect, useRef } from 'react';
import type { FaceROI } from '../lib/faceDetection';

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  faceROI: FaceROI | null;
  faceDetected: boolean;
  showOverlay: boolean;
  isActive: boolean;
}

export function CameraFeed({
  videoRef,
  faceROI,
  faceDetected,
  showOverlay,
  isActive,
}: CameraFeedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Draw face ROI overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    const draw = () => {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (showOverlay && faceROI) {
        // Draw ROI rectangle
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(faceROI.x, faceROI.y, faceROI.width, faceROI.height);

        // Draw landmark dots
        ctx.fillStyle = 'rgba(45, 212, 191, 0.4)';
        for (const point of faceROI.landmarks) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // ROI fill
        ctx.fillStyle = 'rgba(45, 212, 191, 0.08)';
        ctx.fillRect(faceROI.x, faceROI.y, faceROI.width, faceROI.height);
      }

      animId = requestAnimationFrame(draw);
    };

    if (isActive) {
      draw();
    }

    return () => cancelAnimationFrame(animId);
  }, [videoRef, faceROI, showOverlay, isActive]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl bg-black"
      style={{ aspectRatio: '4/3' }}
    >
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        autoPlay
        playsInline
        muted
        style={{ transform: 'scaleX(-1)' }}
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* No face indicator */}
      {isActive && !faceDetected && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg bg-black/60 px-4 py-2 text-center backdrop-blur-sm">
            <svg
              className="mx-auto mb-2 h-8 w-8 text-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0"
              />
            </svg>
            <p className="text-sm text-text-secondary">
              No face detected — please face the camera
            </p>
          </div>
        </div>
      )}

      {/* Camera inactive state */}
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-secondary">
          <div className="text-center">
            <svg
              className="mx-auto mb-3 h-12 w-12 text-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
            <p className="text-text-secondary">Camera is off</p>
          </div>
        </div>
      )}
    </div>
  );
}
