let canvas = document.querySelector("#glCanvas");
 
const LAMBERTIAN = 0,
      METAL = 1,
      DIELECTRIC = 2;
const MAX_SAMPLES = 30.0;
let mouseDown = false,
    sampleCount = 0.0,
    angleX = 0.0,
    angleY = 0.0;
    zoomZ = 2.5;
let px, py;

/*
function make_objects() {
    var objects = [];
    objects.push([[0.0, -100.5, -1.0], 100.0, METAL] 
        objects[0] = sphere(vec3(0.0, -100.5, -1.0), 100.0, material(METAL, vec3(0.2, 0.2, 0.2), 0.05));
        objects[1] = sphere(vec3(1.0, 0.0, 0.0), 0.5, material(METAL, vec3(0.7, 0.2, 0.2), 0.0));
        objects[2] = sphere(vec3(0.0, 1.0, 0.0), 0.5, material(METAL, vec3(0.2, 0.7, 0.2), 0.0));
        objects[3] = sphere(vec3(-1.0, 0.0, 0.0), 0.5, material(METAL, vec3(0.2, 0.2, 0.7), 0.0));
     
}
*/

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
        sampleCount: gl.getUniformLocation(shaderProgram, 'sampleCount'),
        eye: gl.getUniformLocation(shaderProgram, 'eye'),
    };

    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticies), gl.STATIC_DRAW);

    var vPosAttrib = gl.getAttribLocation(shaderProgram, 'vPos');
    gl.vertexAttribPointer(vPosAttrib, 2,  gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(vPosAttrib);

   
    function draw() {
        gl.uniform2fv(uniforms.viewportDimesions, [canvas.width, canvas.height]);
         
        if (!mouseDown) sampleCount = Math.min(MAX_SAMPLES, sampleCount + 1.0);
         
        // Don't redraw if nothing changed
        if (sampleCount < MAX_SAMPLES) {
            let ex = zoomZ * Math.sin(angleY) * Math.cos(angleX);
            let ey = zoomZ * Math.sin(angleX);
            let ez = zoomZ * Math.cos(angleY) * Math.cos(angleX);
       
            gl.uniform3fv(uniforms.eye, [ex, ey, ez]);
            gl.uniform1f(uniforms.sampleCount, sampleCount);
       
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        requestAnimationFrame(draw); 
    }
    requestAnimationFrame(draw); 
}


window.addEventListener("mousedown", function(e) {
    mouseDown = true;
    px = e.clientX;
    py = e.clientY;
    sampleCount = 1.0;
});

window.addEventListener("mousemove", function(e) {
    if (mouseDown) {
        angleY -= (e.clientX - px) * 0.01;
        angleX += (e.clientY - py) * 0.01;

        angleX = Math.max(angleX, -Math.PI/2 + 0.01);
        angleX = Math.min(angleX, Math.PI/2 - 0.01);
        
        px = e.clientX;
        py = e.clientY;
        sampleCount = 1.0;
    }
});

window.addEventListener("mouseup", function(e) {
    mouseDown = false;
    sampleCount = 1.0;
});

main();

