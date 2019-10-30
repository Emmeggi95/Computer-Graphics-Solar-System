/**
 * Set camera and compute camera movement through user interaction with mouse and keyboard.
 *
 * cx, cy, cz are camera coordinates
 * tx, ty, tz are target coordinates
 * ux, uy, uz define the "up" vector
 *
 * Camera matrices are computed every time the scene is drawn on the screen (moveCamera() is called by draw.js).
 *
 * MOVING
 * You can move through the scene dragging it with the mouse or using arrows. To move up/down, left/right the values of tz and tx are changed and the camera (cz, cx) follows them.
 *
 * ZOOM
 * You can zoom in and out using mouse wheel. The values of cy and fov are changed to set zoom.
 * 3 "zoom bands" are defined: the one between two cy limits (band 0), the one where lower cy bound is reached (band -1) and the one where upper cy limit is reached (band 1).
 * When in band 0, only the value of cy is changed. Fov is set at defaultFov in this band.
 * When in band -1 or 1, only the value of fov is changed. When fov oversteps defaultFov, the scene returns in band 0.
 *
 * FOV
 * Fov has upper and lower limits.
 * You can direcly change fov by pressing + and -. When you change fov in band 0, also defaultFov is changed.
 *
 * VIEW MODES
 * You can change view mode pressing a button in the top right corner of the screen.
 * There are 3 view modes:
 * 1) FREE CAMERA
 *    The camera is free to move in every direction and change zoom, with mouse and keyboard, among certain limits.
 * 2) CAMERA ANCHORED
 *    The camera is anchored to a planet and rotates around the Sun togheter with it.
 *    The user can direct the look and zoom using the mouse.
 * 3) CAMERA ANCHORED, LOOKING AT THE SUN
 *    The camera is anchored to a planet like in the previous case, but the camera is locked looking at the Sun.
 *    The user can only zoom in and out using the mouse wheel.
 *
 */

// Constant values
const DEFAULT_FOV = 60,
  DEFAULT_DISTANCE = 50;

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
var info = document.getElementById("info"); // Top left panels which shows some camera values for debug purpose.
var navigation = document.getElementById("navigation"); // Bottom panel which appears when you anchor the camera to a planet.
var planetName = document.getElementById("planet_name"); // Header to write the name of the planet on which the camera is anchored.
var lookSunButton = document.getElementById("look_sun_button"); // Button to look at the Sun when the camera is anchored to a planet.

// Camera control parameters
var trackLeftRight = 0; // Move left and right
var pushInPullOut = 0; // Move back and forth
var craneUpDown = 0; // Zoom in/out

var moveVector = [0.0, 0.0]; // Vector used to calculate movement on the x-z plane (for istance, with mouse). The vector is rotated considering the yawAngle

var step = 0.5; // Step used for camera movements with keyboard

var fov = 60;
var nearPlane = 1.0; // Changed when the POV is put inside a planet to avoid seeing the planet surface.
var farPlane = 2000.0;

var defaultFov = DEFAULT_FOV; // This value can be changed by the user. It represents the value of fov when in zoom band 0 (it is NOT the fixed value DEFAULT_FOV).
// Read the explanation at the beginning of this file to understand how zoom works.
var zoomBand = 0;

var animated = true; // Stop certain animations. See stoppableAnimations() in animation.js

var zoomPrecision = 100; // Under this value the zoom speed is costant, over this value it accelerates.

// Camera rotation
var pitchAngle = 0.0; // Vertical rotation around x axis
var yawAngle = 0.0; // Horizontal rotation around y axis

var angleStep = 5;

// The rotation is computed starting from default vectors
var cuDefault = [0.0, 0.0, 1.0]; // Default c-u vector
var tcDefault = [0.0, 1.0, 0.0]; // Default t-c vector
var tc; // The t-c vector rotated in 3d space considering yawAngle and pitchAngle

var distance = 50; // Length of vector t-c. Used when the camera is free and the target is located on the x-z axis.

var planetSelected;
var free = true; // False if the user selected a planet
var px, py, pz; // The center of the planet to which the camera is anchored
var lookAtTheSun = false; // Switch between free camera rotation or camera locked on the Sun where the camera is anchored to a planet.
// Default vectors to calculate rotation when the camera is anchored to a planet and free to rotate
var ctLockedDefault = [0.0, 0.0, 1.0];
var cuLockedDefault = [0.0, 1.0, 0.0];
var ct; // The c-t vector rotated in 3d space.

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
var lastX = 0,
  lastY = 0;
var dMouseX = 0,
  dMouseY = 0;
var trackingMouseMotion = false;

// Kill
var moving = true; // Interrupt/resume camera animation.

/**
 * Initialize camera intraction with keyboard, mouse and mouse wheel.
 */

