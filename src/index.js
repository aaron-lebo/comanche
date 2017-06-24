import {mat4, vec3} from 'gl-matrix';
let regl = require('regl')();

let keys = {};
document.onkeydown = ({key}) => keys[key] = true;
document.onkeyup = ({key}) => {
    keys[key] = false;
    if (key == ' ') document.body.requestPointerLock();
};

let eye = [0.0, 0.0, 20.0];
let center = [0.0, 0.0, -0.1];
let up = [0.0, 1.0, 0.0];

let move = _ => {
    let speed = 0.3;
    if (keys.w) vec3.add(eye, eye, vec3.scale([], center, speed));
    if (keys.a) vec3.sub(eye, eye, vec3.scale([], vec3.normalize([], vec3.cross([], center, up)), speed));
    if (keys.s) vec3.sub(eye, eye, vec3.scale([], center, speed));
    if (keys.d) vec3.add(eye, eye, vec3.scale([], vec3.normalize([], vec3.cross([], center, up)), speed));
};

let [pitch, yaw] = [0.0, -90.0];

document.addEventListener('mousemove', ({movementX, movementY}) => {
    let sensitivity = 0.05;
    yaw += sensitivity * movementX;
    pitch -= sensitivity * movementY;
    pitch = pitch > 89.0 ? 89.0
        : pitch < -89.0 ? -89.0
        : pitch;
    let radians = x => x * Math.PI / 180.0;
    let cos = x => Math.cos(radians(x));
    let sin = x => Math.sin(radians(x));
    center = vec3.normalize([], [
        cos(yaw) * cos(pitch),
        sin(pitch),
        sin(yaw) * cos(pitch)
    ]);
}, false);

let block = [
    [[-0.5, +0.5, +0.5], [+0.5, +0.5, +0.5], [+0.5, -0.5, +0.5], [-0.5, -0.5, +0.5]], // pos z face
    [[+0.5, +0.5, +0.5], [+0.5, +0.5, -0.5], [+0.5, -0.5, -0.5], [+0.5, -0.5, +0.5]], // pos x
    [[+0.5, +0.5, -0.5], [-0.5, +0.5, -0.5], [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5]], // neg z
    [[-0.5, +0.5, -0.5], [-0.5, +0.5, +0.5], [-0.5, -0.5, +0.5], [-0.5, -0.5, -0.5]], // neg x
    [[-0.5, +0.5, -0.5], [+0.5, +0.5, -0.5], [+0.5, +0.5, +0.5], [-0.5, +0.5, +0.5]], // top
    [[+0.5, -0.5, +0.5], [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5], [-0.5, -0.5, +0.5]]  // bottom
];

let positions = [];
let elements = [];
let addBlock = (x, y, z) => {
    let idx = positions.length;
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < block[i].length; j++) {
            let pos = block[i][j];
            positions.push([pos[0]+x, pos[1]+y, pos[2]+z]);
        }
        elements.push([idx, idx+1, idx+2]);
        elements.push([idx, idx+2, idx+3]);
        idx += 4;
    }
};

let size = 10;
for (let x = -size; x <= size; x++) {
    for (let z = -size; z <= size; z++) {
        addBlock(x, 0, z);
    }
}

let draw = regl({
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
            1000
        )
    }
});

regl.frame(_ => {
    move();
    regl.clear({
        color: [0, 0, 0, 255],
        depth: 1
    });
    draw();
});
