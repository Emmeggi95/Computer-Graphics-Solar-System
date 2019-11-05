/**
 * Load textures from image files.
 */

var texturesDir = "http://127.0.0.1:8889/assets/textures/";

var fileNames = [
  "Sun2.jpg",
  "EarthDay2.jpg",
  "Moon2.jpg",
  "Mercury2.jpg",
  "VenusAtmosphere3.jpg",
  "Mars2.jpg",
  "Jupiter2.jpg",
  "Saturn2.jpg",
  "Uranus.jpg",
  "Neptune.jpg",
  "StarsMilkyWay2.jpg"
];

var textures = [];


function loadTextures() {
  fileNames.forEach(function(fileName, index) {
    var image = new Image();
    requestCORSIfNotSameOrigin(image, texturesDir + fileName);

    image.onload = function() {
      var texture = gl.createTexture();
      textures[index] = texture;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
      );
      
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);
    };

    image.src = texturesDir + fileName;
  });
}

function requestCORSIfNotSameOrigin(img, url) {
  if (new URL(url).origin !== window.location.origin) {
    img.crossOrigin = "";
  }
}
