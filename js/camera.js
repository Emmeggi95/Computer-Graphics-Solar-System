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

// Constant values
const DEFAULT_FOV = 60, DEFAULT_DISTANCE = 50;

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
var navigation = document.getElementById ('navigation');
var planetName = document.getElementById ('planet_name');
var lookSunButton = document.getElementById ('look_sun_button');

// Camera control parameters
var trackLeftRight = 0;
var pushInPullOut = 0;
var craneUpDown = 0;

var moveVector = [0.0, 0.0, 0.0];

var step = 0.5;

var fov = 60;
var nearPlane = 1.0;
var farPlane = 2000.0;

var defaultFov = 60;
var zoomBand = 0;

var animated = true;

var zoomPrecision = 100; // Under this value the zoom speed is costant, over this value it accelerates.

// Camera rotation
var pitchAngle = 0.0; // Vertical rotation around x axis
var yawAngle = 0.0; // Horizontal rotation around y axis
var rollAngle = 0.0; // Rotation around z axis

var angleStep = 5;

// The rotation is computed starting from default vectors
var cuDefault = [0.0, 0.0, 1.0]; // Default c-u vector
var tcDefault = [0.0, 1.0, 0.0]; // Default t-c vector
var tc;

var distance = 50;

var planetSelected;
var free = true; // False if the user selected a planet
var px, py, pz;
var lookToTheSun = false;
var ctLockedDefault = [0.0, 0.0, 1.0];
var cuLockedDefault = [0.0, 1.0, 0.0];
var ct;

// Camera limits;
var fovMin = 10,
  fovMax = 160,
  cyMin = 5,
  cyMax = 600,
  txMin = -600,
  txMax = 600,
  tzMin = -600,
  tzMax = 600,
  czMax = tzMax,
  czMin = tzMin,
  cxMax = txMax,
  cxMin = txMin,
  distanceMin = 5,
  distanceMax = 600,
  pitchAngleMax = 85,
  pitchAngleMin = 0;

// Mouse interaction parameters
var lastX = 0, lastY = 0;
var dMouseX = 0, dMouseY = 0;
var trackingMouseMotion = false;

// Kill
var moving = true;

function initCameraInteraction () {
  var planetsPanel = document.getElementById ('planets');

  orbits.forEach (function (orbit, index) {
    var button = document.createElement ('BUTTON');
    var name = document.createTextNode (orbit.name);
    button.appendChild (name);
    button.onclick = function () {
      selectPlanet (index);
    };
    planetsPanel.appendChild (button);
  });

  var freeButton = document.createElement ('BUTTON');
  var text = document.createTextNode ('FREE');
  freeButton.appendChild (text);
  freeButton.onclick = function () {
    freeCamera ();
  };
  planetsPanel.appendChild (freeButton);

  initMouseMotionCallback ();
  initKeyboardCallback ();
  initWheelCallback ();
}

function moveCamera () {
  if (free) {
    // Apply movemets registered from mouse or keyboard
    if (craneUpDown != 0 || trackLeftRight != 0) {
      moveVector = [-trackLeftRight, craneUpDown];
      [tx, tz] = sum2dVectors (
        [tx, tz],
        rotate2dVector (moveVector, -yawAngle, 1.0)
      );
      craneUpDown = 0;
      trackLeftRight = 0;
    }
    // Zooming
    if (pushInPullOut != 0) {
      switch (zoomBand) {
        // If you are between cy limits, change cy value
        case 0:
          if (distance > zoomPrecision) {
            // Zoom faster when you zoom out a lot
            distance -= pushInPullOut * distance / zoomPrecision;
          } else {
            distance -= pushInPullOut;
          }
          if (distance < distanceMin) {
            distance = distanceMin;
            fov -= pushInPullOut;
            zoomBand = -1;
          } else if (distance > distanceMax) {
            distance = distanceMax;
            fov -= pushInPullOut;
            zoomBand = 1;
          }
          break;
        // Else, change fov value
        case -1:
          fov -= pushInPullOut;
          if (fov > defaultFov) {
            fov = defaultFov;
            distance -= pushInPullOut;
            zoomBand = 0;
          }
          break;
        case 1:
          fov -= pushInPullOut;
          if (fov < defaultFov) {
            fov = defaultFov;
            distance -= pushInPullOut;
            zoomBand = 0;
          }
          break;
      }
      pushInPullOut = 0;
    }

    // Compute t and u
    tc = rotate3dVector (tcDefault, yawAngle, pitchAngle, distance);
    cx = tx + tc[0];
    cy = ty + tc[1];
    cz = tz + tc[2];

    [ux, uy, uz] = rotate3dVector (cuDefault, yawAngle, pitchAngle, 1.0);
  } else {
    // POV is inside one planet
    var pw = utils.multiplyMatrixVector (
      utils.transposeMatrix (orbits[planetSelected].worldMatrix),
      [px, py, pz, 1.0]
    );
    cx = pw[0];
    cy = pw[1];
    cz = -pw[2];

    if (lookToTheSun) {
      tx = 0.0;
      ty = 0.0;
      tz = 0.0;

      ux = 0.0;
      uy = 1.0;
      uz = 0.0;

      pitchAngle = 0;
      yawAngle = angleBetween2dVectors ([1.0, 0.0], [-cz, -cx]);
    } else {
      ct = rotate3dVector (ctLockedDefault, yawAngle, pitchAngle, 1.0);
      [tx, ty, tz] = sum3dVectors ([cx, cy, cz], ct);

      [ux, uy, uz] = rotate3dVector (
        cuLockedDefault,
        yawAngle,
        pitchAngle,
        1.0
      );
    }

    // Zoom
    if (pushInPullOut != 0) {
      fov -= pushInPullOut;
      pushInPullOut = 0;
    }
  }

  limit ();

  // Recompute camera matrices
  cameraPosition = [cx, cy, cz];
  target = [tx, ty, tz];
  up = [ux, uy, uz];

  projectionMatrix = utils.MakePerspective (
    fov,
    gl.canvas.width / gl.canvas.height,
    nearPlane,
    farPlane
  );

  var cameraMatrix = utils.LookAt (cameraPosition, target, up);

  viewMatrix = utils.invertMatrix (cameraMatrix);

  viewProjectionMatrix = utils.multiplyMatrices (projectionMatrix, viewMatrix);

  printInfo ();
}

