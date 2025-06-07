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
    const contourSteps = 8;

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
          context.lineWidth = this.lineWidth * 3;
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

      context.save();
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate(rotation * Math.PI / 180);
      context.scale(this.scale, this.scale);

      for (let n = 0; n < 2; n++) {
        const isFlipped = i % this.flip;
        let coords = this.getCoordinates(canvasW, canvasH, isFlipped ? 1 : 0, false, n % 2 === 0 ? 1 : -1);
        if (isFlipped) coords = this.swapBezierCoords(coords);

        context.beginPath();
        context.moveTo(coords[0], coords[1]);
        context.bezierCurveTo(coords[2], coords[3], coords[4], coords[5], coords[6], coords[7]);

        if (this.brush.on && !isMask) {
          let bCoords = this.getCoordinates(canvasW, canvasH, isFlipped ? 1 : 0, true, n % 2 === 0 ? 1 : -1);
          if (isFlipped) bCoords = this.swapBezierCoords(bCoords);

          context.moveTo(bCoords[6], bCoords[7]);
          context.bezierCurveTo(bCoords[4], bCoords[5], bCoords[2], bCoords[3], bCoords[0], bCoords[1]);
          context.fillStyle = '#fff';
          context.fill();
        }

        context.lineWidth = this.lineWidth;
        context.lineCap = 'round';
        context.strokeStyle = 'black';
        context.stroke();
      }

      context.restore();
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
  const shape = new BezierShape(
    1, 0, 0, 0.25, 0.5, 0.75, -1, 1, 0, 0, 0,
    8, 1, 1, true, 1.13, 1.07, 1.18, 0.62
  );
  shape.random_gen?.(); // Optional chaining, in case random_gen is defined later
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
