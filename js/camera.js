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
 * You can move through the scene using WASD, shift, space bar and mouse wheel. To move up/down, left/right the values of tz and tx are changed and the camera (cz, cx) follows them.
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
 * 3) CAMERA ANCHORED, LOCKED TARGET
 *    The camera is anchored to a planet like in the previous case, but the camera is locked looking at a fixed target.
 *    The user can only zoom in and out using the mouse wheel.
 *
 */

// Constant values
const DEFAULT_FOV = 60, DEFAULT_DISTANCE = 50;
const ZOOM_PRECISION = 100; // Under this value the zoom speed is costant, over this value it accelerates.
const DEFAULT_ZOOM_STEP = 5.0, DEFAULT_ZOOM_SPEED = 1.0;

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
var info = document.getElementById ('info'); // Top left panels which shows some camera values for debug purpose.
var navigation = document.getElementById ('navigation'); // Bottom panel which appears when you anchor the camera to a planet.
var planetName = document.getElementById ('planet_name'); // Header to write the name of the planet on which the camera is anchored.
var fixSelection = document.getElementById ('fix_selection'); // Here will be shown the button to fix camera target.
var debugContainer = document.getElementById ('debug_container'); // Container of checkbox and debug panel. The background is filled when debug is shown.
var debugCheckbox = document.getElementById ('debug'); // Checkbox to show debug panel.
var debugPanel = document.getElementById ('hidden_debug'); // Debug panel shown when debugCheckbox is checked.

// Movement buffers
var movementBuffer = [0.0, 0.0]; // Remaining horizontal movement to execute
var zoomBuffer = 0.0; // Remaining vertical movement to execute
var yawAngleBuffer = 0.0; // Remaining horizontal rotation
var pitchAngleBuffer = 0.0; // Remaining vertical rotation
var mouseXbuffer = 0.0; // Store the mouse movement
var mouseYbuffer = 0.0;

// Movement speeds
var movementSpeed = 0.5; // Speed of horizontal movements expressed in units per tick
var zoomSpeed = DEFAULT_ZOOM_SPEED; // Speed of vertical movements expressed in units per tick
var angleSpeed = 1.0; // Speed of rotation expressed in degrees per tick

// Movement steps
var movementStep = 1.0; // Step used for camera movements with keyboard
var zoomStep = DEFAULT_ZOOM_STEP;
var angleStep = 5.0;
var mouseScale = 30;

// Camera control parameters
var trackLeftRight = 0; // Move left and right
var pushInPullOut = 0; // Move back and forth
var craneUpDown = 0; // Zoom in/out
var yawRotation = 0;
var pitchRotation = 0;

var fov = 60;
var nearPlane = 1.0; // Changed when the POV is put inside a planet to avoid seeing the planet surface.
var farPlane = 2000.0;

var defaultFov = DEFAULT_FOV; // This value can be changed by the user. It represents the value of fov when in zoom band 0 (it is NOT the fixed value DEFAULT_FOV).
// Read the explanation at the beginning of this file to understand how zoom works.
var zoomBand = 0;

var animated = true; // Stop certain animations. See stoppableAnimations() in animation.js

// Camera rotation
var pitchAngle = 0.0; // Vertical rotation around x axis
var yawAngle = 0.0; // Horizontal rotation around y axis

// The rotation is computed starting from default vectors
var cuDefault = [0.0, 0.0, 1.0]; // Default c-u vector
var tcDefault = [0.0, 1.0, 0.0]; // Default t-c vector
var tc; // The t-c vector rotated in 3d space considering yawAngle and pitchAngle

var distance = 50; // Length of vector t-c. Used when the camera is free and the target is located on the x-z axis.

var planetSelected;
var free = true; // False if the user selected a planet
var px, py, pz; // The center of the planet to which the camera is anchored
var fixedTarget = false; // Switch between free camera rotation or camera locked on the Sun where the camera is anchored to a planet.
var targetSelected = 0;
var targetButtons = [];

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
var lastX = 0, lastY = 0;
var dMouseX = 0, dMouseY = 0;
var trackingMouseMotion = false;
var mouseReleased = true;

// Kill
var moving = true; // Interrupt/resume camera animation.

