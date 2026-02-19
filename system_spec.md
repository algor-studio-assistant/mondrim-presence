# System Specification: Mondrim "Presence" Avatar

## Architecture
- **Tech Stack:** HTML5 Canvas, Paper.js (Vector Graphics), Web Audio API (Audio Analysis).
- **Core Concept:** "Waveform Visage" - A single continuous line that morphs between a Face Profile (Idle) and an Audio Oscilloscope (Speaking).
- **Performance:** Must run at 60fps on mobile devices. No heavy WebGL shaders.

## Visual Constraints
- **Line Count:** Exactly 1 continuous path.
- **Segment Count:** 1024 points (matched to `AnalyserNode.fftSize` for 1:1 audio mapping).
- **Style:** Minimalist, geometric, "Swiss Design" aesthetic.
- **Colors:** Deep Navy (#1B2A4A) background, Burnished Gold (#C5A47E) or White stroke.

## Data Flow
1.  **Input:** Microphone -> Web Audio API -> AnalyserNode -> `getByteTimeDomainData()` (1024 bytes).
2.  **Processing:** 
    *   State Machine (Idle/Listening/Speaking) determines the "Target Shape".
    *   Interpolation logic blends "Current Shape" -> "Target Shape".
    *   Audio data modulates Y-coordinates of the path.
3.  **Output:** Paper.js `path.segments` update loop.

## Workflow Rules
- No code dumps in chat.
- Commit every phase to Git.
- API keys must never be committed.
