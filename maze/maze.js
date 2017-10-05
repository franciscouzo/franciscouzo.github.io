'use strict';

var PIXEL_RATIO = window.devicePixelRatio || 1;

var CELL_SIZE = 4;
var CELL_SPACING = 4;

var N = 1 << 0,
    S = 1 << 1,
    W = 1 << 2,
    E = 1 << 3;

function shuffle(array, start, end) {
  var m = end - start;
  while (m) {
    var i = Math.floor(random() * m--);
    var tmp = array[start + m];
    array[start + m] = array[start + i];
    array[start + i] = tmp;
  }
}

function random_choice(arr) {
  return arr[Math.floor(random() * arr.length)];
}

var SG_MAGICCONST = 1.0 + Math.log(4.5);
var LOG4 = Math.log(4.0);

function gamma_distribution(alpha, beta) {
  /*if (alpha <= 0.0 || beta <= 0.0) {
    throw new Error('gamma_distribution: alpha and beta must be > 0.0');
  }*/

  if (alpha > 1) {
    var ainv = Math.sqrt(2.0 * alpha - 1.0);
    var bbb = alpha - LOG4;
    var ccc = alpha + ainv;

    while (true) {
      var u1 = Math.random();
      if (1e-7 > u1 || u1 > .9999999) {
        continue;
      }
      var u2 = 1.0 - Math.random();
      var v = Math.log(u1 / (1.0 - u1)) / ainv;
      var x = alpha * Math.exp(v);
      var z = u1 * u1 * u2;
      var r = bbb + ccc * v - x;
      if (r + SG_MAGICCONST - 4.5 * z >= 0.0 || r >= Math.log(z)) {
        return x * beta;
      }
    }
  } else if (alpha === 1.0) {
      do {
        var u = Math.random();
      } while (u <= 1e-7);
      return -Math.log(u) * beta;
  } else {
    while (true) {
      var u = Math.random();
      var b = (Math.E + alpha) / Math.E;
      var p = b * u;
      if (p <= 1.0) {
        x = Math.pow(p, (1.0 / alpha));
      } else {
        x = -Math.log((b - p) / alpha);
      }
      var u1 = Math.random();
      if (p > 1.0) {
        if (u1 <= Math.pow(x, alpha - 1.0)) {
          break;
        }
      } else if (u1 <= Math.exp(-x)) {
        break;
      }
    }
    return x * beta;
  }
}

function beta_distribution(alpha, beta) {
  var y = gamma_distribution(alpha, 1);
  if (y === 0) {
    return 0.0;
  } else {
    return y / (y + gamma_distribution(beta, 1));
  }
}

function random() {
  do {
    var ret = beta_distribution(maze_input.distribution.alpha, maze_input.distribution.beta);
  } while (ret >= 1);
  return ret;
}


function MazeDrawer(canvas_context) {
  this.ctx = canvas_context;
}

MazeDrawer.prototype.style = function(style) {
  this.ctx.fillStyle = style;
}

MazeDrawer.prototype.fill_cell = function(x, y) {
  this.ctx.fillRect(x * CELL_SIZE + (x + 1) * CELL_SPACING,
                    y * CELL_SIZE + (y + 1) * CELL_SPACING,
                    CELL_SIZE, CELL_SIZE);
}

MazeDrawer.prototype.fill_east = function(x, y) {
  this.ctx.fillRect((x + 1) * (CELL_SIZE + CELL_SPACING),
                    y * CELL_SIZE + (y + 1) * CELL_SPACING,
                    CELL_SPACING, CELL_SIZE);
}

MazeDrawer.prototype.fill_south = function(x, y) {
  this.ctx.fillRect(x * CELL_SIZE + (x + 1) * CELL_SPACING,
                    (y + 1) * (CELL_SIZE + CELL_SPACING),
                    CELL_SIZE, CELL_SPACING);
}


function RandomTraversalMaze(width, height, start, maze_drawer) {
  this.width = width;
  this.height = height;
  this.cells = [];
  for (var y = 0; y < height; y++) {
      this.cells[y] = Array(width);
  }

  this.frontier = this.frontier || [];
  this.maze_drawer = maze_drawer;

  this.maze_drawer.style(maze_input.foreground_color);
  this.maze_drawer.fill_cell(start.x, start.y);

  this.cells[start.y][start.x] = 0;

  if (start.y > 0) {
    this.push(start.x, start.y, N);
  }
  if (start.y < height - 1) {
    this.push(start.x, start.y, S);
  }
  if (start.x > 0) {
    this.push(start.x, start.y, W);
  }
  if (start.y < width - 1) {
    this.push(start.x, start.y, E);
  }
}

