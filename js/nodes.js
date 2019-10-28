/**
 * Build node structure defining planets and orbits.
 */

// Node definition - every element on the screen is associated with a node
var Node = function() {
  this.children = [];
  this.localMatrix = utils.identityMatrix();
  this.worldMatrix = utils.identityMatrix();
};

Node.prototype.setParent = function(parent) {
  // remove us from our parent
  if (this.parent) {
    var ndx = this.parent.children.indexOf(this);
    if (ndx >= 0) {
      this.parent.children.splice(ndx, 1);
    }
  }

  // Add us to our new parent
  if (parent) {
    parent.children.push(this);
  }
  this.parent = parent;
};

Node.prototype.updateWorldMatrix = function(matrix) {
  if (matrix) {
    // a matrix was passed in so do the math
    this.worldMatrix = utils.multiplyMatrices(matrix, this.localMatrix);
  } else {
    // no matrix was passed in so just copy.
    utils.copy(this.localMatrix, this.worldMatrix);
  }

  // now process all the children
  var worldMatrix = this.worldMatrix;
  this.children.forEach(function(child) {
    child.updateWorldMatrix(worldMatrix);
  });
};


// Objects: the set of nodes which are drawn on the screen
var objects = [];

// Orbits: used to compute camera position when anchored to a planet
 var orbits = [];

// Orbit nodes
var sunOrbitNode,
  earthOrbitNode,
  moonOrbitNode,
  mercuryOrbitNode,
  venusOrbitNode,
  marsOrbitNode,
  jupiterOrbitNode,
  saturnOrbitNode,
  uranusOrbitNode,
  neptuneOrbitNode;

// Planet nodes
var sunNode,
  earthNode,
  moonNode,
  mercuryNode,
  venusNode,
  marsNode,
  jupiterNode,
  saturnNode,
  uranusNode,
  neptuneNode;

// Units of measure
var d = 6; //distance mercury-sun
var x = 1; //diameter earth
var sunD = 20;

var planetScales = [sunD * 0.8, 0.38 * x, 0.948 * x, x, x * 0.27, 0.53 * x, 11.2 * x, 9.4 * x, 4.07 * x, 3.79 * x]; //Needed for the nearPlane 
var orbitScales = [0, 1, 2.07, 2.82, 0.4, 4.17, 14.76, 27.34, 52.72, 86.76];


