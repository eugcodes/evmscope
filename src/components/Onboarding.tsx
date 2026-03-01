import { useState, useEffect } from 'react';

const STORAGE_KEY = 'pulsecam-onboarding-dismissed';

interface OnboardingProps {
  forceShow?: boolean;
  onDismiss?: () => void;
}

export function Onboarding({ forceShow, onDismiss }: OnboardingProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      return;
    }
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, [forceShow]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="my-auto w-full max-w-md rounded-2xl border border-border bg-bg-secondary p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="mb-5 text-center">
          <h2 id="onboarding-title" className="text-xl font-bold text-text-primary">
            Welcome to PulseCam
          </h2>
          <p className="mt-1.5 text-sm text-text-secondary">
            Measure your heart rate using just your camera — no contact required.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-5 space-y-3">
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">
              1
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Camera Analysis</p>
              <p className="text-xs text-text-secondary">
                Detects subtle skin color changes caused by blood flow.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">
              2
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Signal Processing</p>
              <p className="text-xs text-text-secondary">
                rPPG algorithms extract the pulse signal in real time.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">
              3
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Live BPM</p>
              <p className="text-xs text-text-secondary">
                Heart rate displayed with a live pulse waveform.
              </p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mb-5 rounded-xl bg-bg-tertiary p-3">
          <h3 className="mb-1.5 text-xs font-semibold text-text-primary">For best results</h3>
          <ul className="space-y-0.5 text-xs text-text-secondary">
            <li>Good, even lighting on your face</li>
            <li>Stay as still as possible</li>
            <li>Face the camera directly</li>
            <li>Wait 5–8 seconds for calibration</li>
          </ul>
        </div>

        {/* Privacy */}
        <p className="mb-5 text-center text-xs text-text-secondary/60">
          All processing happens locally. No data leaves your device.
        </p>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="w-full rounded-xl bg-accent py-3 font-semibold text-bg-primary transition-colors hover:bg-accent-dim focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-secondary"
          aria-label="Get started with PulseCam"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