RandomTraversalMaze.prototype.push = function(x, y, direction) {
  this.frontier.push({x: x, y: y, direction: direction});
};

RandomTraversalMaze.prototype.pop = function() {
  if (!this.frontier) return;
  var n = this.frontier.length;
  var i = Math.floor(random() * n);

  var tmp = this.frontier[i];
  this.frontier[i] = this.frontier[n - 1];
  this.frontier[n - 1] = tmp;

  return this.frontier.pop();
}

RandomTraversalMaze.prototype.step = function() {
  var edge = this.pop();
  if (edge === undefined) return true;

  var x, y;
  var reverse_direction;

  if (edge.direction === N) {
    x = edge.x,
    y = edge.y - 1;
    this.maze_drawer.style(this.cells[y][x] === undefined ? maze_input.foreground_color : maze_input.background_color);
    this.maze_drawer.fill_south(x, y);
    reverse_direction = S;
  } else if (edge.direction === S) {
    x = edge.x,
    y = edge.y + 1;
    this.maze_drawer.style(this.cells[y][x] === undefined ? maze_input.foreground_color : maze_input.background_color);
    this.maze_drawer.fill_south(x, y - 1);
    reverse_direction = N;
  } else if (edge.direction === W) {
    x = edge.x - 1;
    y = edge.y;
    this.maze_drawer.style(this.cells[y][x] === undefined ? maze_input.foreground_color : maze_input.background_color);
    this.maze_drawer.fill_east(x, y);
    reverse_direction = E;
  } else {
    x = edge.x + 1;
    y = edge.y;
    this.maze_drawer.style(this.cells[y][x] === undefined ? maze_input.foreground_color : maze_input.background_color);
    this.maze_drawer.fill_east(x - 1, y);
    reverse_direction = W;
  }

  var open = this.cells[y][x] === undefined;
  this.maze_drawer.style(maze_input.foreground_color);
  this.maze_drawer.fill_cell(x, y);

  if (open) {
    this.cells[edge.y][edge.x] |= edge.direction;
    this.cells[y][x] |= reverse_direction;

    this.maze_drawer.style(maze_input.frontier_color);
    var m = 0;

    if (y > 0 && this.cells[y - 1][x] === undefined) {
      this.maze_drawer.fill_south(x, y - 1);
      this.push(x, y, N);
      m++;
    }
    if (y < this.height - 1 && this.cells[y + 1][x] === undefined) {
      this.maze_drawer.fill_south(x, y);
      this.push(x, y, S);
      m++;
    }
    if (x > 0 && this.cells[y][x - 1] === undefined) {
      this.maze_drawer.fill_east(x - 1, y);
      this.push(x, y, W);
      m++;
    }
    if (x < this.width - 1 && this.cells[y][x + 1] === undefined) {
      this.maze_drawer.fill_east(x, y);
      this.push(x, y, E);
      m++;
    }

    shuffle(this.frontier, this.frontier.length - m, this.frontier.length);
  }
}


function RandomDepthFirstMaze() {
  RandomTraversalMaze.apply(this, arguments);
}

RandomDepthFirstMaze.prototype = Object.create(RandomTraversalMaze.prototype);
RandomDepthFirstMaze.prototype.constructor = RandomDepthFirstMaze;

RandomDepthFirstMaze.prototype.pop = function() {
  return this.frontier.pop();
};


function PrimMaze() {
  this.frontier = minHeap(function(a, b) { return a.weight - b.weight; });
  RandomDepthFirstMaze.apply(this, arguments);

  if (heap_weights_img) {
    this.heap_weights_canvas = document.createElement('canvas');
    this.heap_weights_canvas.width = this.width;
    this.heap_weights_canvas.height = this.height;
    this.heap_weights_ctx = this.heap_weights_canvas.getContext('2d');
    this.heap_weights_ctx.drawImage(heap_weights_img, 0, 0, this.width, this.height);
    this.heap_image_data = this.heap_weights_ctx.getImageData(0, 0, this.width, this.height).data;
  }
}

