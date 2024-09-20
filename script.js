const vertexShaderTxt = `
  precision mediump float;

  uniform mat4 mWorld;
  uniform mat4 mView;
  uniform mat4 mProjection;

  attribute vec3 vertPosition;
  attribute vec3 vertColor;

  varying vec3 fragColor;
 
  void main() {
    fragColor = vertColor;
    gl_Position = mProjection * mView * mWorld * vec4(vertPosition, 1.0);
  }
`;

const fragmentShaderTxt = `
  precision mediump float;

  varying vec3 fragColor;

  void main() {
    gl_FragColor = vec4(fragColor, 1.0);
  }
`;

const mat4 = glMatrix.mat4;

const Triangle = function () {
  const canvas = document.getElementById("main-canvas");
  const gl = canvas.getContext("webgl");
  let canvasColor = [0.976, 0.976, 0.976];

  checkGl(gl);

  gl.clearColor(...canvasColor, 1.0); // R, G, B, A
  gl.clear(gl.COLOR_BUFFER_BIT);

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

  gl.shaderSource(vertexShader, vertexShaderTxt);
  gl.shaderSource(fragmentShader, fragmentShaderTxt);

  gl.compileShader(vertexShader);
  gl.compileShader(fragmentShader);

  checkShaderCompile(gl, vertexShader);
  checkShaderCompile(gl, fragmentShader);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);
  checkLink(gl, program);

  gl.detachShader(program, vertexShader);
  gl.detachShader(program, fragmentShader);

  gl.validateProgram(program);

  let triangleVerts = [
    // X, Y, Z
    -0.5, 0.5, 0.0,
    -0.5, -0.5, 0.0,
    0.5, -0.5, 0.0,
    0.5, -0.5, 0.0,
    0.5, 0.5, 0.0,
    -0.5, 0.5, 0.0
  ];

  let colors = [
    // R, G, B
    0.0, 0.0, 1.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 1.0,
    0.0, 1.0, 1.0,
    1.0, 0.0, 0.0,
    0.0, 0.0, 1.0
  ];

  const triangleVertBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(triangleVerts),
    gl.STATIC_DRAW
  );

  const posAttribLocation = gl.getAttribLocation(program, "vertPosition");
  gl.vertexAttribPointer(
    posAttribLocation,
    3,
    gl.FLOAT,
    gl.FALSE,
    3 * Float32Array.BYTES_PER_ELEMENT,
    0
  );
  gl.enableVertexAttribArray(posAttribLocation);

  const triangleColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  const colorAttribLocation = gl.getAttribLocation(program, "vertColor");
  gl.vertexAttribPointer(
    colorAttribLocation,
    3,
    gl.FLOAT,
    gl.FALSE,
    3 * Float32Array.BYTES_PER_ELEMENT,
    0
  );
  gl.enableVertexAttribArray(colorAttribLocation);

  gl.useProgram(program);

  const worldMatLoc = gl.getUniformLocation(program, "mWorld");
  const viewMatLoc = gl.getUniformLocation(program, "mView");
  const projectionMatLoc = gl.getUniformLocation(program, "mProjection");

  const worldMatrix = mat4.create();
  const viewMatrix = mat4.create();
  mat4.lookAt(viewMatrix, [0, 0, -4], [0, 0, 0], [0, 1, 0]);

  const projectionMatrix = mat4.create();
  mat4.perspective(
    projectionMatrix,
    glMatrix.glMatrix.toRadian(60),
    canvas.width / canvas.height,
    1,
    10
  );

  gl.uniformMatrix4fv(worldMatLoc, gl.FALSE, worldMatrix);
  gl.uniformMatrix4fv(viewMatLoc, gl.FALSE, viewMatrix);
  gl.uniformMatrix4fv(projectionMatLoc, gl.FALSE, projectionMatrix);

  const identityMat = mat4.create();
  let angle = 0;

  const loop = function () {
    angle = (performance.now() / 1000 / 60) * 23 * Math.PI;
    mat4.rotate(worldMatrix, identityMat, angle, [1, 1, -0.5]);
    gl.uniformMatrix4fv(worldMatLoc, gl.FALSE, worldMatrix);

    gl.clearColor(...canvasColor, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
};

function checkGl(gl) {
  if (!gl) {
    console.error("webgl not supported, use another browser");
  }
}

function checkShaderCompile(gl, shader) {
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("shader not compiled", gl.getShaderInfoLog(shader));
  }
}

function checkLink(gl, program) {
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("program not linked", gl.getProgramInfoLog(program));
  }
}