/**
 * Initialize camera intraction with keyboard, mouse and mouse wheel.
 */

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

/**
 * This function is called recursively by drawScene() in draw.js.
 * Every time it is called, it computes the new camera position, based on user interaction or planet's movement, and recompute the view projection matrix.
 */

function moveCamera () {
  // BUFFER MOVEMENTS

  // "Buffer" movemets registered from mouse or keyboard in movementBuffer
  if (craneUpDown != 0 || trackLeftRight != 0) {
    // If the already buffered movement is greater or equal to the defined movement size, don't update the buffer.
    // This behaviour allows the movement to stop almost immediatly after the user releases the keyboard button.
    if (vectorLength (movementBuffer) < movementStep) {
      movementBuffer = sum2dVectors (
        movementBuffer,
        rotate2dVector ([-trackLeftRight, craneUpDown], -yawAngle, 1.0)
      );
    }
    craneUpDown = 0;
    trackLeftRight = 0;
  }

  // Buffer zoom
  if (pushInPullOut != 0) {
    if (Math.abs (zoomBuffer) < DEFAULT_ZOOM_STEP) {
      zoomBuffer += pushInPullOut;
    }
    pushInPullOut = 0;
  }

  // Buffer rotation
  if (yawRotation != 0) {
    if (Math.abs (yawAngleBuffer) < angleStep) {
      yawAngleBuffer += yawRotation;
    }
    yawRotation = 0;
  }
  if (pitchRotation != 0) {
    if (Math.abs (pitchAngleBuffer) < angleStep) {
      pitchAngleBuffer += pitchRotation;
    }
    pitchRotation = 0;
  }

  // EXECUTE MOVEMENTS

  if (free) {
    /**
     * VIEW MODE 1: CAMERA FREE
     */

    rotateWithMouse ();

    moveHorizontally ();

    moveVertically ();

    rotateCamera ();

    // Compute t, u and c considering rotation (yawAngle and pitchAngle)

    tc = rotate3dVector (tcDefault, yawAngle, pitchAngle, distance);
    cx = tx + tc[0];
    cy = ty + tc[1];
    cz = tz + tc[2];

    [ux, uy, uz] = rotate3dVector (cuDefault, yawAngle, pitchAngle, 1.0);
  } else {
    /**
     * VIEW MODE 2 AND 3: CAMERA ANCHORED / ANCHORED LOOKING AT THE SUN/EARTH
     */

    // Compute the position of the planet selected (world matrix of that planet in this istant multiplied per its initial position)

    var pw = utils.multiplyMatrixVector (
      utils.transposeMatrix (orbits[planetSelected].worldMatrix),
      [px, py, pz, 1.0]
    );

    // Moon
    if (planetSelected == 4) {
      var earthPosition = utils.multiplyMatrixVector (
        utils.transposeMatrix (orbits[3].worldMatrix),
        [orbitScales[3] * d + sunD, 0.0, 0.0, 1.0]
      );

      cx = pw[0] + earthPosition[0];
      cy = pw[1] + earthPosition[1];
      cz = -pw[2] - earthPosition[2];
    } else {
      cx = pw[0];
      cy = pw[1];
      cz = -pw[2];
    }

    if (fixedTarget) {
      /**
       * VIEW MODE 3
       */

      // Fix t into the selected target and u directed upwards (along y)

      switch (targetSelected) {
        case 0:
          // Sun
          tx = 0.0;
          ty = 0.0;
          tz = 0.0;
          break;
        case 1:
          // Earth
          var earthPosition = utils.multiplyMatrixVector (
            utils.transposeMatrix (orbits[3].worldMatrix),
            [orbitScales[3] * d + sunD, 0.0, 0.0, 1.0]
          );
          tx = earthPosition[0];
          ty = earthPosition[1];
          tz = -earthPosition[2];
          break;
      }

      ux = 0.0;
      uy = 1.0;
      uz = 0.0;

      // Set the pitchAngle to 0 and compute the current yawAngle (to give continuity to the transition between fixed target and free target).

      pitchAngle = 0;
      yawAngle = radToDeg (angleFromHorizontalAxis ([tz-cz, tx-cx]));
    } else {
      /**
       * VIEW MODE 2
       */

      rotateWithMouse ();

      rotateCamera ();

      ct = rotate3dVector (ctLockedDefault, yawAngle, pitchAngle, 1.0);
      [tx, ty, tz] = sum3dVectors ([cx, cy, cz], ct);

      [ux, uy, uz] = rotate3dVector (
        cuLockedDefault,
        yawAngle,
        pitchAngle,
        1.0
      );
    }

    zoomOnlyFov ();
  }

  // Keep camera values between the bounds
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

  // Show camera values on the screen
  printInfo ();
}

