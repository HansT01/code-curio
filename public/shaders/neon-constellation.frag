precision mediump float;
varying vec2 pos;
uniform vec2 u_resolution;
uniform vec2 u_lightPositions[2];
uniform float u_lightRadii[2];
uniform vec3 u_lightColors[2];

void main() {
    vec2 aspectRatio = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 coord = (pos * 2.0 - 1.0) * aspectRatio;

    vec3 color = vec3(0.0);

    for (int i = 0; i < 2; i++) {
        vec2 lightPos = 2.0 * u_lightPositions[i] / u_resolution * aspectRatio;
        float lightRadius = (u_lightRadii[i] / u_resolution.x);
        vec3 lightColor = u_lightColors[i];

        float dist = distance(lightPos, coord) - lightRadius;
        dist = clamp(dist, 0., 1.);
        float intensity = 1.0 / (dist);
        color += lightColor * intensity * lightRadius;
    }

    gl_FragColor = vec4(color, 1.);
}