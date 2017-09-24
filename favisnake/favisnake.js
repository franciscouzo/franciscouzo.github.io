'use strict';

function mod(n, m) {
  return ((n % m) + m) % m;
}

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');

  canvas.width = 16;
  canvas.height = 16;

  var icon = document.createElement('link');
  icon.type = 'image/x-icon';
  icon.rel = 'shortcut icon';
  icon.href = canvas.toDataURL('image/x-icon');
  document.getElementsByTagName('head')[0].appendChild(icon);

  var lose_image = new Image();
  lose_image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAAQAQMAAABDZ5F1AAAABlBMVEUAAAD///+l2Z/dAAAAXUlE\nQVQImWNgwAOOMTDwwzlNDAwscI4Lbk5hDwtz8+IGMEejo4WFxSXFAczRZGlh4VDRUABzBMEc/gcI\njvIJBjhHQ0EDiaMB1SPQ0cOi4qMC4dQUFPE/7j58AM3JAAiHE+u4INpzAAAAAElFTkSuQmCC';

  var lose_animation = function() {
    var frame = 0;
    var anim = function() {
      ctx.drawImage(lose_image, -frame, 0);
      icon.setAttribute('href', canvas.toDataURL('image/x-icon'));
      frame++;

      if (lose_image.width - 16 > frame) {
        setTimeout(anim, 50);
      } else {
        start_game();
      }
    }
    anim();
  }

  var start_game = function() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 16, 16);

    var direction = [1, 0];
    document.addEventListener('keydown', function(e) {
      var last_direction = direction;

      if (e.keyCode === 37) { // up
        direction = [-1, 0];
      } else if (e.keyCode === 38) { // left
        direction = [0, -1];
      } else if (e.keyCode === 39) { // down
        direction = [1, 0];
      } else if (e.keyCode === 40) { // right
        direction = [0, 1];
      }

      var head = snake[snake.length - 1];
      var neck = snake[snake.length - 2];
      if (head[0] + direction[0] === neck[0] &&
          head[1] + direction[1] === neck[1]) {
        direction = last_direction;
      }
    });

    var snake = [[6, 7], [7, 7]];
    var food;

    var spawn_food = function() {
      var occupied_cells = {};
      for (var i = 0; i < snake.length; i++) {
        occupied_cells[[snake[i]]] = true;
      }
      while (true) {
        var x = Math.random() * 16 | 0;
        var y = Math.random() * 16 | 0;

        if (!occupied_cells[[x, y]]) {
          food = [x, y];
          ctx.fillStyle = '#F00';
          ctx.fillRect(food[0], food[1], 1, 1);
          return;
        }
      }
    };

    spawn_food();

    var interval = setInterval(function() {
      var head = snake[snake.length - 1];

      snake.push([mod(head[0] + direction[0], 16), mod(head[1] + direction[1], 16)]);
      head = snake[snake.length - 1];

      if (food[0] === head[0] && food[1] === head[1]) { // Caught food
        spawn_food();
      } else {
        var tail = snake.shift();
        ctx.fillStyle = '#000';
        ctx.fillRect(tail[0], tail[1], 1, 1);
      }

      for (var i = 0; i < snake.length - 1; i++) {
        if (snake[i][0] === head[0] && snake[i][1] === head[1]) {
          lose_animation();
          clearInterval(interval);
        }
      }

      ctx.fillStyle = '#FFF';
      ctx.fillRect(head[0], head[1], 1, 1);

      icon.setAttribute('href', canvas.toDataURL('image/x-icon'));
    }, 200);
  };

  start_game();
});
