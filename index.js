function main() {
    let canvas = document.querySelector("#glCanvas");
    let gl = canvas.getContext("webgl2");

    if (gl == null) {
        alert("Unable to initialize WebGl2");
        return;
    }
    const shaderProgram = glUtils.initShaderProgram(gl);
    gl.useProgram(shaderProgram);

    var verticies = [
        -1, 1,
        -1, -1,
        1, -1,

        -1, 1,
        1, 1,
        1, -1
    ];
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticies), gl.STATIC_DRAW);

    var vPosAttrib = gl.getAttribLocation(shaderProgram, 'vPos');
    gl.vertexAttribPointer(vPosAttrib, 2,  gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(vPosAttrib);


    function draw() {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        requestAnimationFrame(draw);
    }

    draw();
    requestAnimationFrame(draw);
}

main();