'use strict';

document.addEventListener('DOMContentLoaded', function() {
  var image_upload = document.getElementById('image_upload');

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var max_width  = window.innerWidth;
  var max_height = window.innerHeight;

  ctx.canvas.width  = max_width;
  ctx.canvas.height = max_height;

  var image_ctx;
  var img_data;
  var lines_total;
  var lines;
  var start;

  var step = function(timestamp) {
    if (!start && timestamp) start = timestamp;
    if (Math.floor((timestamp - start) / 500) >= lines.length &&
        lines.length * 10 < img_data.height) {
      lines.push({
        x: 0,
        y: lines.length * 10
      });
    }
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line.x >= img_data.width) continue;
      var color_avg1 = color_average(img_data, line.x - 2.5, line.y, 2);
      var color_avg2 = color_average(img_data, line.x + 2.5, line.y, 2);
      var c1 = (255 - (color_avg1[0] * 3 + color_avg1[1] * 6 + color_avg1[2]) / 10) / 64;
      var c2 = (255 - (color_avg2[0] * 3 + color_avg2[1] * 6 + color_avg2[2]) / 10) / 64;

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(line.x - 2.85, line.y - c1);
      ctx.lineTo(line.x - 2.85, line.y + c1);
      ctx.lineTo(line.x + 2.85, line.y + c2);
      ctx.lineTo(line.x + 2.85, line.y - c2);
      //ctx.lineWidth = c / 32;
      //ctx.lineTo(line.x + 5, line.y);
      ctx.closePath();
      ctx.fill();
      line.x += 5;
    }

    if (lines.length === 0 || lines[lines.length - 1].x < canvas.width) {
      requestAnimationFrame(step);
    }
  }

  image_upload.addEventListener('change', function(e) {
    var reader = new FileReader();
    reader.onload = function(event) {
      var img = new Image();
      img.src = event.target.result;
      img.onload = function() {
        var resize = document.getElementById('resize_checkbox').checked;
        var image_canvas = document.createElement('canvas');
        if (resize) {
          var ratio = Math.min(max_width / img.width, max_height / img.height);
          image_canvas.width  = img.width  * ratio;
          image_canvas.height = img.height * ratio;
        } else {
          image_canvas.width = img.width;
          image_canvas.height = img.height;
        }
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        image_ctx = image_canvas.getContext('2d');
        image_ctx.drawImage(img, 0, 0);
        img_data = image_ctx.getImageData(0, 0, image_canvas.width, image_canvas.height);
        lines_total = image_canvas.height / 10;
        lines = [];
        start = undefined
        step();
      }
    }
    reader.readAsDataURL(e.target.files[0]);
  }, false);

  var color_average = function(img_data, x, y, r) {
    var data   = img_data.data;
    var width  = img_data.width;
    var height = img_data.height;

    var d = Math.sqrt(2) / 2;
    var points_x = [x, x, x, x-r, x+r, x-r*d, x-r*d, x+r*d, x+r*d]
    var points_y = [y, y-r, y+r, y, y, y+r*d, y-r*d, y+r*d, y-r*d]

    var r = 0;
    var g = 0;
    var b = 0;

    var count = 0;

    for (var i = 0; i < points_x.length; i++) {
      x = points_x[i];
      y = points_y[i];

      if (x < 0 || x >= width ||
          y < 0 || y >= height) {
        continue;
      }

      count++;

      var index = (Math.floor(y) * width + Math.floor(x)) * 4;

      r += data[index];
      g += data[index + 1];
      b += data[index + 2];
    }
    
    r = Math.floor(r / count);
    g = Math.floor(g / count);
    b = Math.floor(b / count);

    return [r, g, b];
  };
});
