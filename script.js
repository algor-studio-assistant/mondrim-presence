paper.install(window);

window.onload = function() {
    paper.setup('canvas');

    // 1. Define the "Idle" Face Profile (Simplified SVG Data)
    // This is a rough profile view: Forehead -> Nose -> Lips -> Chin
    var facePathData = "M 200,100 C 200,150 250,150 250,200 C 250,250 220,250 220,270 C 220,290 240,290 240,310 C 240,330 210,350 210,400";
    
    // Create the reference path (hidden)
    var refPath = new Path(facePathData);
    refPath.visible = false;
    refPath.position = view.center;
    
    // Scale it up nicely
    refPath.scale(2);

    // 2. Create the "Waveform" Path (The one we see)
    var waveform = new Path({
        strokeColor: '#C5A47E', // Burnished Gold
        strokeWidth: 3,
        strokeCap: 'round'
    });

    // 3. Resample to exactly 1024 Segments
    // AnalyserNode uses 1024 bin size typically, matching 1:1
    var pointCount = 1024;
    var length = refPath.length;
    var step = length / pointCount;

    for (var i = 0; i < pointCount; i++) {
        var point = refPath.getPointAt(i * step);
        waveform.add(point);
    }

    // 4. Render Loop (Placeholder for now)
    view.onFrame = function(event) {
        // In Phase 2/3, we will modulate waveform.segments[i].point.y here
    }
}
