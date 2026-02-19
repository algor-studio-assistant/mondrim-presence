# System Specification: Mondrim "Presence" Avatar
> Last updated: 2026-02-19 — Expanded from Implementation Blueprint PDF

## Architecture
- **Tech Stack:** HTML5 Canvas, Paper.js (Vector Graphics), Web Audio API (Audio Analysis), TWEEN.js (morphing interpolation).
- **Core Concept:** "Waveform Visage" — A single continuous line that morphs between a Face Profile (Idle), a Receptive Horizon (Listening), a Lissajous Knot (Processing), and an Audio Oscilloscope (Speaking).
- **Performance:** Must run at 60fps on mobile devices. No heavy WebGL shaders.
- **Aesthetic Lineage:** Ben Laposky oscillons, CRT oscilloscope art, Teenage Engineering minimalism. Anti-uncanny-valley by design.

---

## Visual Constraints
- **Line Count:** Exactly 1 continuous path (Path C — the rendered output).
- **Segment Count:** 1024 points (matched to `AnalyserNode.frequencyBinCount` for 1:1 audio mapping).
- **Style:** Minimalist, geometric, "Swiss Design" aesthetic.
- **Colors:** Deep Navy (`#1B2A4A`) background, Burnished Gold (`#C5A47E`) or White stroke.

---

## State Machine (7 States)

| State | Trigger | Visual Metaphor |
|---|---|---|
| **Idle** | Active, no conversation | Face Profile — slow breathing oscillation at ~0.2Hz |
| **Listening** | Mic active, parsing speech | Receptive Horizon — flat line with ambient-noise ripples |
| **Processing** | User finished speaking, AI computing | Lissajous Knot — self-intersecting loop (figure-eight/torus); complexity ∝ load |
| **Speaking** | AI delivering audio response | Audio Oscilloscope — high-amplitude waveform synced to output audio |
| **Success** | Task completed | Harmonic Bloom — brief symmetrical upward arc, returns to Idle |
| **Error** | Recognition failure / network loss | Jagged Static — sharp sawtooth spikes, erratic low-amplitude frequency |
| **Interruption** | User speaks over AI | Dampened Wave — instant compression of speaking waveform → Listening |

### Transition Rules
- **No snapping.** Every state transition uses `interpolate(pathA, pathB, factor)` with TWEEN.js.
- Apply `path.smooth({ type: 'catmull-rom', factor: 0.5 })` on every frame.
- Transition duration: ~400ms with exponential ease-in-out.
- Interruption dampening: 50ms exponential decay.

---

## Data Flow
1. **Input:** Microphone → Web Audio API → `AnalyserNode` (fftSize=2048) → `getByteTimeDomainData()` → **1024 bytes** (time-domain waveform, 0–255, silence=128)
2. **Processing:** State Machine determines Target Shape → TWEEN.js animates `factor` (0.0→1.0) → `PathC.interpolate(PathA, PathB, factor)`
3. **Output:** Paper.js updates `path.segments` + `smooth()` → renders to Canvas at 60fps

### Coordinate Mapping
```
Δx = canvasWidth / 1024
x[i] = i × Δx
y[i] = (audioData[i] / 255) × canvasHeight
```

---

## Three-Path Memory Architecture
- **Path A (Idle):** Normalized 1024-segment Face Profile. Static. Lives in memory.
- **Path B (Target):** Current target shape (Oscilloscope, Lissajous, Horizon, etc.) — updated 60fps when audio-reactive.
- **Path C (Output):** The visible rendered line. Always the result of `interpolate(A, B, factor)`.

### Path Normalization (One-time, on init)
The SVG face outline has ~40 Bezier curves. Must be subdivided to exactly 1024 segments using `path.getPointAt(offset)` across the total path length. Shape is visually unchanged.

---

## The Emotion Layer (Architecture Upgrade)
> Decoupling internal state from visual representation.

