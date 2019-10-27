/**
 * Initialize canvas and webGL context.
 */

var canvas, gl;


function initWebGl() {
  canvas = document.getElementById("c");
  gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  // Init canvas
  initBackground();
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.enable(gl.DEPTH_TEST);
}

function initBackground() {
  resize(canvas);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  canvas.style.background =
    "url('http://127.0.0.1:8889/assets/textures/StarsMilkyWay.jpg')";
}

function resize(canvas) {
  var displayWidth = window.innerWidth;
  var displayHeight = window.innerHeight;

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
}
