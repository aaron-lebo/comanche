import {mat4, vec3} from 'gl-matrix';
let regl = require('regl')();

let keys = {};
document.onkeydown = evt => keys[evt.key] = true;
document.onkeyup = evt => keys[evt.key] = false;

let eye = [0.0, 0.0, 5.0];
let center = [0.0, 0.0, -1.0];
let up = [0.0, 1.0, 0.0];

function move() {
    let speed = 0.3;
    if (keys.w) eye = vec3.add([], eye, vec3.scale([], center, speed));
    if (keys.a) eye = vec3.sub([], eye, vec3.scale([], vec3.normalize([], vec3.cross([], center, up)), speed));
    if (keys.s) eye = vec3.sub([], eye, vec3.scale([], center, speed));
    if (keys.d) eye = vec3.add([], eye, vec3.scale([], vec3.normalize([], vec3.cross([], center, up)), speed));
}

let positions = [
    [-0.5, +0.5, +0.5], [+0.5, +0.5, +0.5], [+0.5, -0.5, +0.5], [-0.5, -0.5, +0.5], // pos z face
    [+0.5, +0.5, +0.5], [+0.5, +0.5, -0.5], [+0.5, -0.5, -0.5], [+0.5, -0.5, +0.5], // pos x
    [+0.5, +0.5, -0.5], [-0.5, +0.5, -0.5], [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5], // neg z
    [-0.5, +0.5, -0.5], [-0.5, +0.5, +0.5], [-0.5, -0.5, +0.5], [-0.5, -0.5, -0.5], // neg x
    [-0.5, +0.5, -0.5], [+0.5, +0.5, -0.5], [+0.5, +0.5, +0.5], [-0.5, +0.5, +0.5], // top
    [+0.5, -0.5, +0.5], [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5], [-0.5, -0.5, +0.5]  // bottom
];

let elements = [];
for (let i = 0; i <= 20; i += 4) {
    elements = elements.concat([i, i+1, i+2], [i, i+2, i+3]);
}

let drawCube = regl({
    frag: `
        precision mediump float;
        void main () {
            gl_FragColor = vec4(1, 1, 1, 1);
        }`,
    vert: `
        precision mediump float;
        attribute vec3 position;
        uniform mat4 projection, view;
        void main() {
            gl_Position = projection * view * vec4(position, 1);
        }`,
    attributes: {
        position: positions
    },
    elements: elements,
    uniforms: {
        view: _ => mat4.lookAt([], eye, vec3.add([], eye, center), up),
        projection: ({viewportWidth, viewportHeight}) => mat4.perspective(
            [],
            Math.PI / 4,
            viewportWidth / viewportHeight,
            0.01,
            10
        )
    }
});

regl.frame(() => {
    move();
    regl.clear({
        color: [0, 0, 0, 255],
        depth: 1
    });
    drawCube();
});
