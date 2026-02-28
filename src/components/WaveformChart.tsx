import { useEffect, useRef } from 'react';

interface WaveformChartProps {
  waveform: number[];
  isActive: boolean;
}

const LINE_COLOR = '#2dd4bf';
const GRID_COLOR = 'rgba(48, 54, 61, 0.5)';
const BG_COLOR = '#161b22';

export function WaveformChart({ waveform, isActive }: WaveformChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const prevWaveformRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
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

      // Grid
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 0.5;
      for (let y = 0; y < h; y += h / 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      for (let x = 0; x < w; x += w / 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Center line
      ctx.strokeStyle = 'rgba(48, 54, 61, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      const data = waveform.length > 0 ? waveform : prevWaveformRef.current;
      if (waveform.length > 0) {
        prevWaveformRef.current = waveform;
      }

      if (data.length < 2) {
        // No data message
        ctx.fillStyle = '#8b949e';
        ctx.font = '14px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          isActive ? 'Waiting for signal...' : 'No data',
          w / 2,
          h / 2 + 5,
        );
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      // Draw waveform
      const padding = 16;
      const plotH = h - padding * 2;

      // Find amplitude range
      let min = Infinity, max = -Infinity;
      for (const v of data) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const range = max - min || 1;

      // Glow effect
      ctx.shadowColor = LINE_COLOR;
      ctx.shadowBlur = 8;

      // Line
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();

      for (let i = 0; i < data.length; i++) {
        const x = (i / (data.length - 1)) * w;
        const y = padding + plotH - ((data[i] - min) / range) * plotH;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Gradient fill under the line
      ctx.shadowBlur = 0;
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, 'rgba(45, 212, 191, 0.15)');
      gradient.addColorStop(1, 'rgba(45, 212, 191, 0)');

      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animRef.current);
  }, [waveform, isActive]);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-bg-secondary">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <h3 className="text-sm font-medium text-text-secondary">Pulse Waveform</h3>
        <span className="text-xs text-text-secondary">~10s window</span>
      </div>
      <canvas
        ref={canvasRef}
        className="h-40 w-full sm:h-48"
        aria-label="Real-time pulse waveform chart"
        role="img"
      />
    </div>
  );
}
