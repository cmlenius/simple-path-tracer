let canvas = document.querySelector("#glCanvas");
const verticies = [
    -1, 1,
    -1, -1,
    1, -1,

    -1, 1,
    1, 1,
    1, -1
];

let mouseDown = false;
let zoomZ = 2.5;
let angleX = 0.0;
let angleY = 0.0;
let px, py;

function main() {
    let gl = canvas.getContext("webgl2");

    if (gl == null) {
        alert("Unable to initialize WebGl2");
        return;
    }

    const shaderProgram = glUtils.initShaderProgram(gl);
    gl.useProgram(shaderProgram);

    let uniforms = {
        viewportDimesions: gl.getUniformLocation(shaderProgram, 'viewportDimensions'),
        eye: gl.getUniformLocation(shaderProgram, 'eye'),
    };

    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticies), gl.STATIC_DRAW);

    var vPosAttrib = gl.getAttribLocation(shaderProgram, 'vPos');
    gl.vertexAttribPointer(vPosAttrib, 2,  gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(vPosAttrib);

    var vpDimesions = [canvas.width, canvas.height];
    gl.uniform2fv(uniforms.viewportDimesions, vpDimesions);
   
    function draw() {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        let ex = zoomZ * Math.sin(angleY) * Math.cos(angleX);
        let ey = zoomZ * Math.sin(angleX);
        let ez = zoomZ * Math.cos(angleY) * Math.cos(angleX);
       
        gl.uniform3fv(uniforms.eye, [ex, ey, ez]);
       
        gl.drawArrays(gl.TRIANGLES, 0, 6);
       requestAnimationFrame(draw); 
    }
   
    requestAnimationFrame(draw); 
}


window.addEventListener("mousedown", function(e) {
    mouseDown = true;
    px = e.clientX;
    py = e.clientY;
});

window.addEventListener("mousemove", function(e) {
    if (mouseDown) {
        angleY -= (e.clientX - px) * 0.01;
        angleX += (e.clientY - py) * 0.01;

        angleX = Math.max(angleX, -Math.PI/2 + 0.01);
        angleX = Math.min(angleX, Math.PI/2 - 0.01);
        
        px = e.clientX;
        py = e.clientY;
    }
});

window.addEventListener("mouseup", function(e) {
    mouseDown = false;
});

main();

