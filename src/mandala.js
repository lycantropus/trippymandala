// Constants
const EXPORT_FORMAT = "PNG";
const SEGMENT_WIDTH = canvas.width / 2;
const SEGMENT_HEIGHT = canvas.width / 2;

let snapshotIndex = 0;

// SVG Constants
const SVG_HEADER = `
  <svg xmlns='http://www.w3.org/2000/svg' width='640' height='640' style='stroke:#000000;stroke-width:1;fill:none;'>
    <rect x='0' y='0' width='640' height='640' style='fill:none;stroke:#000000;stroke-width:1;' />
`;
const SVG_FOOTER = "</svg>";
let svgContent = "";

class BezierShape {
  // Draw colored overlays for each region using the same transforms as the main drawing
  drawColoredRegions(context, regionColors, samplePoints = 32) {
    if (!context || !regionColors || !regionColors.length) return;
    const segs = this.segments;
    const canvasW = canvas.width / 2;
    const canvasH = canvas.height / 4;
    // Use the same symmetry logic as renderSegments
    // For each visible region, use the same transform/flip logic as the main Bezier drawing
    const regionCanvasW = canvas.width / 2;
    const regionCanvasH = canvas.height / 4;
    let filledCount = 0;
    for (let i = 0; i < segs; i++) {
      const rotation = (i / segs) * 360 - 90;
      const symmetries = [
        [1, 1],   // normal
        [-1, 1],  // mirror x
        [1, -1],  // mirror y
        [-1, -1]  // mirror both
      ];
      for (const [sx, sy] of symmetries) {
        for (let n = 0; n < 2; n++) {
          const isFlipped = i % this.flip;
          let coords = this.getCoordinates(regionCanvasW, regionCanvasH, isFlipped ? 1 : 0, false, n % 2 === 0 ? 1 : -1);
          if (isFlipped) coords = this.swapBezierCoords(coords);
          context.save();
          context.translate(canvas.width / 2, canvas.height / 2);
          context.rotate(rotation * Math.PI / 180);
          context.scale(this.scale * sx, this.scale * sy);
          context.beginPath();
          context.moveTo(coords[0] - regionCanvasW, coords[1] - regionCanvasH);
          context.bezierCurveTo(
            coords[2] - regionCanvasW, coords[3] - regionCanvasH,
            coords[4] - regionCanvasW, coords[5] - regionCanvasH,
            coords[6] - regionCanvasW, coords[7] - regionCanvasH
          );
          // Make overlays more transparent (alpha 0.18)
          let color = regionColors[i];
          color = color.replace(/,\s*0\.[0-9]+\)/, ', 0.35)');
          context.fillStyle = color;
          context.fill();
          context.strokeStyle = 'black';
          context.lineWidth = 1.5;
          context.stroke();
          context.restore();
        }
      }
    }
    // Draw black stroke for all visible regions (all symmetries)
    for (let i = 0; i < segs; i++) {
      const rotation = (i / segs) * 360 - 90;
      const symmetries = [
        [1, 1],   // normal
        [-1, 1],  // mirror x
        [1, -1],  // mirror y
        [-1, -1]  // mirror both
      ];
      for (const [sx, sy] of symmetries) {
        context.save();
        context.translate(canvas.width / 2, canvas.height / 2);
        context.rotate(rotation * Math.PI / 180);
        context.scale(this.scale * sx, this.scale * sy);
        for (let n = 0; n < 2; n++) {
          const isFlipped = i % this.flip;
          const canvasW = canvas.width / 2;
          const canvasH = canvas.height / 4;
          let coords0 = this.getCoordinates(canvasW, canvasH, isFlipped ? 1 : 0, false, n % 2 === 0 ? 1 : -1);
          if (isFlipped) coords0 = this.swapBezierCoords(coords0);
          let coords1 = this.getCoordinates(canvasW, canvasH, isFlipped ? 1 : 0, false, n % 2 === 0 ? 1 : -1);
          if (isFlipped) coords1 = this.swapBezierCoords(coords1);
          const segPoints0 = [];
          for (let t = 0; t <= 1; t += 1 / samplePoints) {
            const x = Math.pow(1 - t, 3) * coords0[0] + 3 * Math.pow(1 - t, 2) * t * coords0[2] + 3 * (1 - t) * t * t * coords0[4] + Math.pow(t, 3) * coords0[6];
            const y = Math.pow(1 - t, 3) * coords0[1] + 3 * Math.pow(1 - t, 2) * t * coords0[3] + 3 * (1 - t) * t * t * coords0[5] + Math.pow(t, 3) * coords0[7];
            segPoints0.push({ x, y });
          }
          const segPoints1 = [];
          for (let t = 0; t <= 1; t += 1 / samplePoints) {
            const x = Math.pow(1 - t, 3) * coords1[0] + 3 * Math.pow(1 - t, 2) * t * coords1[2] + 3 * (1 - t) * t * t * coords1[4] + Math.pow(t, 3) * coords1[6];
            const y = Math.pow(1 - t, 3) * coords1[1] + 3 * Math.pow(1 - t, 2) * t * coords1[3] + 3 * (1 - t) * t * t * coords1[5] + Math.pow(t, 3) * coords1[7];
            segPoints1.push({ x, y });
          }
          const poly = segPoints0.concat(segPoints1.slice().reverse());
          context.beginPath();
          context.moveTo(poly[0].x, poly[0].y);
          for (let j = 1; j < poly.length; j++) {
            context.lineTo(poly[j].x, poly[j].y);
          }
          context.closePath();
          context.strokeStyle = 'black';
          context.lineWidth = 1.5;
          context.stroke();
        }
        context.restore();
      }
    }
  }
  constructor(lineWidth, sx, sy, c1x, c1y, c2x, c2y, ex, ey, ox, oy, segs, flip, scale, brushOn, bc1y, bc1x, bc2x, bc2y) {
    this.lineWidth = lineWidth;
    this.start = { x: sx, y: sy };
    this.control1 = { x: c1x, y: c1y };
    this.control2 = { x: c2x, y: c2y };
    this.end = { x: ex, y: ey };
    this.offset = { x: ox, y: oy };
    this.segments = segs;
    this.flip = flip;
    this.scale = scale;
    this.brush = { on: brushOn, bc1y, bc1x, bc2x, bc2y };

    stage.update();
  }

  getCoordinates(cw, ch, swap, brushEnabled, reflect) {
    const xOffset = SEGMENT_WIDTH * this.offset.x;
    const yOffset = SEGMENT_HEIGHT * this.offset.y;
    const startX = (cw * this.start.x) + xOffset;
    const startY = (ch * this.start.y) + yOffset;

    let control1X, control1Y, control2X, control2Y;

    if (!brushEnabled) {
      const computeSwap = (val) => val > 0 ? Math.abs(swap - val) : -Math.abs(swap - val);
      control1X = (cw * computeSwap(this.control1.x)) + xOffset;
      control1Y = (ch * (this.start.y + this.control1.y * reflect)) + yOffset;
      control2X = (cw * computeSwap(this.control2.x)) + xOffset;
      control2Y = (ch * (this.start.y + this.control2.y * reflect)) + yOffset;
    } else {
      const scaleX = (val, factor) => val > 0 ? Math.abs(swap - val * factor) : swap + Math.abs(val * factor);
      control1X = (cw * scaleX(this.control1.x, this.brush.bc1x)) + xOffset;
      control1Y = (ch * (this.start.y + (this.control1.y * this.brush.bc1y * reflect))) + yOffset;
      control2X = (cw * scaleX(this.control2.x, this.brush.bc2x)) + xOffset;
      control2Y = (ch * (this.start.y + (this.control2.y * this.brush.bc2y * reflect))) + yOffset;
    }

    const endX = (cw * this.end.x) + xOffset;
    const endY = (ch * this.end.y) + yOffset;

    return [startX, startY, control1X, control1Y, control2X, control2Y, endX, endY];
  }

  draw() {
    this.drawMask();
    this.drawMain();
    this.drawContour();
  }

  drawMask() {
    svgContent = "";
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineWidth = 30;
    context.strokeStyle = '#000000';
    context.strokeRect(0, 0, canvas.width, canvas.height);

    this.renderSegments(true);
  }

  drawMain() {
    context.beginPath();
    this.renderSegments(false);
  }

  drawContour() {
    const canvasW = canvas.width / 2;
    const canvasH = canvas.height / 4;
    const contourSteps = 6; // Moderate complexity

    for (let i = 0; i < this.segments; i++) {
      const rotation = (i / this.segments) * 360 - 90;

      context.save();
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate(rotation * Math.PI / 180);
      context.scale(this.scale, this.scale);

      for (let n = 0; n < 2; n++) {
        const isFlipped = i % this.flip;
        let coords = this.getCoordinates(canvasW, canvasH, isFlipped ? 1 : 0, false, n % 2 === 0 ? 1 : -1);
        if (isFlipped) coords = this.swapBezierCoords(coords);

        const bCoords = this.getCoordinates(canvasW, canvasH, isFlipped ? 1 : 0, true, n % 2 === 0 ? 1 : -1);
        if (isFlipped) bCoords = this.swapBezierCoords(bCoords);

        for (let c = 1; c < contourSteps - 1; c++) {
          const t = c / (contourSteps - 1);

          context.beginPath();
          context.moveTo(coords[0], coords[1]);

          context.bezierCurveTo(
            coords[2] - (coords[2] - bCoords[2]) * t,
            coords[3] - (coords[3] - bCoords[3]) * t,
            coords[4] - (coords[4] - bCoords[4]) * t,
            coords[5] - (coords[5] - bCoords[5]) * t,
            coords[6],
            coords[7]
          );

          context.strokeStyle = '#000';
          context.lineWidth = this.lineWidth;
          context.stroke();
        }
      }

      context.restore();
    }
  }

  renderSegments(isMask) {
    const canvasW = canvas.width / 2;
    const canvasH = canvas.height / 4;

    for (let i = 0; i < this.segments; i++) {
      const rotation = (i / this.segments) * 360 - 90;

      // For each symmetry: normal, x-mirror, y-mirror, xy-mirror
      const symmetries = [
        [1, 1],   // normal
        [-1, 1],  // mirror x
        [1, -1],  // mirror y
        [-1, -1]  // mirror both
      ];

      for (const [sx, sy] of symmetries) {
        context.save();
        context.translate(canvas.width / 2, canvas.height / 2);
        context.rotate(rotation * Math.PI / 180);
        context.scale(this.scale * sx, this.scale * sy);

        for (let n = 0; n < 2; n++) {
          const isFlipped = i % this.flip;
          let coords = this.getCoordinates(canvasW, canvasH, isFlipped ? 1 : 0, false, n % 2 === 0 ? 1 : -1);
          if (isFlipped) coords = this.swapBezierCoords(coords);

          context.beginPath();
          context.moveTo(coords[0], coords[1]);
          context.bezierCurveTo(coords[2], coords[3], coords[4], coords[5], coords[6], coords[7]);

          context.lineWidth = this.lineWidth;
          context.lineCap = 'round';
          context.strokeStyle = 'black';
          context.stroke();
        }

        context.restore();
      }
    }
  }

  swapBezierCoords(coords) {
    return [coords[0], coords[1], coords[4], coords[5], coords[2], coords[3], coords[6], coords[7]];
  }
}

