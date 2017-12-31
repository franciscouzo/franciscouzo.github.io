"use strict";

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('canvas');
  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  var program = init_shaders(
    gl,
    document.getElementById('fragment-shader').text,
    document.getElementById('vertex-shader').text
  );
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
