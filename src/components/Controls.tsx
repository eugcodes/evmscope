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
}: ControlsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {/* Measurement toggle (power icon) */}
      <button
        onClick={cameraActive ? (isRunning ? onStopMeasure : onStartMeasure) : undefined}
        disabled={!cameraActive}
        className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border transition-colors ${
          isRunning
            ? 'border-accent/30 bg-accent/10 text-accent hover:bg-accent/20'
            : cameraActive
              ? 'border-border/60 text-text-secondary/60 hover:bg-bg-secondary hover:text-text-secondary'
              : 'border-border/30 text-text-secondary/20 cursor-not-allowed'
        }`}
        aria-label={isRunning ? 'Stop measuring' : 'Start measuring'}
        title={isRunning ? 'Stop measuring' : 'Start measuring'}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
        </svg>
      </button>

      {/* Camera toggle */}
      <button
        onClick={cameraActive ? onStopCamera : onStartCamera}
        className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border transition-colors ${
          cameraActive
            ? 'border-border/60 text-text-secondary/60 hover:bg-bg-secondary hover:text-text-secondary'
            : 'border-border/60 text-text-secondary/60 hover:bg-bg-secondary hover:text-text-secondary'
        }`}
        aria-label={cameraActive ? 'Turn off camera' : 'Turn on camera'}
        title={cameraActive ? 'Turn off camera' : 'Turn on camera'}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          {cameraActive ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.121-.12.233-.248.335-.383m-.335.383-6.838-6.838m.495-1.69 8.752 8.752m-8.752-8.752 3.095-3.095M4.862 4.487l14.958 14.958"
            />
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
