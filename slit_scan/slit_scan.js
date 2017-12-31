function buffer_equal(buf1, buf2) {
    if (buf1.byteLength != buf2.byteLength) return false;
    var dv1 = new Int8Array(buf1);
    var dv2 = new Int8Array(buf2);
    for (var i = 0; i != buf1.byteLength; i++) {
        if (dv1[i] != dv2[i]) return false;
    }
    return true;
}

function modify_line(line, x1, y1, x2, y2) {
  var line_element = function(line, x, y, length, angle) {
    var transform_properties = ['transform', 'MozTransform', 'WebkitTransform', 'msTransform', 'oTransform'];

    line.style.border = '1px solid red';
    line.style.width = length + 'px';
    line.style.height = '0px';

    for (var i = 0; i < transform_properties.length; i++) {
      line.style[transform_properties[i]] = 'rotate(' + angle + 'rad)';
    }

    line.style.position = 'absolute';
    line.style.top = y + 'px';
    line.style.left = x + 'px';
    line.style.pointerEvents = 'none';

    return line;
  };

  var a = x1 - x2,
      b = y1 - y2,
      c = Math.hypot(a, b);

  var sx = (x1 + x2) / 2,
      sy = (y1 + y2) / 2;

  var x = sx - c / 2,
      y = sy;

  var alpha = Math.PI - Math.atan2(-b, a);

  return line_element(line, x, y, c, alpha);
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

function hide_gui_folder(gui, folder_name, hide) {
  var folder = gui.__folders[folder_name];
  folder.domElement.parentElement.hidden = hide;
}

document.addEventListener('DOMContentLoaded', function() {
  navigator.mediaDevices.getUserMedia({video: true, audio: false}).then(function(stream) {
    var video = document.getElementById('video');
    video.srcObject = stream;

    video.addEventListener('loadedmetadata', function() {
      var init = function () {
        horizontal_canvas.width = window.innerWidth - video.width;
        horizontal_canvas.height = video.height;
        horizontal_canvas.style.left = video.width + 'px';

        vertical_canvas.width = video.width;
        vertical_canvas.height = window.innerHeight - video.height;
        vertical_canvas.style.top = video.height + 'px';

        video_slit_canvas.width = video.width;
        video_slit_canvas.height = video.height;
        video_slit_canvas.style.left = video.width + 'px';

        horizontal_strip.width = video.width;
      };

      var horizontal_canvas = document.createElement('canvas');
      var horizontal_context = horizontal_canvas.getContext('2d');
      horizontal_canvas.style.position = 'absolute';
      horizontal_canvas.style.visibility = 'hidden';
      horizontal_canvas.style.top = '0px';
      document.body.appendChild(horizontal_canvas);

      var vertical_canvas = document.createElement('canvas');
      var vertical_context = vertical_canvas.getContext('2d');
      vertical_canvas.style.position = 'absolute';
      vertical_canvas.style.visibility = 'hidden';
      vertical_canvas.style.left = '0px';
      document.body.appendChild(vertical_canvas);

      var video_slit_canvas = document.createElement('canvas');
      var video_slit_context = video_slit_canvas.getContext('2d');
      video_slit_canvas.style.position = 'absolute';
      video_slit_canvas.style.top = '0px';
      document.body.appendChild(video_slit_canvas);

      var video_history = [];

      var horizontal_strip = document.createElement('canvas');
      var horizontal_strip_ctx = horizontal_strip.getContext('2d');
      var horizontal_strip_data = horizontal_strip_ctx.getImageData(0, 0, video.width, 1).data;

      init();

      var options = {
        x: Math.floor(video.width / 2),
        y: Math.floor(video.height / 2),
        strip_mode: false,
        order: 'top-bottom',
        x_cycle: {
          mode: 'disabled',
          range: 1.0,
          length: 20
        },
        y_cycle: {
          mode: 'disabled',
          range: 1.0,
          length: 20
        }
      };

      var horizontal_guide_line = document.createElement('div');
      horizontal_guide_line.style.visibility = 'hidden';
      modify_line(horizontal_guide_line, 0, options.y, video.width, options.y);
      document.body.appendChild(horizontal_guide_line);

      var vertical_guide_line = document.createElement('div');
      vertical_guide_line.style.visibility = 'hidden';
      modify_line(vertical_guide_line, options.x, 0, options.x, video.height);
      document.body.appendChild(vertical_guide_line);

      var gui = new dat.GUI();
      gui.add(options, 'strip_mode').name("Strip mode").onChange(function(strip_mode) {
        hide_gui_folder(gui, 'X', !strip_mode);
        hide_gui_folder(gui, 'Y', !strip_mode);
        hide_gui_element(gui, 'order', strip_mode);

        horizontal_canvas.style.visibility = strip_mode ? 'visible' : 'hidden';
        vertical_canvas.style.visibility = strip_mode ? 'visible' : 'hidden';
        video_slit_canvas.style.visibility = strip_mode ? 'hidden' : 'visible';

        horizontal_guide_line.style.visibility = strip_mode ? 'visible' : 'hidden';
        vertical_guide_line.style.visibility = strip_mode ? 'visible' : 'hidden';
      });

      var update_gui = function() {
        for (var i = 0; i < gui.__controllers.length; i++) {
          gui.__controllers[i].updateDisplay();
        }
      };

      var update_resolution = function() {
        init();

        x_value.max(video.width - 1);
        y_value.max(video.height - 1);

        options.x = Math.min(options.x, video.width - 1);
        options.y = Math.min(options.y, video.height - 1);

        update_gui();
      };

      gui.add(video, 'width', 1, video.videoWidth, 1).name("Width").onChange(function() {
        video.height = video.width * (video.videoHeight / video.videoWidth);
        update_resolution();
      });
      gui.add(video, 'height', 1, video.videoHeight, 1).name("Height").onChange(function() {
        video.width = video.height * (video.videoWidth / video.videoHeight);
        update_resolution();
      });

      var x_folder = gui.addFolder("X");
      x_folder.closed = false;
      var x_value = x_folder.add(options, 'x', 0, video.width - 1).name("X").listen();

      x_cycle = x_folder.addFolder("Cycle");
      x_cycle.add(options.x_cycle, 'mode', ['disabled', 'sin', 'cos', 'triangular']).name("Mode");
      x_cycle.add(options.x_cycle, 'range', 0, 1).name('Range %');
      x_cycle.add(options.x_cycle, 'length', 5, 60).name('Length');

      var y_folder = gui.addFolder("Y");
      y_folder.closed = false;
      var y_value = y_folder.add(options, 'y', 0, video.height - 1).name("Y").listen();

      y_cycle = y_folder.addFolder("Cycle");
      y_cycle.add(options.y_cycle, 'mode', ['disabled', 'sin', 'cos', 'triangular']).name("Mode");
      y_cycle.add(options.y_cycle, 'range', 0, 1).name('Range %');
      y_cycle.add(options.y_cycle, 'length', 5, 60).name('Length');

      gui.add(options, 'order', ['top-bottom', 'bottom-top', 'left-right', 'right-left']);

      hide_gui_folder(gui, 'X', true);
      hide_gui_folder(gui, 'Y', true);

      var mousedown = false;

      video.addEventListener('mousedown', function(event) {
        if (event.which === 1) {
          mousedown = true;
          options.x = event.pageX;
          options.y = event.pageY;

          update_gui();
        }
      });

      video.addEventListener('mousemove', function(event) {
        if (mousedown) {
          options.x = event.pageX;
          options.y = event.pageY;

          update_gui();
        }
      });

      video.addEventListener('mouseup', function(event) {
        if (event.which === 1) {
          mousedown = false;
          options.x = event.pageX;
          options.y = event.pageY;

          update_gui();
        }
      });

      var update_slit_scan = function(timestamp) {
        if (options.strip_mode) {
          if (options.x_cycle.mode === 'sin') {
            options.x = Math.sin(timestamp / 1000 / options.x_cycle.length * Math.PI * 2) * options.x_cycle.range * video.width / 2 + video.width / 2;
          } else if (options.x_cycle.mode === 'cos') {
            options.x = Math.cos(timestamp / 1000 / options.x_cycle.length * Math.PI * 2) * options.x_cycle.range * video.width / 2 + video.width / 2;
          } else if (options.x_cycle.mode === 'triangular') {
            options.x = 2 * options.x_cycle.range / options.x_cycle.length * (Math.abs((timestamp / 1000) % options.x_cycle.length - options.x_cycle.length / 2) - options.x_cycle.length / 4) * video.width + video.width / 2;
          }

          if (options.y_cycle.mode === 'sin') {
            options.y = Math.sin(timestamp / 1000 / options.y_cycle.length * Math.PI * 2) * options.y_cycle.range * video.height / 2 + video.height / 2;
          } else if (options.y_cycle.mode === 'cos') {
            options.y = Math.cos(timestamp / 1000 / options.y_cycle.length * Math.PI * 2) * options.y_cycle.range * video.height / 2 + video.height / 2;
          } else if (options.y_cycle.mode === 'triangular') {
            options.y = 2 * options.y_cycle.range / options.y_cycle.length * (Math.abs((timestamp / 1000) % options.y_cycle.length - options.y_cycle.length / 2) - options.x_cycle.length / 4) * video.height + video.height / 2;
          }

          update_gui();

          modify_line(horizontal_guide_line, 0, options.y, video.width, options.y);
          modify_line(vertical_guide_line, options.x, 0, options.x, video.height);

          horizontal_strip_ctx.drawImage(video, options.x * (video.videoWidth / video.width), 0, 1, video.videoHeight, 0, 0, 1, video.height);
          var new_horizontal_strip_data = horizontal_strip_ctx.getImageData(0, 0, video.width, 1).data;

          if (!buffer_equal(horizontal_strip_data, new_horizontal_strip_data)) {
            horizontal_strip_data = new_horizontal_strip_data;

            horizontal_context.drawImage(horizontal_canvas, 1, 0);
            vertical_context.drawImage(vertical_canvas, 0, 1);

            horizontal_context.drawImage(video, options.x * (video.videoWidth / video.width), 0, 1, video.videoHeight, 0, 0, 1, video.height);
            vertical_context.drawImage(video, 0, options.y * (video.videoHeight / video.height), video.videoWidth, 1, 0, 0, video.width, 1);
          }
        } else {
          var new_frame = document.createElement('canvas');
          new_frame.width = video.width;
          new_frame.height = video.height;
          new_frame.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, video.width, video.height);

          video_history.unshift(new_frame);
          if (video_history.length > Math.max(video.width, video.height)) {
            video_history.pop();
          }

          if (options.order === 'top-bottom') {
            for (var i = 0; i < Math.min(video_history.length, video.height); i++) {
              video_slit_context.drawImage(video_history[i], 0, i, video.width, 1, 0, i, video.width, 1);
            }
          } else if (options.order === 'bottom-top') {
            for (var i = 0; i < Math.min(video_history.length, video.height); i++) {
              video_slit_context.drawImage(video_history[i], 0, video.height - i - 1, video.width, 1, 0, video.height - i - 1, video.width, 1);
            }
          } else if (options.order === 'left-right') {
            for (var i = 0; i < Math.min(video_history.length, video.width); i++) {
              video_slit_context.drawImage(video_history[i], i, 0, 1, video.height, i, 0, 1, video.height);
            }
          } else if (options.order === 'right-left') {
            for (var i = 0; i < Math.min(video_history.length, video.width); i++) {
              video_slit_context.drawImage(video_history[i], video.width - i - 1, 0, 1, video.height, video.width - i - 1, 0, 1, video.height);
            }
          }
        }

        requestAnimationFrame(update_slit_scan);
      };

      requestAnimationFrame(update_slit_scan);
    });
  }).catch(function(error) {
    console.log(error.toString());
    console.log(error);
    alert('You have to enable the webcam for this demo to work');
  });
});