PrimMaze.prototype = Object.create(RandomDepthFirstMaze.prototype);
PrimMaze.prototype.constructor = PrimMaze;

PrimMaze.prototype.gen_weight = function(x, y, direction) {
  if (this.heap_image_data) {
    var weight = (this.heap_image_data[(y * this.width + x) * 4    ] +
                  this.heap_image_data[(y * this.width + x) * 4 + 1] +
                  this.heap_image_data[(y * this.width + x) * 4 + 2]);
    return weight;
  } else {
    return random();
  }
}

PrimMaze.prototype.push = function(x, y, direction) {
  this.frontier.push({x: x, y: y, direction: direction, weight: this.gen_weight(x, y, direction)});
};


function WilsonMaze() {
  RandomTraversalMaze.apply(this, arguments);
  this.frontier = [];
  this.current_walk = [];
  this.walk_cells = {};

  this.first_available_x = 0;
  this.first_available_y = 0;
}

WilsonMaze.prototype = Object.create(RandomTraversalMaze.prototype);
WilsonMaze.prototype.constructor = WilsonMaze;

WilsonMaze.prototype.step = function() {
  if (this.current_walk.length) {
    var curr = this.current_walk[this.current_walk.length - 1];
  } else {
    while (true) {
      if (this.cells[this.first_available_y][this.first_available_x] === undefined) {
        break;
      }

      this.first_available_x += 1;
      if (this.first_available_x === this.width) {
        this.first_available_x = 0;
        this.first_available_y += 1;
        if (this.first_available_y === this.height) {
          return true;
        }
      }
    }
    var curr = [this.first_available_x, this.first_available_y];
    this.current_walk = [[curr[0], curr[1]]];
    this.walk_cells = {};
    this.walk_cells[curr] = true
  }

  var x = curr[0], y = curr[1];

  while (true) {
    var dir_x = 0, dir_y = 0;
    var i = Math.floor(random() * 4);

    if      (i === 0) dir_x = -1;
    else if (i === 1) dir_x =  1;
    else if (i === 2) dir_y = -1;
    else              dir_y =  1;

    if (x + dir_x >= 0 && x + dir_x < this.width &&
        y + dir_y >= 0 && y + dir_y < this.height) {
      break;
    }
  }

  if (this.walk_cells[[x + dir_x, y + dir_y]]) {
    this.maze_drawer.style(maze_input.background_color);
    while (this.current_walk.length) {
      var cell = this.current_walk[this.current_walk.length - 1];

      if (cell[0] === x + dir_x && cell[1] === y + dir_y) break;

      this.current_walk.pop();
      delete this.walk_cells[cell];

      this.maze_drawer.fill_cell(cell[0], cell[1]);

      this.maze_drawer.fill_east(cell[0], cell[1]);
      this.maze_drawer.fill_east(cell[0] - 1, cell[1]);
      this.maze_drawer.fill_south(cell[0], cell[1]);
      this.maze_drawer.fill_south(cell[0], cell[1] - 1);
    }
    return;
  }

  this.current_walk.push([x + dir_x, y + dir_y]);
  this.walk_cells[[x + dir_x, y + dir_y]] = true;

  this.maze_drawer.style(maze_input.frontier_color);

  this.maze_drawer.fill_cell(x, y);
  if      (dir_x === -1) this.maze_drawer.fill_east(x - 1, y);
  else if (dir_x ===  1) this.maze_drawer.fill_east(x, y);
  else if (dir_y === -1) this.maze_drawer.fill_south(x, y - 1);
  else                   this.maze_drawer.fill_south(x, y);

  if (this.cells[y + dir_y][x + dir_x] !== undefined) {
    for (var i = 1; i < this.current_walk.length; i++) {
      var prev_cell = this.current_walk[i - 1];
      var cell = this.current_walk[i];

      this.maze_drawer.style(maze_input.foreground_color);
      this.maze_drawer.fill_cell(cell[0], cell[1]);

      if (prev_cell[0] - cell[0] === -1) {
        this.maze_drawer.fill_east(prev_cell[0], prev_cell[1]);
        this.cells[cell[1]][cell[0]] |= W;
        this.cells[prev_cell[1]][prev_cell[0]] |= E;
      } else if (prev_cell[0] - cell[0] === 1) {
        this.maze_drawer.fill_east(cell[0], cell[1]);
        this.cells[cell[1]][cell[0]] |= E;
        this.cells[prev_cell[1]][prev_cell[0]] |= W;
      } else if (prev_cell[1] - cell[1] === -1) {
        this.maze_drawer.fill_south(prev_cell[0], prev_cell[1]);
        this.cells[cell[1]][cell[0]] |= N;
        this.cells[prev_cell[1]][prev_cell[0]] |= S;
      } else if (prev_cell[1] - cell[1] === 1) {
        this.maze_drawer.fill_south(cell[0], cell[1]);
        this.cells[cell[1]][cell[0]] |= S;
        this.cells[prev_cell[1]][prev_cell[0]] |= N;
      }
    }
    this.maze_drawer.fill_cell(this.current_walk[0][0],
                               this.current_walk[0][1]);
    this.current_walk = [];
    this.walk_cells = {};
  }
}


