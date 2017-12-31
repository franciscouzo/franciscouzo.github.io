'use strict';

var create_shader = function(gl, options) {
  var vs_source = `
  precision mediump float;
  attribute vec2 vertexPos;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(vertexPos * -2.0 + 1.0, 0, 1);
    v_texCoord = vertexPos;
  }
  `;

  var fs_source = `
  precision highp float;
  varying vec2 v_texCoord;

  uniform float t;

  uniform float zoom;
  uniform float width;
  uniform float height;
  uniform float move_x;
  uniform float move_y;

  vec3 hsv_to_rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  vec2 product(vec2 a, vec2 b) {
    return vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x);
  }
  vec2 power(vec2 a, vec2 b) {
    float vabs = length(a);
    float len = pow(vabs, b.x);
    float at = atan(a.y, a.x);
    float phase = at * b.x;
    if (b.y != 0.0) {
      len /= exp(at * b.y);
      phase += b.y * log(vabs);
    }
    return vec2(len * cos(phase), len * sin(phase));
  }
  #define conjugate(a) vec2((a).x, -(a).y)
  vec2 divide(vec2 a, vec2 b) {
    return vec2(((a.x*b.x+a.y*b.y) / length(b)),
                ((a.y*b.x-a.x*b.y) / length(b)));
  }
  vec2 logarithm(vec2 a) {
    return vec2(log(length(a)), atan(a.y, a.x));
  }

  float fractal(vec2 p) {
    vec2 z = (${options.z0});
    for (int i = 0; i < (${options.iters}); i++) {
      z = ${options.z};

      if (${options.condition}) {
        if (${options.smooth}) {
          z = ${options.z};
          z = ${options.z};
          return float(i) + 2.0 - log2(log(length(z)));
        } else {
          return float(i);
        }
      }
    }
    return -1.0;
  }

  void main() {
    float x = v_texCoord.x * width;
    float y = v_texCoord.y * height;

    vec3 color = vec3(0.0);

    for (int i = 0; i < ${options.multisampling}; i++) {
      for (int j = 0; j < ${options.multisampling}; j++) {
        float iters = fractal(vec2((width / height) * (x + float(i) / ${options.multisampling}.0 - width  * 0.5) / (0.5 * zoom * width)  + move_x,
                                                      (y + float(j) / ${options.multisampling}.0 - height * 0.5) / (0.5 * zoom * height) + move_y));

        color += step(0.0, iters) * (${options.color});
      }
    }

    color /= ${options.multisampling}.0 * ${options.multisampling}.0;
    gl_FragColor = vec4(color, 1.0);
  }
  `;

  var program = init_shaders(gl, fs_source, vs_source);
  if (!program) return;
  gl.useProgram(program);

  program.timestamp = gl.getUniformLocation(program, "t");
  program.zoom      = gl.getUniformLocation(program, "zoom");
  program.width     = gl.getUniformLocation(program, "width");
  program.height    = gl.getUniformLocation(program, "height");
  program.move_x    = gl.getUniformLocation(program, "move_x");
  program.move_y    = gl.getUniformLocation(program, "move_y");

  gl.deleteProgram(program);

  return program;
};

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('canvas');

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  var options = {
    zoom: 1,
    pos: {
      x: 0,
      y: 0
    },
    iters: 300,
    z0: "p",
    z: "product(z, z) + vec2(-0.6, 0.5)",
    condition: "length(z) > 2.0",
    color: "hsv_to_rgb(vec3(mod(float(iters), 32.0) / 32.0, 1.0, 1.0))",
    animate: false,
    multisampling: 1,
    smooth: false
  };

  var check_hash = function() {
    if (window.location.hash) {
      var hash = decodeURIComponent(window.location.hash.substring(1));
      options = JSON.parse(hash) || options;
    }
  };

  check_hash();

  var update_hash = function() {
    history.replaceState(undefined, undefined, '#' + JSON.stringify(options));
  };

  var on_change = function() {
    update_hash();
    if (!options.animate) {
      requestAnimationFrame(draw);
    }
  };

  var on_shader_change = function() {
    var new_program = create_shader(gl, options);
    if (new_program) {
      update_hash();
      program = new_program;
      on_change();
    }
  }

  var gui = new dat.GUI();
  gui.add(options, 'zoom').name('Zoom').onChange(on_change);
  gui.add(options.pos, 'x', -1, 1).name('Pos x').onChange(on_change);
  gui.add(options.pos, 'y', -1, 1).name('Pos y').onChange(on_change);
  gui.add(options, 'iters', 1, 5000, 1).name('Iterations').onChange(on_shader_change);
  gui.add(options, 'z0').name('z(0)').onChange(on_shader_change);
  gui.add(options, 'z').onChange(on_shader_change);
  gui.add(options, 'condition').onChange(on_shader_change);
  gui.add(options, 'color').onChange(on_shader_change);
  gui.add(options, 'animate').onChange(function(animate) {
    update_hash();
    if (animate) {
      draw();
    }
  });
  gui.add(options, 'multisampling', 1, 10, 1).onChange(on_shader_change);
  gui.add(options, 'smooth').onChange(on_shader_change);

  var dragging = false;
  var mouse_x, mouse_y;

  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  var program = create_shader(gl, options);

  window.addEventListener("hashchange", function() {
    check_hash();
    on_shader_change();
  });

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

    options.pos.x += (mouse_x - curr_x) / options.zoom / canvas.height;
    options.pos.y += (mouse_y - curr_y) / options.zoom / canvas.height;

    mouse_x = curr_x;
    mouse_y = curr_y;

    draw();
    update_hash();
    gui.updateDisplay();
  });
  canvas.addEventListener('wheel', function(e) {
    if (e.deltaY < 0) {
      options.zoom *= 1.5;
    } else {
      options.zoom /= 1.5;
    }

    draw();
    update_hash();
    gui.updateDisplay();
  });
  /*canvas.addEventListener('gestureend', function(e) {
    if (e.scale < 1) {
      options.zoom *= 1.1
    } else {
      options.zoom *= 0.9;
    }

    draw();
    update_hash();
    gui.updateDisplay();
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

  function draw(timestamp) {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    gl.uniform1f(program.timestamp, timestamp / 1000);
    gl.uniform1f(program.zoom, options.zoom);
    gl.uniform1f(program.width, -canvas.width);
    gl.uniform1f(program.height, canvas.height);
    gl.uniform1f(program.move_x, options.pos.x);
    gl.uniform1f(program.move_y, options.pos.y);

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, square_buffer);
    gl.vertexAttribPointer(program.position, square_buffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, square_buffer.numItems);

    if (options.animate) {
      requestAnimationFrame(draw);
    }
  }

  requestAnimationFrame(draw);
});
