/**
 * Execute every method necessary to run the application.
 * 
 * We are using the external library, for matrices computation and model loading, contained in utils.js.
 * Other JavaScript files needed for the execution of the application are, in order of loading:
 * webgl.js
 * shaders.js
 * model.js
 * textures.js
 * nodes.js
 * animation.js
 * camera.js
 * draw.js
 * 
 * This application requires the execution of alocal server in its root directory at the port 8889. A simple Phyton server called server.py is provided.
 * 
 * The application was written by Paolo Fumagalli and Marco Gullo, Politecnico di Milano.
 */

initWebGl(); // webgl.js: initialize canvas and webGL context.
if (!gl) {
  // Check if context was initialized correctly.
  document.write("GL context not opened");
} 
else {
  loadShaders(); // Load shader files and set variable handlers in JS.
  loadModel(); // Load model from json and load buffers for positions, UVs and normals.
  loadTextures(); // Load textures from image files.
  buildSceneGraph(); // Build node structure defining planets and orbits.
  startDrawing(); // Set camera and trigger recursive method to draw elements on the screen.
}
