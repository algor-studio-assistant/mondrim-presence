paper.install(window);

window.onload = function () {
    paper.setup('canvas');

    var N = 1024;
    var W, H, CX, CY;

    function sync() {
        W  = view.size.width;
        H  = view.size.height;
        CX = view.center.x;
        CY = view.center.y;
    }
    sync();

    // ============================================================
    // PATH BUILDERS — one per state
    // Each writes directly into a target path's segments[i].point
    // ============================================================

    function buildIdle(path, t) {
        var breath = Math.sin(t * Math.PI * 0.4) * 8;
        for (var i = 0; i < N; i++) {
            path.segments[i].point.x = pathA.segments[i].point.x;
            path.segments[i].point.y = pathA.segments[i].point.y + breath;
        }
    }

    function buildThinking(path, t) {
        // Lissajous figure-eight (a=1, b=2) — rotates over time
        var rx = W  * 0.28;
        var ry = H * 0.22;
        for (var i = 0; i < N; i++) {
            var theta = (i / N) * Math.PI * 2;
            path.segments[i].point.x = CX + rx * Math.sin(1 * theta + t * 0.6);
            path.segments[i].point.y = CY + ry * Math.sin(2 * theta + t * 0.3);
        }
    }

    function buildSpeaking(path, t, audioData) {
        var dx  = W / N;
        var amp = H * 0.35;
        if (audioData) {
            // Real mic audio if available
            for (var i = 0; i < N; i++) {
                path.segments[i].point.x = i * dx;
                path.segments[i].point.y = CY + ((audioData[i] - 128) / 128.0) * amp;
            }
        } else {
            // Simulated multi-harmonic speech waveform
            for (var i = 0; i < N; i++) {
                path.segments[i].point.x = i * dx;
                path.segments[i].point.y = CY
                    + Math.sin(i * 0.050 + t * 3.1) * amp * 0.55
                    + Math.sin(i * 0.110 + t * 7.3) * amp * 0.25
                    + Math.sin(i * 0.028 + t * 1.7) * amp * 0.20;
            }
        }
    }

    function buildListening(path, t) {
        // Receptive horizon: flat line with very gentle sine ripple
        var dx  = W / N;
        var amp = H * 0.025;
        for (var i = 0; i < N; i++) {
            path.segments[i].point.x = i * dx;
            path.segments[i].point.y = CY + Math.sin(i * 0.12 + t * 1.8) * amp;
        }
    }

    function buildSuccess(path) {
        // Harmonic Bloom: symmetrical upward-facing arc
        var dx  = W / N;
        var amp = H * 0.18;
        for (var i = 0; i < N; i++) {
            var nx = (i / (N - 1)) - 0.5;         // -0.5 → 0.5
            path.segments[i].point.x = i * dx;
            path.segments[i].point.y = CY - amp * (1 - 4 * nx * nx); // upward parabola
        }
    }

    function buildError(path, t) {
        // Jagged Static: sawtooth with erratic noise
        var dx  = W / N;
        var amp = H * 0.09;
        for (var i = 0; i < N; i++) {
            var saw = ((i % 24) / 24) * 2 - 1;
            path.segments[i].point.x = i * dx;
            path.segments[i].point.y = CY + saw * amp * (0.5 + 0.5 * Math.sin(t * 22 + i * 0.4));
        }
    }

    // ============================================================
    // PATH A — Normalized Face Profile (1024 pts, hidden)
    // ============================================================
    var facePathData = [
        "M 0,-150",
        "C 12,-115 18,-85 12,-60",
        "C 6,-45 -6,-35 4,-20",
        "C 14,-5 44,10 48,28",
        "C 49,42 32,54 28,66",
        "C 26,74 38,82 40,95",
        "C 42,108 28,126 32,148",
        "C 35,162 10,178 4,200"
    ].join(" ");

    var refPath = new Path(facePathData);
    refPath.visible = false;
    refPath.position = view.center;
    refPath.scale((H * 0.7) / refPath.bounds.height);

    var pathA = new Path({ visible: false });
    var totalLen = refPath.length;
    for (var i = 0; i < N; i++) {
        pathA.add(refPath.getPointAt((i / N) * totalLen));
    }
    refPath.remove();

    // ============================================================
    // PATH B — Target shape (hidden, rebuilt every frame)
    // PATH SNAP — snapshot of pathC at transition start
    // PATH C — Rendered output (visible)
    // ============================================================
    function makeSilentPath(visible) {
        var p = new Path({ visible: !!visible });
        for (var i = 0; i < N; i++) {
            p.add(pathA.segments[i].point.clone());
        }
        return p;
    }

    var pathB    = makeSilentPath(false);
    var pathSnap = makeSilentPath(false);
    var pathC    = new Path({
        strokeColor: '#C5A47E',
        strokeWidth: 2.5,
        strokeCap:   'round',
        strokeJoin:  'round'
    });
    for (var i = 0; i < N; i++) {
        pathC.add(pathA.segments[i].point.clone());
    }

    // ============================================================
    // STATE MACHINE
    // ============================================================
    var machine = {
        state:        'idle',
        factor:       1.0,
        startTime:    0,
        autoTimer:    null
    };

    var TRANSITION_MS = 400;

    function snapshotC() {
        for (var i = 0; i < N; i++) {
            pathSnap.segments[i].point.x = pathC.segments[i].point.x;
            pathSnap.segments[i].point.y = pathC.segments[i].point.y;
        }
    }

    function transitionTo(newState) {
        if (machine.state === newState && machine.factor >= 1) return;
        if (machine.autoTimer) { clearTimeout(machine.autoTimer); machine.autoTimer = null; }

        machine.state     = newState;
        machine.factor    = 0;
        machine.startTime = 0; // set on first frame

        snapshotC();

        // Auto-return to idle after transient states
        if (newState === 'success' || newState === 'error') {
            machine.autoTimer = setTimeout(function () { transitionTo('idle'); }, 2000);
        }
    }

    // ============================================================
    // SSE — receive state events from server
    // ============================================================
    function connectSSE() {
        var src = new EventSource('/events');
        src.onmessage = function (e) {
            try {
                var data = JSON.parse(e.data);
                if (data.state) transitionTo(data.state);
            } catch (_) {}
        };
        src.onerror = function () {
            src.close();
            setTimeout(connectSSE, 3000); // reconnect
        };
    }
    connectSSE();

    // ============================================================
    // WEB AUDIO — optional, enhances speaking state with real audio
    // ============================================================
    var analyser  = null;
    var dataArray = null;
    var micActive = false;

    function startMic() {
        if (micActive) return;
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(function (stream) {
                var ctx    = new (window.AudioContext || window.webkitAudioContext)();
                var source = ctx.createMediaStreamSource(stream);
                analyser   = ctx.createAnalyser();
                analyser.fftSize              = 2048;
                analyser.smoothingTimeConstant = 0.85;
                source.connect(analyser);
                dataArray = new Uint8Array(analyser.frequencyBinCount);
                micActive = true;
                if (micPrompt) { micPrompt.remove(); micPrompt = null; }
            })
            .catch(function () {});
    }

    var micPrompt = new PointText({
        point:         new Point(CX, CY + H * 0.42),
        content:       '[ tap to enable mic ]',
        fillColor:     new Color(0.77, 0.64, 0.49, 0.35),
        fontFamily:    'monospace',
        fontSize:      12,
        justification: 'center'
    });

    view.element.addEventListener('click',      startMic);
    view.element.addEventListener('touchstart', startMic, { passive: true });

    // ============================================================
    // RENDER LOOP
    // ============================================================
    view.onFrame = function (event) {
        sync();

        var t = event.time;

        // ── Advance transition factor (cubic ease-in-out) ────────
        if (machine.factor < 1) {
            if (machine.startTime === 0) machine.startTime = t;
            var elapsed = (t - machine.startTime) / (TRANSITION_MS / 1000);
            var x = Math.min(elapsed, 1);
            // cubic ease-in-out
            machine.factor = x < 0.5
                ? 4 * x * x * x
                : 1 - Math.pow(-2 * x + 2, 3) / 2;
            if (x >= 1) { machine.factor = 1; }
        }

        // ── Build pathB for current state ───────────────────────
        var liveAudio = null;
        if (micActive && analyser && machine.state === 'speaking') {
            analyser.getByteTimeDomainData(dataArray);
            liveAudio = dataArray;
        }

        switch (machine.state) {
            case 'idle':      buildIdle(pathB, t);                break;
            case 'thinking':  buildThinking(pathB, t);            break;
            case 'speaking':  buildSpeaking(pathB, t, liveAudio); break;
            case 'listening': buildListening(pathB, t);           break;
            case 'success':   buildSuccess(pathB);                break;
            case 'error':     buildError(pathB, t);               break;
            default:          buildIdle(pathB, t);                break;
        }

        // ── Render pathC ─────────────────────────────────────────
        if (machine.factor < 1) {
            pathC.interpolate(pathSnap, pathB, machine.factor);
        } else {
            for (var i = 0; i < N; i++) {
                pathC.segments[i].point.x = pathB.segments[i].point.x;
                pathC.segments[i].point.y = pathB.segments[i].point.y;
            }
        }
    };
};
