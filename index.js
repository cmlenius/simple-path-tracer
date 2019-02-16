let canvas, gl;
const verticies = [
    -1, 1,
    -1, -1,
    1, -1,

    -1, 1,
    1, 1,
    1, -1
];

let rotation = 0.0;

function main() {
    canvas = document.querySelector("#glCanvas");
    gl = canvas.getContext("webgl2");

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
    var lookfrom = [-0.5,1.0,2.0];
    gl.uniform2fv(uniforms.viewportDimesions, vpDimesions);
    gl.uniform3fv(uniforms.lookFrom, lookfrom);


   
    function draw() {
        rotation += 1.0;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
       
        gl.uniform3fv(uniforms.lookFrom, lookfrom);
       
        gl.drawArrays(gl.TRIANGLES, 0, 6);
 //       requestAnimationFrame(draw); 
    }
   
    requestAnimationFrame(draw); 
}
main();
