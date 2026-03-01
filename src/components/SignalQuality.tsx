import type { SignalQualityResult } from '../lib/signalQuality';

interface SignalQualityProps {
  quality: SignalQualityResult;
  isActive: boolean;
}

const DOT_COLOR = {
  good: 'bg-signal-good',
  fair: 'bg-signal-fair',
  poor: 'bg-signal-poor',
} as const;

export function SignalQuality({ quality, isActive }: SignalQualityProps) {
  if (!isActive) return null;

  return (
    <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-text-secondary/50">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${DOT_COLOR[quality.level]}`}
        aria-hidden="true"
      />
      <span>{quality.message}</span>
    </div>
  );
}