function buildSceneGraph() {
  // Define orbits
  sunOrbitNode = new Node();
  sunOrbitNode.name = "Sun";

  mercuryOrbitNode = new Node();
  mercuryOrbitNode.localMatrix = utils.MakeTranslateMatrix(d + sunD, 0, 0);
  mercuryOrbitNode.name = "Mercury";

  venusOrbitNode = new Node();
  venusOrbitNode.localMatrix = utils.MakeTranslateMatrix(d * 2.07 + sunD, 0, 0);
  venusOrbitNode.name = "Venus";

  earthOrbitNode = new Node();
  earthOrbitNode.localMatrix = utils.MakeTranslateMatrix(d * 2.82 + sunD, 0, 0);
  earthOrbitNode.name = "Earth";

  moonOrbitNode = new Node();
  moonOrbitNode.localMatrix = utils.MakeTranslateMatrix(0.4 * d, 0, 0);
  moonOrbitNode.name = "Moon";

  marsOrbitNode = new Node();
  marsOrbitNode.localMatrix = utils.MakeTranslateMatrix(4.17 * d + sunD, 0, 0);
  marsOrbitNode.name = "Mars";

  jupiterOrbitNode = new Node();
  jupiterOrbitNode.localMatrix = utils.MakeTranslateMatrix(14.76 * d + sunD, 0, 0);
  jupiterOrbitNode.name = "Jupiter";

  saturnOrbitNode = new Node();
  saturnOrbitNode.localMatrix = utils.MakeTranslateMatrix(27.34 * d + sunD, 0, 0);
  saturnOrbitNode.name = "Saturn";

  uranusOrbitNode = new Node();
  uranusOrbitNode.localMatrix = utils.MakeTranslateMatrix(52.72 * d + sunD, 0, 0);
  uranusOrbitNode.name = "Uranus";

  neptuneOrbitNode = new Node();
  neptuneOrbitNode.localMatrix = utils.MakeTranslateMatrix(86.76 * d + sunD, 0, 0);
  neptuneOrbitNode.name = "Neptune";

  sunNode = new Node();
  sunNode.localMatrix = utils.MakeScaleMatrix(1, 5, 5);
  sunNode.drawInfo = {
    materialColor: [0.6, 0.6, 0.0],
    programInfo: program,
    bufferLength: indices.length,
    vertexArray: vao
  };

  // Define planets
  sunNode = new Node();
  sunNode.localMatrix = utils.MakeScaleMatrix(sunD*0.8, 5, 5);
  sunNode.drawInfo = {
    materialColor: [0.6, 0.6, 0.0],
    programInfo: program,
    bufferLength: indices.length,
    vertexArray: vao
  };

  mercuryNode = new Node();
  mercuryNode.localMatrix = utils.MakeScaleMatrix(0.38 * x, 3, 3);
  mercuryNode.drawInfo = {
    materialColor: [0.5, 0.5, 0.5],
    programInfo: program,
    bufferLength: indices.length,
    vertexArray: vao
  };

  venusNode = new Node();
  venusNode.localMatrix = utils.MakeScaleMatrix(0.948 * x, 3, 3);
  venusNode.drawInfo = {
    materialColor: [0.5, 0.5, 0.5],
    programInfo: program,
    bufferLength: indices.length,
    vertexArray: vao
  };

  earthNode = new Node();
  earthNode.localMatrix = utils.MakeScaleMatrix(x, 2, 2);
  earthNode.drawInfo = {
    materialColor: [0.2, 0.5, 0.8],
    programInfo: program,
    bufferLength: indices.length,
    vertexArray: vao
  };

  moonNode = new Node();
  moonNode.localMatrix = utils.MakeScaleMatrix(x * 0.27, 0.7, 0.7);
  moonNode.drawInfo = {
    materialColor: [0.6, 0.6, 0.6],
    programInfo: program,
    bufferLength: indices.length,
    vertexArray: vao,
  };

  marsNode = new Node();
  marsNode.localMatrix = utils.MakeScaleMatrix(0.53 * x, 2, 2);
  marsNode.drawInfo = {
    materialColor: [0.2, 0.5, 0.8],
    programInfo: program,
    bufferLength: indices.length,
    vertexArray: vao
  };

  jupiterNode = new Node();
  jupiterNode.localMatrix = utils.MakeScaleMatrix(11.2 * x, 2, 2);
  jupiterNode.drawInfo = {
    materialColor: [0.2, 0.5, 0.8],
    programInfo: program,
    bufferLength: indices.length,
    vertexArray: vao
  };

  saturnNode = new Node();
  saturnNode.localMatrix = utils.MakeScaleMatrix(9.4 * x, 2, 2);
  saturnNode.drawInfo = {
    materialColor: [0.2, 0.5, 0.8],
    programInfo: program,
    bufferLength: indices.length,
    vertexArray: vao
  };

  uranusNode = new Node();
  uranusNode.localMatrix = utils.MakeScaleMatrix(4.07 * x, 2, 2);
  uranusNode.drawInfo = {
    materialColor: [0.2, 0.5, 0.8],
    programInfo: program,
    bufferLength: indices.length,
    vertexArray: vao
  };

  neptuneNode = new Node();
  neptuneNode.localMatrix = utils.MakeScaleMatrix(3.79 * x, 2, 2);
  neptuneNode.drawInfo = {
    materialColor: [0.2, 0.5, 0.8],
    programInfo: program,
    bufferLength: indices.length,
    vertexArray: vao
  };

  // Build the logical tree
  sunNode.setParent(sunOrbitNode);
  mercuryOrbitNode.setParent(sunOrbitNode);
  mercuryNode.setParent(mercuryOrbitNode);
  venusOrbitNode.setParent(sunOrbitNode);
  venusNode.setParent(venusOrbitNode);
  earthOrbitNode.setParent(sunOrbitNode);
  earthNode.setParent(earthOrbitNode);
  moonOrbitNode.setParent(earthOrbitNode);
  moonNode.setParent(moonOrbitNode);
  marsOrbitNode.setParent(sunOrbitNode);
  marsNode.setParent(marsOrbitNode);
  jupiterOrbitNode.setParent(sunOrbitNode);
  jupiterNode.setParent(jupiterOrbitNode);
  saturnOrbitNode.setParent(sunOrbitNode);
  saturnNode.setParent(saturnOrbitNode);
  uranusOrbitNode.setParent(sunOrbitNode);
  uranusNode.setParent(uranusOrbitNode);
  neptuneOrbitNode.setParent(sunOrbitNode);
  neptuneNode.setParent(neptuneOrbitNode);

  // Define the objects to draw
  objects = [
    sunNode,
    earthNode,
    moonNode,
    mercuryNode,
    venusNode,
    marsNode,
    jupiterNode,
    saturnNode,
    uranusNode,
    neptuneNode
  ];

  // Save the orbits in the array
  orbits = [
    sunOrbitNode,
    mercuryOrbitNode,
    venusOrbitNode,
    earthOrbitNode,
    moonOrbitNode,
    marsOrbitNode,
    jupiterOrbitNode,
    saturnOrbitNode,
    uranusOrbitNode,
    neptuneOrbitNode
  ];
}