// Usage: Initialize a shape with parameters and call .draw()
// Example:
// const shape = new BezierShape(...);
// shape.draw();


function getRandomValue(scale, offset) {
  const value = (Math.random() * scale) + offset;
  return Math.round(value * 100) / 100;
}

function createMandala() {
  // Allow control points and endpoints to go off the frame for more dynamic mandalas
  const lineWidth = 2; // Fixed width for all lines
  const sx = 0;
  const sy = 0;
  // Bias control points toward (0.22, 0.99) and (0.85, -0.36) for more 'great' mandalas
  const c1x = 0.22 + (Math.random() - 0.5) * 0.25; // Range: ~0.1 to 0.35
  const c1y = 0.99 + (Math.random() - 0.5) * 0.25; // Range: ~0.87 to 1.12
  let c2x = 0.85 + (Math.random() - 0.5) * 0.3;   // Range: ~0.7 to 1.0
  let c2y = -0.36 + (Math.random() - 0.5) * 0.3;  // Range: ~-0.51 to -0.21
  // Add a little extra variety, but keep close to the target
  if (Math.abs(c2x - 0.85) < 0.08) c2x += (Math.random() - 0.5) * 0.08;
  if (Math.abs(c2y + 0.36) < 0.08) c2y += (Math.random() - 0.5) * 0.08;
  // End point can also go off-frame
  const ex = 0.8 + Math.random() * 0.8; // Range: 0.8 to 1.6
  const ey = -0.3 + Math.random() * 0.6; // Range: -0.3 to 0.3
  const ox = 0;
  const oy = 0;
  // Use 6, 8, 10, or 12 segments for better colorability
  const segOptions = [6, 8, 10, 12];
  const segs = segOptions[Math.floor(Math.random() * segOptions.length)];
  const flip = 1;
  // Bias scale toward 1.0 (moderate size)
  const scale = 0.97 + Math.random() * 0.11;
  const brushOn = false; // brush off since fill is removed
  const bc1y = 1.01 + Math.random() * 0.03;
  const bc1x = 1.01 + Math.random() * 0.03;
  const bc2x = 1.01 + Math.random() * 0.03;
  const bc2y = 0.95 + Math.random() * 0.05;

  const shape = new BezierShape(
    lineWidth, sx, sy, c1x, c1y, c2x, c2y, ex, ey, ox, oy,
    segs, flip, scale, brushOn, bc1y, bc1x, bc2x, bc2y
  );
  shape.random_gen?.();
  mandalas.push(shape);
}

const direction = ["DOWN", "DOWN", "DOWN", "DOWN"];

function updateMandalas() {
  for (let mandala of mandalas) {
    // Animate control points
    const updateDirection = (value, index) => {
      if (direction[index] === "DOWN") {
        value -= 0.01;
        if (value <= -2) direction[index] = "UP";
      } else {
        value += 0.01;
        if (value >= 2) direction[index] = "DOWN";
      }
      return value;
    };

    mandala.control1.x = updateDirection(mandala.control1.x, 0);
    mandala.control1.y = updateDirection(mandala.control1.y, 1);
    mandala.control2.x = updateDirection(mandala.control2.x, 2);
    mandala.control2.y = updateDirection(mandala.control2.y, 3);

    mandala.draw();
  }
}
