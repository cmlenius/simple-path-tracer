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
let rotation = 0.0;

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
        lookFrom: gl.getUniformLocation(shaderProgram, 'lookFrom'),
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

        let radius = 2.0;
        let camx = Math.sin(rotation) * radius;
        let camy = Math.cos(rotation) * radius;
        let lookfrom = [camx, 0.0, camy];
       
        gl.uniform3fv(uniforms.lookFrom, lookfrom);
       
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        // requestAnimationFrame(draw); 
    }
   
    requestAnimationFrame(draw); 
}


window.addEventListener("mousedown", function() {
    mouseDown = true;
});

let px = 0;
window.addEventListener("mousemove", function(e) {
    if (mouseDown) {
        if(e.clientX >= px) {
            rotation -= 0.07;
        } else {
            rotation += 0.07;
        }
        px = e.clientX;
    }
});

window.addEventListener("mouseup", function() {
    mouseDown = false;
});

main();