function MixedMaze() {
  RandomTraversalMaze.apply(this, arguments);
  this.frontier_start = 0;
}

MixedMaze.prototype = Object.create(RandomTraversalMaze.prototype);
MixedMaze.prototype.constructor = MixedMaze;

MixedMaze.prototype.pop = function() {
  if (this.frontier_start >= this.frontier.length) {
    return;
  }

  if (random() < maze_input.mixed_maze_chances) {
    var i = Math.floor(random() * (this.frontier.length - this.frontier_start)) + this.frontier_start;
    var tmp = this.frontier[this.frontier_start];
    this.frontier[this.frontier_start] = this.frontier[i];
    this.frontier[i] = tmp;
    return this.frontier[this.frontier_start++];
  } else {
    return this.frontier.pop();
  }
};


function RandomWalkMaze(width, height, start, maze_drawer) {
  this.width = width;
  this.height = height;
  this.start = start;

  this.path = [];

  for (var y = 0; y < height; y++) {
    if (y % 2 == 0) {
      for (var x = 0; x < width; x++) {
        this.path.push([x, y]);
      }
    } else {
      for (var x = width - 1; x >= 0 ; x--) {
        this.path.push([x, y]);
      }
    }
  }

  this.visited = [];
  for (var y = 0; y < height; y++) {
    this.visited.push([]);
    for (var x = 0; x < width; x++) {
      this.visited[y].push(false);
    }
  }

  this.visited[0][0] = true;
  this.visited[this.height - 1][this.width - 1] = true;
  this.total_visited = 2;

  this.maze_drawer = maze_drawer;

  this.draw_path(false, true);
}

RandomWalkMaze.prototype.reverse_path = function(i1, i2) {
  var jlim = (i2 - i1 + 1) / 2;
  var temp;
  for (var j = 0; j < jlim; j++) {
    temp = this.path[i1 + j];
    this.path[i1+j] = this.path[i2 - j];
    this.path[i2-j] = temp;
  }
};

RandomWalkMaze.prototype.is_inside = function(x, y) {
  return x >= 0 && x < this.width && y >= 0 && y < this.height;
};

RandomWalkMaze.prototype.backbite_left = function(step) {
  var neighbour = [this.path[0][0] + step[0], this.path[0][1] + step[1]];
  if (!this.is_inside(neighbour[0], neighbour[1])) {
    return;
  }
  for (var j = 1; j < this.path.length; j += 2) {
    if ((neighbour[0] == this.path[j][0]) && (neighbour[1] == this.path[j][1])) {
      this.reverse_path(0, j - 1);
      return;
    }
  }
};

RandomWalkMaze.prototype.backbite_right = function(step) {
  var neighbour = [this.path[this.path.length - 1][0] + step[0], this.path[this.path.length - 1][1] + step[1]];
  if (!this.is_inside(neighbour[0], neighbour[1])) {
    return;
  }
  for (var j = this.path.length - 2; j >= 0; j -= 2) {
    if ((neighbour[0] == this.path[j][0]) && (neighbour[1] == this.path[j][1])) {
      this.reverse_path(j + 1, this.path.length - 1);
      return;
    }
  }
};

RandomWalkMaze.prototype.backbite = function() {
  var step = random_choice([[1, 0], [-1, 0], [0, 1], [0, -1]]);

  if (random() < 0.5) {
    this.backbite_left(step);
  } else {
    this.backbite_right(step);
  }
};

