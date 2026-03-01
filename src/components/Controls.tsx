import type { CameraDevice } from '../hooks/useCamera';

interface ControlsProps {
  isRunning: boolean;
  cameraActive: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onStartMeasure: () => void;
  onStopMeasure: () => void;
  devices: CameraDevice[];
  selectedDevice: string;
  onSelectDevice: (deviceId: string) => void;
  showOverlay: boolean;
  onToggleOverlay: () => void;
}

export function Controls({
  isRunning,
  cameraActive,
  onStartCamera,
  onStopCamera,
  onStartMeasure,
  onStopMeasure,
  devices,
  selectedDevice,
  onSelectDevice,
  showOverlay,
  onToggleOverlay,
}: ControlsProps) {
  if (!cameraActive) {
    return (
      <button
        onClick={onStartCamera}
        className="w-full rounded-xl bg-accent py-3 font-semibold text-bg-primary transition-colors hover:bg-accent-dim focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary"
        aria-label="Start camera"
      >
        Start Camera
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Primary action */}
      {!isRunning ? (
        <button
          onClick={onStartMeasure}
          className="flex-1 rounded-xl bg-accent py-3 font-semibold text-bg-primary transition-colors hover:bg-accent-dim focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Start heart rate measurement"
        >
          Start Measuring
        </button>
      ) : (
        <button
          onClick={onStopMeasure}
          className="flex-1 rounded-xl bg-pulse-red/90 py-3 font-semibold text-white transition-colors hover:bg-pulse-red focus:outline-none focus:ring-2 focus:ring-pulse-red"
          aria-label="Stop heart rate measurement"
        >
          Stop
        </button>
      )}

      {/* Camera off */}
      <button
        onClick={() => {
          onStopMeasure();
          onStopCamera();
        }}
        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-border/60 text-text-secondary/60 transition-colors hover:bg-bg-secondary hover:text-text-secondary"
        aria-label="Turn off camera"
        title="Turn off camera"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
        </svg>
      </button>

      {/* Overlay toggle */}
      <button
        onClick={onToggleOverlay}
        className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border transition-colors ${
          showOverlay
            ? 'border-accent/30 bg-accent/10 text-accent'
            : 'border-border/60 text-text-secondary/60 hover:bg-bg-secondary hover:text-text-secondary'
        }`}
        aria-label={showOverlay ? 'Hide face overlay' : 'Show face overlay'}
        title={showOverlay ? 'Hide overlay' : 'Show overlay'}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          {showOverlay ? (
            <>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </>
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
          )}
        </svg>
      </button>

      {/* Camera selector */}
      {devices.length > 1 && (
        <select
          value={selectedDevice}
          onChange={(e) => onSelectDevice(e.target.value)}
          className="h-[46px] rounded-xl border border-border/60 bg-transparent px-3 text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Select camera"
        >
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
