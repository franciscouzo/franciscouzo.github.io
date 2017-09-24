'use strict';

function apply_filter(img_data, type, radius) {
  var data = img_data.data;
  var width = img_data.width;
  var height = img_data.height;

  FFT.init(width);
  FrequencyFilter.init(width);

  var re = [];
  var im = [];

  for (var y = 0; y < height; y++) {
    var i = y * width;
    for (var x = 0; x < width; x++) {
      re[i + x] = data[(i << 2) + (x << 2)];
      im[i + x] = 0.0;
    }
  }

  FFT.fft2d(re, im);
  FrequencyFilter.swap(re, im);

  FrequencyFilter[type](re, im, radius);

  FrequencyFilter.swap(re, im);
  FFT.ifft2d(re, im);
  for (var y = 0; y < height; y++) {
    var i = y * width;
    for (var x = 0; x < width; x++) {
      var val = re[i + x];
      val = val > 255 ? 255 : val < 0 ? 0 : val;
      var p = (i << 2) + (x << 2);
      data[p] = data[p + 1] = data[p + 2] = val;
    }
  }
}

var images;

document.addEventListener('DOMContentLoaded', function() {
  var image_uploads = [
    document.getElementById('image_upload1'),
    document.getElementById('image_upload2')
  ];
  images = [];

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  function draw() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    for (var i = 0; i < image_uploads.length; i++) {
      var image = images[i];
      if (image === undefined) continue;

      ctx.globalAlpha = 0.5;

      ctx.drawImage(
        image.image.canvas,
        0, 0, image.width, image.height,
        image.x, image.y,
        image.width * image.size, image.height * image.size);
    }
  }
  draw();

  window.addEventListener('resize', draw);

  var editing = {
    selected_image_i: undefined,
    action: undefined,
    mouse_start: {
      x: undefined,
      y: undefined
    },
    image_start: {
      x: undefined,
      y: undefined
    }
  }

  document.addEventListener('mousedown', function(e) {
    var x = e.pageX;
    var y = e.pageY;

    var min_distance = Infinity;
    var min_i;

    for (var i = 0; i < image_uploads.length; i++) {
      var image = images[i];

      if (image === undefined) continue;

      if (image.x > x || image.x + image.width  * image.size < x ||
          image.y > y || image.y + image.height * image.size < y) continue;

      var distance = Math.pow(image.x + image.width  * image.size / 2, 2) +
                     Math.pow(image.y + image.height * image.size / 2, 2);

      if (distance < min_distance) {
        min_distance = distance;
        min_i = i;
      }
    }

    if (min_i === undefined) return;

    var image = images[min_i];

    if (e.ctrlKey) {
      editing.action = 'resize';
    } else if (e.shiftKey) {
      editing.action = 'rotate';
    } else {
      editing.action = 'translate';
    }

    editing.selected_image_i = min_i
    editing.mouse_start = {
      x: x,
      y: y
    };
    editing.image_start = {
      x: image.x,
      y: image.y,
      size: image.size,
      rot: image.rot
    }
  });

  document.addEventListener('mousemove', function(e) {
    if (editing.selected_image_i === undefined) return;

    var x = e.pageX;
    var y = e.pageY;

    var image = images[editing.selected_image_i];

    if (editing.action === 'resize') {
      var center_x = editing.image_start.x + image.width  * editing.image_start.size / 2;
      var center_y = editing.image_start.y + image.height * editing.image_start.size / 2;

      var starting_distance_to_center = Math.sqrt(Math.pow(center_x - editing.mouse_start.x, 2) + Math.pow(center_y - editing.mouse_start.y, 2));
      var distance_to_center = Math.sqrt(Math.pow(center_x - x, 2) + Math.pow(center_y - y, 2));

      image.size = distance_to_center / starting_distance_to_center;
      image.x = editing.image_start.x - (image.size - editing.image_start.size) * image.width  / 2;
      image.y = editing.image_start.y - (image.size - editing.image_start.size) * image.height / 2;
    } else if (editing.action === 'rotate') {
      // TODO
    } else if (editing.action === 'translate') {
      image.x = (x - editing.mouse_start.x) + editing.image_start.x
      image.y = (y - editing.mouse_start.y) + editing.image_start.y
    }

    draw();
  });

  document.addEventListener('mouseup', function(e) {
    editing.selected_image_i = undefined;
  });

  for (var i = 0; i < image_uploads.length; i++) {
    (function(i) {
      image_uploads[i].addEventListener('change', function(e) {
        var reader = new FileReader();
        reader.onload = function(event) {
          var img = new Image();
          img.src = event.target.result;
          img.onload = function() {
            var image_canvas = document.createElement('canvas');
            var image_ctx = image_canvas.getContext('2d');

            var next_power_of_two = 1 << Math.ceil(Math.log2(Math.max(img.width, img.height)));

            image_canvas.width  = next_power_of_two;
            image_canvas.height = next_power_of_two;

            image_ctx.drawImage(img, 0, 0);

            var img_data = image_ctx.getImageData(0, 0, image_canvas.width, image_canvas.height);
            if (i === 0) {
              apply_filter(img_data, 'HPF', image_canvas.width / 100);
            } else {
              apply_filter(img_data, 'LPF', image_canvas.width / 100);
            }

            image_canvas.width  = img.width;
            image_canvas.height = img.height;

            image_ctx.putImageData(img_data, 0, 0);

            images[i] = {
              image: image_ctx,
              x: canvas.width  / 2 - image_canvas.width  / 2,
              y: canvas.height / 2 - image_canvas.height / 2,
              width: image_canvas.width,
              height: image_canvas.height,
              rot: 0,
              size: 1
            };

            draw();
          }
        }
        reader.readAsDataURL(e.target.files[0]);
      }, false);
    })(i);
  }
});
