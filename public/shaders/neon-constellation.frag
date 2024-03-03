precision mediump float;
varying vec2 pos;
uniform vec3 color[2];

void main() {
    gl_FragColor = vec4(color[1], 1.);
}
