const vertexShaderTxt = `
  precision mediump float;

  uniform mat4 mWorld;
  uniform mat4 mView;
  uniform mat4 mProjection;

  attribute vec3 vertPosition;
  attribute vec2 textureCoord;
  attribute vec3 vertNormal;

  varying vec2 fragTextureCoord;
  varying vec3 fragNormal;
 
  void main() {
    fragTextureCoord = textureCoord;
    fragNormal = (mWorld * vec4(vertNormal, 0.0)).xyz;
    gl_Position = mProjection * mView * mWorld * vec4(vertPosition, 1.0);
  }
`;

const fragmentShaderTxt = `
  precision mediump float;

  varying vec2 fragTextureCoord;
  varying vec3 fragNormal;

  uniform vec3 ambient;
  uniform vec3 lightDirection;
  uniform vec3 lightColor;

  uniform sampler2D sampler;

  void main() {
    vec3 normFragNormal = normalize(fragNormal);
    vec3 normLightDirection = normalize(lightDirection);
    vec3 light = ambient + lightColor * max(dot(normFragNormal, normLightDirection), 0.0);

    vec4 tex = texture2D(sampler, fragTextureCoord);
    gl_FragColor = vec4(tex.rgb * light, tex.a);
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

  gl.bindBuffer(gl.ARRAY_BUFFER, meshes.obj.normalBuffer);
  const normalLocation = gl.getAttribLocation(program, "vertNormal");
  gl.vertexAttribPointer(
    normalLocation,
    meshes.obj.normalBuffer.itemSize,
    gl.FLOAT,
    gl.TRUE,
    0,
    0
  );
  gl.enableVertexAttribArray(normalLocation);

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

  let directions = {
    w: false,
    a: false,
    s: false,
    d: false,
  };

  addEventListener("keydown", (event) => {
    directions[event.key] = true;
  });
  addEventListener("keyup", (event) => {
    directions[event.key] = false;
  });

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

  let ambientLightLoc = gl.getUniformLocation(program, "ambient");
  let lightDirectionLoc = gl.getUniformLocation(program, "lightDirection");
  let lightColorLoc = gl.getUniformLocation(program, "lightColor");

  let ambientColor = [0.6, 0.6, 0.6];
  gl.uniform3f(ambientLightLoc, ...ambientColor);
  gl.uniform3f(lightDirectionLoc, 1.5, 2.0, -1.0);
  gl.uniform3f(lightColorLoc, 0.7, 0.7, 0.7);

  const identityMat = mat4.create();
  let angle = 0;
  const speed = 0.2;
  let cameraLoc = [0, 0, -17];

  const loop = function () {
    angle = (performance.now() / 1000 / 60) * 25 * Math.PI;
    mat4.rotate(worldMatrix, identityMat, angle, [0.4, 1, 0]);
    gl.uniformMatrix4fv(worldMatLoc, gl.FALSE, worldMatrix);

    gl.clearColor(...canvasColor, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindTexture(gl.TEXTURE_2D, boxTexture);
    gl.activeTexture(gl.TEXTURE0);

    if (directions.w) {
      cameraLoc[2] -= speed;
    }
    if (directions.a) {
      cameraLoc[0] -= speed;
    }
    if (directions.s) {
      cameraLoc[2] += speed;
    }
    if (directions.d) {
      cameraLoc[0] += speed;
    }

    mat4.lookAt(
      viewMatrix,
      cameraLoc,
      [cameraLoc[0], cameraLoc[1], cameraLoc[2] + 17],
      [0, 1, 0]
    );
    gl.uniformMatrix4fv(viewMatLoc, gl.FALSE, viewMatrix);

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
