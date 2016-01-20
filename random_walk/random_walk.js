'use strict';

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  var random_walks = [[canvas.width / 2, canvas.height / 2]];
  var speed = 10;

  document.addEventListener('keypress', function (e) {
    if (e.keyCode == 32 || e.key == ' ') { // space
      if (random_walks.length >= 10000) {
        return;
      }

      var add_n = Math.ceil(Math.log(random_walks.length, 10) * 2);
      for (var i = 0; i < add_n; i++) {
        var x = Math.random() * canvas.width;
        var y = Math.random() * canvas.height;

        random_walks.push([x, y]);
      }
    } else if (e.keyCode == 43 || e.key == '+') { // plus
      speed++;
      speed = Math.min(speed, 100);
    } else if (e.keyCode == 45 || e.key == '-') { // minus
      speed--;
      speed = Math.max(speed, 1);
    }
  });

  canvas.addEventListener('mousedown', function(e) {
    if (random_walks.length >= 10000) {
      return;
    }
    var x = e.pageX - this.offsetLeft;
    var y = e.pageY - this.offsetTop;

    random_walks.push([x, y]);
  });

  var draw = function() {
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fill();

    for (var i = 0; i < random_walks.length; i++) {
      var x = random_walks[i][0];
      var y = random_walks[i][1];

      var new_x = x + Math.random() * speed - speed / 2;
      var new_y = y + Math.random() * speed - speed / 2;

      ctx.beginPath();
      ctx.strokeStyle = 'black';
      ctx.moveTo(x, y);
      ctx.lineTo(new_x, new_y);
      ctx.closePath();
      ctx.stroke();

      if (new_x < 0 || new_x >= canvas.width) {
        new_x = new_x < 0 ? canvas.width + new_x : new_x % canvas.width;
      }
      if (new_y < 0 || new_y >= canvas.height) {
        new_y = new_y < 0 ? canvas.height + new_y : new_y % canvas.height;
      }

      random_walks[i] = [new_x, new_y];
    }

    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);
});
