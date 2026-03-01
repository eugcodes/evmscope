/**
 * Core rPPG algorithm: POS (Plane-Orthogonal-to-Skin) method.
 *
 * Reference: Wang, W., den Brinker, A. C., Stuijk, S., & de Haan, G. (2017).
 * "Algorithmic Principles of Remote PPG."
 * IEEE Transactions on Biomedical Engineering, 64(7), 1479-1491.
 */

import {
  detrendMovingAverage,
  normalize,
  butterworthBandpass,
  filterSignalZeroPhase,
  dominantFrequency,
} from './filters';

export interface RGBSample {
  r: number;
  g: number;
  b: number;
  timestamp: number;
}

export interface PulseResult {
  bpm: number;
  confidence: number;
  waveform: Float64Array;
  rawSignal: Float64Array;
  spectrum: Float64Array;
  sampleRate: number;
}

const MIN_HR_HZ = 0.7; // 42 BPM
const MAX_HR_HZ = 4.0; // 240 BPM
const POS_WINDOW_SEC = 1.6; // POS temporal window

/**
 * POS (Plane-Orthogonal-to-Skin) rPPG algorithm.
 * Extracts pulse signal from a buffer of RGB samples.
 */
export function posAlgorithm(
  rgbBuffer: RGBSample[],
  sampleRate: number,
): Float64Array {
  const n = rgbBuffer.length;
  if (n < 3) return new Float64Array(0);

  const windowLen = Math.round(POS_WINDOW_SEC * sampleRate);

  // Compute in overlapping windows with alpha weighting
  const result = new Float64Array(n);
  const overlapCount = new Float64Array(n);
  const wLen = Math.max(windowLen, 10);

  for (let start = 0; start < n; start += Math.floor(wLen / 2)) {
    const end = Math.min(start + wLen, n);
    const len = end - start;

    // Compute S1, S2 arrays for this window
    const S1 = new Float64Array(len);
    const S2 = new Float64Array(len);

    for (let i = 0; i < len; i++) {
      const idx = start + i;
      // Temporal mean for normalization
      const wStart = Math.max(0, idx - windowLen + 1);
      const wEnd = idx + 1;
      const wLen2 = wEnd - wStart;
      let mR = 0, mG = 0, mB = 0;
      for (let j = wStart; j < wEnd; j++) {
        mR += rgbBuffer[j].r;
        mG += rgbBuffer[j].g;
        mB += rgbBuffer[j].b;
      }
      mR /= wLen2;
      mG /= wLen2;
      mB /= wLen2;

      if (mR < 1e-6 || mG < 1e-6 || mB < 1e-6) continue;

      const cr = rgbBuffer[idx].r / mR;
      const cg = rgbBuffer[idx].g / mG;
      const cb = rgbBuffer[idx].b / mB;

      S1[i] = cg - cb;
      S2[i] = cg + cb - 2 * cr;
    }

    // Standard deviations
    let meanS1 = 0, meanS2 = 0;
    for (let i = 0; i < len; i++) {
      meanS1 += S1[i];
      meanS2 += S2[i];
    }
    meanS1 /= len;
    meanS2 /= len;

    let varS1 = 0, varS2 = 0;
    for (let i = 0; i < len; i++) {
      varS1 += (S1[i] - meanS1) ** 2;
      varS2 += (S2[i] - meanS2) ** 2;
    }
    const stdS1 = Math.sqrt(varS1 / len);
    const stdS2 = Math.sqrt(varS2 / len);

    const alpha = stdS2 > 1e-10 ? stdS1 / stdS2 : 1;

    // Accumulate with overlap-add
    for (let i = 0; i < len; i++) {
      result[start + i] += S1[i] + alpha * S2[i];
      overlapCount[start + i] += 1;
    }
  }

  // Normalize by overlap count to prevent amplitude modulation
  for (let i = 0; i < n; i++) {
    if (overlapCount[i] > 0) result[i] /= overlapCount[i];
  }

  return result;
}

/**
 * Full rPPG processing pipeline:
 * 1. POS algorithm
 * 2. Detrending
 * 3. Bandpass filtering
 * 4. FFT-based BPM estimation
 */
export function processRPPG(
  rgbBuffer: RGBSample[],
  sampleRate: number,
): PulseResult | null {
  if (rgbBuffer.length < sampleRate * 3) return null;

  // 1. POS algorithm
  const rawPulse = posAlgorithm(rgbBuffer, sampleRate);
  if (rawPulse.length === 0) return null;

  // 2. Detrend (remove slow drift via moving-average subtraction)
  const detrended = detrendMovingAverage(rawPulse, Math.round(sampleRate * 1.5));

  // 3. Bandpass filter (0.7–4.0 Hz = 42–240 BPM), zero-phase
  const coeffs = butterworthBandpass(MIN_HR_HZ, MAX_HR_HZ, sampleRate);
  const filtered = filterSignalZeroPhase(detrended, coeffs);

  // 4. Normalize for display
  const waveform = normalize(filtered);

  // 5. FFT-based frequency estimation
  const { frequency, magnitude, spectrum } = dominantFrequency(
    filtered,
    sampleRate,
    MIN_HR_HZ,
    MAX_HR_HZ,
  );

  const bpm = frequency * 60;

  // 6. Confidence: ratio of peak to mean spectral power in band
  const N = spectrum.length;
  const minBin = Math.max(1, Math.floor((MIN_HR_HZ * N * 2) / sampleRate));
  const maxBin = Math.min(N - 1, Math.ceil((MAX_HR_HZ * N * 2) / sampleRate));
  let totalPower = 0;
  let count = 0;
  for (let i = minBin; i <= maxBin; i++) {
    totalPower += spectrum[i];
    count++;
  }
  const meanPower = count > 0 ? totalPower / count : 1;
  const snr = meanPower > 0 ? magnitude / meanPower : 0;
  const confidence = Math.min(1, Math.max(0, (snr - 1.5) / 5));

  return {
    bpm: Math.round(bpm * 10) / 10,
    confidence,
    waveform,
    rawSignal: filtered,
    spectrum,
    sampleRate,
  };
}
