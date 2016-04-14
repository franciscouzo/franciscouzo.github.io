'use strict';

function LineFactory() {}

LineFactory.prototype.generate = function(width, height) {
  return {x1: Math.random() * width, y1: Math.random() * height,
          x2: Math.random() * width, y2: Math.random() * height,
          r: Math.floor(Math.random() * 256), g: Math.floor(Math.random() * 256),
          b: Math.floor(Math.random() * 256), a: Math.random()};
};

LineFactory.prototype.draw = function(ctx, line) {
  ctx.strokeStyle = 'rgba(' + line.r + ', ' + line.g + ', ' + line.b + ', ' + line.a + ')';

  ctx.beginPath();
  ctx.moveTo(line.x1, line.y1);
  ctx.lineTo(line.x2, line.y2);
  ctx.stroke();
};


function TriangleFactory() {}

TriangleFactory.prototype.generate = function(width, height) {
  return {x1: Math.random() * width, y1: Math.random() * height,
          x2: Math.random() * width, y2: Math.random() * height,
          x3: Math.random() * width, y3: Math.random() * height,
          r: Math.floor(Math.random() * 256), g: Math.floor(Math.random() * 256),
          b: Math.floor(Math.random() * 256), a: Math.random()};
};

TriangleFactory.prototype.draw = function(ctx, triangle) {
  ctx.fillStyle = 'rgba(' + triangle.r + ', ' + triangle.g + ', ' + triangle.b + ', ' + triangle.a + ')';

  ctx.beginPath();
  ctx.moveTo(triangle.x1, triangle.y1);
  ctx.lineTo(triangle.x2, triangle.y2);
  ctx.lineTo(triangle.x3, triangle.y3);
  ctx.fill();
};


function SquareFactory() {}

SquareFactory.prototype.generate = function(width, height) {
  var min_diameter = (width + height) / 30;
  var max_diameter = (width + height) / 15;
  var diameter = min_diameter + Math.random() * (max_diameter - min_diameter);
  var angle = Math.random() * 2 * Math.PI;

  var x = Math.random() * width;
  var y = Math.random() * height;

  return {x: x, y: y, diameter: diameter, angle: angle,
          r: Math.floor(Math.random() * 256), g: Math.floor(Math.random() * 256),
          b: Math.floor(Math.random() * 256), a: Math.random()};
};

SquareFactory.prototype.draw = function(ctx, square) {
  ctx.translate(square.x + square.diameter / 2, square.y + square.diameter / 2)
  ctx.rotate(square.angle);
  ctx.fillStyle = 'rgba(' + square.r + ', ' + square.g + ', ' + square.b + ', ' + square.a + ')';
  ctx.fillRect(0, 0, square.diameter, square.diameter);
};


function CircleFactory() {}

CircleFactory.prototype.generate = function(width, height) {
  var radius = (width + height) / 45;

  var x = Math.random() * width;
  var y = Math.random() * height;

  return {x: x, y: y, radius: radius,
          r: Math.floor(Math.random() * 256), g: Math.floor(Math.random() * 256),
          b: Math.floor(Math.random() * 256), a: Math.random()};
};

CircleFactory.prototype.draw = function(ctx, circle) {
  ctx.beginPath();
  ctx.fillStyle = 'rgba(' + circle.r + ', ' + circle.g + ', ' + circle.b + ', ' + circle.a + ')';
  ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();
};

var get_score = function(orig_img_data, img_data) {
  var orig_data = orig_img_data.data;
  var data = img_data.data;

  var w = orig_img_data.width;
  var h = orig_img_data.height;

  var score = 0;

  for (var i = 0; i < w * h * 4; i++) {
    //score += Math.pow((orig_data[i] - data[i]) / 255, 2);
    score += Math.abs(orig_data[i] - data[i]);
  }

  return score;
}

var curr_ctx;

document.addEventListener('DOMContentLoaded', function() {
  var image_upload = document.getElementById('image_upload');
  var generate_button = document.getElementById('generate_button');
  var clear_button = document.getElementById('clear_button');
  var stop_button = document.getElementById('stop_button');

  generate_button.disabled = false;
  clear_button.disabled = false;
  stop_button.disabled = true;

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  ctx.canvas.width  = window.innerWidth;
  ctx.canvas.height = window.innerHeight;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var generating = false;

  image_upload.addEventListener('change', function(e) {
    var reader = new FileReader();
    reader.onload = function(event) {
      var img = new Image();
      img.src = event.target.result;
      img.onload = function() {
        var resize = document.getElementById('resize_checkbox').checked;
        if (resize) {
          var ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
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

  stop_button.addEventListener('click', function() {
    generating = false;

    generate_button.disabled = false;
    clear_button.disabled = false;
    stop_button.disabled = true;
  });

  clear_button.addEventListener('click', function() {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });

  generate_button.addEventListener('click', function() {
    generate_button.disabled = true;
    clear_button.disabled = true;
    stop_button.disabled = false;

    generating = true;

    var select = document.getElementById('style');
    var draw_style = select.options[select.selectedIndex].value;

    var img_data = ctx.getImageData(0, 0, canvas.width, canvas.height);

    var best_canvas = document.createElement('canvas');
    best_canvas.width  = canvas.width;
    best_canvas.height = canvas.height;
    var best_ctx = best_canvas.getContext('2d');

    var generation = 0;

    var shape_factory = new window[draw_style]();

    if (draw_style == 'LineFactory') {
      var shape_n = canvas.width + canvas.height;
    } else {
      var shape_n = 500;
    }

    var shapes = [];

    for (var i = 0; i < shape_n; i++) {
      var shape = shape_factory.generate(canvas.width, canvas.height);
      shapes.push(shape);
      best_ctx.save();
      shape_factory.draw(best_ctx, shape);
      best_ctx.restore();
    }

    var best_score = get_score(img_data, best_ctx.getImageData(0, 0, canvas.width, canvas.height));

    var generation_tag = document.getElementById('generation');
    var show_tries_tag = document.getElementById('show_tries');

    var step = function() {
      if (!generating) {
        generating = false;
        generate_button.disabled = false;
        clear_button.disabled = false;
        stop_button.disabled = true;
        return
      }

      generation++;

      var curr_canvas = document.createElement('canvas');
      curr_canvas.width  = canvas.width;
      curr_canvas.height = canvas.height;
      curr_ctx = curr_canvas.getContext('2d');

      var random_i = Math.floor(Math.random() * shape_n);
      var old_shape = shapes[random_i];
      shapes[random_i] = shape_factory.generate(canvas.width, canvas.height);

      for (var i = 0; i < shape_n; i++) {
        curr_ctx.save();
        shape_factory.draw(curr_ctx, shapes[i]);
        curr_ctx.restore();
      }

      var curr_img_data = curr_ctx.getImageData(0, 0, canvas.width, canvas.height);
      var score = get_score(img_data, curr_img_data);

      if (score < best_score) {
        best_score = score;
        ctx.putImageData(curr_img_data, 0, 0);
      } else {
        shapes[random_i] = old_shape;
        if (show_tries.checked) {
          ctx.putImageData(curr_img_data, 0, 0);
        }
      }

      generation_tag.innerHTML = "Generation: " + generation + "<br>Score: " + best_score;

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  });
});
