'use strict';

var CELL_SIZE = 4;
var CELL_SPACING = 4;

var N = 1 << 0,
    S = 1 << 1,
    W = 1 << 2,
    E = 1 << 3;

function shuffle(array, start, end) {
  var m = end - start;
  while (m) {
    var i = Math.floor(Math.random() * m--);
    var tmp = array[start + m];
    array[start + m] = array[start + i];
    array[start + i] = tmp;
  }
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

function RandomTraversalMaze(width, height, start, maze_drawer, canvas_context) {
  this.width = width;
  this.height = height;
  this.cells = [];
  for (var y = 0; y < height; y++) {
      this.cells[y] = Array(width);
  }

  this.frontier = [];
  this.maze_drawer = maze_drawer;

  this.maze_drawer.style("white");
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
  var i = Math.floor(Math.random() * n);

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
    this.maze_drawer.style(this.cells[y][x] === undefined ? "white" : "black");
    this.maze_drawer.fill_south(x, y);
    reverse_direction = S;
  } else if (edge.direction === S) {
    x = edge.x,
    y = edge.y + 1;
    this.maze_drawer.style(this.cells[y][x] === undefined ? "white" : "black");
    this.maze_drawer.fill_south(x, y - 1);
    reverse_direction = N;
  } else if (edge.direction === W) {
    x = edge.x - 1;
    y = edge.y;
    this.maze_drawer.style(this.cells[y][x] === undefined ? "white" : "black");
    this.maze_drawer.fill_east(x, y);
    reverse_direction = E;
  } else {
    x = edge.x + 1;
    y = edge.y;
    this.maze_drawer.style(this.cells[y][x] === undefined ? "white" : "black");
    this.maze_drawer.fill_east(x - 1, y);
    reverse_direction = W;
  }

  var open = this.cells[y][x] === undefined;
  this.maze_drawer.style("white");
  this.maze_drawer.fill_cell(x, y);

  if (open) {
    this.cells[edge.y][edge.x] |= edge.direction;
    this.cells[y][x] |= reverse_direction;

    this.maze_drawer.style("magenta");
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
  if (!this.frontier) return;

  return this.frontier.pop();
}

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var start_button = document.getElementById("start_button");
  var stop_button = document.getElementById("stop_button");
  var flood_button = document.getElementById("flood_button");

  start_button.disabled = false;
  stop_button.disabled = true;
  flood_button.disabled = true;

  var generated = false;
  var generating = false;
  var flooding = false;

  var maze, width, height;

  var start = {x: 0, y: 0};

  start_button.addEventListener("click", function() {
    start_button.disabled = true;
    stop_button.disabled = false;
    flood_button.disabled = true;

    generated = false;
    generating = true;

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    CELL_SIZE    = Number(document.getElementById("cell_size").value);
    CELL_SPACING = Number(document.getElementById("cell_spacing").value);

    width  = Math.floor((canvas.width  - CELL_SPACING) / (CELL_SIZE + CELL_SPACING));
    height = Math.floor((canvas.height - CELL_SPACING) / (CELL_SIZE + CELL_SPACING));

    ctx.translate(
      Math.round((canvas.width  - width  * CELL_SIZE - (width  + 1) * CELL_SPACING) / 2),
      Math.round((canvas.height - height * CELL_SIZE - (height + 1) * CELL_SPACING) / 2)
    );

    var starting_point = document.getElementById("starting_point").value;
    if (starting_point === 'top_left') {
      start = {
        x: 0,
        y: 0
      };
    } else if (starting_point === 'center') {
      start = {
        x: Math.floor(width  / 2),
        y: Math.floor(height / 2)
      };
    } else if (starting_point === 'random') {
      start = {
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height)
      };
    }

    var mode = document.getElementById("maze_mode").value;
    maze = new window[mode](width, height, start, new MazeDrawer(ctx));

    var steps = width * height / 2500;
    function step() {
      var speed = Number(document.getElementById("speed").value);
      speed = Math.pow(speed, 1.1);
      for (var i = 0; i < steps * speed; i++) {
          if (maze.step()) {
            start_button.disabled = false;
            stop_button.disabled = true;
            flood_button.disabled = false;
            generated = true;
            return;
          }
      }
      if (generating) {
        requestAnimationFrame(step);
      }
    }

    step();
  });

  stop_button.addEventListener("click", function() {
    start_button.disabled = false;
    stop_button.disabled = true;
    flood_button.disabled = true;
    generating = false;
    flooding = false;
  });

  flood_button.addEventListener("click", function() {
    start_button.disabled = true;
    stop_button.disabled = false;
    flood_button.disabled = true;

    flooding = true;

    var distance = 0;
    var visited = [];
    for (var y = 0; y < height; y++) {
      visited[y] = new Array(width);
      visited[y].fill(false);
    }
    var frontier = [start];

    var maze_drawer = new MazeDrawer(ctx);

    var flood_going_up = true;

    var steps = width * height / 250000;
    function step() {
      var speed = Number(document.getElementById("speed").value);
      speed = Math.pow(speed, 1.1);
      for (var s = 0; s < steps * speed; s++) {
        if (!frontier.length || !flooding) {
          start_button.disabled = false;
          stop_button.disabled = true;
          flood_button.disabled = true;
          return;
        }

        distance += flood_going_up ? 1 : -1;
        if (distance === 0 || distance == 255) {
          flood_going_up = !flood_going_up;
        }

        //maze_drawer.style(hsl(distance % 360, 1, .5));
        maze_drawer.style('rgba(' + distance + ", 100, 100, 1)");

        for (var i = 0; i < frontier.length; ++i) {
          maze_drawer.fill_cell(frontier[i].x, frontier[i].y);
        }

        var frontier1 = [];

        for (var i = 0; i < frontier.length; ++i) {
          var f = frontier[i];
          if (!maze.cells[f.y]) continue;
          if (maze.cells[f.y][f.x] & E && !visited[f.y][f.x + 1]) {
            visited[f.y][f.x + 1] = true;
            maze_drawer.fill_east(f.x, f.y);
            frontier1.push({x: f.x + 1, y: f.y});
          }
          if (maze.cells[f.y][f.x] & W && !visited[f.y][f.x - 1]) {
            visited[f.y][f.x - 1] = true;
            maze_drawer.fill_east(f.x - 1, f.y);
            frontier1.push({x: f.x - 1, y: f.y});
          }
          if (maze.cells[f.y][f.x] & S && visited[f.y + 1] && !visited[f.y + 1][f.x]) {
            visited[f.y + 1][f.x] = true;
            maze_drawer.fill_south(f.x, f.y);
            frontier1.push({x: f.x, y: f.y + 1});
          }
          if (maze.cells[f.y][f.x] & N && visited[f.y - 1] && !visited[f.y - 1][f.x]) {
            visited[f.y - 1][f.x] = true;
            maze_drawer.fill_south(f.x, f.y - 1);
            frontier1.push({x: f.x, y: f.y - 1});
          }
        }

        frontier = frontier1;
      }

      requestAnimationFrame(step);
    }

    step();
  });
});
