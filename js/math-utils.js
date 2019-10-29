function rotate3dVector(v, yawAngle, pitchAngle, factor) {
    var pitchSin = Math.sin(utils.degToRad(pitchAngle));
    var pitchCos = Math.cos(utils.degToRad(pitchAngle));
    var yawSin = Math.sin(utils.degToRad(yawAngle));
    var yawCos = Math.cos(utils.degToRad(yawAngle));
  
    var x, y, z, z1;
  
    // Vertical rotation around x
    z1 = pitchCos * v[2] - pitchSin * v[1];
    y = pitchSin * v[2] + pitchCos * v[1];
  
    // Horizontal rotation around y
    z = yawCos * z1 - yawSin * v[0];
    x = yawSin * z1 + yawCos * v[0];
  
    return [x * factor, y * factor, z * factor];
  }

function rotate2dVector(v, angle, factor) {
    var sin = Math.sin(utils.degToRad(angle));
    var cos = Math.cos(utils.degToRad(angle));

    var x, y;

    x = cos * v[0] - sin * v[1];
    y = sin * v[0] + cos * v[1];

    return [x * factor, y * factor];
}

function sum3dVectors(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
}

function sum2dVectors(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1]];
}

function angleBetween2dVectors(v1, v2) {
    var m1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
    var m2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
    var dot = v1[0] * v2[0] + v1[1] * v2[1];
    return Math.acos(dot / (m1 * m2));
}