RandomWalkMaze.prototype.draw_path = function(draw_frontier, draw_anyway) {
  if (CELL_SPACING === 0 && !draw_anyway) {
    return;
  }
  this.maze_drawer.style(maze_input.background_color);
  this.maze_drawer.ctx.fillRect(0, 0, this.maze_drawer.ctx.canvas.width, this.maze_drawer.ctx.canvas.height);

  this.maze_drawer.style(maze_input.foreground_color);
  for (var i = 0; i < this.path.length - 1; i++) {
    if (this.path[i][0] <= this.path[i + 1][0] && this.path[i][1] <= this.path[i + 1][1]) {
      var x1 = this.path[i][0], y1 = this.path[i][1];
      var x2 = this.path[i + 1][0], y2 = this.path[i + 1][1];
    } else {
      var x1 = this.path[i + 1][0], y1 = this.path[i + 1][1];
      var x2 = this.path[i][0], y2 = this.path[i][1];
    }

    this.maze_drawer.fill_cell(x1, y1);

    if (y1 == y2) {
      this.maze_drawer.fill_east(x1, y1);
    } else {
      this.maze_drawer.fill_south(x1, y1);
      this.maze_drawer.fill_cell(x1, y1 + 1);
    }
  }

  if (draw_frontier) {
    this.maze_drawer.style(maze_input.frontier_color);
  }

  this.maze_drawer.fill_cell(this.path[0][0], this.path[0][1]);
  this.maze_drawer.fill_cell(this.path[this.path.length - 1][0], this.path[this.path.length - 1][1]);
};

RandomWalkMaze.prototype.step = function(draw) {
  this.backbite();

  if (!this.visited[this.path[0][1]][this.path[0][0]]) {
    this.visited[this.path[0][1]][this.path[0][0]] = true;
    this.total_visited++;
  }

  if (!this.visited[this.path[this.path.length - 1][1]][this.path[this.path.length - 1][0]]) {
    this.visited[this.path[this.path.length - 1][1]][this.path[this.path.length - 1][0]] = true;
    this.total_visited++;
  }

  if (draw) {
    this.draw_path(true);
  }

  if (this.width * this.height % 2 == 0 && this.total_visited == this.width * this.height) {
    return true;
  }
  if (this.width * this.height % 2 == 1 && this.total_visited * 2 - 1 === this.width * this.height) {
    return true;
  }
};

RandomWalkMaze.prototype.stop = function() {
  this.start.x = this.path[0][0];
  this.start.y = this.path[0][1];

  this.cells = [];
  for (var y = 0; y < this.height; y++) {
    this.cells.push([]);
    for (var x = 0; x < this.width; x++) {
      this.cells[y].push(0);
    }
  }

  for (var i = 0; i < this.path.length - 1; i++) {
    var x1 = this.path[i][0], y1 = this.path[i][1];
    var x2 = this.path[i + 1][0], y2 = this.path[i + 1][1];

    if (y2 > y1) {
      this.cells[y1][x1] |= S;
      this.cells[y2][x2] |= N;
    } else if (y2 < y1) {
      this.cells[y1][x1] |= N;
      this.cells[y2][x2] |= S;
    } else if (x2 < x1) {
      this.cells[y1][x1] |= W;
      this.cells[y2][x2] |= E;
    } else {
      this.cells[y1][x1] |= E;
      this.cells[y2][x2] |= W;
    }
  }

  this.draw_path(false);
}


