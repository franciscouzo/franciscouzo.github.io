'use strict';

var PIXEL_RATIO = window.devicePixelRatio || 1;
var ROTATION_TIME = 350; // 350ms for 1/6 turn

function mod(n, m) {
  return ((n % m) + m) % m;
}

function Game(ctx) {
  this.data = [];
  this.solution = [];
  this.shuffled = false;
  for (var i = 0; i < 6; i++) { // 6 outer circles
    for (var j = 0; j < 9; j++) { // each circle has its own 9 colors
      this.solution.push(i);
      this.data.push(i);
    }
  }
  this.undo_history = [];

  this.ctx = ctx;
  this.animating = {};
  this.circles = [];

  requestAnimationFrame(this.animation_step.bind(this));
}

Game.prototype.colors = [
  '#C41E3A',
  '#FF5800',
  '#FFD500',
  '#009E60',
  '#005160',
  '#FFFFFF'
];

Game.prototype.relative_indexes = [0, 1, 2, 3, 4, 5, 6, 7, 8, -2, -3, -4];
Game.prototype.relative_index = function(n, i) {
  var r_index = this.relative_indexes[mod(i, this.relative_indexes.length)];
  return mod(n * 9 + r_index, this.data.length);
};

Game.prototype.piece_ratio = 0.4;

Game.prototype.center_piece = function(style) {
  var center_piece = document.createElement('canvas');
  center_piece.width = this.radius / 2;
  center_piece.height = this.radius;
  var cp_ctx = center_piece.getContext('2d');

  cp_ctx.fillStyle = style;
  cp_ctx.fillRect(0, 0, center_piece.width, center_piece.height);
  cp_ctx.globalCompositeOperation = 'destination-out';

  cp_ctx.beginPath();
  cp_ctx.arc(
    center_piece.width  / 2 + Math.sin(2 * Math.PI * 5 / 6) * this.radius * (1 + this.piece_ratio),
    center_piece.height / 2,
    this.radius, 0, 2 * Math.PI
  );
  cp_ctx.fill();

  cp_ctx.beginPath();
  cp_ctx.arc(
    center_piece.width  / 2 + Math.sin(2 * Math.PI * 1 / 6) * this.radius * (1 + this.piece_ratio),
    center_piece.height / 2,
    this.radius, 0, 2 * Math.PI
  );
  cp_ctx.fill();

  cp_ctx.globalCompositeOperation = 'destination-in';

  cp_ctx.beginPath();
  cp_ctx.arc(
    center_piece.width  / 2,
    center_piece.height / 2 - this.radius * (this.piece_ratio * Math.sqrt(3)),
    this.radius, 0, 2 * Math.PI
  );
  cp_ctx.fill();

  cp_ctx.beginPath();
  cp_ctx.arc(
    center_piece.width  / 2,
    center_piece.height / 2 + this.radius * (this.piece_ratio * Math.sqrt(3)),
    this.radius, 0, 2 * Math.PI
  );
  cp_ctx.fill();

  return center_piece;
};

