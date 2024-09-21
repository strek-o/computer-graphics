const vertexShaderTxt = `
  precision mediump float;

  uniform mat4 mWorld;
  uniform mat4 mView;
  uniform mat4 mProjection;

  attribute vec3 vertPosition;
  attribute vec2 textureCoord;

  varying vec2 fragTextureCoord;
 
  void main() {
    fragTextureCoord = textureCoord;
    gl_Position = mProjection * mView * mWorld * vec4(vertPosition, 1.0);
  }
`;

const fragmentShaderTxt = `
  precision mediump float;

  varying vec2 fragTextureCoord;

  uniform sampler2D sampler;

  void main() {
    gl_FragColor = texture2D(sampler, fragTextureCoord);
  }
`;

const mat4 = glMatrix.mat4;

const Triangle = function () {
  const canvas = document.getElementById("main-canvas");
  const gl = canvas.getContext("webgl");
  let canvasColor = [0.976, 0.976, 0.976];

  checkGl(gl);

  gl.clearColor(...canvasColor, 1.0); // R, G, B, A
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

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

  let boxVerts = [
    // X, Y, Z
    -1.0, 1.0, -1.0,    // 0
    -1.0, 1.0, 1.0,     // 1
    1.0, 1.0, 1.0,      // 2
    1.0, 1.0, -1.0,     // 3
    -1.0, 1.0, 1.0,     // 4
    -1.0, -1.0, 1.0,    // 5
    -1.0, -1.0, -1.0,   // 6
    -1.0, 1.0, -1.0,    // 7
    1.0, 1.0, 1.0,      // 8
    1.0, -1.0, 1.0,     // 9
    1.0, -1.0, -1.0,    // 10
    1.0, 1.0, -1.0,     // 11
    1.0, 1.0, 1.0,      // 12
    1.0, -1.0, 1.0,     // 13
    -1.0, -1.0, 1.0,    // 14
    -1.0, 1.0, 1.0,     // 15
    1.0, 1.0, -1.0,     // 16
    1.0, -1.0, -1.0,    // 17
    -1.0, -1.0, -1.0,   // 18
    -1.0, 1.0, -1.0,    // 19
    -1.0, -1.0, -1.0,   // 20
    -1.0, -1.0, 1.0,    // 21
    1.0, -1.0, 1.0,     // 22
    1.0, -1.0, -1.0     // 23
  ];

  let boxIndices = [
    // Top
    0, 1, 2,
    0, 2, 3,
    // Left
    5, 4, 6,
    6, 4, 7,
    // Right
    8, 9, 10,
		8, 10, 11,
    // Front
    13, 12, 14,
		15, 14, 12,
    // Back
    16, 17, 18,
		16, 18, 19,
    // Bottom
    21, 20, 22,
		22, 20, 23
  ];

  boxTextureCoords = [
    // Top
    0, 0,
    0, 1,
    1, 1,
    1, 0,
    // Left
    0, 0,
    1, 0,
    1, 1,
    0, 1,
    // Right
    1, 1,
    0, 1,
    0, 0,
    1, 0,
    // Front
    1, 1,
    1, 0,
    0, 0,
    0, 1,
    // Back
    0, 0,
    0, 1,
    1, 1,
    1, 0,
    // Bottom
    1, 1,
    1, 0,
    0, 0,
    0, 1
  ];

  const boxVertBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, boxVertBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVerts), gl.STATIC_DRAW);

  const boxIndicesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndicesBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(boxIndices),
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

  const boxTextureBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, boxTextureBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(boxTextureCoords),
    gl.STATIC_DRAW
  );

  const textureLocation = gl.getAttribLocation(program, "textureCoord");
  gl.vertexAttribPointer(
    textureLocation,
    2,
    gl.FLOAT,
    gl.FALSE,
    2 * Float32Array.BYTES_PER_ELEMENT,
    0
  );
  gl.enableVertexAttribArray(textureLocation);

  const img = document.getElementById("img");
  const boxTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, boxTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

  gl.useProgram(program);

  const worldMatLoc = gl.getUniformLocation(program, "mWorld");
  const viewMatLoc = gl.getUniformLocation(program, "mView");
  const projectionMatLoc = gl.getUniformLocation(program, "mProjection");

  const worldMatrix = mat4.create();
  const viewMatrix = mat4.create();
  mat4.lookAt(viewMatrix, [0, 0, -5], [0, 0, 0], [0, 1, 0]);

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
    angle = (performance.now() / 1000 / 60) * 25 * Math.PI;
    mat4.rotate(worldMatrix, identityMat, angle, [1, 0, 1]);
    gl.uniformMatrix4fv(worldMatLoc, gl.FALSE, worldMatrix);

    gl.clearColor(...canvasColor, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindTexture(gl.TEXTURE_2D, boxTexture);
    gl.activeTexture(gl.TEXTURE0);

    gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);
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
