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
  onShowHelp: () => void;
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
  onShowHelp,
}: ControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Start/Stop Camera */}
      {!cameraActive ? (
        <button
          onClick={onStartCamera}
          className="rounded-xl bg-accent px-5 py-2.5 font-semibold text-bg-primary transition-colors hover:bg-accent-dim focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary"
          aria-label="Start camera"
        >
          Start Camera
        </button>
      ) : (
        <>
          {/* Start/Stop Measurement */}
          {!isRunning ? (
            <button
              onClick={onStartMeasure}
              className="rounded-xl bg-accent px-5 py-2.5 font-semibold text-bg-primary transition-colors hover:bg-accent-dim focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary"
              aria-label="Start heart rate measurement"
            >
              Start Measuring
            </button>
          ) : (
            <button
              onClick={onStopMeasure}
              className="rounded-xl bg-pulse-red px-5 py-2.5 font-semibold text-white transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-pulse-red focus:ring-offset-2 focus:ring-offset-bg-primary"
              aria-label="Stop heart rate measurement"
            >
              Stop
            </button>
          )}

          {/* Stop Camera */}
          <button
            onClick={() => {
              onStopMeasure();
              onStopCamera();
            }}
            className="rounded-xl border border-border bg-bg-secondary px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary"
            aria-label="Turn off camera"
          >
            Camera Off
          </button>
        </>
      )}

      {/* Camera selector */}
      {cameraActive && devices.length > 1 && (
        <select
          value={selectedDevice}
          onChange={(e) => onSelectDevice(e.target.value)}
          className="rounded-xl border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Select camera"
        >
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
        </select>
      )}

      {/* Toggle overlay */}
      {cameraActive && (
        <button
          onClick={onToggleOverlay}
          className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary ${
            showOverlay
              ? 'border-accent/50 bg-accent/10 text-accent'
              : 'border-border bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
          }`}
          aria-label={showOverlay ? 'Hide face detection overlay' : 'Show face detection overlay'}
          aria-pressed={showOverlay}
        >
          {showOverlay ? 'Overlay On' : 'Overlay Off'}
        </button>
      )}

      {/* Help button */}
      <button
        onClick={onShowHelp}
        className="rounded-xl border border-border bg-bg-secondary px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary"
        aria-label="Show help and instructions"
      >
        Help
      </button>
    </div>
  );
}
