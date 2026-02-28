import { useState, useCallback } from 'react';
import { useCamera } from './hooks/useCamera';
import { usePulseDetection } from './hooks/usePulseDetection';
import { CameraFeed } from './components/CameraFeed';
import { BPMDisplay } from './components/BPMDisplay';
import { WaveformChart } from './components/WaveformChart';
import { SignalQuality } from './components/SignalQuality';
import { Onboarding } from './components/Onboarding';
import { Controls } from './components/Controls';

export default function App() {
  const camera = useCamera();
  const pulse = usePulseDetection(camera.videoRef, camera.isActive);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  const handleStartCamera = useCallback(async () => {
    await camera.start();
  }, [camera]);

  const handleStopCamera = useCallback(() => {
    pulse.stop();
    camera.stop();
  }, [camera, pulse]);

  const handleStartMeasure = useCallback(() => {
    pulse.start();
  }, [pulse]);

  const handleStopMeasure = useCallback(() => {
    pulse.stop();
  }, [pulse]);

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      {/* Onboarding Modal */}
      <Onboarding />
      {showHelp && (
        <Onboarding forceShow onDismiss={() => setShowHelp(false)} />
      )}

      {/* Header */}
      <header className="border-b border-border bg-bg-secondary/50 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <svg
                className="h-5 w-5 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">EVMScope</h1>
              <p className="text-xs text-text-secondary">
                Real-Time Pulse Detection
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {/* Error display */}
        {camera.error && (
          <div
            className="mb-4 rounded-xl border border-pulse-red/30 bg-pulse-red/10 p-4"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-pulse-red"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
              <p className="text-sm text-pulse-red">{camera.error}</p>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {pulse.state === 'loading' && pulse.loadingMessage && (
          <div className="mb-4 rounded-xl border border-accent/30 bg-accent/10 p-4">
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 animate-spin text-accent"
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
              <p className="text-sm text-accent">{pulse.loadingMessage}</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left column: Camera + Controls */}
          <div className="space-y-4 lg:col-span-3">
            <CameraFeed
              videoRef={camera.videoRef}
              faceROI={pulse.faceROI}
              faceDetected={pulse.faceDetected}
              showOverlay={showOverlay}
              isActive={camera.isActive}
            />

            <Controls
              isRunning={pulse.isRunning}
              cameraActive={camera.isActive}
              onStartCamera={handleStartCamera}
              onStopCamera={handleStopCamera}
              onStartMeasure={handleStartMeasure}
              onStopMeasure={handleStopMeasure}
              devices={camera.devices}
              selectedDevice={camera.selectedDevice}
              onSelectDevice={camera.selectDevice}
              showOverlay={showOverlay}
              onToggleOverlay={() => setShowOverlay((s) => !s)}
              onShowHelp={() => setShowHelp(true)}
            />
          </div>

          {/* Right column: BPM + Waveform + Quality */}
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <BPMDisplay
                bpm={pulse.bpm}
                state={pulse.state}
                confidence={pulse.confidence}
              />
            </div>

            <WaveformChart
              waveform={pulse.waveform}
              isActive={pulse.isRunning}
            />

            <SignalQuality
              quality={pulse.quality}
              isActive={pulse.isRunning}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-bg-secondary/50 px-4 py-4">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs text-text-secondary">
            This app is for educational and entertainment purposes only. It is not a
            medical device and should not be used for clinical decision-making.
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            All processing is done locally in your browser. No video or biometric
            data leaves your device.
          </p>
        </div>
      </footer>
    </div>
  );
}
