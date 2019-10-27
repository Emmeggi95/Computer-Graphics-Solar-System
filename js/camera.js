/**
 * Set camera and compute camera movement through user interaction with mouse and keyboard.
 * 
 * cx, cy, cz are camera coordinates
 * tx, ty, tz are target coordinates
 * ux, uy, uz define the "up" vector
 * 
 * Camera matrices are computed every time the scene is drawn on the screen (moveCamera() is called by draw.js).
 * 
 * You can move through the scene dragging it with the mouse or using arrows. To move up/down, left/right the values of tz and tx are changed.
 * 
 * You can zoom in and out using mouse wheel. The values of cy and fov are changed to set zoom.
 * 3 "zoom bands" are defined: the one between two cy limits (band 0), the one where lower cy bound is reached (band -1) and the one where upper cy limit is reached (band 1).
 * When in band 0, only the value of cy is changed. Fov is set at defaultFov in this band.
 * When in band -1 or 1, only the value of fov is changed. When fov oversteps defaultFov, the scene returns in band 0.
 * 
 * Fov has upper and lower limits.
 * You can direcly change fov by pressing + and -. When you change fov in band 0, also defaultFov is changed.
 * 
 * You can also change manually the values of c[], t[] and u[]: 
 * T, Y, U: increase c[], t[] and u[]
 * G, H, J: decrease c[], t[] and u[]
 * B, N, M: select coordinate (x, y or z)
 * O, P: decrease/increase step size
 * 
 */

// Camera vaules
var cx = 0.0,
  cy = 50.0,
  cz = 0.0,
  tx = 0.0,
  ty = 0.0,
  tz = 0.0,
  ux = 0.0,
  uy = 0.0,
  uz = 1.0;
var cameraPosition;
var target;
var up;

// Matrices needed for camera
var projectionMatrix, viewProjectionMatrix;

// HTML elements
var info = document.getElementById ('info');
var selection = 0;
var selected = 'X';

// Camera control parameters
var trackLeftRight = 0;
var pushInPullOut = 0;
var craneUpDown = 0;

var step = 0.5;

var fov = 60;

var defaultFov = 60;
var zoomBand = 0;

var animated = true;

var zoomPrecision = 100; // Under this value the zoom speed is costant, over this value it accelerates.

// Camera limits;
var fovMin = 10,
  fovMax = 160,
  cyMin = 5,
  cyMax = 600,
  txMin = -600,
  txMax = 600,
  tzMin = -600,
  tzMax = 600;
  czMax = tzMax,
  czMin = tzMin,
  cxMax = txMax,
  cxMin = txMin;

// Mouse interaction parameters
var lastX = 0, lastY = 0;
var dMouseX = 0, dMouseY = 0;
var trackingMouseMotion = false;

function initCameraInteraction () {
  initMouseMotionCallback ();
  initKeyboardCallback ();
  initWheelCallback ();
}

function moveCamera () {
  // Apply movemets registered from mouse or keyboard
  if (craneUpDown != 0) {
    cz += craneUpDown;
    cz = Math.max (cz, czMin);
    cz = Math.min (cz, czMax);
    craneUpDown = 0;
  }
  if (trackLeftRight != 0) {
    cx -= trackLeftRight;
    cx = Math.max (cx, cxMin);
    cx = Math.min (cx, cxMax);
    trackLeftRight = 0;
  }
  if (pushInPullOut != 0) {
    switch (zoomBand) {
      // If you are between cy limits, change cy value
      case 0: 
        if (cy > zoomPrecision) {
          // Zoom faster when you zoom out a lot
          cy -= pushInPullOut * cy / zoomPrecision;
        } else {
          cy -= pushInPullOut;
        }
        if (cy < cyMin) {
          cy = cyMin;
          fov -= pushInPullOut;
          zoomBand = -1;
        } else if (cy > cyMax) {
          cy = cyMax;
          fov -= pushInPullOut;
          zoomBand = 1;
        }
        break;
      // Else, change fov value
      case -1:
        fov -= pushInPullOut;
        if (fov > defaultFov) {
          fov = defaultFov;
          cy -= pushInPullOut;
          zoomBand = 0;
        }
        break;
      case 1:
        fov -= pushInPullOut;
        if (fov < defaultFov) {
          fov = defaultFov;
          cy -= pushInPullOut;
          zoomBand = 0;
        }
        break;
    }
    pushInPullOut = 0;
  }

  // Synct c and t
  tx = cx;
  ty = cy - 1;
  tz = cz;

  limit ();

  // Recompute camera matrices
  cameraPosition = [cx, cy, cz];
  target = [tx, ty, tz];
  up = [ux, uy, uz];

  projectionMatrix = utils.MakePerspective (
    fov,
    gl.canvas.width / gl.canvas.height,
    1.0,
    2000.0
  );

  var cameraMatrix = utils.LookAt (cameraPosition, target, up);

  viewMatrix = utils.invertMatrix (cameraMatrix);

  viewProjectionMatrix = utils.multiplyMatrices (projectionMatrix, viewMatrix);

  // Print camera values on screen
  info.innerHTML =
    'cx: ' +
    cx.toFixed (2) +
    '<br>cy: ' +
    cy.toFixed (2) +
    '<br>cz: ' +
    cz.toFixed (2) +
    '<br>tx: ' +
    tx.toFixed (2) +
    '<br>ty: ' +
    ty.toFixed (2) +
    '<br>tz: ' +
    tz.toFixed (2) +
    '<br>ux: ' +
    ux.toFixed (2) +
    '<br>uy: ' +
    uy.toFixed (2) +
    '<br>uz: ' +
    uz.toFixed (2) +
    '<br>fov: ' +
    fov.toFixed(2) +
    '<br>step: ' +
    step.toFixed(1) +
    '<br>selected: ' +
    selected +
    '<br>zoom band: ' +
    zoomBand;
}