The "Emotion Layer" acts as an intermediate middleware.
1. **Source (The AI):** Emits a high-level intent: `{"state": "speaking", "emotion": "curious", "intensity": 0.8}`.
2. **Translation (The Layer):** Maps that intent to a set of **Parametric Overrides**:
   - `amplitude_multiplier`: 1.2
   - `frequency_shift`: +0.4
   - `tension`: 0.15
   - `asymmetry`: 0.3
   - `glitch_factor`: 0.0
3. **Sink (The Frontend):** Applies these physical constants to whatever path is being drawn (Face, Waveform, or Knot).

---

## Expanded State & Emotion Library

### 1. Cognitive States (How I'm thinking)
- **`searching` (The Radar):** Vertical scan line sweeping left-to-right across the face profile.
- **`focused` (The Core):** Fast-rotating, high-symmetry geometric core.
- **`confused` (The Stutter):** Dual mismatched sine waves (beat frequency interference).

### 2. Emotional States (How I'm feeling)
- **`curious` (The Tilt):** Asymmetrical amplitude + upward brow shift.
- **`amused` (The Jiggle):** High-frequency, low-amplitude rhythmic bounce.
- **`annoyed` (The Jitter):** High tension + low-amplitude jagged spikes.
- **`empathetic` (The Fluid):** Low tension + very slow, viscous delayed easing.

### 3. Meta / Witty States (Mondrim specific)
- **`glitch` (The Smirk):** One-sided 50ms stutter/snap.
- **`deconstructing` (The Truth):** Path temporarily breaks into raw 1024 dots.

### 4. System States (The Machine)
- **`booting`:** Unfolding from a single point to a face.
- **`sleep`:** Horizontal thread with 0.1Hz pulse.
- **`offline`:** Static flat line.

---

## Expression Library (Parametric Mapping)

| Parameter | Property | Psychological Meaning |
|---|---|---|
| **Amplitude (A)** | Vertical displacement | Arousal / Energy |
| **Frequency (f)** | Wave cycles over length | Valence / Cognitive Load |
| **Tension (ρ)** | Interpolation algorithm | Comfort / Distress (0=fluid, 1=rigid) |
| **Easing (k)** | Rate of change in motion | Intent / Anticipation |

### Emotion Presets
- **Laid Back (Default):** Low freq, low amp, Tension=0.2, slow ease-in-out
- **Curiosity:** Slightly asymmetric amplitude (one side higher), moderate freq, slight "pause" at wave peak (easing)
- **Confusion:** Beat frequency interference — two overlaid sine waves with mismatched freqs `y = sin(2πf₁t) + sin(2πf₂t)`, Tension slightly elevated
- **Agreement / Comprehension:** Perfectly symmetrical low-freq harmonic, Tension=0, Catmull-Rom, rapid settle (no bounce)
- **Empathy:** Very low amp, very low freq, extremely soft delayed easing — viscous fluid motion
- **Dry Wit Glitch:** 50ms asymmetric stutter before sarcastic reply (Tension spikes to 0.9, then relaxes)
- **Machine Self:** Line deconstructs to raw data points when Mondrim jokes about being code

### Emotion Tagging Requirement
The LLM pipeline must emit emotion metadata (`{ emotion: "sarcasm" }`) **before** audio delivery begins, so visual timing can precede the audio and land the emotional beat correctly.

---

## Lissajous Knot (Processing State)
```
x(t) = A × sin(a×t + δ)
y(t) = B × sin(b×t)
```
- Shift from simple circle (a=1, b=1, δ=π/2) to complex torus knot as processing load increases.
- Rotation speed ∝ processing intensity.

---

## Conversational Micro-Behaviors
- **Backchannel Nod:** User pauses 500ms–1500ms → single-cycle ripple across face profile
- **Anticipation Gap:** User stops speaking (intent incomplete) → frequency increases 0.2Hz→0.5Hz, Tension rises but stays in Listening state
- **Interrupt/Yield:** User speaks during Speaking state → waveform dampens to flat in 50ms → transitions to Listening
- **Idle Breathing:** Slow vertical translation of entire path at 0.2Hz + Perlin noise drift on vertices

---

## Workflow Rules
- No code dumps in chat.
- Commit every phase to Git.
- API keys must never be committed.
- Update TODO.md and notify when each phase is complete.