function initCameraInteraction() {
  var planetsPanel = document.getElementById("planets");

  orbits.forEach(function(orbit, index) {
    var button = document.createElement("BUTTON");
    var name = document.createTextNode(orbit.name);
    button.appendChild(name);
    button.onclick = function() {
      selectPlanet(index);
    };
    planetsPanel.appendChild(button);
  });

  var freeButton = document.createElement("BUTTON");
  var text = document.createTextNode("FREE");
  freeButton.appendChild(text);
  freeButton.onclick = function() {
    freeCamera();
  };
  planetsPanel.appendChild(freeButton);

  initMouseMotionCallback();
  initKeyboardCallback();
  initWheelCallback();
}

/**
 * This function is called recursively by drawScene() in draw.js.
 * Every time it is called, it computes the new camera position, based on user interaction or planet's movement, and recompute the view projection matrix.
 */

function moveCamera() {
  if (free) {
    /**
     * VIEW MODE 1: CAMERA FREE
     */
    // Apply movemets registered from mouse or keyboard
    if (craneUpDown != 0 || trackLeftRight != 0) {
      moveVector = [-trackLeftRight, craneUpDown];
      [tx, tz] = sum2dVectors(
        [tx, tz],
        rotate2dVector(moveVector, -yawAngle, 1.0)
      );
      craneUpDown = 0;
      trackLeftRight = 0;
    }
    // Zooming
    if (pushInPullOut != 0) {
      switch (zoomBand) {
        // If you are between distance limits, change distance value (BAND 0)
        case 0:
          if (distance > zoomPrecision) {
            // Zoom faster when you zoom out a lot
            distance -= (pushInPullOut * distance) / zoomPrecision;
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
        // Else, change fov value (BAND -1 AND 1)
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
    tc = rotate3dVector(tcDefault, yawAngle, pitchAngle, distance);
    cx = tx + tc[0];
    cy = ty + tc[1];
    cz = tz + tc[2];

    [ux, uy, uz] = rotate3dVector(cuDefault, yawAngle, pitchAngle, 1.0);
  } else {
    /**
     * VIEW MODE 2 AND 3: CAMERA ANCHORED / ANCHORED LOOKING AT THE SUN
     */
    // POV is inside one planet
    var pw = utils.multiplyMatrixVector(
      utils.transposeMatrix(orbits[planetSelected].worldMatrix),
      [px, py, pz, 1.0]
    );
    cx = pw[0];
    cy = pw[1];
    cz = -pw[2];

    if (lookAtTheSun) {
      /**
       * VIEW MODE 3
       */
      tx = 0.0;
      ty = 0.0;
      tz = 0.0;

      ux = 0.0;
      uy = 1.0;
      uz = 0.0;

      pitchAngle = 0;
      yawAngle = radToDeg(angleFromHorizontalAxis([-cz, -cx]));
    } else {
      /**
       * VIEW MODE 2
       */
      ct = rotate3dVector(ctLockedDefault, yawAngle, pitchAngle, 1.0);
      [tx, ty, tz] = sum3dVectors([cx, cy, cz], ct);

      [ux, uy, uz] = rotate3dVector(cuLockedDefault, yawAngle, pitchAngle, 1.0);
    }

    // Zoom
    if (pushInPullOut != 0) {
      fov -= pushInPullOut;
      pushInPullOut = 0;
    }
  }

  // Keep camera values between the bounds
  limit();

  // Recompute camera matrices
  cameraPosition = [cx, cy, cz];
  target = [tx, ty, tz];
  up = [ux, uy, uz];

  projectionMatrix = utils.MakePerspective(
    fov,
    gl.canvas.width / gl.canvas.height,
    nearPlane,
    farPlane
  );

  var cameraMatrix = utils.LookAt(cameraPosition, target, up);

  viewMatrix = utils.invertMatrix(cameraMatrix);

  viewProjectionMatrix = utils.multiplyMatrices(projectionMatrix, viewMatrix);

  // Show camera values on the screen
  printInfo();
}

/**
 * Debug function to show the values of some variables on the screen.
 */

function printInfo() {
  // Print camera values on screen
  info.innerHTML =
    "cx: " +
    cx.toFixed(2) +
    "<br>cy: " +
    cy.toFixed(2) +
    "<br>cz: " +
    cz.toFixed(2) +
    "<br>tx: " +
    tx.toFixed(2) +
    "<br>ty: " +
    ty.toFixed(2) +
    "<br>tz: " +
    tz.toFixed(2) +
    "<br>ux: " +
    ux.toFixed(2) +
    "<br>uy: " +
    uy.toFixed(2) +
    "<br>uz: " +
    uz.toFixed(2) +
    "<br>fov: " +
    fov.toFixed(2) +
    "<br>step: " +
    step.toFixed(1) +
    "<br>zoom band: " +
    zoomBand +
    "<br>yaw angle: " +
    yawAngle.toFixed(2) +
    "<br>pitch angle: " +
    pitchAngle.toFixed(2) +
    "<br>moving: " +
    moving +
    "<br>look at the sun: " +
    lookAtTheSun;
}

/**
 *  Function called in moveCamera() to keep the camera values between defined bounds.
 */

function limit() {
  fov = Math.min(fov, fovMax);
  fov = Math.max(fov, fovMin);
  tx = Math.min(txMax, Math.max(tx, txMin));
  tz = Math.min(tzMax, Math.max(tz, tzMin));
}

/**
 * Function to register mouse callback functions
 */

function initMouseMotionCallback() {
  // If a mouse button is pressed, save the current mouse location
  // and start tracking mouse motion.
  canvas.onmousedown = function(event) {
    var x = event.clientX;
    var y = event.clientY;

    var rect = event.target.getBoundingClientRect();
    // Check if the mouse cursor is in canvas.
    if (rect.left <= x && rect.right > x && rect.top <= y && rect.bottom > y) {
      lastX = x;
      lastY = y;
      trackingMouseMotion = true;
    }
  };

  // If the mouse button is release, stop tracking mouse motion.
  canvas.onmouseup = function(event) {
    trackingMouseMotion = false;
  };

  // Calculate how far the mouse cusor has moved and convert the mouse motion
  // to rotation angles.
  canvas.onmousemove = function(event) {
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
        trackLeftRight -= (((scale * dMouseX * cy) / 20) * fov) / 60;

        craneUpDown += (((scale * dMouseY * cy) / 20) * fov) / 60;
      } else {
        // For camera pitch and yaw motions
        scale = 30;
        // Add the mouse motion to the current rotation angle so that the rotation
        // is added to the previous rotations.
        // Use scale to control the speed of the rotation.
        yawAngle += scale * dMouseX;

        pitchAngle += scale * dMouseY;
        pitchAngle = Math.max(
          Math.min(pitchAngle, pitchAngleMax),
          pitchAngleMin
        );
      }
    }

    // Save the current mouse location in order to calculate the next mouse motion.
    lastX = x;
    lastY = y;
  };
}

/**
 * Function to interact with keyboard
 */

function initKeyboardCallback() {
  document.onkeydown = function(event) {
    switch (event.keyCode) {
      case 81: // Q
        animated = !animated;
        break;
      case 37: // Arrow left
        trackLeftRight -= step;
        break;
      case 38: // Arrow up
        craneUpDown += step;
        break;
      case 39: // Arrow right
        trackLeftRight += step;
        break;
      case 40: // Arrow down
        craneUpDown -= step;
        break;
      case 107: // +
        fov -= step;
        fov = Math.max(fov, fovMin); // lower limit of fov
        if (zoomBand == 0) {
          defaultFov = fov;
        }
        break;
      case 109: // -
        fov += step;
        fov = Math.min(fov, fovMax); // upper limit of fov
        if (zoomBand == 0) {
          defaultFov = fov;
        }
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
      case 87: // W
        pitchAngle -= angleStep;
        pitchAngle = Math.max(pitchAngle, pitchAngleMin);
        break;
      case 83: // S
        pitchAngle += angleStep;
        pitchAngle = Math.min(pitchAngle, pitchAngleMax);
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
        moveCamera();
        break;
      case 75: // K
        moving = !moving;
        printInfo();
        break;
      // Look to the Sun
      case 49: // 1
        lookAtTheSun = !lookAtTheSun;
        break;
      default:
        return;
    }
  };
}

/**
 * Function to interact with the mouse wheel.
 */
function initWheelCallback() {
  document.onwheel = function(event) {
    pushInPullOut -= event.deltaY * 0.05;
  };
}

/**
 * Function to select a planet to place the camera, called when a button with the name of a planet on the screen is pressed.
 * @param {*} n is the planet number
 */

function selectPlanet(n) {
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
    lookSunButton.style.visibility = "hidden";
    lookAtTheSun = false;
  } else {
    px = orbitScales[n] * d + sunD;
    lookSunButton.style.visibility = "visible";
  }
  navigation.style.visibility = "visible";
  planetName.innerHTML = orbits[n].name;
}

/**
 * Function to set the camera in view mode 1: camera free. It is called when the FREE button is pressed.
 * Resets the camera variables to some default values.
 */

function freeCamera() {
  pitchAngleMax = 85;
  pitchAngleMin = 0;
  nearPlane = 1.0;
  distance = DEFAULT_DISTANCE;
  tx = 0.0;
  ty = distance;
  tz = 0.0;
  fov = DEFAULT_FOV;
  free = true;
  navigation.style.visibility = "hidden";
  lookSunButton.style.visibility = "hidden";
}
