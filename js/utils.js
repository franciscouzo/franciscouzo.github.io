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
