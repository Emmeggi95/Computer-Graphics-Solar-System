#version 300 es

precision mediump float;

in vec3 fsPosition;
in vec3 fsNormal;
in vec2 fsUV;

// Texture
uniform sampler2D objectTexture;

// Ambient lighting
uniform vec3 alColor;
uniform float alInfluence;

// Material emission
uniform vec3 meColor;
uniform float meInfluence;

// Point light
uniform vec3 plPosition;
uniform vec3 plColor;
uniform float plTarget;
uniform float plDecay;

out vec4 outColor;

void main() {
    // Texture
    vec4 textureColor = texture(objectTexture, fsUV);

    // Ambient light
    vec4 ambientLight = vec4(alInfluence * alColor, 1.0) * textureColor;    // White light multiplied per ambient influence

    // Emission light
    vec4 emissionLight = 
        vec4(meColor * meInfluence, 1.0)        // White component to give "brighteness", multiplied per emission influence
        + textureColor * vec4(meColor, 1.0);    // Texture component to give to a bright object full visibility

    // Point light
    float plDistance = length(plPosition - fsPosition);
    vec4 pointLight = vec4(plColor * pow(plTarget / plDistance, plDecay), 1.0);
    vec4 lambertDiffuse = textureColor * clamp(dot(normalize(plPosition - fsPosition), fsNormal), 0.0, 1.0);

    // Shader output
    outColor = clamp(pointLight * lambertDiffuse + ambientLight + emissionLight, 0.0, 1.0);
}