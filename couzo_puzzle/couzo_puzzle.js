'use strict';

function mod(n, m) {
  return ((n % m) + m) % m;
}

function Game() {
  this.data = [];
  this.solution = [];
  for (var i = 0; i < 6; i++) { // 6 outer circles
    for (var j = 0; j < 9; j++) { // each circle has its own 9 colors
      this.solution.push(i);
      this.data.push(i);
    }
  }
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
  var r_index = this.relative_indexes[i];
  return mod(n * 9 + r_index, this.data.length);
};

Game.prototype.piece_ratio = 0.4;
Game.prototype.line_width = 4;

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
  circle.width = this.radius * 2 + this.line_width;
  circle.height = this.radius * 2 + this.line_width;
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
  var center_piece = this.center_piece(this.colors[this.data[mod(n * 9 - 3, this.data.length)]]);
  ctx.drawImage(
    center_piece,
    -center_piece.width / 2,
    this.radius * this.piece_ratio / 2
  );
  ctx.rotate(Math.PI / 3);

  for (var i = 0; i < 5; i++) {
    var center_piece = this.center_piece(this.colors[this.data[mod(n * 9 + i * 2, this.data.length)]]);
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
  ctx.arc(circle.width  / 2, circle.height / 2, this.radius, 0, 2 * Math.PI);
  ctx.stroke();

  return circle;
}

Game.prototype.rotate_circle = function(n) {
  for (var j = 0; j < 2; j++) {
    for (var i = this.relative_indexes.length - 1; i > 0; i--) {
      var r_index = this.relative_indexes[i];
      var r_prev_index = this.relative_indexes[mod(i - 1, this.relative_indexes.length)];

      var index = mod(n * 9 + r_index, this.data.length);
      var prev_index = mod(n * 9 + r_prev_index, this.data.length);

      var tmp = this.data[prev_index];
      this.data[prev_index] = this.data[index];
      this.data[index] = tmp;
    }
  }

  return JSON.stringify(this.data) == JSON.stringify(this.solution);
};

Game.prototype.shuffle = function(n) {
  for (var i = 0; i < n; i++) {
    var circle = Math.floor(Math.random() * 6);
    if (Math.random() < 0.5) {
      this.rotate_circle(circle, false);
    } else {
      for (var j = 0; j < 5; j++) {
        this.rotate_circle(circle, false);
      }
    }
  }
}

Game.prototype.draw = function(ctx) {
  ctx.canvas.width  = window.innerWidth;
  ctx.canvas.height = window.innerHeight;

  ctx.fillStyle = '#F5F5DD';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  this.radius = Math.min(ctx.canvas.width, ctx.canvas.height) / 5;

  for (var i = 0; i < 6; i++) {
    var circle = this.draw_circle(i);
    ctx.drawImage(
      circle,
      ctx.canvas.width  / 2 + Math.sin(Math.PI * i / 3) * this.radius * (1 + this.piece_ratio) - circle.width  / 2,
      ctx.canvas.height / 2 - Math.cos(Math.PI * i / 3) * this.radius * (1 + this.piece_ratio) - circle.height / 2
    );
  }
};

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var game = new Game();

  document.getElementById("shuffle_button_easy").addEventListener("click", function() {
    game.shuffle(10);
    game.draw(ctx);
  });
  document.getElementById("shuffle_button_medium").addEventListener("click", function() {
    game.shuffle(25);
    game.draw(ctx);
  });
  document.getElementById("shuffle_button_hard").addEventListener("click", function() {
    game.shuffle(250);
    game.draw(ctx);
  });

  window.addEventListener('resize', function() {
    game.draw(ctx);
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

    if (found_circle === undefined) {
      return;
    }

    if (!left_click) {
      for (var i = 0; i < 3; i++) {
        game.rotate_circle(found_circle);
      }
    }
    var win = game.rotate_circle(found_circle);
    game.draw(ctx);
    if (win) {
      alert("You win!");
    }
  }

  canvas.addEventListener('mousedown', function(e) {
    onclick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
  });
  canvas.addEventListener('contextmenu', function(e) {
    console.log(e.pageX - this.offsetLeft, e.pageY - this.offsetTop)
    onclick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, false);
    e.preventDefault();
    return false;
  });

  game.draw(ctx);
});
