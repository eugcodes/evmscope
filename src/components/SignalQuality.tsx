import type { SignalQualityResult } from '../lib/signalQuality';

interface SignalQualityProps {
  quality: SignalQualityResult;
  isActive: boolean;
}

const LEVEL_CONFIG = {
  good: {
    color: 'bg-signal-good',
    textColor: 'text-signal-good',
    label: 'Good',
    icon: '●',
  },
  fair: {
    color: 'bg-signal-fair',
    textColor: 'text-signal-fair',
    label: 'Fair',
    icon: '●',
  },
  poor: {
    color: 'bg-signal-poor',
    textColor: 'text-signal-poor',
    label: 'Poor',
    icon: '●',
  },
} as const;

export function SignalQuality({ quality, isActive }: SignalQualityProps) {
  if (!isActive) return null;

  const config = LEVEL_CONFIG[quality.level];
  const barWidth = Math.max(5, Math.round(quality.score * 100));

  return (
    <div className="w-full rounded-xl border border-border bg-bg-secondary p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">Signal Quality</h3>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs ${config.textColor}`} aria-hidden="true">
            {config.icon}
          </span>
          <span className={`text-sm font-medium ${config.textColor}`}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Quality bar */}
      <div
        className="mb-3 h-2 w-full overflow-hidden rounded-full bg-bg-tertiary"
        role="progressbar"
        aria-valuenow={Math.round(quality.score * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Signal quality: ${config.label}, ${Math.round(quality.score * 100)}%`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${config.color}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Quality message */}
      <p className="text-xs text-text-secondary">{quality.message}</p>

      {/* Tips */}
      {quality.level !== 'good' && (
        <div className="mt-2 rounded-lg bg-bg-tertiary p-2">
          <p className="text-xs text-text-secondary">
            <span className="font-medium">Tips:</span> Ensure good lighting, stay still,
            and keep your face clearly visible to the camera.
          </p>
        </div>
      )}
    </div>
  );
}
