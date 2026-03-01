import { useEffect, useRef } from 'react';

interface WaveformChartProps {
  waveform: number[];
  isActive: boolean;
}

const LINE_COLOR = '#2dd4bf';
const GRID_COLOR = 'rgba(48, 54, 61, 0.3)';
const BG_COLOR = '#0d1117';

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

      // Background matches page
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, w, h);

      // Subtle horizontal grid only
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 0.5;
      for (let y = 0; y < h; y += h / 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const data = waveform.length > 0 ? waveform : prevWaveformRef.current;
      if (waveform.length > 0) {
        prevWaveformRef.current = waveform;
      }

      if (data.length < 2) {
        ctx.fillStyle = 'rgba(139, 148, 158, 0.4)';
        ctx.font = '13px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          isActive ? 'Waiting for signal...' : '',
          w / 2,
          h / 2 + 5,
        );
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      // Waveform
      const padding = 12;
      const plotH = h - padding * 2;

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
        const x = (i / (data.length - 1)) * w;
        const y = padding + plotH - ((data[i] - min) / range) * plotH;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Gradient fill
      ctx.shadowBlur = 0;
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, 'rgba(45, 212, 191, 0.08)');
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
    <canvas
      ref={canvasRef}
      className="h-28 w-full rounded-lg sm:h-32"
      aria-label="Pulse waveform"
      role="img"
    />
  );
}