Game.prototype.draw_circle = function(n) {
  var circle = document.createElement('canvas');
  circle.width = this.radius * 2 + this.line_width * 2;
  circle.height = this.radius * 2 + this.line_width * 2;
  var ctx = circle.getContext('2d');

  ctx.lineWidth = this.line_width;

  // Center circle
  ctx.fillStyle = this.colors[n];
  ctx.beginPath();
  ctx.arc(circle.width  / 2, circle.height / 2, this.radius, 0, 2 * Math.PI);
  ctx.fill();

  // Pieces
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.translate(circle.width / 2, circle.height / 2);
  ctx.rotate((n - 0.5) * Math.PI / 3);
  for (var i = 1; i < 12; i += 2) {
    ctx.beginPath();
    ctx.fillStyle = this.colors[this.data[this.relative_index(n, i)]];
    ctx.fillRect(-this.radius / 4, -this.radius, this.radius / 2, this.radius / 2);
    ctx.rotate(Math.PI / 3);
  }

  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.translate(circle.width / 2, circle.height / 2);

  ctx.rotate(Math.PI * (n + 1) / 3);
  var center_piece = this.center_pieces[this.data[mod(n * 9 - 3, this.data.length)]];
  ctx.drawImage(
    center_piece,
    -center_piece.width / 2,
    this.radius * this.piece_ratio / 2
  );
  ctx.rotate(Math.PI / 3);

  for (var i = 0; i < 5; i++) {
    var center_piece = this.center_pieces[this.data[mod(n * 9 + i * 2, this.data.length)]];
    ctx.drawImage(
      center_piece,
      -center_piece.width / 2,
      this.radius * this.piece_ratio / 2
    );
    ctx.rotate(Math.PI / 3);
  }
  ctx.restore();

  // Outlines
  ctx.globalCompositeOperation = 'source-atop';
  for (var i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(
      ctx.canvas.width  / 2 + Math.sin(Math.PI * i / 3) * this.radius * (1 + this.piece_ratio),
      ctx.canvas.height / 2 - Math.cos(Math.PI * i / 3) * this.radius * (1 + this.piece_ratio),
      this.radius, 0, 2 * Math.PI
    );
    ctx.stroke();
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = this.colors[n];
  ctx.beginPath();
  ctx.arc(circle.width / 2, circle.height / 2, this.radius, 0, 2 * Math.PI);
  ctx.stroke();

  return circle;
}

Game.prototype.rotate_circle = function(n) {
  for (var j = 0; j < 2; j++) {
    for (var i = this.relative_indexes.length - 1; i > 0; i--) {
      var index = this.relative_index(n, i);
      var prev_index = this.relative_index(n, i - 1);

      var tmp = this.data[prev_index];
      this.data[prev_index] = this.data[index];
      this.data[index] = tmp;
    }
  }
};

Game.prototype.undo = function() {
  if (this.undo_history.length) {
    var data = this.undo_history.pop(-1)
    this.data = data.data;
    this.animate_piece(data.circle, data.angle_start, ROTATION_TIME);
  }
};

Game.prototype.shuffle = function(n) {
  this.data = this.solution.slice();
  for (var i = 0; i < n; i++) {
    var circle = Math.floor(Math.random() * 6);
    if (Math.random() < 0.5) {
      this.rotate_circle(circle);
    } else {
      for (var j = 0; j < 5; j++) {
        this.rotate_circle(circle);
      }
    }
  }
  this.undo_history = [];
  this.shuffled = true;
};

Game.prototype.is_solved = function() {
  return JSON.stringify(this.data) == JSON.stringify(this.solution);
};

Game.prototype.update_circles = function() {
  this.center_pieces = [];
  for (var i = 0; i < this.colors.length; i++) {
    this.center_pieces.push(this.center_piece(this.colors[i]));
  }

  for (var i = 0; i < 6; i++) {
    this.circles[i] = this.draw_circle(i);
  }
};

Game.prototype.draw = function(keep_circles) {
  var ctx = this.ctx;
  var size = Math.min(ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#F5F5DD';
  ctx.fillRect((ctx.canvas.width  - size) / 2,
               (ctx.canvas.height - size) / 2,
               size, size);

  this.radius = size / 5;
  this.line_width = this.radius / 20;

  if (!keep_circles) this.update_circles();

  for (var i = 0; i < 6; i++) {
    if (this.animating[i]) continue;

    var circle = this.circles[i]
    ctx.drawImage(
      circle,
      ctx.canvas.width  / 2 + Math.sin(Math.PI * i / 3) * this.radius * (1 + this.piece_ratio) - circle.width  / 2,
      ctx.canvas.height / 2 - Math.cos(Math.PI * i / 3) * this.radius * (1 + this.piece_ratio) - circle.height / 2
    );
  }

  for (var i = 0; i < 6; i++) {
    if (!this.animating[i]) continue;

    ctx.save();
    ctx.translate(
      ctx.canvas.width  / 2 + Math.sin(Math.PI * i / 3) * this.radius * (1 + this.piece_ratio),
      ctx.canvas.height / 2 - Math.cos(Math.PI * i / 3) * this.radius * (1 + this.piece_ratio)
    );
    var circle = this.circles[i];
    var animation = this.animating[i];
    var t = Math.min(animation.func((performance.now() - animation.start) / animation.duration), 1);
    ctx.rotate((animation.angle_start * (1 - t) + animation.angle_end * t) / 2);
    ctx.drawImage(circle, -circle.width / 2, -circle.height / 2);
    ctx.restore();
  }
};

Game.prototype.animate_piece = function(circle_n, angle_start, duration, keep_old_circles, redraw) {
  if (!keep_old_circles) {
    for (var i = -1; i <= 1; i++) {
      var index = mod(circle_n + i, 6);
      var circle = this.draw_circle(index);
      this.circles[index] = circle;
    }
  }

  this.animating[circle_n] = {
    start: performance.now(),
    duration: duration,
    angle_start: angle_start,
    angle_end: 0,
    func: function(x) { return Math.sin(Math.PI * x / 2); },
    redraw: redraw === undefined ? true : redraw
  };
};

Game.prototype.animation_step = function(timestamp) {
  for (var piece_n in this.animating) {
    var animation = this.animating[piece_n];
    if (animation.start + animation.duration < timestamp) {
      delete this.animating[piece_n];
      this.draw(true);
      continue;
    }
    this.draw(true);
  }
  requestAnimationFrame(this.animation_step.bind(this));
};

function setup_context(game) {
  var ctx = game.ctx;

  ctx.canvas.style.width  = window.innerWidth  + 'px';
  ctx.canvas.style.height = window.innerHeight + 'px';

  ctx.canvas.width  = window.innerWidth  * PIXEL_RATIO;
  ctx.canvas.height = window.innerHeight * PIXEL_RATIO;

  var undo_button = document.getElementById("undo_button");
  var size = Math.min(ctx.canvas.width, ctx.canvas.height);
  undo_button.width  = size / 10;
  undo_button.height = size / 10;

  game.update_circles();
  game.draw();
}

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var game = new Game(ctx);

  setup_context(game);

  document.getElementById("undo_button").addEventListener("click", function() {
    game.undo();
    game.draw();
  });
  document.getElementById("shuffle_button_easy").addEventListener("click", function() {
    game.shuffle(10);
    game.draw();
  });
  document.getElementById("shuffle_button_medium").addEventListener("click", function() {
    game.shuffle(25);
    game.draw();
  });
  document.getElementById("shuffle_button_hard").addEventListener("click", function() {
    game.shuffle(250);
    game.draw();
  });

  window.addEventListener('resize', function() {
    setup_context(game);
  })

  function onclick(x, y, left_click) {
    var found_circle;
    for (var i = 0; i < 6; i++) {
      var circle_x = ctx.canvas.width  / 2 + Math.sin(Math.PI * i / 3) * game.radius * (1 + game.piece_ratio);
      var circle_y = ctx.canvas.height / 2 - Math.cos(Math.PI * i / 3) * game.radius * (1 + game.piece_ratio);

      if (Math.pow(x - circle_x, 2) + Math.pow(y - circle_y, 2) < Math.pow(game.radius, 2)) {
        if (found_circle !== undefined) {
          // Clicked two circles at once
          return;
        }
        found_circle = i;
      }
    }

    if (found_circle === undefined) return;

    game.undo_history.push({
      data: game.data.slice(),
      circle: found_circle,
      angle_start: (Math.PI / 1.5) * (left_click ? 1 : -1)
    });
    if (!left_click) {
      for (var i = 0; i < 4; i++) {
        game.rotate_circle(found_circle);
      }
    }
    game.rotate_circle(found_circle);
    game.animate_piece(found_circle, (Math.PI / 1.5) * (left_click ? -1 : 1), ROTATION_TIME);

    if (game.is_solved() && game.shuffled) {
      setTimeout(function() {
        if (!game.is_solved()) return;
        game.shuffled = false;
        for (var i = 0; i < 6; i += 2) {
          game.animate_piece(i, Math.PI * 4, ROTATION_TIME * 4, true, false);
        }
        setTimeout(function() {
          if (!game.is_solved()) return;
          for (var i = 1; i < 6; i += 2) {
            game.animate_piece(i, Math.PI * 4, ROTATION_TIME * 4, true);
          }
        }, ROTATION_TIME * 4);
      }, ROTATION_TIME);
    }
  }

  canvas.addEventListener('mousedown', function(e) {
    if (e.which == 1) {
      onclick(e.pageX * PIXEL_RATIO, e.pageY * PIXEL_RATIO, true);
    }
    return false;
  });
  canvas.addEventListener('contextmenu', function(e) {
    onclick(e.pageX * PIXEL_RATIO, e.pageY * PIXEL_RATIO, false);
    e.preventDefault();
    return false;
  });

  game.draw();
});
