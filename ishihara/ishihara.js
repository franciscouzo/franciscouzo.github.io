'use strict';

var PIXEL_RATIO = window.devicePixelRatio || 1;

function download(filename, data) {
  var link = document.createElement('a');
  link.setAttribute('href', data);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var max_width  = window.innerWidth  * PIXEL_RATIO;
  var max_height = window.innerHeight * PIXEL_RATIO;

  ctx.canvas.style.width  = window.innerWidth  + 'px'
  ctx.canvas.style.height = window.innerHeight + 'px'

  ctx.canvas.width  = max_width;
  ctx.canvas.height = max_height;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var img_canvas = document.createElement('canvas');
  var img_ctx = img_canvas.getContext('2d');

  img_ctx.canvas.width  = max_width;
  img_ctx.canvas.height = max_height;

  img_ctx.fillStyle = "white";
  img_ctx.fillRect(0, 0, canvas.width, canvas.height);

  var svg_elements = [];
  var worker;

  var ishihara_input = {
    load_image: function() {
      var image_upload = document.getElementById('image_upload');
      image_upload.click();
    },
    circular: true,
    resize: true,
    edge_detection: true,
    invert_colors: false,
    style: 0,
    min_radius: (canvas.width + canvas.height) / 600,
    max_radius: (canvas.width + canvas.height) / 150,
    draw_ratio: 1,
    stop_after: 10000,
    shape_factory: 'Circle',
    sides: 4,
    pointiness: 0.75,
    generate: function() {
      hide_gui_element(gui, 'generate', true);
      hide_gui_element(gui, 'clear', true);
      hide_gui_element(gui, 'stop', false);

      generating = true;

      var img_data = img_ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      var shape_factory = {
        'Circle': CircleFactory,
        'Regular polygon': RegularPolygonFactory,
        'Cross': CrossFactory,
        'Star': StarFactory
      }[ishihara_input.shape_factory];
      shape_factory = new shape_factory(JSON.parse(JSON.stringify(ishihara_input)));

      svg_elements = [];

      var options = {};
      for (var k in ishihara_input) {
        if (typeof ishihara_input[k] !== "function") {
          options[k] = ishihara_input[k];
        }
      }

      options.img_data = img_data;
      options.width = canvas.width;
      options.height = canvas.height;

      worker = new Worker('worker.js');
      worker.postMessage(options);

      worker.addEventListener('message', function(e) {
        if (e.data.action === 'shape') {
          ctx.fillStyle = e.data.style;
          shape_factory.draw(ctx, e.data.shape);
          svg_elements.push(shape_factory.svg(e.data.shape, e.data.style));
        } else if (e.data.action === 'stop') {
          ishihara_input.stop();
        }
      })
    },
    clear: function() {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      img_ctx.fillStyle = "white";
      img_ctx.fillRect(0, 0, canvas.width, canvas.height);
    },
    stop: function() {
      if (worker) {
        worker.terminate();
      }
      generating = false;

      hide_gui_element(gui, 'generate', false);
      hide_gui_element(gui, 'clear', false);
      hide_gui_element(gui, 'stop', true);
    },
    download_png: function() {
      download('ishihara.png', canvas.toDataURL('image/png'))
    },
    download_svg: function() {
      var data = [
        '<?xml version="1.0" encoding="UTF-8" ?>',
        '<svg width="' + canvas.width + '" height="' + canvas.height + '" ' +
        'viewBox="0 0 ' + canvas.width + ' ' + canvas.height + '" ' +
        'xmlns="http://www.w3.org/2000/svg" version="1.1">'
      ].concat(svg_elements, '</svg>').join('\n');
      download('ishihara.svg', 'data:image/svg+xml,' + encodeURIComponent(data));
    }
  };

  var gui = new dat.GUI();
  gui.add(ishihara_input, 'load_image').name("Load image");
  gui.add(ishihara_input, 'circular').name("Circular");
  gui.add(ishihara_input, 'resize').name("Resize");
  gui.add(ishihara_input, 'edge_detection').name("Edge detection");
  gui.add(ishihara_input, 'invert_colors').name("Invert colors");
  gui.add(ishihara_input, 'shape_factory', ['Circle', 'Regular polygon', 'Cross', 'Star']).onChange(function(value) {
    hide_gui_element(gui, 'sides', value !== 'Regular polygon' && value !== 'Star');
    hide_gui_element(gui, 'pointiness', value !== 'Cross' && value !== 'Star');
  }).name("Shape");
  gui.add(ishihara_input, 'sides', 3, 12, 1).name("Sides");
  gui.add(ishihara_input, 'pointiness', 0.01, 0.99).name("Pointiness");
  gui.add(ishihara_input, 'style', {
    'General 1': 0, 'General 2': 1, 'General 3': 2, 'Protanopia': 3,
    'Protanomaly': 4, 'Viewable by all': 5, 'Colorblind only': 6
  }).name("Style");
  gui.add(ishihara_input, 'min_radius', 2, 50).name("Min radius").onChange(function() {
    ishihara_input.max_radius = Math.max(ishihara_input.min_radius, ishihara_input.max_radius);
    update_gui(gui);
  });
  gui.add(ishihara_input, 'max_radius', 2, 50).name("Max radius").onChange(function() {
    ishihara_input.min_radius = Math.min(ishihara_input.min_radius, ishihara_input.max_radius);
    update_gui(gui);
  });
  gui.add(ishihara_input, 'draw_ratio', 0, 1, 0.01).name("Draw ratio");
  gui.add(ishihara_input, 'stop_after', 1000, 100000, 1).name("Stop after");
  gui.add(ishihara_input, 'generate').name("Generate");
  gui.add(ishihara_input, 'clear').name("Clear");
  gui.add(ishihara_input, 'stop').name("Stop");
  gui.add(ishihara_input, 'download_png').name("Download PNG");
  gui.add(ishihara_input, 'download_svg').name("Download SVG");

  hide_gui_element(gui, 'sides', true);
  hide_gui_element(gui, 'pointiness', true);
  hide_gui_element(gui, 'stop', true);

  var painting = false;
  var generating = false;
  var x, y;

  var hand_draw = function(ctx, style, x1, y1, x2, y2) {
    if (x2 && y2) {
      ctx.beginPath();
      ctx.strokeStyle = style;
      ctx.moveTo(x1, y1);
      ctx.lineWidth = 15;
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.fillStyle = style;
    ctx.arc(x1, y1, 7.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  };

  var mousedown = function(mx, my, style) {
    painting = true;

    x = mx;
    y = my;

    if (generating) return;

    hand_draw(ctx, style, x, y);
    hand_draw(img_ctx, style, x, y);
  };
  canvas.addEventListener('mousedown', function(e) {
    if (e.button === 0) {
      mousedown(e.offsetX * PIXEL_RATIO, e.offsetY * PIXEL_RATIO, e.ctrlKey ? '#FFF' : '#000');
    }
  });
  canvas.addEventListener('touchstart', function(e) {
    var rect = canvas.getBoundingClientRect();
    mousedown(
      (e.touches[0].clientX - rect.left) * PIXEL_RATIO,
      (e.touches[0].clientY - rect.top)  * PIXEL_RATIO,
      '#000'
    );
  });

  var mouseup = function(mx, my, style) {
    painting = false;

    x = mx;
    y = my;

    if (generating) return;

    hand_draw(ctx, style, x, y);
    hand_draw(img_ctx, style, x, y);
  };
  canvas.addEventListener('mouseup', function(e) {
    if (e.button === 0) {
      mouseup(e.offsetX * PIXEL_RATIO, e.offsetY * PIXEL_RATIO, e.ctrlKey ? '#FFF' : '#000');
    }
  });
  canvas.addEventListener('touchend', function(e) {
    var rect = canvas.getBoundingClientRect();
    mouseup(
      (e.touches[0].clientX - rect.left) * PIXEL_RATIO,
      (e.touches[0].clientY - rect.top)  * PIXEL_RATIO,
      '#000'
    );
  });

  var mousemove = function(curr_x, curr_y, style) {
    if (!painting || generating) return;

    hand_draw(ctx, style, curr_x, curr_y, x, y);
    hand_draw(img_ctx, style, curr_x, curr_y, x, y);

    x = curr_x;
    y = curr_y;
  };
  canvas.addEventListener('mousemove', function(e) {
    mousemove(e.offsetX * PIXEL_RATIO, e.offsetY * PIXEL_RATIO, e.ctrlKey ? '#FFF' : '#000');
  });
  canvas.addEventListener('touchmove', function(e) {
    var rect = canvas.getBoundingClientRect();
    mousemove(
      (e.touches[0].clientX - rect.left) * PIXEL_RATIO,
      (e.touches[0].clientY - rect.top)  * PIXEL_RATIO,
      '#000'
    );
  });

  image_upload.addEventListener('change', function(e) {
    ishihara_input.stop();

    var reader = new FileReader();
    reader.onload = function(event) {
      var img = new Image();
      img.src = event.target.result;
      img.onload = function() {
        if (ishihara_input.resize) {
          var ratio = Math.min(max_width / img.width, max_height / img.height);
          canvas.width  = img.width  * ratio;
          canvas.height = img.height * ratio;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        canvas.style.width  = canvas.width  / PIXEL_RATIO + 'px'
        canvas.style.height = canvas.height / PIXEL_RATIO + 'px'

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        img_canvas.width = canvas.width;
        img_canvas.height = canvas.height;
        img_ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    };
    reader.readAsDataURL(e.target.files[0]);
  }, false);
});
