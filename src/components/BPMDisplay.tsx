import type { MeasurementState } from '../hooks/usePulseDetection';

interface BPMDisplayProps {
  bpm: number | null;
  state: MeasurementState;
  confidence: number;
}

export function BPMDisplay({ bpm, state, confidence }: BPMDisplayProps) {
  const pulseDuration = bpm && bpm > 0 ? 60 / bpm : 1;

  return (
    <div className="flex flex-col items-center justify-center py-4" aria-live="polite">
      {/* BPM Value */}
      <div className="relative flex items-baseline gap-2">
        {/* Pulse ring effect */}
        {state === 'measuring' && bpm && (
          <div
            className="animate-pulse-ring absolute inset-0 rounded-full border-2 border-accent"
            style={{ '--pulse-duration': `${pulseDuration}s` } as React.CSSProperties}
          />
        )}

        <span
          className={`text-6xl font-bold tracking-tight transition-all duration-300 sm:text-7xl ${
            state === 'measuring' && bpm
              ? 'animate-pulse-glow text-accent'
              : 'text-text-secondary'
          }`}
          style={
            state === 'measuring' && bpm
              ? ({ '--pulse-duration': `${pulseDuration}s` } as React.CSSProperties)
              : undefined
          }
          aria-label={bpm ? `Heart rate: ${bpm} beats per minute` : 'No reading'}
        >
          {state === 'measuring' && bpm ? bpm : '—'}
        </span>
        <span className="text-xl font-medium text-text-secondary">BPM</span>
      </div>

      {/* State label */}
      <div className="mt-2 h-6">
        {state === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <LoadingSpinner />
            <span>Loading face detection...</span>
          </div>
        )}
        {state === 'calibrating' && (
          <div className="flex items-center gap-2 text-sm text-accent-dim">
            <LoadingSpinner />
            <span>Calibrating... hold still</span>
          </div>
        )}
        {state === 'measuring' && bpm && (
          <p className="text-sm text-text-secondary">
            Confidence: {Math.round(confidence * 100)}%
          </p>
        )}
        {state === 'idle' && (
          <p className="text-sm text-text-secondary">Press Start to begin</p>
        )}
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
