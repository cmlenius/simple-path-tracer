let canvas, gl;


function main() {
    canvas = document.querySelector("#glCanvas");
    gl = canvas.getContext("webgl2");

    if (gl == null) {
        alert("Unable to initialize WebGl2");
        return;
    }

    // window.addEventListener('resize', onResizeWindow);
    // onResizeWindow();

    const shaderProgram = glUtils.initShaderProgram(gl);
    gl.useProgram(shaderProgram);

    var uniforms = {
        viewportDimesions: gl.getUniformLocation(shaderProgram, 'viewportDimensions'),
        minI: gl.getUniformLocation(shaderProgram, 'g_seed'),
    };

    var vpDimesions = [canvas.width, canvas.height];

    var vertexBuffer = gl.createBuffer();
    var verticies = [
        -1, 1,
        -1, -1,
        1, -1,

        -1, 1,
        1, 1,
        1, -1
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticies), gl.STATIC_DRAW);

    var vPosAttrib = gl.getAttribLocation(shaderProgram, 'vPos');
    gl.vertexAttribPointer(vPosAttrib, 2,  gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(vPosAttrib);


    function draw() {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.uniform2fv(uniforms.viewportDimesions, vpDimesions);

        gl.drawArrays(gl.TRIANGLES, 0, 6);


        // requestAnimationFrame(draw);
    }

    draw();
    // requestAnimationFrame(draw);
}

function onResizeWindow() {
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    gl.viewport(0, 0, canvas.width, canvas.height);
}

main();