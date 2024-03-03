precision mediump float;
varying vec2 pos;
uniform vec3 u_lights[2];
uniform vec2 u_resolution;

void main() {
    vec2 aspectRatio = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 coord = pos * 2.0 - 1.0;
    coord *= aspectRatio;

    vec4 color = vec4(0.0);

    for (int i = 0; i < 2; i++) {
        vec2 lightPos = 2.0 * u_lights[i].xy / u_resolution * aspectRatio;
        float dist = distance(lightPos, coord) - (u_lights[i].z / u_resolution.y);
        dist = clamp(dist, 0., 1.);
        float intensity = 1. / (dist);
        color += vec4(0.1 * intensity);
    }

    gl_FragColor = color;
}