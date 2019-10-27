var vpMatrix, viewProjectionMatrix;

var info = document.getElementById ('info');

var cx = 2.0,
  cy = 2.0,
  cz = 20.0,
  tx = 0.0,
  ty = 0.0,
  tz = 0.0,
  ux = 0.0,
  uy = 1.0,
  uz = 0.0;

// Camera control parameters
var pitchAngle = 0;
var minPitchAngle = -90;
var maxPitchAngle = 90;

var yawAngle = 0;
var minYawAngle = -90;
var maxYawAngle = 90;

var rollCamera = false;

var rollAngle = 0;
var minRollAngle = -180;
var maxRollAngle = 180; 

var trackLeftRight = 0;
var pushInPullOut = 0;
var craneUpDown = 0;

var step = 0.5;

var fov = 30;
var fovMin = 10;
var fovMax = 160;

var animated = true;


function initCameraInteraction() {
    vpMatrix = new Matrix4();
    initKeyboardCallback();
    initMouseMotionCallback();
}

function moveCamera() {
    // Replaced fixed field of view with a variable fov, which can be changed by users.    
    vpMatrix.setPerspective(fov, canvas.width/canvas.height, 1, 100);
    
    // Camera transformations should be done after the view transformation but
    // before the projection transformation. 
    
    // Move the camera horizontally. 
    // In fact, we are moving the entire scene to the opposite direction of the camera motion.
    // If you translate the camera to the left, it's equivalent to translating the entire scene to the right.    
    vpMatrix.translate(-trackLeftRight, 0, 0);
    
    // Move the camera vertically. 
    // We are moving the entire scene to the opposite direction of the camera motion.
    vpMatrix.translate(0, -craneUpDown, 0);
    
    // Move the camera forward and backward.
    // We are moving the entire scene to the opposite direction of the camera motion.
    vpMatrix.translate(0, 0, pushInPullOut);
    
    // Rotations must be done before translation. 
    
    // Camera pitch
    // We are rotating the entire scene in the opposite direction. 
    vpMatrix.rotate(pitchAngle, 1, 0, 0);
    
    // Camera yaw
    // We are rotating the entire scene in the opposite direction. 
    vpMatrix.rotate(yawAngle, 0, 1, 0);
    
    // Camera roll
    // We are rotating the entire scene in the opposite direction. 
    vpMatrix.rotate(rollAngle, 0, 0, 1);

//*** end of the code added by Ying Zhu (03/2016)
  
    vpMatrix.lookAt(cx, cy, cz, tx, ty, tz, ux, uy, uz);

    viewProjectionMatrix = [vpMatrix.elements];

    // Print camera values on screen
  info.innerHTML =
  'pitchAngle: ' +
  pitchAngle.toFixed (2) +
  '<br>yawAngle: ' +
  yawAngle.toFixed (2) +
  '<br>rollAngle: ' +
  rollAngle.toFixed (2) +
  '<br>trackLeftRight: ' +
  trackLeftRight.toFixed (2) +
  '<br>craneUpDown: ' +
  craneUpDown.toFixed (2);
}

// Register a keyboard callback function. 
function initKeyboardCallback() {
    document.onkeydown = function(event) {
        switch(event.keyCode) {
            case 82: // Use r or R to turn on/off camera rolling.  
                rollCamera = !rollCamera;
                break;
            case 65: // Use a or A to turn on/off animation. 
                animated = !animated;
                break;
            case 37: // Use left arrow to move the camera to the left.  
                trackLeftRight -= step; 
                break;
            case 38: // Use up arrow to move the camera forward. 
                 pushInPullOut += step;
                 break;
            case 39: // Use right arrow to move the camera to the right. 
                trackLeftRight += step;
                break; 
            case 40: // Use down arrow to move the camera backward.  
                pushInPullOut -= step;
                break;
            case 85: // Use u or U key to move the camera upward. 
                craneUpDown += step;
                break;
            case 68: // Use d or D key to move the camera downward. 
                craneUpDown -= step;
                break;
            case 107: // Use + key to zoom in. 
                fov -= step;
                fov = Math.max(fov, fovMin); // lower limit of fov
                break;
            case 109: // Use - key to zoom out. 
                fov += step;
                fov = Math.min(fov, fovMax); // upper limit of fov
                break;
            case 32:
                console.log(viewProjectionMatrix);
                break;
            default: return;
        }
    }
}

var lastX = 0, lastY = 0;
var dMouseX = 0, dMouseY = 0;
var trackingMouseMotion = false;

// Register mouse callback functions 
function initMouseMotionCallback() {
    
    // If a mouse button is pressed, save the current mouse location
    // and start tracking mouse motion.  
    canvas.onmousedown = function(event) {
        var x = event.clientX;
        var y = event.clientY;
        
        var rect = event.target.getBoundingClientRect();
        // Check if the mouse cursor is in canvas. 
        if (rect.left <= x && rect.right > x &&
            rect.top <= y && rect.bottom > y) {
            lastX = x; 
            lastY = y;
            trackingMouseMotion = true;    
        }
    }

    // If the mouse button is release, stop tracking mouse motion.     
    canvas.onmouseup = function(event) {
        trackingMouseMotion = false; 
    }
    
    // Calculate how far the mouse cusor has moved and convert the mouse motion 
    // to rotation angles. 
    canvas.onmousemove = function(event) {
        var x = event.clientX;
        var y = event.clientY;
                    
        if (trackingMouseMotion) {
            var scale = 1;
            // Calculate how much the mouse has moved along X and Y axis, and then
            // normalize them based on the canvas' width and height. 
            dMouseX = (x - lastX)/canvas.width;
            dMouseY = (y - lastY)/canvas.height;            
                
            if (!rollCamera) { 
                // For camera pitch and yaw motions
                scale = 30;
                // Add the mouse motion to the current rotation angle so that the rotation 
                // is added to the previous rotations. 
                // Use scale to control the speed of the rotation.    
                yawAngle += scale * dMouseX;
                // Impose the upper and lower limits to the rotation angle. 
                yawAngle = Math.max(Math.min(yawAngle, maxYawAngle), minYawAngle); 
                
                pitchAngle += scale * dMouseY;
                pitchAngle = Math.max(Math.min(pitchAngle, maxPitchAngle), minPitchAngle);
            } else {
                // For camera roll motion
                scale = 100; 
                
                // Add the mouse motion delta to the rotation angle, don't just replace it.
                // Use scale to control the speed of the rotation. 
                rollAngle += scale * dMouseX;
                rollAngle %= 360;
            }
        }
        
        // Save the current mouse location in order to calculate the next mouse motion. 
        lastX = x;
        lastY = y;
    }
}