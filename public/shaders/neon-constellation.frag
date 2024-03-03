precision mediump float;

#define NUM_LIGHTS 100

varying vec2 pos;
uniform vec2 u_resolution;
uniform vec2 u_lightPositions[NUM_LIGHTS];
uniform float u_lightRadii[NUM_LIGHTS];
uniform vec3 u_lightColors[NUM_LIGHTS];

void main() {
    vec2 aspectRatio = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 coord = (pos * 2.0 - 1.0) * aspectRatio;

    vec3 color = vec3(0.0);

    for (int i = 0; i < NUM_LIGHTS; i++) {
        vec2 lightPos = (2.0 / u_resolution) * u_lightPositions[i] * aspectRatio;
        float lightRadius = (2.0 / u_resolution.y) * u_lightRadii[i];
        vec3 lightColor = u_lightColors[i];

        float dist = distance(lightPos, coord) - lightRadius;
        dist = clamp(dist, 0.0, 1.0);
        float intensity = 1.0 / (dist) * 0.2;
        color += lightColor * intensity * lightRadius;
    }

    gl_FragColor = vec4(color, 1.0);
}