function printInfo () {
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
    fov.toFixed (2) +
    '<br>step: ' +
    step.toFixed (1) +
    '<br>selected: ' +
    selected +
    '<br>zoom band: ' +
    zoomBand +
    '<br>yaw angle: ' +
    yawAngle.toFixed(2) +
    '<br>pitch angle: ' +
    pitchAngle.toFixed(2) +
    '<br>moving: ' +
    moving +
    '<br>look at the sun: ' +
    lookToTheSun;
}

// Avoid breking the limits
function limit () {
  fov = Math.min (fov, fovMax);
  fov = Math.max (fov, fovMin);
  tx = Math.min (txMax, Math.max (tx, txMin));
  tz = Math.min (tzMax, Math.max (tz, tzMin));
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

      if (free) {
        // For camera pitch and yaw motions
        scale = 30;
        // Add the mouse motion to the current rotation angle so that the rotation
        // is added to the previous rotations.
        // Use scale to control the speed of the rotation.
        trackLeftRight -= scale * dMouseX * cy / 20 * fov / 60;

        craneUpDown += scale * dMouseY * cy / 20 * fov / 60;
      } else {
        // For camera pitch and yaw motions
        scale = 30;
        // Add the mouse motion to the current rotation angle so that the rotation
        // is added to the previous rotations.
        // Use scale to control the speed of the rotation.
        yawAngle += scale * dMouseX;

        pitchAngle += scale * dMouseY;
        pitchAngle = Math.max (
          Math.min (pitchAngle, pitchAngleMax),
          pitchAngleMin
        );
      }
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
      case 81: // Q
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
        step = Math.max (step, 0.5);
        break;
      // Angle
      case 87: // W
        pitchAngle -= angleStep;
        pitchAngle = Math.max (pitchAngle, pitchAngleMin);
        break;
      case 83: // S
        pitchAngle += angleStep;
        pitchAngle = Math.min (pitchAngle, pitchAngleMax);
        break;
      case 65: // A
        yawAngle += angleStep;
        if (yawAngle >= 360) {
          yawAngle -= 360;
        }
        break;
      case 68: // D
        yawAngle -= angleStep;
        if (yawAngle < 0) {
          yawAngle += 360;
        }
        break;
      // Change step size
      case 76: // L
        moveCamera ();
        break;
      case 75: // K
        moving = !moving;
        printInfo ();
        break;
      // Look to the Sun
      case 49: // 1
        lookToTheSun = !lookToTheSun;
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

function selectPlanet (n) {
  console.log ('Selected planet number ' + n + ': ' + orbits[n].name);
  py = 0.0;
  pz = 0.0;
  planetSelected = n;
  nearPlane = planetScales[n];
  yawAngle = 0.0;
  pitchAngle = 0.0;
  pitchAngleMax = 45;
  pitchAngleMin = -45;
  free = false;
  if (n == 0) {
    // Sun
    px = 0.0;
    lookSunButton.style.visibility = 'hidden';
    lookToTheSun = false;
  } else {
    px = orbitScales[n] * d + sunD;
    lookSunButton.style.visibility = 'visible';
  }
  navigation.style.visibility = 'visible';
  planetName.innerHTML = orbits[n].name;
}

function freeCamera () {
  console.log ('CAMERA FREE!!');
  pitchAngleMax = 85;
  pitchAngleMin = 0;
  nearPlane = 1.0;
  fov = DEFAULT_FOV;
  free = true;
  navigation.style.visibility = 'hidden';
}
