let canvas, context, stage;
let isPaused = false;

function init() {
  canvas = document.getElementById("canvas");
  context = canvas.getContext("2d");
  stage = new createjs.Stage(canvas);

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("keydown", handleKeyDown);

  resizeCanvas();
  createSceneElements();

  createjs.Ticker.framerate = 60;
  createjs.Ticker.addEventListener("tick", onTick);
}

function onTick() {
  if (isPaused) return;
  updateSceneElements();
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  updateSceneElements();
}

function handleKeyDown(e) {
  if (e.code === "Space") {
    isPaused = !isPaused;
  }
}
