function hide_gui_folder(gui, folder_name, hide) {
  var folder = gui.__folders[folder_name];
  folder.domElement.parentElement.hidden = hide;
}

function hide_gui_element(gui, property, hide) {
  for (var i = 0; i < gui.__controllers.length; i++) {
    var controller = gui.__controllers[i];
    if (controller.property === property) {
      controller.domElement.parentElement.parentElement.hidden = hide;
      return;
    }
  }
}

function update_gui(gui) {
  for (var i = 0; i < gui.__controllers.length; i++) {
    gui.__controllers[i].updateDisplay();
  }
}

function random_choice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(array, start, end) {
  var m = end - start;
  while (m) {
    var i = Math.floor(random() * m--);
    var tmp = array[start + m];
    array[start + m] = array[start + i];
    array[start + i] = tmp;
  }
}

function init_shaders(gl, fs_source, vs_source) {
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

function download(filename, data) {
  var link = document.createElement('a');
  link.setAttribute('href', data);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

var SG_MAGICCONST = 1.0 + Math.log(4.5);
var LOG4 = Math.log(4.0);

function gamma_distribution(alpha, beta) {
  /*if (alpha <= 0.0 || beta <= 0.0) {
    throw new Error('gamma_distribution: alpha and beta must be > 0.0');
  }*/

  if (alpha > 1) {
    var ainv = Math.sqrt(2.0 * alpha - 1.0);
    var bbb = alpha - LOG4;
    var ccc = alpha + ainv;

    while (true) {
      var u1 = Math.random();
      if (1e-7 > u1 || u1 > .9999999) {
        continue;
      }
      var u2 = 1.0 - Math.random();
      var v = Math.log(u1 / (1.0 - u1)) / ainv;
      var x = alpha * Math.exp(v);
      var z = u1 * u1 * u2;
      var r = bbb + ccc * v - x;
      if (r + SG_MAGICCONST - 4.5 * z >= 0.0 || r >= Math.log(z)) {
        return x * beta;
      }
    }
  } else if (alpha === 1.0) {
      do {
        var u = Math.random();
      } while (u <= 1e-7);
      return -Math.log(u) * beta;
  } else {
    while (true) {
      var u = Math.random();
      var b = (Math.E + alpha) / Math.E;
      var p = b * u;
      if (p <= 1.0) {
        x = Math.pow(p, (1.0 / alpha));
      } else {
        x = -Math.log((b - p) / alpha);
      }
      var u1 = Math.random();
      if (p > 1.0) {
        if (u1 <= Math.pow(x, alpha - 1.0)) {
          break;
        }
      } else if (u1 <= Math.exp(-x)) {
        break;
      }
    }
    return x * beta;
  }
}

function beta_distribution(alpha, beta) {
  var y = gamma_distribution(alpha, 1);
  if (y === 0) {
    return 0.0;
  } else {
    return y / (y + gamma_distribution(beta, 1));
  }
}