/**
 * ----------------------------------------------------------------MOVEMENTS-----------------------------------------------------------------------
 * The following functions are recursivelly called by moveCamera().
 * They require to initialize movement buffers firts.
 */

/**
 * Change angles moving mouse
 */

function rotateWithMouse () {
  if (mouseXbuffer != 0 || mouseYbuffer != 0) {
    yawAngle += mouseScale * mouseXbuffer;

    pitchAngle += mouseScale * mouseYbuffer;
    pitchAngle = Math.max (Math.min (pitchAngle, pitchAngleMax), pitchAngleMin);

    if (mouseReleased) {
      // Keep going
    } else {
      mouseXbuffer = 0.0;
      mouseYbuffer = 0.0;
    }
  }
}

/**
 * Move along x and z
 */

function moveHorizontally () {
  if (!isNullVector (movementBuffer)) {
    // Clean movement buffer
    if (vectorLength (movementBuffer) < movementSpeed) {
      movementBuffer = resizeVector (movementBuffer, 0.0);
    } else {
      var m = resizeVector (movementBuffer, movementSpeed);
      tx += m[0];
      tz += m[1];
      cx += m[0];
      cz += m[1];
      movementBuffer = sum2dVectors (movementBuffer, scalarPerVector (-1, m));
    }
  }
}

/**
 * Move along y
 */

function moveVertically () {
  // Zoom faster when you zoom out a lot
  if (distance > ZOOM_PRECISION && zoomBand == 0) {
    var multiplier = distance / ZOOM_PRECISION;
    zoomStep = DEFAULT_ZOOM_STEP * multiplier;
    zoomSpeed = DEFAULT_ZOOM_SPEED * multiplier;
  } else {
    zoomStep = DEFAULT_ZOOM_STEP;
    zoomSpeed = DEFAULT_ZOOM_SPEED;
  }

  // Zoom
  if (zoomBuffer != 0.0) {
    // Clean zoom buffer
    if (Math.abs (zoomBuffer) < DEFAULT_ZOOM_SPEED) {
      zoomBuffer = 0.0;
    } else {
      var m = Math.sign (zoomBuffer) * zoomSpeed;

      switch (zoomBand) {
        // If you are between distance limits, change distance value (BAND 0)
        case 0:
          distance -= m;
          if (distance < distanceMin) {
            distance = distanceMin;
            fov -= m;
            zoomBand = -1;
          } else if (distance > distanceMax) {
            distance = distanceMax;
            fov -= m;
            zoomBand = 1;
          }
          break;
        // Else, change fov value (BAND -1 AND 1)
        case -1:
          fov -= m;
          if (fov > defaultFov) {
            fov = defaultFov;
            distance -= m;
            zoomBand = 0;
          }
          break;
        case 1:
          fov -= m;
          if (fov < defaultFov) {
            fov = defaultFov;
            distance -= m;
            zoomBand = 0;
          }
          break;
      }

      zoomBuffer -= m;
    }
  }
}

/**
 * Zoom changing only fov and not cy (Used when c coordinates are anchored to a planet).
 */

function zoomOnlyFov () {
  if (zoomBuffer != 0) {
    fov -= zoomBuffer;
    zoomBuffer = 0;
  }
}

/**
 * Cange yawAngle and pitchAngle
 */

