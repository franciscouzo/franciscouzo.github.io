"use strict";

var init_shaders = function(gl, fs_id, vs_id) {
  var fs_source = document.getElementById(fs_id).text;
  var vs_source = document.getElementById(vs_id).text;

  var fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragment_shader, fs_source);
  gl.compileShader(fragment_shader);
  if (!gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS)) {
    console.log("ERROR IN " + fragment_shader + "SHADER: " + gl.getShaderInfoLog(fragment_shader));
    alert("Error in fragment shader")
    return false;
  }

  var vertex_shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertex_shader, vs_source);
  gl.compileShader(vertex_shader);
  if (!gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS)) {
    console.log("ERROR IN " + vertex_shader + "SHADER: " + gl.getShaderInfoLog(vertex_shader));
    alert("Error in vertex shader")
    return false;
  }

  var program_id = gl.createProgram();
  gl.attachShader(program_id, fragment_shader);
  gl.attachShader(program_id, vertex_shader);

  gl.linkProgram(program_id);

  gl.deleteShader(fragment_shader);
  gl.deleteShader(vertex_shader);

  if (!gl.getProgramParameter(program_id, gl.LINK_STATUS)) {
    alert("Could not initialize shaders");
  }

  program_id.position = gl.getAttribLocation(program_id, "vertexPos");
  gl.enableVertexAttribArray(program_id.position);

  return program_id;
}

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('canvas');
  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  var program = init_shaders(gl, 'fragment-shader', 'vertex-shader');
  gl.useProgram(program);

  program.metaballs   = gl.getUniformLocation(program, "metaballs");
  //program.metaballs_n = gl.getUniformLocation(program, "metaballs_n");

  var mouse_x = -1;
  var mouse_y = -1;

  var metaballs = [0, 0, 0]

  canvas.addEventListener('mousemove', function(e) {
    mouse_x = e.pageX;
    mouse_y = e.pageY;
  });
  canvas.addEventListener('touchmove', function(e) {
    mouse_x = e.touches[0].pageX;
    mouse_y = e.touches[0].pageY;
  });

  var square_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, square_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
    -1.0, -1.0
  ]), gl.STATIC_DRAW);
  square_buffer.itemSize = 2;
  square_buffer.numItems = 4;

  render();

  function render() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    if (metaballs.length / 3 === 32) metaballs = metaballs.slice(3);

    if (mouse_x !== -1 || mouse_y !== -1) {
      metaballs.push(
        mouse_x / canvas.width * 2 - 1,
        mouse_y / canvas.height * - 2 + 1, 1
      );
    }

    gl.uniform3fv(program.metaballs, metaballs);

    gl.uniform1i(program.metaballs_n, metaballs.length / 3);

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, square_buffer);
    gl.vertexAttribPointer(program.position, square_buffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, square_buffer.numItems);

    requestAnimationFrame(render);
  }
});