/**
 * Load model from json and load buffers for positions, UVs and normals.
 */

var modelDir = "http://127.0.0.1:8889/assets/";

// json model
var model;

// Model values
var vertices, indices, normals, UVs;

// Buffers
var positionBuffer, indexBuffer, normalBuffer, UVBuffer;

// Vertex Array Object
var vao;


function loadModel() {
  // Load model from json file
  utils.get_json(modelDir + "OnePlanet.json", function(jsonFile) {
    model = jsonFile;
  });

  // Read values from model
  vertices = model.meshes[0].vertices;
  indices = [].concat.apply([], model.meshes[0].faces);
  normals = model.meshes[0].normals;
  UVs = model.meshes[0].texturecoords[0];

  // VAO
  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // Init buffers
  positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertices),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

  indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(normals),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(normalLoc);
  gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);

  UVBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, UVBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(UVs),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(UVLoc);
  gl.vertexAttribPointer(UVLoc, 2, gl.FLOAT, false, 0, 0);
}