function rotateCamera () {
  if (yawAngleBuffer != 0) {
    if (Math.abs (yawAngleBuffer) < angleSpeed) {
      yawAngleBuffer = 0.0;
    } else {
      var m = Math.sign (yawAngleBuffer) * angleSpeed;
      yawAngle -= m;
      yawAngleBuffer -= m;
    }
  }

  if (pitchAngleBuffer != 0) {
    if (Math.abs (pitchAngleBuffer) < angleSpeed) {
      pitchAngleBuffer = 0.0;
    } else {
      var m = Math.sign (pitchAngleBuffer) * angleSpeed;
      pitchAngle -= m;
      pitchAngle = Math.max (
        pitchAngleMin,
        Math.min (pitchAngleMax, pitchAngle)
      );
      pitchAngleBuffer -= m;
    }
  }
}

//--------------------------------------------------------------------------------------------------------------------------------------

/**
 * Debug function to show the values of some variables on the screen.
 */

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
    '<br>movement step: ' +
    movementStep.toFixed (1) +
    '<br>movement speed: ' +
    movementSpeed.toFixed(1) +
    '<br>zoom band: ' +
    zoomBand +
    '<br>yaw angle: ' +
    yawAngle.toFixed (2) +
    '<br>pitch angle: ' +
    pitchAngle.toFixed (2) +
    '<br>moving: ' +
    moving +
    '<br>look at the sun: ' +
    fixedTarget;
}

/**
 *  Function called in moveCamera() to keep the camera values between defined bounds.
 */

function limit () {
  fov = Math.min (fov, fovMax);
  fov = Math.max (fov, fovMin);
  tx = Math.min (txMax, Math.max (tx, txMin));
  tz = Math.min (tzMax, Math.max (tz, tzMin));
}

/**
 * -----------------------------------------------------------------------USER INTERACTION-----------------------------------------------------------------
 */

/**
 * Function to register mouse callback functions
 */

function initMouseMotionCallback () {
  // If a mouse button is pressed, save the current mouse location
  // and start tracking mouse motion.
  canvas.onmousedown = function (event) {
    mouseReleased = false;

    mouseXbuffer = 0.0;
    mouseYbuffer = 0.0;

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
    mouseReleased = true;
    trackingMouseMotion = false;
  };

  // Calculate how far the mouse cusor has moved and convert the mouse motion
  // to rotation angles.
  canvas.onmousemove = function (event) {
    var x = event.clientX;
    var y = event.clientY;

    if (trackingMouseMotion) {
      // Calculate how much the mouse has moved along X and Y axis, and then
      // normalize them based on the canvas' width and height.
      dMouseX = (x - lastX) / canvas.width;
      dMouseY = (y - lastY) / canvas.height;

      mouseXbuffer += mouseScale * dMouseX;
      mouseYbuffer += mouseScale * dMouseY;
    }

    // Save the current mouse location in order to calculate the next mouse motion.
    lastX = x;
    lastY = y;
  };
}

/**
 * Function to interact with keyboard
 */

function initKeyboardCallback () {
  document.onkeydown = function (event) {
    switch (event.keyCode) {
      // Move with WASD
      case 87: // W
        craneUpDown += movementStep;
        break;
      case 83: // S
        craneUpDown -= movementStep;
        break;
      case 65: // A
        trackLeftRight -= movementStep;
        break;
      case 68: // D
        trackLeftRight += movementStep;
        break;
      // Space bar and shift to move up and down (zoom)
      case 16: // Shift
        pushInPullOut += zoomStep;
        break;
      case 32: // Space
        pushInPullOut -= zoomStep;
        break;
      case 81: // Q
        animated = !animated;
        break;
      // Rotate camera with arrows
      case 37: // Arrow left
        yawRotation -= angleStep;
        break;
      case 38: // Arrow up
        pitchRotation -= angleStep;
        break;
      case 39: // Arrow right
        yawRotation += angleStep;
        break;
      case 40: // Arrow down
        pitchRotation += angleStep;
        break;
      case 107: // +
        fov -= movementStep;
        fov = Math.max (fov, fovMin); // lower limit of fov
        if (zoomBand == 0) {
          defaultFov = fov;
        }
        break;
      case 109: // -
        fov += movementStep;
        fov = Math.min (fov, fovMax); // upper limit of fov
        if (zoomBand == 0) {
          defaultFov = fov;
        }
        break;
      // Change step size
      case 80: // P
        movementStep += 0.2;
        movementSpeed += 0.1;
        break;
      case 79: // O
        movementStep -= 0.2;
        movementSpeed -= 0.1;
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
        fixedTarget = !fixedTarget;
        break;
      default:
        return;
    }
  };
}

