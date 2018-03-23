import {mat4, vec3} from 'gl-matrix';
import * as upng from 'upng-js';

let l = console.log;
let el = id => document.getElementById(id);

let block = {
    positions: [],
    indices: [],
    add(x, y, z) {
        const a = 0.5;
        const b = -a;
        const positions = [
            b, b, a,
            a, b, a,
            a, a, a,
            b, a, a,
            b, b, b,
            b, a, b,
            a, a, b,
            a, b, b
        ];
        const indices = [
            0, 1, 2, 2, 3, 0, // +z
            4, 5, 6, 6, 7, 4, // -z
            3, 2, 6, 6, 5, 3, // +y
            0, 4, 7, 7, 1, 0, // -y
            1, 7, 6, 6, 2, 1, // +x
            0, 3, 5, 5, 4, 0  // -x
        ];
        let push = (i, x) => this.positions.push(positions[i] + x);
        let sum = this.positions.length / 3;
        for (let i = 0; i < 24;) {
            push(i++, x);
            push(i++, y);
            push(i++, z);
        }
        indices.forEach(x => this.indices.push(sum + x));
    },
    vertex_shader: `
        precision mediump float;
        uniform mat4 projection_view;
        attribute vec3 position;
        void main() {
            gl_Position = projection_view * vec4(position, 1.0);
        }`,
    fragment_shader: `
        precision mediump float;
        void main () {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }`
};

let keys;
let pitch, yaw;
let eye, center, up;

function reset_input() {
    keys = {};
    [pitch, yaw] = [-35.0, 45.0];
    [eye, center, up] = [[0.0, 500.0, 0.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]];
}

document.onkeydown = ({key}) => keys[key] = true;
document.onkeyup = ({key}) => {
    keys[key] = false;
    key === ' ' && document.body.requestPointerLock();
};

let rad = deg => deg * Math.PI / 180.0;
let cos = deg => Math.cos(rad(deg));
let sin = deg => Math.sin(rad(deg));

document.addEventListener('mousemove', ({movementX, movementY}) => {
    const sensitivity = 0.05;
    yaw += sensitivity * movementX;
    pitch -= sensitivity * movementY;
    pitch = pitch > 89.0 ? 89.0
        : pitch < -89.0 ? -89.0
        : pitch;
}, false);

const fps = el('fps');
let then = 0;

function update_fps(now) {
    now *= 0.001;
    let delta_time = now - then;
    fps.textContent = (1 / delta_time).toFixed();
    then = now;
}

function update_player() {
    center = vec3.normalize([], [cos(yaw) * cos(pitch), sin(pitch), sin(yaw) * cos(pitch)]);

    const speed = 2.0;
    const {w, a, s, d} = keys;
    if (w || s) {
        let dist = vec3.scale([], center, speed);
        w && vec3.add(eye, eye, dist);
        s && vec3.sub(eye, eye, dist);
    }
    if (a || d) {
        let dist = vec3.scale([], vec3.normalize([], vec3.cross([], center, up)), speed);
        a && vec3.sub(eye, eye, dist);
        d && vec3.add(eye, eye, dist);
    }
}

let gl;

function resize_canvas() {
    let {width, height, clientWidth, clientHeight} = gl.canvas;
    if (width === clientWidth && height === clientHeight) {
        return;
    }

    gl.canvas.width = clientWidth;
    gl.canvas.height = clientHeight;
    gl.viewport(0, 0, clientWidth,  clientHeight);
}

function render(now) {
    update_fps(now);
    update_player();
    resize_canvas();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let projection = mat4.perspective(
        [],
        rad(45),
        gl.canvas.clientWidth / gl.canvas.clientHeight,
        0.01,
        1000
    );
    let view = mat4.lookAt([], eye, vec3.add([], eye, center), up);
    let projection_view = mat4.mul([], projection, view);

    let {program, vao, indices} = block;
    gl.useProgram(program);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'projection_view'), false, projection_view);
    gl.bindVertexArray(vao);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);
    gl.bindVertexArray(null);

    requestAnimationFrame(render);
}

function create_shader(type, src)  {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader;
    }

    alert(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function create_program({vertex_shader, fragment_shader}) {
    let program = gl.createProgram();
    gl.attachShader(program, create_shader(gl.VERTEX_SHADER, vertex_shader));
    gl.attachShader(program, create_shader(gl.FRAGMENT_SHADER, fragment_shader));
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return program;
    }

    alert(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

function load_map(name, then=_ => {}) {
    let req = new XMLHttpRequest();
    req.responseType = 'arraybuffer';
    req.open('GET', `https://raw.githubusercontent.com/s-macke/VoxelSpace/master/maps/${name}.png`, true);
    req.onload = evt => {
        let buf = req.response;
        if (!buf) {
            return;
        }

        reset_input();
        block.positions = [];
        block.indices = [];

        let img = upng.decode(buf);
        let rgba = new Uint8Array(upng.toRGBA8(img)[0]);
        let i = 0;
        for (let x = 0; x < img.height; x++) {
            for (let z = 0; z < img.width; z++) {
                block.add(x, rgba[i], z);
                i += 4;
            }
        }

        block.program = create_program(block);
        block.vao = gl.createVertexArray();
        gl.bindVertexArray(block.vao);
        let position_buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, position_buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(block.positions), gl.STATIC_DRAW);
        let position_loc = gl.getAttribLocation(block.program, 'position');
        gl.vertexAttribPointer(position_loc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(position_loc);
        let index_buf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(block.indices), gl.STATIC_DRAW, 0);
        gl.bindVertexArray(null);

        then();
    };
    req.send(null);
}

const map_select = el('map_select');
map_select.onchange = _ => load_map(map_select.value);

function main() {
    const canvas = el('canvas');
    gl = canvas.getContext('webgl2');
    if (!gl) {
        alert("can't load webgl2");
        return;
    }

    gl.getExtension('OES_element_index_uint');
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    ['D1', 'D2'].map(x => {
        const opt = document.createElement('option');
        opt.value = x;
        opt.innerHTML = x;
        map_select.appendChild(opt);
    });

    load_map('D1', _ => requestAnimationFrame(render));
}

main();
