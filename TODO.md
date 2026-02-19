# Project TODOs

## Phase 1: Foundation (Current)
- [ ] Set up index.html and basic CSS.
- [ ] Initialize Paper.js canvas.
- [ ] Create static normalized SVG Face Profile (1024 segments).
- [ ] Git commit to `feature/phase-1`.

## Phase 2: Audio Pipeline
- [ ] Implement Web Audio API context.
- [ ] Connect microphone input stream.
- [ ] Set up AnalyserNode.
- [ ] Extract 1024 points of `getByteTimeDomainData()`.

## Phase 3: The State Machine & Morphing
- [ ] Implement `Idle`, `Listening`, `Speaking` states.
- [ ] Implement path morphing logic (Paper.js interpolate).
- [ ] Map audio data to path Y-coordinates.

## Phase 4: Emotional Modifiers
- [ ] Add `Curiosity` parameter (asymmetry).
- [ ] Add `Confusion` parameter (tension/knots).
- [ ] Add `Empathy` parameter (frequency smoothing).
