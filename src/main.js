// Estimate the area of regions formed by the mandala's segments
function estimateMandalaRegionAreas(mandala, samplePoints = 32) {
  // For a symmetric mandala, sample points along the Bezier curve for each segment
  // and use the points to estimate the area of each region (wedge between two segments)
  const cx = 0.5, cy = 0.5; // Assume center at (0.5, 0.5) in normalized coordinates
  const regions = [];
  const segs = mandala.segments;
  const pointsBySegment = [];
  for (let i = 0; i < segs; i++) {
    const theta0 = (2 * Math.PI * i) / segs;
    const theta1 = (2 * Math.PI * (i + 1)) / segs;
    // For each segment, sample points along the Bezier curve
    const segPoints = [];
    for (let t = 0; t <= 1; t += 1 / samplePoints) {
      // Rotate control points for this segment
      const rot = (angle, x, y) => {
        return {
          x: Math.cos(angle) * x - Math.sin(angle) * y,
          y: Math.sin(angle) * x + Math.cos(angle) * y
        };
      };
      const s = rot(theta0, mandala.start.x, mandala.start.y);
      const c1 = rot(theta0, mandala.control1.x, mandala.control1.y);
      const c2 = rot(theta0, mandala.control2.x, mandala.control2.y);
      const e = rot(theta0, mandala.end.x, mandala.end.y);
      // Cubic Bezier formula
      const x = Math.pow(1 - t, 3) * s.x + 3 * Math.pow(1 - t, 2) * t * c1.x + 3 * (1 - t) * t * t * c2.x + Math.pow(t, 3) * e.x;
      const y = Math.pow(1 - t, 3) * s.y + 3 * Math.pow(1 - t, 2) * t * c1.y + 3 * (1 - t) * t * t * c2.y + Math.pow(t, 3) * e.y;
      segPoints.push({ x, y });
    }
    pointsBySegment.push(segPoints);
  }
  // For each region (wedge between two segments), estimate area
  for (let i = 0; i < segs; i++) {
    // Region is polygon: center + points from segment i + reversed points from segment (i+1)%segs
    const next = (i + 1) % segs;
    const poly = [{ x: cx, y: cy }]
      .concat(pointsBySegment[i])
      .concat(pointsBySegment[next].slice().reverse());
    // Shoelace formula for area
    let area = 0;
    for (let j = 0; j < poly.length; j++) {
      const p1 = poly[j];
      const p2 = poly[(j + 1) % poly.length];
      area += (p1.x * p2.y - p2.x * p1.y);
    }
    area = Math.abs(area) / 2;
    regions.push(area);
  }
  return regions;
}
let canvas, context, stage;
let isPaused = false;

// Generate a color palette for regions (returns array of CSS color strings)
function getRegionColors(n) {
  const colors = [];
  for (let i = 0; i < n; i++) {
    // Evenly spaced hues, max saturation, higher lightness, alpha 0.35
    colors.push(`hsla(${Math.round((360 * i) / n)}, 98%, 68%, 0.35)`);
  }
  return colors;
}

// Draw colored overlays for each region (called after mandala is drawn)
function drawRegionOverlays(mandala, regionAreas, samplePoints = 32) {
  // Deprecated: now handled by BezierShape.drawColoredRegions
  return;
}

function init() {
  canvas = document.getElementById("canvas");
  context = canvas.getContext("2d");
  stage = new createjs.Stage(canvas);
  // Ensure global mandalas array exists
  window.mandalas = window.mandalas || [];

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("keydown", handleKeyDown);

  resizeCanvas();
  createSceneElements();

  createjs.Ticker.framerate = 60;
  createjs.Ticker.addEventListener("tick", onTick);

  // Add pause/resume button listeners
  const pauseBtn = document.getElementById("pauseBtn");
  const resumeBtn = document.getElementById("resumeBtn");
  pauseBtn.addEventListener("click", () => {
    isPaused = true;
    pauseBtn.style.display = "none";
    resumeBtn.style.display = "inline-block";
  });
  resumeBtn.addEventListener("click", () => {
    isPaused = false;
    resumeBtn.style.display = "none";
    pauseBtn.style.display = "inline-block";
  });

  // Global error handler
  window.onerror = function(message, source, lineno, colno, error) {
    showError(message + (error && error.stack ? ("\n" + error.stack) : ""));
    return true;
  };
}

