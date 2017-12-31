'use strict';

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var generating = false;
  var paused = false;

  var options = {
    sink: true,
    rules: [
      false, true,  false,
      true,  false, true,
      false, true,  false
    ],
    cell_size: 4,
    speed: 25,
    starting_point: 'Center',
    start: function() {
      hide_gui_element(gui, 'start', true);
      hide_gui_element(gui, 'pause', false);
      hide_gui_element(gui, 'unpause', true);
      hide_gui_element(gui, 'stop', false);

      generating = true;

      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;

      ctx.fillStyle = options.colors[0];
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      var CELL_SIZE = options.cell_size;

      var width  = Math.floor(canvas.width  / CELL_SIZE);
      var height = Math.floor(canvas.height / CELL_SIZE);

      ctx.translate(
        Math.round((canvas.width  - width  * CELL_SIZE) / 2),
        Math.round((canvas.height - height * CELL_SIZE) / 2)
      );

      var start;

      if (options.starting_point === 'Top left') {
        start = {
          x: 0,
          y: 0
        };
      } else if (options.starting_point === 'Center') {
        start = {
          x: Math.floor(width  / 2),
          y: Math.floor(height / 2)
        };
      } else if (options.starting_point === 'Random') {
        start = {
          x: Math.floor(Math.random() * width),
          y: Math.floor(Math.random() * height)
        };
      }

      var grid = [];
      for (var y = 0; y < height; y++) {
        grid[y] = []
        for (var x = 0; x < width; x++) {
          grid[y].push(0);
        }
      }

      function topple_sand(x, y) {
        if (grid[y][x] < rules.length) {
          return;
        }

        grid[y][x] -= rules.length;
        changed[x + ',' + y] = true;

        for (var i = 0; i < rules.length; i++) {
          var x_dir = rules[i][0];
          var y_dir = rules[i][1];

          if (x + x_dir >= 0 && x + x_dir < width &&
              y + y_dir >= 0 && y + y_dir < height) {
            grid[y + y_dir][x + x_dir] += 1;
            topple_sand(x + x_dir, y + y_dir);
          } else if (!options.sink) {
            grid[y][x] += 1;
          }
        }
      }

      var rules;
      var changed;

      function step() {
        if (!paused) {
          rules = [];
          for (var y = -1, i = 0; y <= 1; y++) {
            for (var x = -1; x <= 1; x++, i++) {
              if (options.rules[i]) {
                rules.push([x, y]);
              }
            }
          }

          changed = {};

          for (var i = 0; i < options.speed; i++) {
            grid[start.y][start.x] += 1;
            topple_sand(start.x, start.y);
          }

          for (var key in changed) {
            var x = key.split(',')[0];
            var y = key.split(',')[1];
            ctx.fillStyle = options.colors[Math.min(grid[y][x], options.colors.length - 1)];
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          }
        }

        if (generating) {
          requestAnimationFrame(step);
        }
      }

      step();
    },
    pause: function() {
      hide_gui_element(gui, 'start', true);
      hide_gui_element(gui, 'pause', true);
      hide_gui_element(gui, 'unpause', false);
      hide_gui_element(gui, 'stop', true);

      paused = true;
    },
    unpause: function() {
      hide_gui_element(gui, 'start', true);
      hide_gui_element(gui, 'pause', false);
      hide_gui_element(gui, 'unpause', true);
      hide_gui_element(gui, 'stop', false);

      paused = false;
    },
    stop: function() {
      hide_gui_element(gui, 'start', false);
      hide_gui_element(gui, 'pause', true);
      hide_gui_element(gui, 'unpause', true);
      hide_gui_element(gui, 'stop', true);

      generating = false;
    },
    //colors: ['#FFF', '#00bfff', '#ffd700', '#b03060', '#b03060', '#b03060', '#b03060', '#b03060']
    colors: ['#ffffff', '#e2efde', '#afd0bf', '#808f87', '#9b7e46', '#f4b266', '#d0d6b5', '#f9b5ac', '#ee7674']
  };

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  ctx.fillStyle = options.colors[0];
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var gui = new dat.GUI();
  gui.add(options, 'sink').name('Sink');
  gui.add(options, 'cell_size', 1, 10, 1).name('Cell size');
  gui.add(options, 'speed', 1, 500, 1).name('Speed');
  gui.add(options, 'starting_point', ['Top left', 'Center', 'Random']).name('Starting point');

  var colors_folder = gui.addFolder('Colors');
  for (var i = 0; i < options.colors.length; i++) {
    colors_folder.addColor(options.colors, i).name('Color ' + (i + 1));
  }

  var rules_folder = gui.addFolder('Rules');
  rules_folder.add(options.rules, 0).name('Top left');
  rules_folder.add(options.rules, 1).name('Top');
  rules_folder.add(options.rules, 2).name('Top right');
  rules_folder.add(options.rules, 3).name('Left');
  rules_folder.add(options.rules, 4).name('Center');
  rules_folder.add(options.rules, 5).name('Right');
  rules_folder.add(options.rules, 6).name('Bottom left');
  rules_folder.add(options.rules, 7).name('Bottom');
  rules_folder.add(options.rules, 8).name('Bottom right');

  gui.add(options, 'start').name('Start');
  gui.add(options, 'pause').name('Pause');
  gui.add(options, 'unpause').name('Unpause');
  gui.add(options, 'stop').name('Stop');

  hide_gui_element(gui, 'pause', true);
  hide_gui_element(gui, 'unpause', true);
  hide_gui_element(gui, 'stop', true);
});
