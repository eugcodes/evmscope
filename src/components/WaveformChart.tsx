import { useEffect, useRef } from 'react';

interface WaveformChartProps {
  waveform: number[];
  isActive: boolean;
}

const LINE_COLOR = '#2dd4bf';
const GRID_COLOR = 'rgba(48, 54, 61, 0.3)';
const BG_COLOR = '#0d1117';

/**
 * The waveform displays 10 seconds of data. Data snapshots arrive every ~500ms,
 * shifting the window forward by ~15 samples. Between snapshots we continuously
 * scroll the waveform left by a time-based pixel offset so the motion appears
 * fluid rather than jumping in discrete steps.
 *
 * To eliminate vertical jumping, we maintain a separate display buffer that
 * lerps toward the target data each frame. When a new snapshot arrives, we
 * shift the display buffer left to align with the new time indices before
 * starting the lerp, so existing on-screen points stay in place. The Y-axis
 * min/max are derived from the smoothly-changing display buffer, so they
 * also change smoothly — no separate range smoothing is needed.
 */
const WINDOW_DURATION_MS = 10_000;

// Per-frame lerp rate for displayed values.
// At 60 fps: ~95% converged in 16 frames (~270 ms), well before next 500 ms snapshot.
const LERP_RATE = 0.17;

// Minimum Y range prevents noise amplification when the signal is very small.
const MIN_Y_RANGE = 0.5;

export function WaveformChart({ waveform, isActive }: WaveformChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const targetRef = useRef<number[]>([]);
  const displayRef = useRef<Float64Array>(new Float64Array(0));
  const lastUpdateRef = useRef<number>(0);
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  // When a new waveform snapshot arrives, shift displayData to align with
  // the new time indices (accounting for samples that scrolled off the left),
  // then let the per-frame lerp smoothly converge to the new values.
  useEffect(() => {
    if (waveform.length === 0) return;

    const now = performance.now();
    const display = displayRef.current;

    if (display.length === 0) {
      // First data — snap directly, no lerp needed.
      displayRef.current = Float64Array.from(waveform);
    } else {
      // Estimate how many samples have scrolled since the last update.
      const elapsed = lastUpdateRef.current > 0 ? now - lastUpdateRef.current : 0;
      const shift = Math.round((elapsed / WINDOW_DURATION_MS) * display.length);

      // Shift the old display buffer left so index i aligns with the same
      // moment in time as waveform[i]. For indices beyond the old buffer,
      // snap to the target so new data at the right edge appears immediately.
      const aligned = new Float64Array(waveform.length);
      for (let i = 0; i < waveform.length; i++) {
        const srcIdx = i + shift;
        aligned[i] = srcIdx < display.length ? display[srcIdx] : waveform[i];
      }
      displayRef.current = aligned;
    }

    targetRef.current = waveform;
    lastUpdateRef.current = now;
  }, [waveform]);

  // Single persistent rAF loop — runs from mount to unmount.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const now = performance.now();
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;

      // Background
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, w, h);

      // Horizontal grid lines
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 0.5;
      for (let y = 0; y < h; y += h / 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const target = targetRef.current;
      const display = displayRef.current;

      if (display.length < 2) {
        ctx.fillStyle = 'rgba(139, 148, 158, 0.4)';
        ctx.font = '13px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          isActiveRef.current ? 'Waiting for signal...' : '',
          w / 2,
          h / 2 + 5,
        );
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      // ── Lerp displayed values toward target each frame ────────────────
      for (let i = 0; i < display.length && i < target.length; i++) {
        display[i] += (target[i] - display[i]) * LERP_RATE;
      }

      // ── Smooth scroll offset ──────────────────────────────────────────
      const elapsed = lastUpdateRef.current > 0
        ? now - lastUpdateRef.current
        : 0;
      const scrollPx = Math.min(elapsed / WINDOW_DURATION_MS, 0.1) * w;

      // ── Draw waveform ─────────────────────────────────────────────────
      const padding = 12;
      const plotH = h - padding * 2;
      const step = w / (display.length - 1);

      // Min/max derived from the smoothly-changing display data.
      let min = Infinity, max = -Infinity;
      for (let i = 0; i < display.length; i++) {
        if (display[i] < min) min = display[i];
        if (display[i] > max) max = display[i];
      }
      const range = Math.max(max - min, MIN_Y_RANGE);
      const mid = (min + max) / 2;
      const yMin = mid - range / 2;

      ctx.shadowColor = LINE_COLOR;
      ctx.shadowBlur = 6;
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();

      for (let i = 0; i < display.length; i++) {
        const x = i * step - scrollPx;
        const y = padding + plotH - ((display[i] - yMin) / range) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Gradient fill under the curve
      ctx.shadowBlur = 0;
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, 'rgba(45, 212, 191, 0.08)');
      gradient.addColorStop(1, 'rgba(45, 212, 191, 0)');

      const lastX = (display.length - 1) * step - scrollPx;
      ctx.lineTo(lastX, h);
      ctx.lineTo(-scrollPx, h);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-28 w-full rounded-lg sm:h-32"
      aria-label="Pulse waveform"
      role="img"
    />
  );
}
