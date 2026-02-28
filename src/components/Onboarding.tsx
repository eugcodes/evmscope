import { useState, useEffect } from 'react';

const STORAGE_KEY = 'evmscope-onboarding-dismissed';

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
      <div className="my-auto w-full max-w-lg rounded-2xl border border-border bg-bg-secondary p-5 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="mb-4 text-center sm:mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 sm:mb-4 sm:h-16 sm:w-16">
            <svg
              className="h-6 w-6 text-accent sm:h-8 sm:w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
              />
            </svg>
          </div>
          <h2 id="onboarding-title" className="text-2xl font-bold text-text-primary">
            Welcome to EVMScope
          </h2>
          <p className="mt-2 text-text-secondary">
            Measure your heart rate using just your camera — no contact required.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-4 space-y-3 sm:mb-6 sm:space-y-4">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-sm font-bold text-accent">
              1
            </div>
            <div>
              <p className="font-medium text-text-primary">Camera Analysis</p>
              <p className="text-sm text-text-secondary">
                Your camera captures subtle skin color changes caused by blood flow — invisible to the naked eye.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-sm font-bold text-accent">
              2
            </div>
            <div>
              <p className="font-medium text-text-primary">Signal Processing</p>
              <p className="text-sm text-text-secondary">
                Advanced algorithms (rPPG) extract the pulse signal from these micro-variations in real time.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-sm font-bold text-accent">
              3
            </div>
            <div>
              <p className="font-medium text-text-primary">Live BPM</p>
              <p className="text-sm text-text-secondary">
                Your heart rate is displayed in real time along with a live pulse waveform.
              </p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mb-4 rounded-xl bg-bg-tertiary p-3 sm:mb-6 sm:p-4">
          <h3 className="mb-2 text-sm font-semibold text-text-primary">For Best Results</h3>
          <ul className="space-y-1 text-sm text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-accent" aria-hidden="true">✓</span>
              Good, even lighting on your face
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-accent" aria-hidden="true">✓</span>
              Stay as still as possible
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-accent" aria-hidden="true">✓</span>
              Face the camera directly
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-accent" aria-hidden="true">✓</span>
              Wait 5-8 seconds for calibration
            </li>
          </ul>
        </div>

        {/* Privacy note */}
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-accent/5 p-3 sm:mb-6">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
            />
          </svg>
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-accent">Privacy:</span> All processing happens
            locally in your browser. No video or biometric data is ever transmitted.
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="w-full rounded-xl bg-accent py-3 font-semibold text-bg-primary transition-colors hover:bg-accent-dim focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-secondary"
          aria-label="Get started with EVMScope"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
