import {mat4, vec3} from 'gl-matrix';
import maps from '../static/*';

let {log} = console;
let el = id => document.getElementById(id);

let block = {
    reset() {
        this.positions = [];
        this.indices = [];
        this.coords = [];
    },
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
        const push = (i, x) => this.positions.push(positions[i] + x);
        const sum = this.positions.length / 3;
        for (let i = 0; i < 24;) {
            push(i++, x);
            push(i++, y);
            push(i++, z);
            this.coords.push(z / 1024);
            this.coords.push(x / 1024);
        }
        indices.forEach(x => this.indices.push(sum + x));
    },
    vertex_shader: `#version 300 es
        precision mediump float;
        uniform mat4 projection_view;
        in vec3 position;
        in vec2 coord;
        out vec2 tex_coord;
        void main() {
            gl_Position = projection_view * vec4(position, 1.0);
            tex_coord = coord;
        }`,
    fragment_shader: `#version 300 es
        precision mediump float;
        uniform sampler2D tex;
        in vec2 tex_coord;
        out vec4 color;
        void main() {
            color = texture(tex, tex_coord);
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
    gl.uniform1i(gl.getUniformLocation(program, 'tex'), 0);
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

const color_and_height = {
    'C1W': 'D1',
    'C2W': 'D2',
    'C3': 'D3',
    'C4': 'D4',
    'C5W': 'D5',
    'C6W': 'D6',
    'C7W': 'D7',
    'C8': 'D6',
    'C9W': 'D9',
    'C10W': 'D10',
    'C11W': 'D11',
    'C12W': 'D11',
    'C13': 'D13',
    'C14': 'D14',
    'C15': 'D15',
    'C16W': 'D16',
    'C17W': 'D17',
    'C18W': 'D18',
    'C19W': 'D19',
    'C20W': 'D20',
    'C21': 'D21',
    'C22W': 'D22',
    'C23W': 'D21',
    'C24W': 'D24',
    'C25W': 'D25',
    'C26W': 'D18',
    'C27W': 'D15',
    'C28W': 'D25',
    'C29W': 'D16'
};

function load_map(name, then=_ => {}) {
    reset_input();
    block.reset();

    let colormap = new Image();
    colormap.src = maps[name + '.png'];
    colormap.addEventListener('load', _ => {
        let tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, colormap);
        gl.generateMipmap(gl.TEXTURE_2D);
    });

    let heightmap = new Image();
    heightmap.src = maps[color_and_height[name] + '.png'];
    heightmap.addEventListener('load', _ =>  {
        let {width, height} = heightmap;
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(heightmap, 0, 0);
        let data = ctx.getImageData(0, 0, width, height);
        let i = 0;
        for (let x = 0; x < width; x++) {
            for (let z = 0; z < height; z++) {
                block.add(x, data.data[i], z);
                i += 4;
            }
        }

        block.program = create_program(block);
        block.vao = gl.createVertexArray();
        let {vao, program, positions, indices, coords} = block;

        gl.bindVertexArray(vao);
        let position_buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, position_buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        let position_loc = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(position_loc);
        gl.vertexAttribPointer(position_loc, 3, gl.FLOAT, false, 0, 0);
        let index_buf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
        let coord_buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, coord_buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords), gl.STATIC_DRAW);
        let coord_loc = gl.getAttribLocation(program, 'coord');
        gl.enableVertexAttribArray(coord_loc);
        gl.vertexAttribPointer(coord_loc, 2, gl.FLOAT, false, 0, 0);
        gl.bindVertexArray(null);

        then();
    });
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
    gl.enable(gl.DEPTH_TEST);
    gl.cullFace(gl.BACK);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    Object.keys(color_and_height).map(x => {
        const opt = document.createElement('option');
        opt.value = x;
        opt.innerHTML = x;
        map_select.appendChild(opt);
    });

    load_map('C1W', _ => requestAnimationFrame(render));
}

main();
