import { useRef } from 'react';

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  faceDetected: boolean;
  isActive: boolean;
}

export function CameraFeed({
  videoRef,
  faceDetected,
  isActive,
}: CameraFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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
