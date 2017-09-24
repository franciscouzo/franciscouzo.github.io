'use strict';

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var parse_formula = function(formula) {
    try {
      return new Function('r', 'x', 'return ' + formula + ';');
    } catch (e) {
    }
  };

  var draw = function() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerWidth / 4;

    var formula = parse_formula(options.formula);
    if (!formula) {
      return;
    }

    var i_start = 0;

    function draw_step() {
      ctx.fillStyle = 'rgba(0, 0, 0, ' + (1 - options.transparency) + ')';
      for (var i = i_start; i < i_start + options.speed && i < canvas.width; i++) {
        var r = i / canvas.width * (options.r_end - options.r_start) + options.r_start;
        var x = 0.5;
        for (var j = 0; j < options.pre_iterations; j++) {
          // Let x stabilize
          x = formula(r, x);
        }
        for (var j = 0; j < options.iterations; j++) {
          x = formula(r, x);
          ctx.fillRect(i, (canvas.height - (x - options.y_start) / (options.y_end - options.y_start) * canvas.height - 1), 1, 1);
        }
      }

      i_start += options.speed;
      if (i_start < canvas.width) {
        requestAnimationFrame(draw_step);
      }
    }

    draw_step();
  };

  var options = {
    formula: 'r * x * (1 - x)',
    pre_iterations: 500,
    iterations: 500,
    transparency: 0.75,
    r_start: 0,
    r_end: 4,
    y_start: 0,
    y_end: 1,
    speed: 10
  };

  var gui = new dat.GUI({
    load: {
      preset: "Logistic map",
      remembered: {
        "Logistic map": [{
          formula: "r * x * (1 - x)",
          r_start: 0,
          r_end: 4,
          y_start: 0,
          y_end: 1
        }],
        "Tent map": [{
          formula: "r * Math.min(x, 1 - x)",
          r_start: 0.98,
          r_end: 2,
          y_start: 0,
          y_end: 1
        }],
        "Gauss iterated map": [{
          formula: "Math.exp(-6.2 * x * x) + r",
          r_start: -0.725,
          r_end: 0.5,
          y_start: -0.5,
          y_end: 1.05
        }]
      },
      closed: false,
      folders: {
        R: {
          preset: "Default",
          closed: false,
          folders: {}
        },
        Y: {
          preset: "Default",
          closed: false,
          folders: {}
        }
      }
    }
  });

  gui.remember(options);

  gui.add(options, 'formula').name("Formula");
  gui.add(options, 'pre_iterations').name("Pre-iterations");
  gui.add(options, 'iterations').name("Iterations");
  gui.add(options, 'transparency', 0, 1, 0.01).name("Transparency");

  var r_folder = gui.addFolder('R');
  r_folder.add(options, 'r_start', -5, 5, 0.01).name("start");
  r_folder.add(options, 'r_end', -5, 5, 0.01).name("end");

  var y_folder = gui.addFolder('Y');
  y_folder.add(options, 'y_start', -5, 5, 0.01).name("start");
  y_folder.add(options, 'y_end', -5, 5, 0.01).name("end");

  gui.add(options, 'speed').name("Speed");
  gui.add({draw: draw}, 'draw').name("Draw")

  window.addEventListener('resize', draw);

  draw();
});
