precision mediump float;
varying vec2 pos;

void main() {
    vec4 color1 = vec4(.5, .1, .9, 1.);
    vec4 color2 = vec4(.1, .8, .7, 1.);
    vec4 color3 = vec4(.8, .6, .1, 1.);
    vec4 color4 = vec4(.7, .1, .2, 1.);

    // X is right
    // Y is up
    vec4 c = mix(mix(color1, color2, pos.x), mix(color3, color4, pos.x), pos.y);
    gl_FragColor = c;
}
