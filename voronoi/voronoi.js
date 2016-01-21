'use strict';

document.addEventListener('DOMContentLoaded', function() {
  var image_upload = document.getElementById('image_upload');
  var generate_button = document.getElementById('generate_button');
  var stop_button = document.getElementById('stop_button');

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var max_width  = window.innerWidth;
  var max_height = window.innerHeight;

  ctx.canvas.width  = max_width;
  ctx.canvas.height = max_height;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  image_upload.addEventListener('change', function(e) {
    var reader = new FileReader();
    reader.onload = function(event) {
      var img = new Image();
      img.src = event.target.result;
      img.onload = function() {
        var resize = document.getElementById('resize_checkbox').checked;
        if (resize) {
          var ratio = Math.min(max_width / img.width, max_height / img.height);
          canvas.width  = img.width  * ratio;
          canvas.height = img.height * ratio;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    }
    reader.readAsDataURL(e.target.files[0]);
  }, false);

  generate_button.addEventListener('click', function() {
    var img_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = img_data.data;

    var convolute = function(img_data, weights, opaque) {
      var weight_width  = weights.length;
      var weight_height = weights[0].length;

      var half_width  = Math.floor(weight_width  / 2);
      var half_height = Math.floor(weight_height / 2);

      var data   = img_data.data;
      var width  = img_data.width;
      var height = img_data.height;

      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');

      var output = ctx.createImageData(width, height);
      var dst = output.data;

      var alpha = opaque ? 1 : 0;
      for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
          var r = 0, g = 0, b = 0, a = 0;
          for (var cx = 0; cx < weight_width; cx++) {
            for (var cy = 0; cy < weight_height; cy++) {
              var scx = x + cx - half_width;
              var scy = y + cy - half_height;
              if (scx >= 0 && scx < width &&
                  scy >= 0 && scy < height) {
                var src_index = (scy * width + scx) * 4;
                var weight = weights[cx][cy];

                r += data[src_index]     * weight;
                g += data[src_index + 1] * weight;
                b += data[src_index + 2] * weight;
                a += data[src_index + 3] * weight;
              }
            }
          }

          var index = (y * width + x) * 4;

          dst[index]     = r;
          dst[index + 1] = g;
          dst[index + 2] = b;
          dst[index + 3] = a + alpha * (255 - a);
        }
      }
      return output;
    };

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

        count++

        var index = (Math.floor(y) * width + Math.floor(x)) * 4;

        r += data[index];
        g += data[index + 1];
        b += data[index + 2];
      }

      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);

      return [r, g, b];
    }

    var laplace_convolution = convolute(img_data,
      [[1,  1, 1],
       [1, -8, 1],
       [1,  1, 1]], true);

    var laplace_convolution_data = laplace_convolution.data;

    //ctx.putImageData(laplace_convolution, 0, 0);

    var average_radius = document.getElementById('color_average_radius').value;
    average_radius = parseFloat(average_radius) || 1.5;
    average_radius = Math.max(average_radius, 0);
    average_radius = Math.min(average_radius, 100);

    var point_chance = document.getElementById('point_chance').value;
    point_chance = parseFloat(point_chance) || 1000;
    point_chance = Math.max(point_chance, 50);

    console.log(point_chance);

    var points = [];

    for (var x = 0; x < canvas.width; x++) {
      for (var y = 0; y < canvas.height; y++) {
        var index = (y * canvas.width + x) * 4;
        var r = laplace_convolution_data[index];
        var g = laplace_convolution_data[index + 1];
        var b = laplace_convolution_data[index + 2];

        var ratio = (r * 0.3 + g * 0.6 + b * 0.1) / 256;

        if (Math.random() < Math.pow(ratio, point_chance / 500) || Math.random() < 1 / point_chance) {
          var color = color_average(img_data, x, y, average_radius);
          points.push({x: x, y: y, color: color});
        }
      }
    }

    var distances = {
      euclidean: function(a, b) {
        return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
      },
      manhattan: function(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      },
      minkowski: function(a, b) {
        var p = 3;
        return Math.pow(Math.pow(Math.abs(a.x - b.x), p) + Math.pow(Math.abs(a.y - b.y), p), 2/p);
      },
      random: function(a, b) {
        return Math.random() * Math.abs(a.x - b.x) +
               Math.random() * Math.abs(a.y - b.y);
      },
      constant: function(a, b) {
        return 0;
      },
      mosaic: function(a, b) {
        var x = Math.abs(a.x - b.x);
        var y = Math.abs(a.y - b.y);
        return Math.sin(x + y) * 10 + (x + y);
      }
    };

    var distance;
    var radios = document.getElementsByName('distance_metric');

    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) {
        console.log(radios[i].value);
        distance = distances[radios[i].value];
      }
    }

    var tree = new kdTree(points, distance, ['x', 'y']);

    var chunk_width = 64;
    var chunk_height = 64;

    var chunk_x = 0;
    var chunk_y = 0;

    var chunk_canvas = document.createElement('canvas');
    var chunk_ctx = chunk_canvas.getContext('2d');
    var chunk_img_data = chunk_ctx.createImageData(chunk_width, chunk_height);

    var step = function() {
      var max_x = chunk_width
      var max_y = chunk_height;

      if (chunk_x * chunk_width  >= canvas.width - chunk_width) {
        max_x = canvas.width % chunk_width;
      }
      if (chunk_y * chunk_height >= canvas.height - chunk_height) {
        max_y = canvas.height % chunk_height;
      }

      for (var x = 0; x < max_x; x++) {
        for (var y = 0; y < max_y; y++) {
          var nearest = tree.nearest({
            x: x + chunk_x * chunk_width,
            y: y + chunk_y * chunk_height
          }, 1)[0];
          nearest = nearest[0];

          var index = (y * chunk_img_data.width + x) * 4;

          chunk_img_data.data[index]     = nearest.color[0];
          chunk_img_data.data[index + 1] = nearest.color[1];
          chunk_img_data.data[index + 2] = nearest.color[2];
          chunk_img_data.data[index + 3] = 255;
        }
      }

      ctx.putImageData(chunk_img_data,
                       chunk_x * chunk_width,
                       chunk_y * chunk_height);

      chunk_x++;
      if (chunk_x * chunk_width >= canvas.width) {
        chunk_x = 0;
        chunk_y++;
      }

      if (chunk_y * chunk_height < canvas.height) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  });
});
