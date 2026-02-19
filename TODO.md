# Project TODOs — Mondrim Waveform Visage

## Phase 1: Foundation ✅ COMPLETE
- [x] Set up index.html and basic CSS (Navy background, fullscreen canvas)
- [x] Initialize Paper.js canvas
- [x] Create static normalized SVG Face Profile (1024 segments via path.getPointAt)
- [x] Git commit to `feature/phase-1`

---

## Phase 2: Audio Pipeline ✅ COMPLETE
> Branch: `feature/phase-2`
- [x] Initialize Web Audio API context (user gesture required)
- [x] Request microphone input (`getUserMedia`)
- [x] Connect mic stream → `AnalyserNode` (fftSize = **2048** → frequencyBinCount = 1024)
- [x] Use `getByteTimeDomainData()` (NOT getByteFrequencyData — we need waveform, not EQ)
- [x] Map 1024 bytes to canvas coordinates (Δx = width/1024, y centered at H/2, amplitude = H×0.4)
- [x] Update `path.segments[i].point.y` in `view.onFrame` loop (no path destroy/recreate)
- [x] smoothingTimeConstant = 0.85 (reduces noise jitter)
- [x] Idle breathing preserved when mic is inactive
- [x] Git commit to `feature/phase-2`

---

## Phase 3: State Machine & Morphing ✅ COMPLETE
> Branch: `feature/phase-3`
> **Architecture change (2026-02-19):** Avatar is AI-state-driven, not mic-driven.
> The face is a window into Mondrim's internal state — visible even without mic/audio.
> State is pushed from the AI/backend via SSE. Mic enhances speaking state if available.

### Server Upgrades
- [x] Upgrade serve.py: add SSE endpoint (`GET /events`) — pushes state to browser in real-time
- [x] Upgrade serve.py: add state endpoint (`POST /state`) — AI pushes state here
- [x] Use ThreadingHTTPServer for concurrent SSE connections
- [x] On SSE connect: immediately emit current state (browser gets state on page load)
- [x] Add `push-state.sh` helper script for testing from CLI

### Client: Three-Path Architecture
- [x] Path A: Face Profile (hidden, stored — source shape for morphing)
- [x] Path B: Target Shape (hidden, dynamically built per state every frame)
- [x] PathSnapshot: snapshot of pathC at transition start (for interpolate `from`)
- [x] Path C: Rendered output (visible — result of interpolate or live pathB)

### Client: State Machine (7 states)
- [x] `idle` → Face profile + 0.2Hz breathing
- [x] `thinking` → Lissajous Knot (figure-eight, a=1 b=2, rotates over time)
- [x] `speaking` → Simulated multi-harmonic waveform (or real mic audio if available)
- [x] `listening` → Receptive Horizon (flat line + gentle sine ripple)
- [x] `success` → Harmonic Bloom (upward arc, auto-returns to idle after 2s)
- [x] `error` → Jagged Static (sawtooth + noise, auto-returns to idle after 2s)

### Client: Morphing
- [x] Cubic ease-in-out transition (400ms) — manual, no TWEEN.js dependency
- [x] `pathC.interpolate(pathSnapshot, pathB, factor)` during transition
- [x] Direct copy pathB → pathC when stable (factor = 1)
- [x] SSE reconnect on drop (retry every 3s)

### AI Integration
- [x] State push from AI: `curl -sk -X POST https://100.83.203.41:8443/state -d '{"state":"thinking"}'`
- [x] Git commit to `feature/phase-3`

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
