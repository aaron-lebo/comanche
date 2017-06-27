import {mat4, vec3} from 'gl-matrix';
let regl = require('regl')();

let keys = {};
document.onkeydown = ({key}) => keys[key] = true;
document.onkeyup = ({key}) => {
    keys[key] = false;
    if (key == ' ') document.body.requestPointerLock();
};

let [eye, center, up] = [[0.0, 0.0, 20.0], [0.0, 0.0, -0.1], [0.0, 1.0, 0.0]];

let move = () => {
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

let rand = (min, max) => Math.random() * (max - min) + min;
let randInt = max => Math.floor(Math.random() * max);

let [size, points] = [40, {}];
for (let x = 0; x <= size; x++) {
    for (let z = 0; z <= size; z++)
        points[[x, z]] = [rand(-0.15, 0.15), rand(-0.15, 0.15)];
}
console.log(points);

let genBlock = (x, y, z) => {
    let [x1, z1, x2, z2, x3, z3, x4, z4] = [].concat(points[[x, z+1]], points[[x+1, z+1]], points[[x+1, z]], points[[x, z]]);
    [x1, z1, x2, z2, x3, z3, x4, z4] = [
        0.5 + x1, 0.5 - z1,
        0.5 - x2, 0.5 - z2,
        0.5 - x3, 0.5 + z3,
        0.5 + x4, 0.5 + z4
    ];
    let [a, b, c, d, e, f, g, h] = [
        [-x1, +0.5, +z1], [+x2, +0.5, +z2], [+x2, -0.5, +z2], [-x1, -0.5, +z1],
        [+x3, +0.5, -z3], [-x4, +0.5, -z4], [-x4, -0.5, -z4], [+x3, -0.5, -z3]
    ];
    return [
        [a, b, c, d], // +z face
        [b, e, h, c], // +x
        [e, f, g, h], // -z
        [f, a, d, g], // -x
        [f, e, b, a], // +y
        [c, g, h, d]  // -y
    ];
};

let [positions, elements] = [[], []];
let addBlock = (x, y, z) => {
    genBlock(x, y, z).map(face => {
        let idx = positions.length;
        elements = elements.concat([[idx, idx+1, idx+2], [idx, idx+2, idx+3]]);
        positions = positions.concat(face.map(pt => vec3.add([], pt, [x, y, z])));
    });
};

for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++)
        addBlock(x, randInt(40), z);
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
