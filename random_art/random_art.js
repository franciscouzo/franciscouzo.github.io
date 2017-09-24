"use strict";

var init_shaders = function(gl, fs_source, vs_source) {
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

var fragment_shader_source =
  "precision mediump float;\n" +
  "varying vec2 v_texCoord;\n" +
  "uniform float t;\n" +
  "uniform float mx;\n" +
  "uniform float my;\n" +
  "void main() {\n" +
  "    float x = v_texCoord.x;\n" +
  "    float y = v_texCoord.y;\n" +
  "    gl_FragColor = vec4({0}, {1}, {2}, 1.0);\n" +
  "}";

var vertex_shader_source =
  "precision mediump float;\n" +
  "attribute vec2 vertexPos;\n" +
  "varying vec2 v_texCoord;\n" +
  "void main() {\n" +
  "    gl_Position = vec4(vertexPos * -2.0 + 1.0, 0, 1);\n" +
  "    v_texCoord = vertexPos;\n" +
  "}";

function random_choice(l) {
  return l[Math.floor(Math.random() * l.length)];
}

function random_expr(prob) {
  prob = prob === undefined ? 0.995 : prob;
  if (Math.random() < prob) {
    var r = Math.random();
    if (r < 1 / 4) {
      return 'cos(' + random_expr(prob * prob) + ')';
    } else if (r < 2 / 4) {
      return 'sin(' + random_expr(prob * prob) + ')';
    } else if (r < 3 / 4) {
      return '(' + random_expr(prob * prob) + ' * ' + random_expr(prob * prob) + ')';
    } else {
      return random_expr(prob * prob) + ' / (1.0 + ' + random_expr(prob * prob) + ')';
    }
  } else {
    return random_choice(['x', 'y', 't', 'mx', 'my']);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('canvas');
  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  var program;

  var update_shader = function(force_update) {
    if (window.location.hash && !force_update) {
      var exprs = decodeURIComponent(window.location.hash.substring(1)).split(':');
    } else {
      exprs = [random_expr(), random_expr(), random_expr()];
      history.replaceState(undefined, undefined, '#' + exprs.join(':'));
    }

    var formatted_fragment_shader = fragment_shader_source.replace(/{(\d+)}/g, function(match, i) {
      return exprs[i];
    });

    program = init_shaders(gl, formatted_fragment_shader, vertex_shader_source);
    if (!program) return;
    gl.useProgram(program);

    program.timestamp = gl.getUniformLocation(program, "t");
    program.mouse_x   = gl.getUniformLocation(program, "mx");
    program.mouse_y   = gl.getUniformLocation(program, "my");

    gl.deleteProgram(program);
  };

  update_shader();

  var mouse_x = 0;
  var mouse_y = 0;

  window.addEventListener("mousedown", function() {
    update_shader(true);
  });
  window.addEventListener("hashchange", function() {
    update_shader();
  });

  document.onmousemove = function(e) {
    mouse_x = e.pageX;
    mouse_y = e.pageY;
  };

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

  render(1000 / 60.0);

  function render(timestamp) {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    gl.uniform1f(program.timestamp, timestamp / 1000);
    gl.uniform1f(program.mouse_x, mouse_x / canvas.width * 2 - 1);
    gl.uniform1f(program.mouse_y, mouse_y / canvas.height * 2 - 1);

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, square_buffer);
    gl.vertexAttribPointer(program.position, square_buffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, square_buffer.numItems);

    requestAnimationFrame(render);
  }
});
