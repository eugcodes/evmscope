import { useEffect, useRef } from 'react';

interface WaveformChartProps {
  waveform: number[];
  isActive: boolean;
}

const LINE_COLOR = '#2dd4bf';
const GRID_COLOR = 'rgba(48, 54, 61, 0.3)';
const BG_COLOR = '#0d1117';

/**
 * Smooth-scrolling waveform with stable peaks.
 *
 * Two techniques keep the display rock-steady:
 *
 * 1. **Fixed Y-axis (±2.8)**: The data is already normalized (zero mean,
 *    unit std), so a fixed range means each value always maps to the same
 *    pixel — no rescaling.
 *
 * 2. **Append-only display buffer**: The DSP pipeline reruns filtfilt +
 *    normalize over the full (growing) buffer every 500ms, which changes
 *    values at every position — even ones already on screen. To prevent
 *    that from causing visible jumps, we keep a persistent display buffer
 *    and only splice in the genuinely new samples at the right edge. Old
 *    on-screen values are preserved from when they first entered, so their
 *    y-position never changes.
 *
 * Between snapshots, a time-based scroll offset shifts the display left
 * at the natural data rate. When a new snapshot arrives the buffer shifts
 * left by the same amount and the scroll resets to 0, keeping visual
 * position continuous.
 */
const WINDOW_DURATION_MS = 10_000;

// Fixed Y-axis: normalized data (std=1) is centered at 0.
// ±2.8 gives good visual fill for a typical pulse waveform (amplitude ≈ √2 ≈ 1.4)
// while leaving headroom for occasional larger peaks.
const Y_MIN = -2.8;
const Y_MAX = 2.8;
const Y_RANGE = Y_MAX - Y_MIN;

export function WaveformChart({ waveform, isActive }: WaveformChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Append-only display buffer: old on-screen values are preserved,
  // only the right edge gets new data each snapshot.
  const displayBufRef = useRef<Float64Array>(new Float64Array(0));
  const lastUpdateRef = useRef<number>(0);
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  useEffect(() => {
    if (waveform.length === 0) return;

    const now = performance.now();
    const oldBuf = displayBufRef.current;

    if (oldBuf.length === 0) {
      // First snapshot — use directly.
      displayBufRef.current = Float64Array.from(waveform);
    } else {
      // Estimate how many new samples entered since last update.
      const elapsed = lastUpdateRef.current > 0 ? now - lastUpdateRef.current : 0;
      const shift = Math.max(1, Math.round((elapsed / WINDOW_DURATION_MS) * oldBuf.length));

      const newBuf = new Float64Array(waveform.length);
      const preserveEnd = waveform.length - shift;

      for (let i = 0; i < waveform.length; i++) {
        if (i < preserveEnd) {
          // Preserve old value (shifted left to align with new time index).
          const srcIdx = i + shift;
          newBuf[i] = srcIdx < oldBuf.length ? oldBuf[srcIdx] : waveform[i];
        } else {
          // Right edge: genuinely new data.
          newBuf[i] = waveform[i];
        }
      }

      displayBufRef.current = newBuf;
    }

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

      const data = displayBufRef.current;

      if (data.length < 2) {
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

      // ── Smooth scroll offset ──────────────────────────────────────────
      const elapsed = lastUpdateRef.current > 0
        ? now - lastUpdateRef.current
        : 0;
      const scrollPx = Math.min(elapsed / WINDOW_DURATION_MS, 0.1) * w;

      // ── Draw waveform ─────────────────────────────────────────────────
      const padding = 12;
      const plotH = h - padding * 2;
      const step = w / (data.length - 1);

      ctx.shadowColor = LINE_COLOR;
      ctx.shadowBlur = 6;
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();

      for (let i = 0; i < data.length; i++) {
        const x = i * step - scrollPx;
        const clamped = Math.max(Y_MIN, Math.min(Y_MAX, data[i]));
        const y = padding + plotH - ((clamped - Y_MIN) / Y_RANGE) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Gradient fill under the curve
      ctx.shadowBlur = 0;
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, 'rgba(45, 212, 191, 0.08)');
      gradient.addColorStop(1, 'rgba(45, 212, 191, 0)');

      const lastX = (data.length - 1) * step - scrollPx;
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
