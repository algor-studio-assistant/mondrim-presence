paper.install(window);

window.onload = function () {
    paper.setup('canvas');

    // --- Face Profile Reference Path ---
    // Single-line left-facing profile: Forehead → Brow Ridge → Nose → Philtrum → Lips → Chin → Neck
    // Anatomically minimal — designed to read as "face", not "squiggle".
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

    // Build hidden reference path for point sampling
    var refPath = new Path(facePathData);
    refPath.visible = false;
    refPath.position = view.center;

    // Scale to fill ~70% of screen height (works on any screen size)
    var targetHeight = view.size.height * 0.7;
    refPath.scale(targetHeight / refPath.bounds.height);

    // --- Path A: Normalized 1024-segment Face Profile ---
    // fftSize=2048 → frequencyBinCount=1024 → 1 segment per audio bin (1:1 mapping)
    // In Phase 3, this becomes the source shape for interpolate(pathA, pathB, factor)
    var pathA = new Path({
        strokeColor: '#C5A47E',  // Burnished Gold
        strokeWidth: 2.5,
        strokeCap: 'round',
        strokeJoin: 'round'
    });

    var N = 1024;
    var totalLength = refPath.length;

    for (var i = 0; i < N; i++) {
        pathA.add(refPath.getPointAt((i / N) * totalLength));
    }

    // Reference path no longer needed
    refPath.remove();

    // --- Idle Breathing: 0.2Hz vertical oscillation ---
    // Phase 3 replaces this with full state machine + TWEEN.js interpolation
    var baseY = view.center.y;

    view.onFrame = function (event) {
        pathA.position.y = baseY + Math.sin(event.time * Math.PI * 0.4) * 8;
    };
};
