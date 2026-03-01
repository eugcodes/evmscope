import type { MeasurementState } from '../hooks/usePulseDetection';

interface BPMDisplayProps {
  bpm: number | null;
  state: MeasurementState;
  confidence: number;
}

export function BPMDisplay({ bpm, state, confidence }: BPMDisplayProps) {
  const pulseDuration = bpm && bpm > 0 ? 60 / bpm : 1;
  const isShowingBpm = state === 'measuring' && bpm;

  return (
    <div className="flex flex-col items-center" aria-live="polite">
      {/* BPM Value */}
      <div className="relative flex items-baseline gap-1">
        {isShowingBpm && (
          <div
            className="animate-pulse-ring absolute inset-0 rounded-full border-2 border-accent"
            style={{ '--pulse-duration': `${pulseDuration}s` } as React.CSSProperties}
          />
        )}

        <span
          className={`text-7xl font-bold tracking-tighter sm:text-8xl ${
            isShowingBpm
              ? 'animate-pulse-glow text-accent'
              : 'text-text-secondary/20'
          }`}
          style={
            isShowingBpm
              ? ({ '--pulse-duration': `${pulseDuration}s` } as React.CSSProperties)
              : undefined
          }
          aria-label={bpm ? `Heart rate: ${bpm} beats per minute` : 'No reading'}
        >
          {isShowingBpm ? bpm : '—'}
        </span>
        <span className="text-lg font-medium text-text-secondary/40">BPM</span>
      </div>

      {/* Status */}
      <div className="mt-1 h-5">
        {state === 'loading' && (
          <p className="text-xs text-text-secondary/50">Loading face detection...</p>
        )}
        {state === 'calibrating' && (
          <p className="text-xs text-accent-dim">Calibrating — hold still</p>
        )}
        {isShowingBpm && (
          <p className="text-xs text-text-secondary/50">
            Confidence {Math.round(confidence * 100)}%
          </p>
        )}
        {state === 'idle' && (
          <p className="text-xs text-text-secondary/30">Ready</p>
        )}
      </div>
    </div>
  );
}
