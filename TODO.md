# Project TODOs — Mondrim Waveform Visage

## Phase 1: Foundation ✅ COMPLETE
- [x] Set up index.html and basic CSS (Navy background, fullscreen canvas)
- [x] Initialize Paper.js canvas
- [x] Create static normalized SVG Face Profile (1024 segments via path.getPointAt)
- [x] Git commit to `feature/phase-1`

---

## Phase 2: Audio Pipeline
> Branch: `feature/phase-2`
- [ ] Initialize Web Audio API context (user gesture required)
- [ ] Request microphone input (`getUserMedia`)
- [ ] Connect mic stream → `AnalyserNode` (fftSize = **2048** → frequencyBinCount = 1024)
- [ ] Use `getByteTimeDomainData()` (NOT getByteFrequencyData — we need waveform, not EQ)
- [ ] Map 1024 bytes to canvas coordinates (Δx = width/1024, y normalized from 0–255 range)
- [ ] Update `path.segments[i].point.y` in `view.onFrame` loop (no path destroy/recreate)
- [ ] Git commit to `feature/phase-2`

---

## Phase 3: State Machine & Morphing
> Branch: `feature/phase-3`
- [ ] Set up three-path memory architecture (Path A = Face, Path B = Target, Path C = Output)
- [ ] Implement State Machine (7 states: Idle, Listening, Processing, Speaking, Success, Error, Interruption)
- [ ] Integrate TWEEN.js for factor animation (0.0→1.0, ~400ms, exponential ease-in-out)
- [ ] Implement `PathC.interpolate(PathA, PathB, factor)` on every frame
- [ ] Apply `PathC.smooth({ type: 'catmull-rom', factor: 0.5 })` on every frame
- [ ] Implement Idle breathing (0.2Hz vertical oscillation + Perlin noise drift)
- [ ] Implement Listening state (Receptive Horizon — flat line with ambient ripples)
- [ ] Implement Processing state (Lissajous Knot — figure-eight, rotation speed ∝ load)
- [ ] Implement Speaking state (live oscilloscope from getByteTimeDomainData)
- [ ] Implement Interruption/Yield (50ms exponential dampening → Listening)
- [ ] Git commit to `feature/phase-3`

---

## Phase 4: Emotional Modifiers & Expression Library
> Branch: `feature/phase-4`
- [ ] Implement parametric control system (Amplitude, Frequency, Tension, Easing)
- [ ] Emotion preset: Curiosity (asymmetric amplitude, pause easing at peak)
- [ ] Emotion preset: Confusion (beat frequency interference — dual mismatched sine waves)
- [ ] Emotion preset: Agreement/Comprehension (symmetrical low-freq harmonic, instant settle)
- [ ] Emotion preset: Empathy (very low amp/freq, viscous delayed easing)
- [ ] Personality: Dry Wit Glitch (50ms Tension=0.9 stutter before sarcastic reply)
- [ ] Personality: Machine Self (deconstruct to raw points on self-deprecating jokes)
- [ ] Implement Success state (Harmonic Bloom — upward arc → Idle)
- [ ] Implement Error state (Jagged Static — sawtooth, erratic frequency)
- [ ] Conversational micro-behaviors: Backchannel Nod (ripple on 500–1500ms pause)
- [ ] Conversational micro-behaviors: Anticipation Gap (freq 0.2→0.5Hz on intent-incomplete pause)
- [ ] Emotion tagging hook from LLM pipeline (`{ emotion: "sarcasm" }` etc.)
- [ ] Git commit to `feature/phase-4`
