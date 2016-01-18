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

  var colors_on = [
    ['#F9BB82', '#EBA170', '#FCCD84'],
    ['#89B270', '#7AA45E', '#B6C674', '#7AA45E', '#B6C674'],
    ['#89B270', '#7AA45E', '#B6C674', '#7AA45E', '#B6C674', '#FECB05'],
    ['#E96B6C', '#F7989C'],
    ['#AD5277', '#F7989C'],
    ['#FF934F']
  ];
  var colors_off =  [
    ['#9CA594', '#ACB4A5', '#BBB964', '#D7DAAA', '#E5D57D', '#D1D6AF'],
    ['#F49427', '#C9785D', '#E88C6A', '#F1B081'],
    ['#F49427', '#C9785D', '#E88C6A', '#F1B081', '#FFCE00'],
    ['#635A4A', '#817865', '#9C9C84'],
    ['#635A4A', '#817865', '#9C9C84'],
    ['#9C9C9C']
  ];

  var painting = false;
  var generating = false;
  var x, y;

  canvas.addEventListener('mousedown', function(e) {
    painting = true;

    x = e.pageX - this.offsetLeft;
    y = e.pageY - this.offsetTop;

    if (generating) return;

    ctx.beginPath();
    ctx.fillStyle = e.ctrlKey ? '#FFF' : '#000';
    ctx.arc(x, y, 7.25, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  });
  canvas.addEventListener('mouseup', function(e) {
    painting = false;

    x = e.pageX - this.offsetLeft;
    y = e.pageY - this.offsetTop;

    if (generating) return;

    ctx.beginPath();
    ctx.fillStyle = e.ctrlKey ? '#FFF' : '#000';
    ctx.arc(x, y, 7.25, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  });
  canvas.addEventListener('mousemove', function(e) {
    if (!painting || generating) return;
    var curr_x = e.pageX - this.offsetLeft;
    var curr_y = e.pageY - this.offsetTop;

    ctx.beginPath();
    ctx.strokeStyle = e.ctrlKey ? '#FFF' : '#000';
    ctx.moveTo(x, y);
    ctx.lineWidth = 15;
    ctx.lineTo(curr_x, curr_y);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = e.ctrlKey ? '#FFF' : '#000';
    ctx.arc(x, y, 7.25, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();

    x = curr_x;
    y = curr_y;
  });

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

  stop_button.addEventListener('click', function() {
    generating = false;
  });

  clear_button.addEventListener('click', function() {
    if (!generating) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  });

  generate_button.addEventListener('click', function() {
    if (generating) {
      return;
    }
    generating = true;

    var circular_area = document.getElementById('circular_checkbox').checked;
    var invert_colors = document.getElementById('invert_checkbox').checked;

    var draw_style;
    var radios = document.getElementsByName('color_style');

    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) {
        draw_style = radios[i].value;
      }
    }

    var img_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var min_radius = (canvas.width + canvas.height) / 600;
    var max_radius = (canvas.width + canvas.height) / 150;

    var generate_circle = function(circular_area) {
      var radius = min_radius + Math.random() * (max_radius - min_radius);

      if (circular_area) {
        var angle = Math.random() * 2 * Math.PI;
        var distance_from_center = Math.random() * (Math.min(canvas.width, canvas.height) * 0.48 - radius);
        var x = canvas.width  * 0.5 + Math.cos(angle) * distance_from_center;
        var y = canvas.height * 0.5 + Math.sin(angle) * distance_from_center;
      } else {
        var x = radius + Math.random() * (canvas.width  - radius * 2);
        var y = radius + Math.random() * (canvas.height - radius * 2);
      }

      return {x: x, y: y, radius: radius};
    }

    var overlaps_image = function(circle) {
      var x = circle.x;
      var y = circle.y;
      var r = circle.radius;

      var points_x = [x, x, x, x-r, x+r, x-r*0.93, x-r*0.93, x+r*0.93, x+r*0.93]
      var points_y = [y, y-r, y+r, y, y, y+r*0.93, y-r*0.93, y+r*0.93, y-r*0.93]

      for (var i = 0; i < points_x.length; i++) {
        var x = points_x[i];
        var y = points_y[i];

        var index = (Math.floor(y) * img_data.width + Math.floor(x)) * 4;

        var r = img_data.data[index];
        var g = img_data.data[index + 1];
        var b = img_data.data[index + 2];
        var a = img_data.data[index + 3];

        if ((r + g + b) * (a / 255) < 127) {
          return true;
        }
      }
      return false;
    }

    var circle_intersection = function(circle1, circle2) {
      return Math.pow(circle2.x - circle1.x, 2) +
             Math.pow(circle2.y - circle1.y, 2) <
             Math.pow(circle1.radius + circle2.radius, 2)
    }

    var draw_circle = function(circle, color_on, color_off) {
      ctx.beginPath();

      if (overlaps_image(circle)) {
        ctx.fillStyle = color_on[Math.floor(Math.random() * color_on.length)];
      } else {
        ctx.fillStyle = color_off[Math.floor(Math.random() * color_off.length)];
      }

      ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();
    }

    var tree = new kdTree([], function(a, b) {
      return Math.pow(a.x - b.x, 2) +  Math.pow(a.y - b.y, 2);
    }, ['x', 'y']);

    var step_n = 0;
    var area = canvas.width * canvas.height;

    if (circular_area) {
      var steps = area / 150;
    } else {
      var steps = area / 50;
    }

    var step = function() {
      if (!generating) {
        return
      }
      while (step_n < steps) {
        var tries = 0;

        while (true) {
          tries++;
          if (tries > 100) {
            step_n++;
            requestAnimationFrame(step);
            return;
          }
          var circle = generate_circle(circular_area);
          var nearest = tree.nearest(circle, 8);

          var intersects = false;

          for (var j = 0; j < nearest.length; j++) {
            var near_circle = nearest[j][0];
            var distance = nearest[j][1];
            if (circle_intersection(circle, near_circle)) {
              intersects = true;
              break;
            }
          }

          if (!intersects) {
            step_n++;
            if (invert_colors) {
              draw_circle(circle, colors_off[draw_style], colors_on[draw_style]);
            } else {
              draw_circle(circle, colors_on[draw_style], colors_off[draw_style]);
            }
            tree.insert(circle);
            if (step_n % 50 == 0) {
              requestAnimationFrame(step);
              return;
            } else {
              break;
            }
          }
        }
      }
      generating = false;
    };

    requestAnimationFrame(step);
  });
});
