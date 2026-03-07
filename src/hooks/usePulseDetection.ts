import { useReducer, useEffect, useRef, useCallback } from 'react';
import { initFaceDetection, detectFace, extractROIColors, destroyFaceDetection } from '../lib/faceDetection';
import type { FaceROI } from '../lib/faceDetection';
import type { WorkerMessage, WorkerResult } from '../workers/signalProcessor.worker';
import type { SignalQualityResult } from '../lib/signalQuality';

export type MeasurementState = 'idle' | 'loading' | 'calibrating' | 'measuring';

export interface PulseDetectionResult {
  state: MeasurementState;
  bpm: number | null;
  confidence: number;
  quality: SignalQualityResult;
  waveform: number[];
  faceROI: FaceROI | null;
  faceDetected: boolean;
  start: () => void;
  stop: () => void;
  isRunning: boolean;
  newSampleCount: number;
  loadingMessage: string;
}

const PROCESS_INTERVAL_MS = 250; // Process every 250ms for faster convergence

// ─── Frame scheduling ────────────────────────────────────────────────────────
// Prefer requestVideoFrameCallback (fires once per decoded video frame from the
// hardware decoder) over rAF (fires at display refresh rate, often processing
// the same frame twice at 60Hz display / 30fps camera). Falls back to rAF on
// browsers without support (Firefox).

interface FrameHandle {
  id: number;
  rvfc: boolean;
}

function scheduleFrame(video: HTMLVideoElement, cb: () => void): FrameHandle {
  if ('requestVideoFrameCallback' in video) {
    return { id: video.requestVideoFrameCallback(cb), rvfc: true };
  }
  return { id: requestAnimationFrame(cb), rvfc: false };
}

