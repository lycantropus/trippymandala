var canvas;
var stage;
var context;
function init() {
	// resize event listener
	window.addEventListener('resize', resize, false);

	// create a new stage and point it at our canvas:
	canvas = document.getElementById('canvas');
	stage = new createjs.Stage(canvas);
	context = canvas.getContext('2d');
	createSceneElements();
	
	resize();

	// Ticker
	createjs.Ticker.setFPS(60);
	createjs.Ticker.addEventListener('tick', tick);

}


function tick(event) {
	updateSceneElements();
}

function resize() { 
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	updateSceneElements();
}