function onTick() {
  if (isPaused) return;
  try {
    updateSceneElements();
    // Show heuristic value live, but only if a mandala exists
    const heuristicDiv = document.getElementById("heuristic-value");
    const reasonsDiv = document.getElementById("heuristic-reasons");
    if (window.mandalas && window.mandalas.length > 0) {
      const m = window.mandalas[0];
      const regionAreas = estimateMandalaRegionAreas(m, 24);
      // Draw colored overlays for regions using BezierShape logic
      if (typeof m.drawColoredRegions === 'function') {
        const regionColors = getRegionColors(m.segments);
        m.drawColoredRegions(context, regionColors, 24);
      }
      const heuristicResult = mandalaHeuristic(true, regionAreas);
      if (heuristicDiv) {
        heuristicDiv.style.display = 'block';
        heuristicDiv.innerHTML = heuristicResult.display;
      }
      if (reasonsDiv) {
        if (heuristicResult && heuristicResult.reasons && heuristicResult.reasons.length) {
          reasonsDiv.style.display = 'block';
          reasonsDiv.innerHTML = '<b>Reasons:</b> ' + heuristicResult.reasons.map(r => `<span style="margin-right:8px;">${r}</span>`).join('');
        } else {
          reasonsDiv.style.display = 'none';
          reasonsDiv.innerHTML = '';
        }
      }
      // Heuristic evaluation after drawing
      if (heuristicResult.value) {
        isPaused = true;
        const pauseBtn = document.getElementById("pauseBtn");
        const resumeBtn = document.getElementById("resumeBtn");
        if (pauseBtn && resumeBtn) {
          pauseBtn.style.display = "none";
          resumeBtn.style.display = "inline-block";
        }
        showError("🎨 Great mandala found! Generation paused. Ready to paint!");
      } else {
        hideError();
      }
    } else {
      if (heuristicDiv) {
        heuristicDiv.style.display = 'block';
        heuristicDiv.innerHTML = '<b>Heuristic:</b> <span style="color:gray">No mandala yet.</span>';
      }
      if (reasonsDiv) {
        reasonsDiv.style.display = 'none';
        reasonsDiv.innerHTML = '';
      }
      hideError();
    }
  } catch (err) {
    showError(err.message + (err.stack ? ("\n" + err.stack) : ""));
  }
}
// Heuristic: returns {value: boolean, display: string} for coloring suitability
function mandalaHeuristic(verbose) {
  if (!window.mandalas || !window.mandalas.length) return { value: false, score: 0, display: 'No mandala.', reasons: [] };
  const m = window.mandalas[0];
  let reasons = [];
  let value = true;
  let score = 0;
  // Penalize if any region is too small (not colorable)
  let minRegionArea = 0.002; // This is a normalized area; tweak as needed
  // Accept regionAreas as an optional argument for color mapping
  let regionAreas = arguments.length > 1 && Array.isArray(arguments[1]) ? arguments[1] : estimateMandalaRegionAreas(m, 24);
  let tooSmall = regionAreas.some(a => a < minRegionArea);
  if (tooSmall) {
    value = false;
    reasons.push('Some regions too small to color');
  }
  // Prefer 6-12 segments for colorability
  if (m.segments >= 6 && m.segments <= 12) { score++; } else { value = false; reasons.push('Segments not 6-12'); }
  // Prefer moderate scale (not too small or too large)
  if (m.scale >= 0.97 && m.scale <= 1.08) { score++; } else { value = false; reasons.push('Scale not ideal'); }
  // Prefer curves that are not too wild and not too tight
  const c1x = Math.abs(m.control1.x);
  const c1y = Math.abs(m.control1.y);
  const c2x = Math.abs(m.control2.x);
  const c2y = Math.abs(m.control2.y);
  if ((c1x > 0.2 && c1x < 1.3) && (c1y > 0.2 && c1y < 1.3) && (c2x > 0.2 && c2x < 1.6) && (c2y > 0.2 && c2y < 1.6)) {
    score++;
  } else {
    value = false;
    reasons.push('Curves too wild or too tight');
  }
  // Avoid too much overlap at the center (stricter threshold)
  if (!(c1x < 0.15 && c1y < 0.15 && c2x < 0.15 && c2y < 0.15)) {
    score++;
  } else {
    value = false;
    reasons.push('Too much overlap at center');
  }
  // Prefer some spread between control points, but not too much
  const spread = Math.sqrt(Math.pow(m.control1.x - m.control2.x, 2) + Math.pow(m.control1.y - m.control2.y, 2));
  if (spread > 0.15 && spread < 1.5) { score++; } else { value = false; reasons.push('Spread not ideal'); }
  let display = `<div style='font-size:2.1em;font-weight:bold;color:${score === 5 ? 'green' : score >= 3 ? 'orange' : 'red'};line-height:1.1;'>${score}/5</div>`;
  display += `<div style='font-size:1.1em;'><b>Status:</b> <span style='color:${value ? 'green' : 'red'}'>${value ? 'Great!' : 'Not great'}</span></div>`;
  if (verbose) {
    const safeNum = v => (typeof v === 'number' && isFinite(v)) ? v.toFixed(2) : '?';
    const segs = (typeof m.segments === 'number') ? m.segments : '?';
    const scale = safeNum(m.scale);
    const c1xVal = m.control1 && typeof m.control1.x === 'number' ? m.control1.x : undefined;
    const c1yVal = m.control1 && typeof m.control1.y === 'number' ? m.control1.y : undefined;
    const c2xVal = m.control2 && typeof m.control2.x === 'number' ? m.control2.x : undefined;
    const c2yVal = m.control2 && typeof m.control2.y === 'number' ? m.control2.y : undefined;
    const c1x = safeNum(c1xVal);
    const c1y = safeNum(c1yVal);
    const c2x = safeNum(c2xVal);
    const c2y = safeNum(c2yVal);
    const c1xAbs = safeNum(Math.abs(c1xVal));
    const c1yAbs = safeNum(Math.abs(c1yVal));
    const c2xAbs = safeNum(Math.abs(c2xVal));
    const c2yAbs = safeNum(Math.abs(c2yVal));
    const spread = safeNum(Math.sqrt(Math.pow((c1xVal ?? 0) - (c2xVal ?? 0), 2) + Math.pow((c1yVal ?? 0) - (c2yVal ?? 0), 2)));
    const minRegionArea = (Array.isArray(regionAreas) && regionAreas.length) ? safeNum(Math.min(...regionAreas)) : '?';
    // Color each region area value to match the overlay
    let areaSpans = '?';
    if (Array.isArray(regionAreas) && regionAreas.length) {
      const colors = getRegionColors(regionAreas.length);
      areaSpans = regionAreas.map((a, i) => `<span style="color:${colors[i].replace(/, 0\.35\)/, ', 1)')}">${safeNum(a)}</span>`).join(", ");
    }
    display += `<div style='font-size:0.98em;'><small>
      Segments: ${segs}, Scale: ${scale}<br>
      c1: (${c1x}, ${c1y}), c2: (${c2x}, ${c2y})<br>
      |c1|: (${c1xAbs}, ${c1yAbs}), |c2|: (${c2xAbs}, ${c2yAbs})<br>
      Spread: ${spread}, Min region area: ${minRegionArea}<br>
      All region areas: [${areaSpans}]
    </small></div>`;
  }
  return { value, score, display, reasons };
}

// Attach init to window for HTML onload
window.init = init;

function resizeCanvas() {
  // Make canvas fill the square frame responsively
  const frame = document.getElementById("mandala-frame");
  // Use getBoundingClientRect to get the actual rendered size
  const rect = frame.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height);
  canvas.width = size;
  canvas.height = size;
  updateSceneElements();
}
// Error display helpers
function showError(msg) {
  const errorDiv = document.getElementById("error-message");
  if (errorDiv) {
    errorDiv.textContent = msg;
    errorDiv.style.display = "block";
  }
}

function hideError() {
  const errorDiv = document.getElementById("error-message");
  if (errorDiv) {
    errorDiv.textContent = "";
    errorDiv.style.display = "none";
  }
}

function handleKeyDown(e) {
  if (e.code === "Space") {
    isPaused = !isPaused;
    // Update button visibility if present
    const pauseBtn = document.getElementById("pauseBtn");
    const resumeBtn = document.getElementById("resumeBtn");
    if (pauseBtn && resumeBtn) {
      if (isPaused) {
        pauseBtn.style.display = "none";
        resumeBtn.style.display = "inline-block";
      } else {
        resumeBtn.style.display = "none";
        pauseBtn.style.display = "inline-block";
      }
    }
  }
}