// Avoid breking the limits
function limit () {
  fov = Math.min (fov, fovMax);
  fov = Math.max (fov, fovMin);
}

// Register mouse callback functions
function initMouseMotionCallback () {
  // If a mouse button is pressed, save the current mouse location
  // and start tracking mouse motion.
  canvas.onmousedown = function (event) {
    var x = event.clientX;
    var y = event.clientY;

    var rect = event.target.getBoundingClientRect ();
    // Check if the mouse cursor is in canvas.
    if (rect.left <= x && rect.right > x && rect.top <= y && rect.bottom > y) {
      lastX = x;
      lastY = y;
      trackingMouseMotion = true;
    }
  };

  // If the mouse button is release, stop tracking mouse motion.
  canvas.onmouseup = function (event) {
    trackingMouseMotion = false;
  };

  // Calculate how far the mouse cusor has moved and convert the mouse motion
  // to rotation angles.
  canvas.onmousemove = function (event) {
    var x = event.clientX;
    var y = event.clientY;

    if (trackingMouseMotion) {
      var scale = 1;
      // Calculate how much the mouse has moved along X and Y axis, and then
      // normalize them based on the canvas' width and height.
      dMouseX = (x - lastX) / canvas.width;
      dMouseY = (y - lastY) / canvas.height;

      // For camera pitch and yaw motions
      scale = 30;
      // Add the mouse motion to the current rotation angle so that the rotation
      // is added to the previous rotations.
      // Use scale to control the speed of the rotation.
      trackLeftRight -= scale * dMouseX * cy / 20 * fov / 60;

      craneUpDown += scale * dMouseY * cy / 20 * fov / 60;
    }

    // Save the current mouse location in order to calculate the next mouse motion.
    lastX = x;
    lastY = y;
  };
}

// Register a keyboard callback function.
function initKeyboardCallback () {
  document.onkeydown = function (event) {
    switch (event.keyCode) {
      case 65: // A
        animated = !animated;
        break;
      case 37: // Arrow left
        trackLeftRight -= step;
        break;
      case 38: // Arrow up
        //pushInPullOut += step;
        craneUpDown += step;
        break;
      case 39: // Arrow right
        trackLeftRight += step;
        break;
      case 40: // Arrow down
        //pushInPullOut -= step;
        craneUpDown -= step;
        break;
      case 107: // +
        fov -= step;
        fov = Math.max (fov, fovMin); // lower limit of fov
        if (zoomBand == 0) {
          defaultFov = fov;
        }
        break;
      case 109: // -
        fov += step;
        fov = Math.min (fov, fovMax); // upper limit of fov
        if (zoomBand == 0) {
          defaultFov = fov;
        }
        break;
      // Manually set values
      case 84: // T
        switch (selection) {
          case 0:
            cx += step;
            break;
          case 1:
            cy += step;
            break;
          case 2:
            cz += step;
            break;
        }
        break;
      case 71: // G
        switch (selection) {
          case 0:
            cx -= step;
            break;
          case 1:
            cy -= step;
            break;
          case 2:
            cz -= step;
            break;
        }
        break;
      case 89: // Y
        switch (selection) {
          case 0:
            tx += step;
            break;
          case 1:
            ty += step;
            break;
          case 2:
            tz += step;
            break;
        }
        break;
      case 72: // H
        switch (selection) {
          case 0:
            tx -= step;
            break;
          case 1:
            ty -= step;
            break;
          case 2:
            tz -= step;
            break;
        }
        break;
      case 85: // U
        switch (selection) {
          case 0:
            ux += step;
            break;
          case 1:
            uy += step;
            break;
          case 2:
            uz += step;
            break;
        }
        break;
      case 74: // J
        switch (selection) {
          case 0:
            ux -= step;
            break;
          case 1:
            uy -= step;
            break;
          case 2:
            uz -= step;
            break;
        }
        break;
      case 66: // B
        selection = 0;
        selected = 'X';
        break;
      case 78: // N
        selection = 1;
        selected = 'Y';
        break;
      case 77: // M
        selection = 2;
        selected = 'Z';
        break;
      
      // Change step size
      case 80: // P
        step += 0.5;
        break;
      case 79: // O
        step -= 0.5;
        step = Math.max(step, 0.5);
        break;

      
      // Angle
      case 90: // Z
        angle -= 5;
        break;
      case 88: // X
        angle += 5;
        break;
      default:
        return;
    }
  };
}

// Init wheel interation for zooming
function initWheelCallback () {
  document.onwheel = function (event) {
    pushInPullOut -= event.deltaY * 0.05;
  };
}
