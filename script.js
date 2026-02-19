paper.install(window);

window.onload = function () {
    paper.setup('canvas');

    var N = 1024;

    // ============================================================
    // PATH A: Normalized Face Profile (1024 segments)
    // Hidden reference shape — stored for Phase 3 morphing.
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
    refPath.scale((view.size.height * 0.7) / refPath.bounds.height);

    var pathA = new Path({ visible: false });
    var totalLength = refPath.length;
    for (var i = 0; i < N; i++) {
        pathA.add(refPath.getPointAt((i / N) * totalLength));
    }
    refPath.remove();

    // ============================================================
    // PATH C: Rendered Output (the visible line)
    // Phase 2: mirrors pathA in idle, switches to live waveform on mic.
    // Phase 3: will become interpolate(pathA, pathB, factor) via TWEEN.js
    // ============================================================
    var pathC = new Path({
        strokeColor: '#C5A47E',
        strokeWidth: 2.5,
        strokeCap: 'round',
        strokeJoin: 'round'
    });

    // Initialize pathC as a copy of the face profile
    for (var i = 0; i < N; i++) {
        pathC.add(pathA.segments[i].point.clone());
    }

    // ============================================================
    // WEB AUDIO PIPELINE
    // fftSize=2048 → frequencyBinCount=1024 → 1 bin per path segment
    // Uses getByteTimeDomainData() — waveform amplitude, not EQ bars
    // ============================================================
    var analyser   = null;
    var dataArray  = null;
    var isListening = false;

    function startAudio() {
        if (isListening) return;

        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(function (stream) {
                var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                var source   = audioCtx.createMediaStreamSource(stream);

                analyser = audioCtx.createAnalyser();
                analyser.fftSize = 2048;            // frequencyBinCount → 1024
                analyser.smoothingTimeConstant = 0.85; // smooths out noise jitter

                source.connect(analyser);
                dataArray = new Uint8Array(analyser.frequencyBinCount); // 1024 bytes

                isListening = true;
                if (startPrompt) { startPrompt.remove(); startPrompt = null; }
            })
            .catch(function (err) {
                console.error('Mic access denied:', err);
            });
    }

    // ============================================================
    // START PROMPT
    // Web Audio API requires a user gesture before context creation.
    // ============================================================
    var startPrompt = new PointText({
        point: new Point(view.center.x, view.center.y + view.size.height * 0.38),
        content: '[ tap to activate ]',
        fillColor: new Color(0.77, 0.64, 0.49, 0.45),
        fontFamily: 'monospace',
        fontSize: 13,
        justification: 'center'
    });

    view.element.addEventListener('click',      startAudio);
    view.element.addEventListener('touchstart', startAudio, { passive: true });

    // ============================================================
    // RENDER LOOP
    // ============================================================
    var baseY = view.center.y;

    view.onFrame = function (event) {
        var W = view.size.width;
        var H = view.size.height;

        if (isListening && analyser) {
            // --- LISTENING STATE: Live Oscilloscope ---
            // Pull time-domain waveform: 1024 bytes, 0–255, silence = 128
            analyser.getByteTimeDomainData(dataArray);

            var dx        = W / N;
            var amplitude = H * 0.4; // waveform spans ±40% of screen height

            for (var i = 0; i < N; i++) {
                // x: evenly spaced across full canvas width
                pathC.segments[i].point.x = i * dx;
                // y: centered at H/2, scaled by audio amplitude
                // silence (128) → 0 offset → dead center
                pathC.segments[i].point.y = baseY + ((dataArray[i] - 128) / 128.0) * amplitude;
            }

        } else {
            // --- IDLE STATE: Face Profile + 0.2Hz Breathing ---
            var breathOffset = Math.sin(event.time * Math.PI * 0.4) * 8;
            for (var i = 0; i < N; i++) {
                pathC.segments[i].point.x = pathA.segments[i].point.x;
                pathC.segments[i].point.y = pathA.segments[i].point.y + breathOffset;
            }
        }
    };
};
