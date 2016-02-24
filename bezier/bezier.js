'use strict';

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  ctx.canvas.width  = window.innerWidth;
  ctx.canvas.height = window.innerHeight;

  var painting = false;
  var mouse_positions = [];

  var draw = function() {
    if (mouse_positions.length < 4) {
      return;
    } else if (mouse_positions.length === 4) {
      var positions = [[0, 1, 2, 3]];
    } else if (mouse_positions.length < 19) {
      var positions = [
        [0, 1, 2, 3],
        [0, 3, 6, 9]
      ];
    } else {
      var positions = [
        [0, 1, 2, 3],
        [0, 3, 6, 9],
        [0, 6, 13, 19]
      ];
    }

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      ctx.beginPath();
      ctx.strokeStyle = document.getElementById("color").value;
      ctx.moveTo(mouse_positions[pos[0]].x, mouse_positions[pos[0]].y);
      ctx.bezierCurveTo(
        mouse_positions[pos[1]].x, mouse_positions[pos[1]].y,
        mouse_positions[pos[2]].x, mouse_positions[pos[2]].y,
        mouse_positions[pos[3]].x, mouse_positions[pos[3]].y
      );
      ctx.stroke();
    }
    if (mouse_positions.length >= 20) {
      mouse_positions.shift();
    }
  };

  function mousedown(x, y) {
    painting = true;

    mouse_positions.push({
      x: x,
      y: y
    });
  }
  canvas.addEventListener('mousedown', function(e) {
    mousedown(e.pageX, e.pageY);
  });
  canvas.addEventListener('touchstart', function(e) {
    mousedown(e.touches[0].pageX, e.touches[0].pageY);
    e.preventDefault();
  });

  function mousemove(x, y) {
    if (!painting) return;

    mouse_positions.push({
      x: x,
      y: y
    });

    draw();
  }

  canvas.addEventListener('mousemove', function(e) {
    mousemove(e.pageX, e.pageY);
  });
  canvas.addEventListener('touchmove', function(e) {
    mousemove(e.touches[0].pageX, e.touches[0].pageY);
  });

  function mouseup(x, y) {
    painting = false;

    mouse_positions.push({
      x: x,
      y: y
    });

    draw();

    mouse_positions = [];
  }

  canvas.addEventListener('mouseup', function(e) {
    mouseup(e.pageX, e.pageY);
  });
  canvas.addEventListener('touchend', function(e) {
    mouseup(e.touches[0].pageX, e.touches[0].pageY)
  });
  canvas.addEventListener('touchcancel', function(e) {
    mouse_positions = [];
  });
});
