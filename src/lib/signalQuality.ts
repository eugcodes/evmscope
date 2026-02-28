/**
 * Signal quality estimation for rPPG signals.
 */

export type QualityLevel = 'good' | 'fair' | 'poor';

export interface SignalQualityResult {
  level: QualityLevel;
  score: number; // 0-1
  message: string;
}

/**
 * Assess signal quality based on multiple factors:
 * - rPPG confidence from FFT analysis
 * - Face detection presence
 * - Motion/stability of the ROI
 */
export function assessSignalQuality(
  confidence: number,
  faceDetected: boolean,
  motionLevel: number, // 0 = still, 1 = lots of motion
): SignalQualityResult {
  if (!faceDetected) {
    return {
      level: 'poor',
      score: 0,
      message: 'No face detected. Please face the camera.',
    };
  }

  // Motion penalty
  const motionPenalty = Math.min(1, motionLevel * 2);

  // Combined score
  const score = Math.max(0, Math.min(1, confidence * (1 - motionPenalty * 0.5)));

  if (score >= 0.5) {
    return {
      level: 'good',
      score,
      message: 'Good signal quality.',
    };
  } else if (score >= 0.2) {
    return {
      level: 'fair',
      score,
      message: 'Fair signal. Try to stay still and ensure good lighting.',
    };
  } else {
    return {
      level: 'poor',
      score,
      message: 'Poor signal. Improve lighting, stay still, and face the camera.',
    };
  }
}

/**
 * Estimate motion from face ROI position changes.
 * Returns a 0-1 motion level.
 */
export function estimateMotion(
  roiHistory: Array<{ x: number; y: number }>,
  maxSamples: number = 15,
): number {
  if (roiHistory.length < 2) return 0;

  const recent = roiHistory.slice(-maxSamples);
  let totalDisplacement = 0;

  for (let i = 1; i < recent.length; i++) {
    const dx = recent[i].x - recent[i - 1].x;
    const dy = recent[i].y - recent[i - 1].y;
    totalDisplacement += Math.sqrt(dx * dx + dy * dy);
  }

  const avgDisplacement = totalDisplacement / (recent.length - 1);

  // Normalize: 0-5 pixels = still, >20 pixels = lots of motion
  return Math.min(1, avgDisplacement / 20);
}