var maze_input;
var heap_weights_img;

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var generating = false;
  var flooding = false;

  var maze, width, height;

  var start = {x: 0, y: 0};

  var image_upload = document.getElementById('image_upload');
  image_upload.addEventListener('change', function(e) {
    var reader = new FileReader();
    reader.onload = function(event) {
      var img = new Image();
      img.src = event.target.result;
      img.onload = function() {
        heap_weights_img = img;
      }
    }
    reader.readAsDataURL(e.target.files[0]);
  }, false);

  maze_input = {
    cell_size: 4,
    cell_spacing: 4,
    speed: 25,
    starting_point: 'Top left',
    algorithm: 'Random',
    mixed_maze_chances: 0.5,
    heap_weights: function() {
      image_upload.click();
    },
    start: function() {
      hide_gui_element('start', true);
      hide_gui_element('stop', false);
      hide_gui_element('flood', true);
      hide_gui_element('color_flood', true);

      generating = true;

      ctx.setTransform(1, 0, 0, 1, 0, 0);

      ctx.fillStyle = maze_input.background_color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      CELL_SIZE    = maze_input.cell_size;
      CELL_SPACING = maze_input.cell_spacing;

      width  = Math.floor((canvas.width  - CELL_SPACING) / (CELL_SIZE + CELL_SPACING));
      height = Math.floor((canvas.height - CELL_SPACING) / (CELL_SIZE + CELL_SPACING));

      ctx.translate(
        Math.round((canvas.width  - width  * CELL_SIZE - (width  + 1) * CELL_SPACING) / 2),
        Math.round((canvas.height - height * CELL_SIZE - (height + 1) * CELL_SPACING) / 2)
      );

      if (maze_input.starting_point === 'Top left') {
        start = {
          x: 0,
          y: 0
        };
      } else if (maze_input.starting_point === 'Center') {
        start = {
          x: Math.floor(width  / 2),
          y: Math.floor(height / 2)
        };
      } else if (maze_input.starting_point === 'Random') {
        start = {
          x: Math.floor(random() * width),
          y: Math.floor(random() * height)
        };
      }

      var algorithm = {"Random": RandomTraversalMaze,
                       "Depth first": RandomDepthFirstMaze,
                       "Heap": PrimMaze,
                       "Wilson": WilsonMaze,
                       "Mixed": MixedMaze,
                       "Random walk": RandomWalkMaze}[maze_input.algorithm];
      maze = new algorithm(width, height, start, new MazeDrawer(ctx));

      function step() {
        if (!generating) {
          return;
        }
        var speed = maze_input.speed;
        var steps = Math.ceil(width * height / 2500 * Math.pow(speed, 1.5));
        for (var i = 0; i < steps; i++) {
          if (maze.step(i == steps - 1)) {
            maze_input.stop();
            return;
          }
        }
        requestAnimationFrame(step);
      }

      step();
    },
    stop: function() {
      hide_gui_element('start', false);
      hide_gui_element('stop', true);
      hide_gui_element('flood', false);
      hide_gui_element('color_flood', false);

      if (maze && maze.stop) {
        maze.stop();
      }

      generating = false;
      flooding = false;
    },
    flood: function() {
      flood();
    },
    color_flood: function() {
      flood(true);
    },
    background_color: '#000',
    foreground_color: '#FFF',
    frontier_color: '#F0F',
    distribution: {
      alpha: 1,
      beta: 1
    }
  };

  canvas.style.width  = window.innerWidth  + 'px';
  canvas.style.height = window.innerHeight + 'px';

  canvas.width  = window.innerWidth  * PIXEL_RATIO;
  canvas.height = window.innerHeight * PIXEL_RATIO;

  ctx.fillStyle = maze_input.background_color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var gui = new dat.GUI();
  gui.add(maze_input, 'cell_size', 1, 10, 1).name('Cell size');
  gui.add(maze_input, 'cell_spacing', 0, 10, 1).name('Cell spacing');
  gui.add(maze_input, 'speed', 1, 50).name('Speed');
  gui.add(maze_input, 'starting_point', ['Top left', 'Center', 'Random']).name('Starting point');
  gui.add(maze_input, 'algorithm', ['Random', 'Depth first', 'Heap', 'Wilson', 'Mixed', 'Random walk']).name('Algorithm').onChange(function(value) {
    hide_gui_element('mixed_maze_chances', value !== 'Mixed');
    hide_gui_element('heap_weights', value !== 'Heap');
  });
  gui.add(maze_input, 'mixed_maze_chances', 0, 1).name('Mixed maze');
  gui.add(maze_input, 'heap_weights').name('Heap weights');
  gui.add(maze_input, 'start').name('Start');
  gui.add(maze_input, 'stop').name('Stop');
  gui.add(maze_input, 'flood').name('Flood');
  gui.add(maze_input, 'color_flood').name('Color flood');

  var color_folder = gui.addFolder('Colors');
  color_folder.addColor(maze_input, 'background_color').name('Background color');
  color_folder.addColor(maze_input, 'foreground_color').name('Foreground color');
  color_folder.addColor(maze_input, 'frontier_color').name('Frontier color');

  var distribution_folder = gui.addFolder('Beta distribution');
  distribution_folder.add(maze_input.distribution, 'alpha', 0.01).name('Alpha');
  distribution_folder.add(maze_input.distribution, 'beta', 0.01).name('Beta');

  var hide_gui_element = function(property, hide) {
    for (var i = 0; i < gui.__controllers.length; i++) {
      var controller = gui.__controllers[i];
      if (controller.property === property) {
        controller.domElement.parentElement.parentElement.hidden = hide;
        return;
      }
    }
  };

  hide_gui_element('mixed_maze_chances', true);
  hide_gui_element('heap_weights', true);
  hide_gui_element('stop', true);
  hide_gui_element('flood', true);
  hide_gui_element('color_flood', true);

  var flood = function(colorful) {
    hide_gui_element('start', true);
    hide_gui_element('stop', false);
    hide_gui_element('flood', true);
    hide_gui_element('color_flood', true);

    flooding = true;

    var visited = [];
    for (var y = 0; y < height; y++) {
      visited[y] = new Array(width);
      visited[y].fill(false);
    }

    var maze_drawer = new MazeDrawer(ctx);

    var distance = 0;
    var flood_going_up = true;

    var steps = width * height / 250000;

    var frontier = [{
      x: start.x,
      y: start.y,
    }];

    if (colorful) {
      var tree = new kdTree([], function(a, b) {
        return Math.abs(a[0] - b[0]) +
               Math.abs(a[1] - b[1]) +
               Math.abs(a[2] - b[2]);
      }, [0, 1, 2]);

      var colors_per_channel = Math.ceil(Math.pow(width * height, 1 / 3));
      for (var r = 0; r < 256; r += 256 / colors_per_channel) {
        for (var g = 0; g < 256; g += 256 / colors_per_channel) {
          for (var b = 0; b < 256; b += 256 / colors_per_channel) {
            tree.insert([r | 0, g | 0, b | 0]);
          }
        }
      }

      frontier[0].color = [random() * 256, random() * 256, random() * 256];
    }

    function step() {
      var speed = maze_input.speed;
      speed = Math.pow(speed, 1.1);
      for (var s = 0; s < steps * speed; s++) {
        if (!frontier.length || !flooding) {
          hide_gui_element('start', false);
          hide_gui_element('stop', true);
          hide_gui_element('flood', true);
          hide_gui_element('color_flood', true);

          return;
        }

        distance += flood_going_up ? 1 : -1;
        if (distance === 0 || distance === 255) {
          flood_going_up = !flood_going_up;
        }
        maze_drawer.style('rgba(' + distance + ", 100, 100, 1)");

        for (var i = 0; i < frontier.length; ++i) {
          if (colorful) {
            maze_drawer.style('rgba(' + frontier[i].color[0] + ', ' +
                                        frontier[i].color[1] + ', ' +
                                        frontier[i].color[2] + ', 1)');
          }

          maze_drawer.fill_cell(frontier[i].x, frontier[i].y);
        }

        var frontier1 = [];

        for (var i = 0; i < frontier.length; ++i) {
          var f = frontier[i];
          if (!maze.cells[f.y]) continue;

          if (colorful) {
            var color = tree.nearest(f.color, 1)[0][0];
            tree.remove(color);

            maze_drawer.style('rgba(' + color[0] + ', ' +
                                        color[1] + ', ' +
                                        color[2] + ', 1)');
          }

          if (maze.cells[f.y][f.x] & E && !visited[f.y][f.x + 1]) {
            visited[f.y][f.x + 1] = true;
            maze_drawer.fill_east(f.x, f.y);
            frontier1.push({x: f.x + 1, y: f.y, color: color});
          }
          if (maze.cells[f.y][f.x] & W && !visited[f.y][f.x - 1]) {
            visited[f.y][f.x - 1] = true;
            maze_drawer.fill_east(f.x - 1, f.y);
            frontier1.push({x: f.x - 1, y: f.y, color: color});
          }
          if (maze.cells[f.y][f.x] & S && visited[f.y + 1] && !visited[f.y + 1][f.x]) {
            visited[f.y + 1][f.x] = true;
            maze_drawer.fill_south(f.x, f.y);
            frontier1.push({x: f.x, y: f.y + 1, color: color});
          }
          if (maze.cells[f.y][f.x] & N && visited[f.y - 1] && !visited[f.y - 1][f.x]) {
            visited[f.y - 1][f.x] = true;
            maze_drawer.fill_south(f.x, f.y - 1);
            frontier1.push({x: f.x, y: f.y - 1, color: color});
          }
        }

        frontier = frontier1;
      }

      requestAnimationFrame(step);
    }

    step();
  };
});
