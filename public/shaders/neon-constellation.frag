precision mediump float;
varying vec2 pos;
uniform vec2 u_lights[2];
uniform vec2 u_resolution;

void main() {
    vec2 coord = pos * 2. - 1.;
    vec2 aspectRatio = vec2(u_resolution.x / u_resolution.y, 1.);
    coord *= aspectRatio;
    vec3 color = vec3(0.);

    for (int i = 0; i < 2; i++) {
        vec2 pos = u_lights[i] / u_resolution * aspectRatio;
        float dist = distance(pos, coord);
        float intensity = 0.1 / dist;
        color += vec3(intensity);
    }

    gl_FragColor = vec4(color, 1.0);
}
