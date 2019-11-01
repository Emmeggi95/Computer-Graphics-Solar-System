/**
 * Define recursive animations like rotation and revolution of planets.
 * The methods for these animations are called in draw.js.
 * The animation can be stopped by pressing A (camera.js).
 */

// Time values
var rot = 365; // time of one rotation of the earth
var rev = 1; // time of one revolution of the earth

// Shining effect values
var meInfluence = 0.1; // Must be between 0 and 1
var minMeInfluence = 0.0;
var maxMeInfluence = 0.2;
var increasingShine = true;
var stepShine = 0.001;

function stoppableAnimations() {
  if(animated) {
    revolutionMovement();
    rotationMovement();
  }
}

function independentAnimations() {
  shine();
}

function revolutionMovement() {
    earthOrbitNode.localMatrix = utils.multiplyMatrices(
      utils.MakeRotateYMatrix(rev),
      earthOrbitNode.localMatrix
    );
    moonOrbitNode.localMatrix = utils.multiplyMatrices(
      utils.MakeRotateYMatrix(0.6 * rev),
      moonOrbitNode.localMatrix
    );
    mercuryOrbitNode.localMatrix = utils.multiplyMatrices(
      utils.MakeRotateYMatrix(rev / 0.24),
      mercuryOrbitNode.localMatrix
    );
    venusOrbitNode.localMatrix = utils.multiplyMatrices(
      utils.MakeRotateYMatrix(rev / 0.615),
      venusOrbitNode.localMatrix
    );
    marsOrbitNode.localMatrix = utils.multiplyMatrices(
      utils.MakeRotateYMatrix(rev / 1.88),
      marsOrbitNode.localMatrix
    );
    jupiterOrbitNode.localMatrix = utils.multiplyMatrices(
      utils.MakeRotateYMatrix(rev / 11.86),
      jupiterOrbitNode.localMatrix
    );
    saturnOrbitNode.localMatrix = utils.multiplyMatrices(
      utils.MakeRotateYMatrix(rev / 29.46),
      saturnOrbitNode.localMatrix
    );
    uranusOrbitNode.localMatrix = utils.multiplyMatrices(
      utils.MakeRotateYMatrix(rev / 84.01),
      uranusOrbitNode.localMatrix
    );
    neptuneOrbitNode.localMatrix = utils.multiplyMatrices(
      utils.MakeRotateYMatrix(rev / 164.79),
      neptuneOrbitNode.localMatrix
    );
  }
  
  function rotationMovement() {
    sunNode.localMatrix = utils.multiplyMatrices(
      utils.MakeRotateYMatrix(rot / 365 *0.05),
      sunNode.localMatrix
    );
    mercuryNode.localMatrix = utils.multiplyMatrices(
      utils.MakeRotateYMatrix(rot / 58.6),
      mercuryNode.localMatrix
    );
    venusNode.localMatrix = utils.multiplyMatrices(
      utils.MakeRotateYMatrix(rot / 243),
      venusNode.localMatrix
    );
    earthNode.localMatrix = utils.multiplyMatrices(
      utils.MakeRotateYMatrix(rot),
      earthNode.localMatrix
    );
    moonNode.localMatrix = utils.multiplyMatrices(
      utils.MakeRotateYMatrix(-0.1 * rot / 365),
      moonNode.localMatrix
    );
    marsNode.localMatrix = utils.multiplyMatrices(
      utils.MakeRotateYMatrix(rot / 1.03),
      marsNode.localMatrix
    );
    jupiterNode.localMatrix = utils.multiplyMatrices(
      utils.MakeRotateYMatrix(rot / 0.41),
      jupiterNode.localMatrix
    );
    saturnNode.localMatrix = utils.multiplyMatrices(
      utils.MakeRotateYMatrix(rot / 0.45),
      saturnNode.localMatrix
    );
    uranusNode.localMatrix = utils.multiplyMatrices(
      utils.MakeRotateYMatrix(rot / 0.72),
      uranusNode.localMatrix
    );
    neptuneNode.localMatrix = utils.multiplyMatrices(
      utils.MakeRotateYMatrix(rot / 0.67),
      neptuneNode.localMatrix
    );
  }

function shine() {
  if(increasingShine) {
    meInfluence += stepShine * (1 + meInfluence/maxMeInfluence * 2);
    if(meInfluence >= maxMeInfluence) {
      meInfluence = maxMeInfluence;
      increasingShine = false;
    }
  } else {
    meInfluence -= stepShine * (1 + meInfluence/maxMeInfluence * 2);
    if(meInfluence <= minMeInfluence) {
      meInfluence = minMeInfluence;
      increasingShine = true;
    }
  }
}


function updateSpeedInfluence(val) {
  rev = val;
  rot = 365 * val;
}