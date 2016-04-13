'use strict';

var init_shaders = function(gl, fs_id, vs_id) {
  var fs_source = document.getElementById(fs_id).text;
  var vs_source = document.getElementById(vs_id).text;

  var fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragment_shader, fs_source);
  gl.compileShader(fragment_shader);
  if (!gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS)) {
    console.log("ERROR IN " + fragment_shader + "SHADER: " + gl.getShaderInfoLog(fragment_shader));
    return false;
  }

  var vertex_shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertex_shader, vs_source);
  gl.compileShader(vertex_shader);
  if (!gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS)) {
    console.log("ERROR IN " + vertex_shader + "SHADER: " + gl.getShaderInfoLog(vertex_shader));
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
  //var ctx = canvas.getContext('2d');

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  var zoom = 1;
  var move_x = 0, move_y = 0;
  var max_iters = 300;

  var dragging = false;
  var mouse_x, mouse_y;

  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  var program = init_shaders(gl, "fragment-shader", "vertex-shader");
  if (!program) return;
  gl.useProgram(program);

  program.timestamp = gl.getUniformLocation(program, "t");
  program.zoom      = gl.getUniformLocation(program, "zoom");
  program.width     = gl.getUniformLocation(program, "width");
  program.height    = gl.getUniformLocation(program, "height");
  program.move_x    = gl.getUniformLocation(program, "move_x");
  program.move_y    = gl.getUniformLocation(program, "move_y");

  gl.deleteProgram(program);

  canvas.addEventListener('mousedown', function(e) {
    dragging = true;

    mouse_x = e.pageX - this.offsetLeft;
    mouse_y = e.pageY - this.offsetTop;
  });
  canvas.addEventListener('mouseup', function(e) {
    dragging = false;

    mouse_x = e.pageX - this.offsetLeft;
    mouse_y = e.pageY - this.offsetTop;
  });
  canvas.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    var curr_x = e.pageX - this.offsetLeft;
    var curr_y = e.pageY - this.offsetTop;

    move_x += (mouse_x - curr_x) / zoom / canvas.height;
    move_y += (mouse_y - curr_y) / zoom / canvas.height;

    draw();

    mouse_x = curr_x;
    mouse_y = curr_y;
  });
  canvas.addEventListener('wheel', function(e) {
    if (e.deltaY < 0) {
      zoom *= 1.5;
    } else {
      zoom *= 1 / 1.5;
    }

    draw();
  });
  /*canvas.addEventListener('gestureend', function(e) {
    if (e.scale < 1) {
      zoom *= 1.1
    } else {
      zoom *= 0.9;
    }
  });*/

  window.addEventListener('resize', function() {
    draw();
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

  var needs_redrawing = true;

  function draw(timestamp) {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    gl.uniform1f(program.timestamp, timestamp / 1000);
    gl.uniform1f(program.zoom, zoom);
    gl.uniform1f(program.width, -canvas.width);
    gl.uniform1f(program.height, canvas.height);
    gl.uniform1f(program.move_x, move_x);
    gl.uniform1f(program.move_y, move_y);

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, square_buffer);
    gl.vertexAttribPointer(program.position, square_buffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, square_buffer.numItems);

    if (needs_redrawing) {
      requestAnimationFrame(draw);
    }
  }

  requestAnimationFrame(draw);
});
