'use strict';

var MARGIN_RATIO = 5;

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var points = [];
  var generating = false;

  var clear = function() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    if (!generating) {
      draw();
    }
  };

  clear();

  var options = {
    ratio: 0.5,
    speed: 5,
    start: function() {
      var parse_custom_restrictions = function(restrictions) {
        // format:  {from: [to1, to2, ..., ton], from2: [to1, to2, ..., ton], ..., fromn: [to1, to2, ..., ton]}
        // example: {0: [0, 1, 2], 1: [1, 2], 2: [0, 1]}
        restrictions = restrictions.replace(/(['"])?([a-zA-Z0-9]+)(['"])?:/g, '"$2":');
        try {
          restrictions = JSON.parse(restrictions);
        } catch (e) {
          return;
        }

        var parsed = {};

        for (var k in restrictions) {
          parsed[k] = new Set(restrictions[k]);
        }

        return parsed;
      };

      generating = true;
      hide_gui_element(gui, 'start', true);
      hide_gui_element(gui, 'stop', false);

      clear();

      var x = canvas.width / 2;
      var y = canvas.height / 2;

      var last_points = [];
      for (var i = 0; i < 10; i++) {
        last_points.push(-1);
      }

      var step = function() {
        if (options.custom_restrictions) {
          var custom_restrictions = parse_custom_restrictions(options.custom_restrictions);
        }

        ctx.fillStyle = 'black';
        ctx.globalAlpha = 0.1;
        for (var i = 0; i < options.speed * 1000; i++) {
          var point_i = Math.floor(Math.random() * points.length);
          var point = points[point_i];

          var cont = false;
          if (custom_restrictions &&
              custom_restrictions[last_points[last_points.length - 1]] &&
              !custom_restrictions[last_points[last_points.length - 1]].has(point_i)) {
            cont = true;
          } else {
            for (var j = 0; j < restrictions.length; j++) {
              var restriction = restrictions[j];
              if (last_points[last_points.length - restriction.n] - point_i === restriction.m) {
                cont = true;
                break;
              }
            }
          }

          if (cont) {
            continue;
          }

          last_points.push(point_i);
          last_points.shift();

          x = point.x * options.ratio + x * (1 - options.ratio);
          y = point.y * options.ratio + y * (1 - options.ratio);

          ctx.fillRect(x, y, 1, 1);
        }

        if (generating) {
          requestAnimationFrame(step);
        } else {
          hide_gui_element(gui, 'start', false);
          hide_gui_element(gui, 'stop', true);

          draw();
        }
      };

      step();
    },
    stop: function() {
      generating = false;
      hide_gui_element(gui, 'start', false);
      hide_gui_element(gui, 'stop', true);
    },
    add_point: function() {
      add_point(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2));
      clear();
    },
    custom_restrictions: "",
    add_restriction: function() {
      add_restriction(1, 1);
    }
  };

  var gui = new dat.GUI();
  gui.add(options, 'ratio', 0, 1).onChange(function() {
    clear();
  }).name('Ratio');
  gui.add(options, 'speed', 0, 100, 1).name('Speed');
  var gui_points = gui.addFolder('Points');
  gui_points.add(options, 'add_point').name('Add point');
  var gui_restrictions = gui.addFolder('Restrictions');
  gui_restrictions.add(options, 'custom_restrictions').name('Custom').onChange(clear);
  gui_restrictions.add(options, 'add_restriction').name('Add restriction');
  gui.add(options, 'start').name('Start');
  gui.add(options, 'stop').name('Stop');

  dat.GUI.prototype.removeFolder = function(name) {
    var folder = this.__folders[name];
    if (!folder) {
      return;
    }
    folder.close();
    this.__ul.removeChild(folder.domElement.parentNode);
    delete this.__folders[name];
    this.onResize();
  };

  hide_gui_element(gui, 'stop', true);

  var add_point = function(x, y) {
    var point = {
      x: x, y: y,
      folder: gui_points.addFolder('Point ' + (points.length + 1)),
      remove: function() {
        for (var i = 0; i < points.length; i++) {
          if (points[i] === point) {
            remove_point(i);
            clear();
            break;
          }
        }
      }
    };
    point.folder.add(point, 'x', 0, canvas.width  - 1, 1).onChange(function() {
      clear();
    });
    point.folder.add(point, 'y', 0, canvas.height - 1, 1).onChange(function() {
      clear();
    });
    point.folder.add(point, 'remove').name('Remove');
    points.push(point);
  };

  var remove_point = function(point_i) {
    for (var i = 0; i < points.length; i++) {
      gui_points.removeFolder('Point ' + (i + 1));
    }

    points.splice(point_i, 1);

    var old_points = points;
    points = [];
    for (var i = 0; i < old_points.length; i++) {
      add_point(old_points[i].x, old_points[i].y);
    }
  };

  add_point(canvas.width  / 2, canvas.height / 2 - canvas.height / 3);
  add_point(canvas.width  / 2 + Math.sin(Math.PI * 4 / 3) * canvas.height / 3,
            canvas.height / 2 - Math.cos(Math.PI * 4 / 3) * canvas.height / 3);
  add_point(canvas.width  / 2 + Math.sin(Math.PI * 2 / 3) * canvas.height / 3,
            canvas.height / 2 - Math.cos(Math.PI * 2 / 3) * canvas.height / 3);
  /*add_point(500, 100);
  add_point(500, 500);
  add_point(900, 500);
  add_point(900, 100);*/

  var restrictions = [];

  var add_restriction = function(n, m) {
    clear();
    var restriction = {
      n: n, m: m,
      folder: gui_restrictions.addFolder('Restriction ' + (restrictions.length + 1)),
      remove: function() {
        for (var i = 0; i < restrictions.length; i++) {
          if (restrictions[i] === restriction) {
            remove_restriction(i);
            clear();
            break;
          }
        }
      }
    };
    restriction.folder.add(restriction, 'n', 1, 10, 1).onChange(function() {
      clear();
    });
    restriction.folder.add(restriction, 'm', -10, 10, 1).onChange(function() {
      clear();
    });
    restriction.folder.add(restriction, 'remove').name('Remove');
    restrictions.push(restriction);
  };

  var remove_restriction = function(restriction_i) {
    for (var i = 0; i < restrictions.length; i++) {
      gui_restrictions.removeFolder('Restriction ' + (i + 1));
    }

    restrictions.splice(restriction_i, 1);

    var old_restrictions = restrictions;
    restrictions = [];
    for (var i = 0; i < old_restrictions.length; i++) {
      add_restriction(old_restrictions[i].n, old_restrictions[i].m);
    }
  };

  var selected_point = null;
  canvas.addEventListener('mousedown', function(e) {
    var x = e.pageX - this.offsetLeft;
    var y = e.pageY - this.offsetTop;

    if (e.ctrlKey) {
      add_point(x, y)
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
          remove_point(nearest_point);
        } else {
          selected_point = nearest_point;
          points[nearest_point].x = x;
          points[nearest_point].y = y;
        }

        clear();
        gui.updateDisplay();
      }
    }
  });

  canvas.addEventListener('mousemove', function(e) {
    var x = e.pageX - this.offsetLeft;
    var y = e.pageY - this.offsetTop;

    if (selected_point === null) {
      return;
    }

    points[selected_point].x = x;
    points[selected_point].y = y;

    clear();
    gui.updateDisplay();
  });

  canvas.addEventListener('mouseup', function(e) {
    selected_point = null;
  });

  function draw(clear_canvas) {
    if (clear_canvas) {
      clear();
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
});
