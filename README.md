# PulseCam — Real-Time Pulse Detection

A browser-based heart rate monitor that measures your pulse in real time using your device camera and remote photoplethysmography (rPPG). No physical contact required.

**[Live Demo](https://eugcodes.github.io/pulsecam/)**

## How It Works

Your camera captures video of your face. With each heartbeat, blood flow causes tiny, invisible color changes in your skin. PulseCam uses the **POS (Plane-Orthogonal-to-Skin)** rPPG algorithm to detect these micro-variations and extract your heart rate — entirely in the browser.

### Signal Processing Pipeline

1. **Face Detection** — MediaPipe Face Mesh locates forehead and cheek regions of interest (ROI)
2. **Color Extraction** — Average RGB values are sampled from the ROI each frame
3. **POS Algorithm** — Projects color channels onto a plane orthogonal to skin tone, isolating the blood volume pulse
4. **Detrending** — Removes slow drift via linear detrending
5. **Bandpass Filter** — Butterworth filter (0.7–4.0 Hz) isolates cardiac frequencies
6. **FFT Analysis** — Identifies the dominant frequency (heart rate) with parabolic interpolation
7. **Temporal Smoothing** — Median filter across multiple readings for stable BPM output

All processing runs in a **Web Worker** to keep the UI responsive at 30 fps.

## Running Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173/pulsecam/ in your browser.

## Build

```bash
npm run build
```

The built files are output to the `dist/` directory.

## Tips for Best Accuracy

- **Good, even lighting** — Avoid harsh shadows or backlighting on your face
- **Stay still** — Motion degrades signal quality significantly
- **Face the camera directly** — Ensure your forehead and cheeks are visible
- **Wait 5–8 seconds** — The algorithm needs a calibration period to stabilize
- **Steady camera** — If on a phone, prop it up rather than holding it

## Tech Stack

- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** for styling
- **MediaPipe Face Mesh** for face detection
- **Web Workers** for off-thread signal processing
- **Canvas API** for waveform rendering

## Limitations & Disclaimer

- Accuracy varies based on lighting, skin tone, camera quality, and motion
- Not validated against clinical-grade equipment
- Works best in well-lit, stable conditions

**This app is for educational and entertainment purposes only. It is not a medical device and should not be used for clinical decision-making.**

## Privacy

All processing happens locally in your browser. No video or biometric data is ever transmitted anywhere. Your camera feed never leaves your device.

## License

See [LICENSE](./LICENSE) for details.
