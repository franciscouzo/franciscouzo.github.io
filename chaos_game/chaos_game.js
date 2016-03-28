'use strict';

// http://stackoverflow.com/a/1501725/1192111
function sqr(x) { return x * x }
function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }

const MARGIN_RATIO = 5;

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var start_button = document.getElementById('start_button');
  var stop_button = document.getElementById('stop_button');
  var ratio_input = document.getElementById('ratio');

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  var x, y;
  var points = [
    {
      x: canvas.width  / 2,
      y: canvas.height / 2 - canvas.height / 3
    },
    {
      x: canvas.width  / 2 + Math.sin(Math.PI * 4 / 3) * canvas.height / 3,
      y: canvas.height / 2 - Math.cos(Math.PI * 4 / 3) * canvas.height / 3
    },
    {
      x: canvas.width  / 2 + Math.sin(Math.PI * 2 / 3) * canvas.height / 3,
      y: canvas.height / 2 - Math.cos(Math.PI * 2 / 3) * canvas.height / 3
    }
  ];

  var selected_point = null;
  canvas.addEventListener('mousedown', function(e) {
    x = e.pageX - this.offsetLeft;
    y = e.pageY - this.offsetTop;

    if (e.ctrlKey) {
      points.push({x: x, y: y});
      selected_point = points.length - 1;
      draw(true);
    } else if (points.length) {
      var nearest_point;
      var min_dist = Infinity;

      for (var i = 0; i < points.length; i++) {
        var point = points[i];
        var dist = Math.hypot(point.x - x, point.y - y);
        if (dist < min_dist) {
          min_dist = dist;
          nearest_point = i;
        }
      }

      if (min_dist <= MARGIN_RATIO) {
        if (e.shiftKey) {
          points.splice(nearest_point, 1);
        } else {
          selected_point = nearest_point;
          points[nearest_point].x = x;
          points[nearest_point].y = y;
        }
        draw(true);
      }
    }
  });

  canvas.addEventListener('mousemove', function(e) {
    x = e.pageX - this.offsetLeft;
    y = e.pageY - this.offsetTop;

    if (selected_point === null) {
      return;
    }

    points[selected_point].x = x;
    points[selected_point].y = y;

    draw(true);
  });

  canvas.addEventListener('mouseup', function(e) {
    selected_point = null;
  });

  function draw(clear) {
    if (clear) {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'white';
    for (var i = 0; i < points.length; i++) {
      var point = points[i];

      ctx.beginPath();
      ctx.arc(point.x, point.y, MARGIN_RATIO, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  }

  draw(true);

  start_button.disabled = false;
  stop_button.disabled = true;

  var generating = false;
  start_button.addEventListener('click', function() {
    generating = true;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    start_button.disabled = true;
    stop_button.disabled = false;

    var x = canvas.width / 2;
    var y = canvas.height / 2;

    var steps = 1000000;
    var step = function() {
      var ratio = ratio_input.value / 1000;
      ctx.fillStyle = 'black';
      ctx.globalAlpha = 0.1;
      for (var i = 0; i < 10000 && --steps; i++) {
        var point = points[Math.floor(Math.random() * points.length)];
        x = point.x * ratio + x * (1 - ratio);
        y = point.y * ratio + y * (1 - ratio);

        ctx.fillRect(x, y, 1, 1);
      }

      if (steps !== 0 && generating) {
        requestAnimationFrame(step);
      } else {
        start_button.disabled = false;
        stop_button.disabled = true;

        draw(false);
      }
    };

    step();
  });

  stop_button.addEventListener('click', function() {
    generating = false;

    start_button.disabled = false;
    stop_button.disabled = true;
  });
});
