# Claude Code Prompt: Real-Time Pulse Detection Web App (rPPG)

## Project Overview

Build a polished, production-ready web application that measures a user's heart rate in real time using their device camera and remote photoplethysmography (rPPG) — no physical contact required. The app should analyze subtle color variations in the user's face captured via webcam to extract a pulse signal and display a live BPM reading.

## Technical Requirements

### Architecture

- **Fully client-side** — all processing happens in the browser. No backend server.
- **Framework**: Use React with Vite for fast builds and modern DX. TypeScript preferred.
- **Deployment target**: GitHub Pages. Include a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys on push to `main`.
- **Repository**: Initialize as a complete, ready-to-push Git repo with proper `.gitignore`, `package.json`, `README.md`, etc.

### Camera & Face Detection

- Use the `getUserMedia` API to access the device camera.
- Implement face detection to locate the forehead/cheek region of interest (ROI). Use one of:
    - **MediaPipe Face Mesh** (preferred for accuracy and cross-browser support), or
    - A lightweight alternative like `face-api.js` if MediaPipe proves too heavy.
- The ROI should track the face in real time and adapt to head movement.
- Support both front-facing (mobile) and built-in webcam (laptop/desktop) cameras.
- Handle camera permission denial gracefully with clear user messaging.

### rPPG Signal Processing (This is critical — invest heavily here)

Choose the best-performing rPPG algorithm suitable for real-time browser execution. Strong candidates include:

- **POS (Plane-Orthogonal-to-Skin)** — generally the best balance of accuracy and computational efficiency for real-time use.
- **CHROM (Chrominance-based)** — good alternative.
- **Green channel method** — simpler fallback if needed.

The signal processing pipeline should include:

1. **ROI extraction**: Average the RGB values from the face ROI each frame.
2. **Temporal buffer**: Maintain a sliding window of RGB samples (~10–15 seconds at 30fps).
3. **Signal detrending**: Remove slow drift (e.g., using a polynomial or moving average subtraction).
4. **Bandpass filtering**: Apply a Butterworth or similar bandpass filter in the range of ~0.7–4.0 Hz (42–240 BPM) to isolate the cardiac signal.
5. **Peak detection / frequency estimation**: Use FFT (e.g., via a JS FFT library) to find the dominant frequency in the filtered signal, or use peak-counting in the time domain.
6. **Temporal smoothing**: Smooth the BPM estimate over several windows to reduce jitter and produce a stable reading.
7. **Signal quality assessment**: Compute an SNR or confidence metric and expose it to the UI. Flag when the signal is too noisy (e.g., due to movement, bad lighting, or no face detected).

Use **Web Workers** for the signal processing pipeline to keep the UI thread responsive.

### Performance Targets

- Maintain **30 fps** camera capture on modern hardware.
- BPM updates at least every **1–2 seconds** after an initial stabilization period (~5–8 seconds).
- Acceptable BPM range: **45–180 BPM**.
- The app should work in **Chrome, Firefox, Safari, and Edge** on both desktop and mobile.

## UI / UX Requirements

### Design Philosophy

- Clean, modern, medical-instrument-inspired aesthetic. Think: dark background, soft glowing accent colors (teal/cyan or soft red for the pulse).
- Responsive layout that works on desktop (landscape) and mobile (portrait).
- Use a component library or Tailwind CSS for styling.

### Layout & Components

1. **Camera Feed**
    
    - Live camera preview as the main visual element.
    - Semi-transparent overlay showing the detected face ROI (subtle bounding box or mesh outline on the forehead/cheek region).
    - Visual indicator when no face is detected.
2. **BPM Display**
    
    - Large, prominent BPM number front and center.
    - Subtle pulsing animation synced to the detected heart rate.
    - Show a "Measuring..." or "Calibrating..." state during the initial stabilization window.
    - Show "—" or equivalent when no valid reading is available.
3. **Real-Time Pulse Waveform Chart**
    
    - A scrolling line chart showing the live rPPG waveform signal (~10 seconds of data).
    - Smooth, animated updates.
    - Use a performant charting approach (Canvas-based preferred over SVG for performance — consider a lightweight library or custom Canvas rendering).
4. **Signal Quality Indicator**
    
    - A clear visual indicator of signal quality (e.g., a bar, icon, or color-coded badge).
    - Three states minimum: Good (green), Fair (yellow), Poor (red).
    - Tooltip or label explaining what affects signal quality (lighting, movement, face visibility).
5. **Onboarding / Instructions**
    
    - Brief overlay or modal on first use explaining:
        - How it works (camera analyzes subtle skin color changes).
        - Tips for best results (good lighting, stay still, face the camera).
        - Privacy note: all processing is local, no video is transmitted.
    - Dismissable, with a "help" button to re-show.
6. **Controls**
    
    - Start/Stop measurement button.
    - Camera selector (if multiple cameras are available).
    - Optional: toggle for showing/hiding the face detection overlay.

### Animations & Polish

- Smooth transitions between states (calibrating → measuring → stable reading).
- The BPM number should have a gentle pulse animation.
- The waveform chart should scroll smoothly.
- Loading states and error states should be well-designed, not just text.

## Project Structure

```
pulse-app/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages deployment
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── CameraFeed.tsx
│   │   ├── BPMDisplay.tsx
│   │   ├── WaveformChart.tsx
│   │   ├── SignalQuality.tsx
│   │   ├── Onboarding.tsx
│   │   └── Controls.tsx
│   ├── workers/
│   │   └── signalProcessor.worker.ts
│   ├── lib/
│   │   ├── rppg.ts             # Core rPPG algorithm
│   │   ├── faceDetection.ts    # Face detection wrapper
│   │   ├── filters.ts          # DSP utilities (bandpass, FFT, etc.)
│   │   └── signalQuality.ts    # SNR / quality estimation
│   ├── hooks/
│   │   ├── useCamera.ts
│   │   ├── usePulseDetection.ts
│   │   └── useSignalQuality.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## Additional Notes

- **Privacy**: Emphasize in the UI and README that all processing is done locally in the browser. No video or biometric data leaves the device.
- **Accessibility**: Use proper ARIA labels, ensure sufficient color contrast, and support keyboard navigation.
- **README**: Include a clear README with:
    - What the app does and how it works (brief explanation of rPPG).
    - Live demo link (GitHub Pages URL).
    - How to run locally (`npm install && npm run dev`).
    - Tips for best measurement accuracy.
    - Technical details on the algorithm used.
    - Limitations and disclaimers (not a medical device).
- **Medical disclaimer**: Include a visible disclaimer in the app footer: "This app is for educational and entertainment purposes only. It is not a medical device and should not be used for clinical decision-making."

## Success Criteria

The app is done when:

1. Opening the app in a browser shows the camera feed with face detection overlay.
2. Within ~5–8 seconds of a face being detected, a stable BPM reading appears.
3. The pulse waveform chart shows a clearly periodic signal in sync with the user's actual pulse.
4. The signal quality indicator correctly reflects measurement conditions.
5. The BPM reading is within ±5 BPM of a reference measurement (e.g., finger pulse oximeter) under good conditions (stable, well-lit face).
6. The app deploys to GitHub Pages via the included workflow.
7. The app works on Chrome, Firefox, and Safari on both desktop and mobile.