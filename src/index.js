import {mat4, vec3} from 'gl-matrix';
import * as upng from 'upng-js';

let l = console.log;

let block = {
    positions: [],
    indices: [],
    add(x, y, z) {
	      const a = 0.5;
	      const b = -a;
	      let positions = [
		        b, b, a,
		        a, b, a,
		        a, a, a,
		        b, a, a,
		        b, b, b,
		        b, a, b,
		        a, a, b,
		        a, b, b
	      ];
	      let indices = [
		        0, 1, 2, 2, 3, 0, // +z
		        4, 5, 6, 6, 7, 4, // -z
		        3, 2, 6, 6, 5, 3, // +y
		        0, 4, 7, 7, 1, 0, // -y
		        1, 7, 6, 6, 2, 1, // +x
		        0, 3, 5, 5, 4, 0 // -x
        ];
        let sum = this.positions.length / 3;
        for (let i = 0; i < 24; i += 3) {
            this.positions.push(positions[i] + x);
            this.positions.push(positions[i + 1] + y);
            this.positions.push(positions[i + 2] + z);
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

let keys = {};
let [pitch, yaw] = [-35.0, 45.0];
let [eye, center, up] = [[0.0, 500.0, 0.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]];

document.onkeydown = ({key}) => keys[key] = true;
document.onkeyup = ({key}) => {
    keys[key] = false;
    key === ' ' && document.body.requestPointerLock();
};

let radians = deg => deg * Math.PI / 180.0;
let cos = deg => Math.cos(radians(deg));
let sin = deg => Math.sin(radians(deg));

document.addEventListener('mousemove', ({movementX, movementY}) => {
    const sensitivity = 0.05;
    yaw += sensitivity * movementX;
    pitch -= sensitivity * movementY;
    pitch = pitch > 89.0 ? 89.0
        : pitch < -89.0 ? -89.0
        : pitch;
}, false);

function update() {
    center = vec3.normalize([], [
        cos(yaw) * cos(pitch),
        sin(pitch),
        sin(yaw) * cos(pitch)
    ]);

    const speed = 2.0;
    let {w, a, s, d} = keys;
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
    update();
    resize_canvas();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let projection = mat4.perspective(
        [],
        radians(45),
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

function main() {
    let canvas = document.getElementById('canvas');
    gl = canvas.getContext('webgl2');
    if (!gl) {
        alert("can't load webgl");
        return;
    }

    let ext = gl.getExtension('OES_element_index_uint');
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    let req = new XMLHttpRequest();
    req.responseType = 'arraybuffer';
    req.open('GET', 'https://raw.githubusercontent.com/s-macke/VoxelSpace/master/maps/D1.png', true);
    req.onload = evt => {
        let buf = req.response;
        if (!buf) {
            return;
        }

        let img = upng.decode(buf);
        let rgba = new Uint8Array(upng.toRGBA8(img)[0]);

        const size = 1024;
        let rand_int = max => Math.floor(Math.random() * max);
        let i = 0;
        for (let x = 0; x < size; x++) {
            for (let z = 0; z < size; z++) {
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

        requestAnimationFrame(render);
    };
    req.send(null);
}

main();
