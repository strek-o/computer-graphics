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

function Draw() {
  OBJ.downloadMeshes(
    {
      obj: "object.obj"
    },
    Triangle
  );
}

const Triangle = function (meshes) {
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

  OBJ.initMeshBuffers(gl, meshes.obj);
  gl.bindBuffer(gl.ARRAY_BUFFER, meshes.obj.vertexBuffer);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshes.obj.indexBuffer);

  const posAttribLocation = gl.getAttribLocation(program, "vertPosition");
  gl.vertexAttribPointer(
    posAttribLocation,
    meshes.obj.vertexBuffer.itemSize,
    gl.FLOAT,
    gl.FALSE,
    0,
    0
  );
  gl.enableVertexAttribArray(posAttribLocation);

  gl.bindBuffer(gl.ARRAY_BUFFER, meshes.obj.textureBuffer);

  const textureLocation = gl.getAttribLocation(program, "textureCoord");
  gl.vertexAttribPointer(
    textureLocation,
    meshes.obj.textureBuffer.itemSize,
    gl.FLOAT,
    gl.FALSE,
    0,
    0
  );
  gl.enableVertexAttribArray(textureLocation);

  const img = document.getElementById("main-texture");
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
  mat4.lookAt(viewMatrix, [0, 0, -17], [0, 0, 0], [0, 1, 0]);

  const projectionMatrix = mat4.create();
  mat4.perspective(
    projectionMatrix,
    glMatrix.glMatrix.toRadian(60),
    canvas.width / canvas.height,
    1,
    100
  );

  gl.uniformMatrix4fv(worldMatLoc, gl.FALSE, worldMatrix);
  gl.uniformMatrix4fv(viewMatLoc, gl.FALSE, viewMatrix);
  gl.uniformMatrix4fv(projectionMatLoc, gl.FALSE, projectionMatrix);

  const identityMat = mat4.create();
  let angle = 0;

  const loop = function () {
    angle = (performance.now() / 1000 / 60) * 25 * Math.PI;
    mat4.rotate(worldMatrix, identityMat, angle, [0.4, 1, 0]);
    gl.uniformMatrix4fv(worldMatLoc, gl.FALSE, worldMatrix);

    gl.clearColor(...canvasColor, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindTexture(gl.TEXTURE_2D, boxTexture);
    gl.activeTexture(gl.TEXTURE0);

    gl.drawElements(
      gl.TRIANGLES,
      meshes.obj.indexBuffer.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
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
