#version 300 es

in vec3 position;
in vec3 normal;
in vec2 UV;

out vec3 fsPosition;
out vec3 fsNormal;
out vec2 fsUV;

uniform mat4 modelProjectionMatrix;
uniform mat4 worldMatrix;

void main() {
    // Pass variables to framgment shader
    fsPosition = (worldMatrix * vec4(position, 1.0)).xyz;
    fsNormal = (worldMatrix * vec4(normal, 0.0)).xyz;
    fsUV = UV;

    gl_Position = modelProjectionMatrix * vec4(position, 1.0);
}