/**
 * Function to interact with the mouse wheel.
 */
function initWheelCallback () {
  document.onwheel = function (event) {
    pushInPullOut -= event.deltaY * 0.05;
  };
}

/**
 * ------------------------------------------------------------------------------VIEW MODES-------------------------------------------------------------------
 */

/**
 * Function to select a planet to place the camera, called when a button with the name of a planet on the screen is pressed.
 * @param {*} n is the planet number
 */

function selectPlanet (n) {
  py = 0.0;
  pz = 0.0;
  planetSelected = n;
  nearPlane = planetScales[n];
  yawAngle = 0.0;
  pitchAngle = 0.0;
  pitchAngleMax = 45;
  pitchAngleMin = -45;
  free = false;

  // Clear buttons
  targetButtons = [];

  if (n == 0) {
    // Sun: create only Earth button
    px = 0.0;

    if(targetSelected == 0) fixedTarget = false;

    // Create button to fix target in the Earth
    var earthButton = createButton("Earth", 1);
    fixSelection.innerHTML = 'Fix: ';
    fixSelection.appendChild (earthButton);
    targetButtons.push(earthButton);
  } else if (n == 4) {
    // Moon: use special scale
    px = orbitScales[4] * d;

    // Create buttons to fix target in the Sun and in the Earth
    var sunButton = createButton("Sun", 0);
    var earthButton = createButton("Earth", 1);

    fixSelection.innerHTML = 'Fix: ';
    fixSelection.appendChild (sunButton);
    fixSelection.appendChild (earthButton);
    targetButtons.push(sunButton);
    targetButtons.push(earthButton);
  } else if (n == 3) {
    // Earth: create only Sun button
    px = orbitScales[n] * d + sunD;

    if(targetSelected == 1) fixedTarget = false;

    // Create button to fix target in the Sun
    var sunButton = createButton("Sun", 0);

    fixSelection.innerHTML = 'Fix: ';
    fixSelection.appendChild (sunButton);
    targetButtons.push(sunButton);
  } else {
    // Other planets
    px = orbitScales[n] * d + sunD;

    // Create buttons to fix target in the Sun and in the Earth
    var sunButton = createButton("Sun", 0);
    var earthButton = createButton("Earth", 1);

    fixSelection.innerHTML = 'Fix: ';
    fixSelection.appendChild (sunButton);
    fixSelection.appendChild (earthButton);
    targetButtons.push(sunButton);
    targetButtons.push(earthButton);
  }
  navigation.style.visibility = 'visible';
  planetName.innerHTML = orbits[n].name;
}

/**
 * Auxiliary function to create a button to set a fixed target
 */

function createButton(name, number) {
  var button = document.createElement ('BUTTON');
  button.appendChild (document.createTextNode (name));
  button.onclick = function () {
    if(targetSelected == number) {
      fixedTarget = !fixedTarget;
    } else {
      targetSelected = number;
      fixedTarget = true;
      targetButtons.forEach( function (button) {
        button.style.backgroundColor = '';
      })
    }    
    
    if (fixedTarget) {
      this.style.backgroundColor = 'cyan';
    } else {
      this.style.backgroundColor = '';
    }
  };

  if (fixedTarget && targetSelected == number) {
    button.style.backgroundColor = 'cyan';
  }
  
  return button;
}

/**
 * Function to set the camera in view mode 1: camera free. It is called when the FREE button is pressed.
 * Resets the camera variables to some default values.
 */

function freeCamera () {
  pitchAngleMax = 85;
  pitchAngleMin = 0;
  nearPlane = 1.0;
  distance = DEFAULT_DISTANCE;
  tx = 0.0;
  ty = 0.0;
  tz = 0.0;
  fov = DEFAULT_FOV;
  mouseXbuffer = 0.0;
  mouseYbuffer = 0.0;
  free = true;
  navigation.style.visibility = 'hidden';
  document.getElementById("slider1").value = 1;
  updateSpeedInfluence(1);
}