function cancelFrame(handle: FrameHandle, video: HTMLVideoElement | null) {
  if (handle.rvfc) {
    video?.cancelVideoFrameCallback?.(handle.id);
  } else {
    cancelAnimationFrame(handle.id);
  }
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

interface PulseState {
  state: MeasurementState;
  bpm: number | null;
  confidence: number;
  quality: SignalQualityResult;
  waveform: number[];
  faceROI: FaceROI | null;
  faceDetected: boolean;
  isRunning: boolean;
  newSampleCount: number;
  loadingMessage: string;
}

type PulseAction =
  | { type: 'startLoading' }
  | { type: 'loadFailed' }
  | { type: 'calibrating' }
  | { type: 'workerResult'; confidence: number; quality: SignalQualityResult; waveform: number[]; newSampleCount: number; smoothedBpm: number | null; bufferLength: number }
  | { type: 'faceUpdate'; roi: FaceROI | null }
  | { type: 'stop' };

const INITIAL_STATE: PulseState = {
  state: 'idle',
  bpm: null,
  confidence: 0,
  quality: { level: 'poor', score: 0, message: 'Not started.' },
  waveform: [],
  faceROI: null,
  faceDetected: false,
  isRunning: false,
  newSampleCount: 0,
  loadingMessage: '',
};

function pulseReducer(s: PulseState, a: PulseAction): PulseState {
  switch (a.type) {
    case 'startLoading':
      return { ...s, state: 'loading', loadingMessage: 'Loading face detection model...', bpm: null, confidence: 0 };
    case 'loadFailed':
      return { ...s, state: 'idle', loadingMessage: '' };
    case 'calibrating':
      return { ...s, state: 'calibrating', loadingMessage: '', isRunning: true };
    case 'workerResult': {
      const next: Partial<PulseState> = {
        confidence: a.confidence,
        quality: a.quality,
        waveform: a.waveform,
        newSampleCount: a.newSampleCount,
      };
      if (a.smoothedBpm !== null) {
        next.bpm = a.smoothedBpm;
        next.state = 'measuring';
      }
      return { ...s, ...next };
    }
    case 'faceUpdate': {
      // Skip update if ROI fields haven't changed (avoids re-render every rAF frame)
      const prev = s.faceROI;
      const roi = a.roi;
      const detected = roi !== null;
      if (detected === s.faceDetected && prev === roi) return s;
      if (prev && roi && prev.x === roi.x && prev.y === roi.y && prev.width === roi.width && prev.height === roi.height) {
        if (detected === s.faceDetected) return s;
      }
      return { ...s, faceROI: roi, faceDetected: detected };
    }
    case 'stop':
      return { ...INITIAL_STATE };
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePulseDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  cameraActive: boolean,
): PulseDetectionResult {
  const [s, dispatch] = useReducer(pulseReducer, INITIAL_STATE);

  const workerRef = useRef<Worker | null>(null);
  const frameRef = useRef<FrameHandle>({ id: 0, rvfc: false });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sampleCountRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const fpsEstRef = useRef(30);
  const frameCountRef = useRef(0);
  const fpsTimerStartRef = useRef(0);
  const lastRoiRef = useRef<FaceROI | null>(null);

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/signalProcessor.worker.ts', import.meta.url),
      { type: 'module' },
    );

    workerRef.current.onmessage = (e: MessageEvent<WorkerResult>) => {
      const result = e.data;
      if (result.type !== 'result') return;

      dispatch({
        type: 'workerResult',
        confidence: result.confidence,
        quality: result.quality,
        waveform: result.waveform,
        newSampleCount: result.newSampleCount,
        smoothedBpm: result.smoothedBpm,
        bufferLength: result.bufferLength,
      });
    };

    canvasRef.current = document.createElement('canvas');

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Main capture loop stored in a ref so start() can kick it off
  const captureFrameRef = useRef<() => void>(undefined);
  useEffect(() => {
    captureFrameRef.current = () => {
      const video = videoRef.current;
      if (!video || !workerRef.current || !canvasRef.current) return;
      if (video.readyState < 2) {
        frameRef.current = { id: requestAnimationFrame(() => captureFrameRef.current?.()), rvfc: false };
        return;
      }

      const now = performance.now();

      // FPS estimation
      frameCountRef.current++;
      if (fpsTimerStartRef.current === 0) {
        fpsTimerStartRef.current = now;
      } else if (now - fpsTimerStartRef.current > 2000) {
        fpsEstRef.current =
          (frameCountRef.current * 1000) / (now - fpsTimerStartRef.current);
        frameCountRef.current = 0;
        fpsTimerStartRef.current = now;
        workerRef.current.postMessage({
          type: 'setSampleRate',
          sampleRate: Math.round(fpsEstRef.current),
        } satisfies WorkerMessage);
      }

      // Face detection — run every other frame and reuse last ROI on skipped frames.
      // Face position changes slowly; 15 detections/sec is sufficient for ROI tracking.
      let roi: FaceROI | null;
      if (frameCountRef.current % 2 === 0 || !lastRoiRef.current) {
        roi = detectFace(video, now);
        lastRoiRef.current = roi;
      } else {
        roi = lastRoiRef.current;
      }
      dispatch({ type: 'faceUpdate', roi });
      const detected = roi !== null;

      // Extract ROI colors and send batched frame message to worker
      const colors = roi ? extractROIColors(video, roi, canvasRef.current) : null;
      if (colors) sampleCountRef.current++;

      const shouldProcess = now - lastTimestampRef.current > PROCESS_INTERVAL_MS;
      if (shouldProcess) lastTimestampRef.current = now;

      workerRef.current.postMessage({
        type: 'frame',
        faceDetected: detected,
        sample: colors ? { ...colors, timestamp: now } : undefined,
        roiCenter: roi ? { x: roi.x + roi.width / 2, y: roi.y + roi.height / 2 } : undefined,
        shouldProcess,
      } satisfies WorkerMessage);

      frameRef.current = scheduleFrame(video, () => captureFrameRef.current?.());
    };
  }, [videoRef]);

  const resetRefs = () => {
    sampleCountRef.current = 0;
    workerRef.current?.postMessage({ type: 'reset' } satisfies WorkerMessage);
  };

  const start = useCallback(async () => {
    if (!cameraActive) return;

    dispatch({ type: 'startLoading' });
    sampleCountRef.current = 0;

    try {
      await initFaceDetection();
    } catch (err) {
      console.error('Failed to initialize face detection:', err);
      dispatch({ type: 'loadFailed' });
      return;
    }

    dispatch({ type: 'calibrating' });

    // Reset worker buffer
    workerRef.current?.postMessage({ type: 'reset' } satisfies WorkerMessage);

    // Start capture loop — initial kick uses rAF since video may not be ready
    frameRef.current = { id: requestAnimationFrame(() => captureFrameRef.current?.()), rvfc: false };
  }, [cameraActive]);

  const stop = useCallback(() => {
    cancelFrame(frameRef.current, videoRef.current);
    dispatch({ type: 'stop' });
    resetRefs();
  }, [videoRef]);

  // Cleanup
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      cancelFrame(frameRef.current, video);
      destroyFaceDetection();
    };
  }, [videoRef]);

  // Stop measurement when camera goes inactive.
  useEffect(() => {
    if (!cameraActive && s.isRunning) {
      cancelFrame(frameRef.current, videoRef.current);
      dispatch({ type: 'stop' });
      resetRefs();
    }
  }, [cameraActive, s.isRunning, videoRef]);

  return {
    state: s.state,
    bpm: s.bpm,
    confidence: s.confidence,
    quality: s.quality,
    waveform: s.waveform,
    faceROI: s.faceROI,
    faceDetected: s.faceDetected,
    start,
    stop,
    isRunning: s.isRunning,
    newSampleCount: s.newSampleCount,
    loadingMessage: s.loadingMessage,
  };
}
