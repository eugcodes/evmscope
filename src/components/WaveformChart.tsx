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
 */
const WINDOW_DURATION_MS = 10_000;

export function WaveformChart({ waveform, isActive }: WaveformChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Store latest data and timing in refs so the rAF loop always reads
  // current values without needing to restart on every prop change.
  const dataRef = useRef<number[]>([]);
  const lastUpdateRef = useRef<number>(0);
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  // When a new waveform snapshot arrives, stash it and record the time.
  useEffect(() => {
    if (waveform.length > 0) {
      dataRef.current = waveform;
      lastUpdateRef.current = performance.now();
    }
  }, [waveform]);

  // Single persistent rAF loop – runs from mount to unmount.
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

      const data = dataRef.current;

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
      // Between data snapshots, shift the waveform left at a rate matching
      // the 10-second display window.  Cap at ~1 second of scroll so the
      // line never drifts too far if an update is delayed.
      const elapsed = lastUpdateRef.current > 0
        ? now - lastUpdateRef.current
        : 0;
      const scrollPx = Math.min(elapsed / WINDOW_DURATION_MS, 0.1) * w;

      // ── Draw waveform ─────────────────────────────────────────────────
      const padding = 12;
      const plotH = h - padding * 2;
      const step = w / (data.length - 1);

      let min = Infinity, max = -Infinity;
      for (const v of data) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const range = max - min || 1;

      ctx.shadowColor = LINE_COLOR;
      ctx.shadowBlur = 6;
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();

      for (let i = 0; i < data.length; i++) {
        const x = i * step - scrollPx;
        const y = padding + plotH - ((data[i] - min) / range) * plotH;
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
