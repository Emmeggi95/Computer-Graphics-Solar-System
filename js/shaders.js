/**
 * Load shader files and set variable handlers in JS.
 */

var shadersDir = "http://127.0.0.1:8889/shaders/";

var program;

// VS locations
var positionLoc, normalLoc, UVLoc, modelProjectionMatrixLoc, worldMatrixLoc;

// FS locations
var textureLoc; // texture
var alColorLoc, alInfluenceLoc; // ambient lighting
var meColorLoc, meInfluenceLoc; // emission material
var plPositionLoc, plColorLoc, plTargetLoc, plDecayLoc; // point light


function loadShaders() {
  utils.loadFiles([shadersDir + "vs.glsl", shadersDir + "fs.glsl"], function(
    shadersText
  ) {
    var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shadersText[0]);
    var fragmentShader = utils.createShader(
      gl,
      gl.FRAGMENT_SHADER,
      shadersText[1]
    );
    program = utils.createProgram(gl, vertexShader, fragmentShader);
  });

  gl.useProgram(program);

  // Set VS locations
  positionLoc = gl.getAttribLocation(program, "position");
  normalLoc = gl.getAttribLocation(program, "normal");
  UVLoc = gl.getAttribLocation(program, "UV");

  modelProjectionMatrixLoc = gl.getUniformLocation(program, "modelProjectionMatrix");
  worldMatrixLoc = gl.getUniformLocation(program, "worldMatrix");

  // Set FS locations
  textureLoc = gl.getUniformLocation(program, "objectTexture");
  alColorLoc = gl.getUniformLocation(program, "alColor");
  alInfluenceLoc = gl.getUniformLocation(program, "alInfluence");
  meColorLoc = gl.getUniformLocation(program, "meColor");
  meInfluenceLoc = gl.getUniformLocation(program, "meInfluence");
  plPositionLoc = gl.getUniformLocation(program, "plPosition");
  plColorLoc = gl.getUniformLocation(program, "plColor");
  plTargetLoc = gl.getUniformLocation(program, "plTarget");
  plDecayLoc = gl.getUniformLocation(program, "plDecay");
}
