/**
 * Set camera and trigger recursive method to draw elements on the screen.
 */

// Matrices
var perspectiveMatrix, viewMatrix, worldMatrix, viewWorldMatrix;
// Projection matrix and view projection matrix are in camera.js

/**
 * FS values
 */

// Ambient lighting
var alColor = [1.0, 1.0, 1.0];
var alInfluence = 0.3; // Must be between 0 and 1

// Specular light
var mSpecColor = [0.5, 0.5, 0.5, 1.0];
var mSpecPower = 12.0;
// Material emission
var brightMaterialColor = [1.0, 1.0, 1.0];
var darkMaterialColor = [0.0, 0.0, 0.0];
// meInfluence is in animation.js

// Point light
var plPosition = [0.0, 0.0, 0.0];
var plColor = [0.945, 0.855, 0.643];
var plTarget = 10.0;
var plDecay = 0.05;

function startDrawing () {
  initMatrices ();
  initCameraInteraction ();
  drawScene ();
}

function initMatrices () {
  perspectiveMatrix = utils.MakePerspective (
    90,
    gl.canvas.width / gl.canvas.height,
    0.1,
    100.0
  );
  viewMatrix = utils.MakeView (1.5, 0.0, 3.0, 0.0, -30.0);
}

function drawScene (time) {
  time *= 0.001;

  // Clear the canvas
  initBackground ();

  // Animate
  stoppableAnimations ();
  independentAnimations ();

  // Update all world matrices in the scene graph starting from the orbit of the sun (cascade)
  sunOrbitNode.updateWorldMatrix ();

  // Set all the values in the shader to render objects
  renderObjects ();

  // Recursively draw the scene
  window.requestAnimationFrame (drawScene);
}

function renderObjects () {
  // Set camera
  if (moving) {
    moveCamera ();
  }
  
  // Set constant shader values
  gl.uniform3fv (alColorLoc, alColor);
  
  gl.uniform3fv (plPositionLoc, plPosition);
  
  gl.uniform1f (plTargetLoc, plTarget);
  gl.uniform1f (plDecayLoc, plDecay);
  gl.uniform3fv(eyePositionLoc, cameraPosition);
  gl.uniform1f(mSpecPowerLoc, mSpecPower);
  
  gl.uniform3fv(targetPositionLoc, target);

  // Set values for each object
  objects.forEach (function (object, index) {
    var modelProjectionMatrix;

    gl.useProgram (object.drawInfo.programInfo);

    // Compute matrices and send them to shader
    modelProjectionMatrix = utils.multiplyMatrices (
      viewProjectionMatrix,
      object.worldMatrix
    );

    gl.uniformMatrix4fv (
      modelProjectionMatrixLoc,
      gl.FALSE,
      utils.transposeMatrix (modelProjectionMatrix)
    );

    gl.uniformMatrix4fv (
      worldMatrixLoc,
      gl.FALSE,
      utils.transposeMatrix (object.worldMatrix)
    );

    // Set texture
    gl.activeTexture (gl.TEXTURE0);
    gl.bindTexture (gl.TEXTURE_2D, textures[index]);

    // Set material emission
    if (index == 0) {
      // Sun
      gl.uniform3fv (meColorLoc, brightMaterialColor);
    } else {
      // Other planets
      gl.uniform3fv (meColorLoc, darkMaterialColor);
    }
    gl.uniform1f (meInfluenceLoc, meInfluence);

    if(index == objects.length - 1) { // Stars background
      gl.uniform1f (alInfluenceLoc, 1.0);
      gl.uniform3fv (plColorLoc, [0.0, 0.0, 0.0]);
      gl.uniform4fv(mSpecColorLoc, [0.0, 0.0, 0.0, 0.0]);
    } else {
      gl.uniform1f (alInfluenceLoc, alInfluence);
      gl.uniform3fv (plColorLoc, plColor);
      gl.uniform4fv(mSpecColorLoc, mSpecColor);
    }

    // Bind VAO
    gl.bindVertexArray (object.drawInfo.vertexArray);

    // Render
    gl.drawElements (
      gl.TRIANGLES,
      object.drawInfo.bufferLength,
      gl.UNSIGNED_SHORT,
      0
    );
  });
}
