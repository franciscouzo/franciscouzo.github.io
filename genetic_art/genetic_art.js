'use strict';

function random(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(x, min, max) {
  var tmp = min;
  min = Math.min(min, max);
  max = Math.max(tmp, max);
  return Math.min(max, Math.max(min, x));
}


function PolygonFactory(width, height, options) {
  this.width = width;
  this.height = height;
  this.options = options;
}

PolygonFactory.prototype.generate_point = function() {
  if (this.options.restriction.enable) {
    var sides = this.options.restriction.sides;
    var angle = this.options.restriction.angle;
    var radius = Math.min(this.width, this.height) / 2;

    var i1 = Math.floor(Math.random() * sides);
    var i2 = (i1 + 1) % sides;

    var x1 = Math.cos(i1 / sides * 2 * Math.PI + angle) * radius + this.width  / 2;
    var y1 = Math.sin(i1 / sides * 2 * Math.PI + angle) * radius + this.height / 2;

    var x2 = Math.cos(i2 / sides * 2 * Math.PI + angle) * radius + this.width  / 2;
    var y2 = Math.sin(i2 / sides * 2 * Math.PI + angle) * radius + this.height / 2;

    var t = Math.random();
    var x = (1 - t) * x1 + t * x2;
    var y = (1 - t) * y1 + t * y2;

    return [x, y];
  } else {
    return [random(0, this.width), random(0, this.height)];
  }
}

PolygonFactory.prototype.tweak_point = function(point) {
  if (this.options.restriction.enable) {
    return this.generate_point();
  } else {
    return [clamp(point[0] + random(-this.width  / 10, this.width  / 10), 0, this.width),
            clamp(point[1] + random(-this.height / 10, this.height / 10), 0, this.height)];
  }
}

PolygonFactory.prototype.generate = function() {
  var polygon = {r: Math.floor(Math.random() * 256), g: Math.floor(Math.random() * 256),
                 b: Math.floor(Math.random() * 256), a: Math.random(), points: []};

  var sides = Math.floor(this.options.min_sides + Math.random() * (this.options.max_sides - this.options.min_sides));
  for (var i = 0; i < sides; i++) {
    polygon.points.push(this.generate_point());
  }

  return polygon;
};

PolygonFactory.prototype.tweak = function(polygon) {
  var new_polygon = {};
  for (var k in polygon) {
    new_polygon[k] = polygon[k];
  }

  new_polygon.points = polygon.points.slice();

  var r = random(0, polygon.points.length + 4);
  if (r < 3) {
    var color = random_choice(['r', 'g', 'b']);
    new_polygon[color] = clamp(polygon[color] + random(-25, 25), 0, 255);
  } else if (r < 4) {
    new_polygon.a = clamp(polygon.a + random(-0.1, 0.1), 0, 1);
  } else {
    var i = Math.floor(Math.random() * polygon.points.length);
    if (polygon.points.length > this.options.min_sides && Math.random() < 0.1) {
      new_polygon.points.splice(i, 1);
    } else if (polygon.points.length < this.options.max_sides && Math.random() < 0.1) {
      new_polygon.points.splice(i, 0, this.generate_point());
    } else if (Math.random() < 0.5) {
      var j = Math.floor(Math.random() * polygon.points.length);
      new_polygon.points[i] = polygon.points[j];
      new_polygon.points[j] = polygon.points[i];
    } else {
      new_polygon.points[i] = this.tweak_point(polygon.points[i]);
    }
  }

  return new_polygon;
};

PolygonFactory.prototype.draw = function(ctx, polygon) {
  var style = 'rgba(' + polygon.r + ', ' + polygon.g + ', ' + polygon.b + ', ' + polygon.a + ')';
  ctx.strokeStyle = ctx.fillStyle = style;

  ctx.beginPath();
  ctx.moveTo(polygon.points[0][0], polygon.points[0][1]);
  for (var i = 0; i < polygon.points.length; i++) {
    ctx.lineTo(polygon.points[i][0], polygon.points[i][1]);
  }

  if (polygon.points.length === 2) {
    ctx.stroke();
  } else {
    ctx.fill();
  }
};

PolygonFactory.prototype.svg = function(polygon) {
  var style = rgb2hex(polygon.r, polygon.g, polygon.b);
  var points = [];
  for (var i = 0; i < polygon.points.length; i++) {
    points.push(polygon.points[i][0] + ',' + polygon.points[i][1]);
  }
  return '<polygon points="' + points.join(' ') + '" fill="' + style + '" opacity="' + polygon.a + '"/>';
};

function RegularPolygonFactory(width, height, options) {
  this.width = width;
  this.height = height;
  this.options = options;
}

RegularPolygonFactory.prototype.generate = function() {
  return {
    r: Math.floor(Math.random() * 256), g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256), a: Math.random(),
    sides: Math.floor(random(this.options.min_sides, this.options.max_sides)),
    x: random(0, this.width), y: random(0, this.height),
    radius: random(this.options.min_radius, this.options.max_radius),
    angle: random(0, 2 * Math.PI)
  };
};

RegularPolygonFactory.prototype.tweak = function(polygon) {
  var new_polygon = {};
  for (var k in polygon) {
    new_polygon[k] = polygon[k];
  }

  var r = random(0, 10);
  if (r < 4 && (polygon.sides > this.options.min_sides ||
                polygon.sides < this.options.max_sides)) {
    if (polygon.sides > this.options.min_sides) {
      new_polygon.sides--;
    } else if (polygon.sides < this.options.max_sides) {
      new_polygon.sides++;
    }
  } else if (r < 6) {
    var color = random_choice(['r', 'g', 'b']);
    new_polygon[color] = clamp(polygon[color] + random(-25, 25), 0, 255);
  } else if (r < 7) {
    new_polygon.a = clamp(polygon.a + random(-0.1, 0.1), 0, 1);
  } else {
    new_polygon.angle = (polygon.angle + random(-0.1, 0.1)) % (2 * Math.PI);
  }

  return new_polygon;
};

RegularPolygonFactory.prototype.get_point = function(polygon, i) {
  return [Math.cos(i / polygon.sides * 2 * Math.PI + polygon.angle) * polygon.radius + polygon.x,
          Math.sin(i / polygon.sides * 2 * Math.PI + polygon.angle) * polygon.radius + polygon.y];
};

RegularPolygonFactory.prototype.draw = function(ctx, polygon) {
  var style = 'rgba(' + polygon.r + ', ' + polygon.g + ', ' + polygon.b + ', ' + polygon.a + ')';
  ctx.strokeStyle = ctx.fillStyle = style;

  ctx.beginPath();
  if (polygon.sides === 50) {
    ctx.arc(polygon.x, polygon.y, polygon.radius, 0, 2 * Math.PI);
  } else {
    for (var i = 0; i < polygon.sides; i++) {
      var xy = this.get_point(polygon, i);
      if (i === 0) {
        ctx.moveTo(xy[0], xy[1]);
      } else {
        ctx.lineTo(xy[0], xy[1]);
      }
    }
  }
  if (polygon.sides === 2) {
    ctx.stroke();
  } else {
    ctx.fill();
  }
};

RegularPolygonFactory.prototype.svg = function(polygon) {
  var style = rgb2hex(polygon.r, polygon.g, polygon.b);

  if (polygon.sides === 50) {
    return '<circle cx="' + polygon.x + '" cy="' + polygon.y + '" ' +
           'r="' + polygon.radius + '" fill="' + style + '" />';
  } else {
    var points = [];
    for (var i = 0; i < polygon.sides; i++) {
      var xy = this.get_point(polygon, i);
      points.push(xy.join());
    }
    return '<polygon points="' + points.join(' ') + '" fill="' + style + '" opacity="' + polygon.a + '"/>';
  }
};

function TextureFactory(width, height, options, texture_canvas) {
  this.width = width;
  this.height = height;
  this.options = options;
  this.texture_canvas = texture_canvas;
}

TextureFactory.prototype.generate = function() {
  return {
    a: Math.random(), x: random(0, this.width), y: random(0, this.height),
    radius: random(this.options.min_radius, this.options.max_radius),
    angle: random(0, 2 * Math.PI)
  };
};

TextureFactory.prototype.tweak = function(texture) {
  var new_texture = {};
  for (var k in texture) {
    new_texture[k] = texture[k];
  }

  var r = random(0, 5);
  if (r < 1) {
    new_texture.a = clamp(texture.a + random(-0.1, 0.1), 0, 1);
  } else if (r < 2) {
    new_texture.x = clamp(texture.x + random(-0.1, 0.1) * this.width,  -texture.radius, this.width  + texture.radius);
  } else if (r < 3) {
    new_texture.y = clamp(texture.y + random(-0.1, 0.1) * this.height, -texture.radius, this.height + texture.radius);
  } else if (r < 4) {
    new_texture.radius = clamp(texture.radius + random(this.options.min_radius, this.options.max_radius) / 10, this.options.min_radius, this.options.max_radius);
  } else {
    new_texture.angle = (texture.angle + random(-0.1, 0.1)) % (2 * Math.PI);
  }

  return new_texture;
};

TextureFactory.prototype.draw = function(ctx, texture) {
  ctx.save();
  ctx.globalAlpha = texture.a;
  ctx.translate(texture.x, texture.y);
  ctx.rotate(texture.angle);
  if (texture.width > texture.height) {
    var width = texture.radius;
    var height = texture.radius * this.texture_canvas.height / this.texture_canvas.width;
  } else {
    var width = texture.radius * this.texture_canvas.width / this.texture_canvas.height;
    var height = texture.radius;
  }
  ctx.drawImage(this.texture_canvas, -width / 2, -height / 2, width, height);
  ctx.restore();
};

var get_score = function(orig_img_data, img_data) {
  var orig_data = orig_img_data.data;
  var data = img_data.data;

  var w = orig_img_data.width;
  var h = orig_img_data.height;

  var score = 0;

  for (var i = 0; i < w * h * 4; i++) {
    //score += Math.pow((orig_data[i] - data[i]) / 255, 2);
    score += Math.abs(orig_data[i] - data[i]);
  }

  return score;
};


function download(filename, data) {
  var link = document.createElement('a');
  link.setAttribute('href', data);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function rgb2hex(red, green, blue) {
  var rgb = blue | (green << 8) | (red << 16);
  return '#' + (0x1000000 + rgb).toString(16).slice(1);
}

document.addEventListener('DOMContentLoaded', function() {
  var shapes = [];
  var shape_factory;

  var genetic_input = {
    load_image: function() {
      image_upload.click();
    },
    algorithm: 'Simulated annealing',
    invert: false,
    style: 'Regular polygons',
    min_sides: 4,
    max_sides: 4,
    min_radius: 30,
    max_radius: 50,
    restriction: {
      enable: false,
      sides: 4,
      angle: 0
    },
    load_texture: function() {
      texture_upload.click();
    },
    resize: true,
    overdraw: false,
    show_tries: true,
    shape_count: 500,
    speed: 1,
    generate: function() {
      hide_gui_element(gui, 'generate', true);
      hide_gui_element(gui, 'clear', true);
      hide_gui_element(gui, 'stop', false);

      generating = true;

      var img_data = ctx.getImageData(0, 0, canvas.width, canvas.height);

      var best_canvas = document.createElement('canvas');
      best_canvas.width  = canvas.width;
      best_canvas.height = canvas.height;
      var best_ctx = best_canvas.getContext('2d');

      var generations = 0;
      var evolutions = 0;

      shape_factory = new {
        Polygons: PolygonFactory,
        'Regular polygons': RegularPolygonFactory,
        Textures: TextureFactory
      }[genetic_input.style](canvas.width, canvas.height, genetic_input, texture_canvas);

      hide_gui_element(gui, 'download_svg', !shape_factory.svg);

      var shape_n = genetic_input.shape_count;

      var overdraw = genetic_input.overdraw;

      shapes = [];

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!overdraw) {
        for (var i = 0; i < shape_n; i++) {
          var shape = shape_factory.generate();
          shapes.push(shape);
          shape_factory.draw(best_ctx, shape);
        }
      }

      var best_score = get_score(img_data, best_ctx.getImageData(0, 0, canvas.width, canvas.height));
      var worst_possible_score = best_score;

      var generation_tag = document.getElementById('generation');

      var accept_new_state_algorithms = {
        'Simulated annealing': function(score, best_score, generation) {
          if (score <= best_score) {
            return true;
          } else {
            var temperature = 10000 / Math.log(generation + 1);
            return Math.exp(-(score - best_score) / temperature) >= Math.random();
          }
        },
        'Hill climbing': function(score, best_score, generation) {
          return score <= best_score;
        }
      };

      var step = function() {
        if (!generating) {
          generating = false;

          hide_gui_element(gui, 'generate', false);
          hide_gui_element(gui, 'clear', false);
          hide_gui_element(gui, 'stop', true);

          return;
        }

        for (var j = 0; j < genetic_input.speed; j++) {
          generations++;

          var curr_canvas = document.createElement('canvas');
          curr_canvas.width  = canvas.width;
          curr_canvas.height = canvas.height;
          var curr_ctx = curr_canvas.getContext('2d');

          if (!overdraw) {
            var old_shapes = shapes.slice();
            var steps = -Math.log(1 - Math.random()) / 2 + 1;
            for (var k = 0; k < steps; k++) {
              var random_i = Math.floor(Math.random() * shape_n);
              var r = Math.random();
              if (r < 0.7) {
                shapes[random_i] = shape_factory.tweak(shapes[random_i]);
              } else if (r < 0.8) {
                var random_j = Math.floor(Math.random() * shape_n);
                var tmp = shapes[random_i];
                shapes[random_i] = shapes[random_j];
                shapes[random_j] = tmp;
              } else {
                shapes[random_i] = shape_factory.generate();
              }
            }

            for (var i = 0; i < shape_n; i++) {
              shape_factory.draw(curr_ctx, shapes[i]);
            }
          } else {
            curr_ctx.drawImage(canvas, 0, 0);
            var shape = shape_factory.generate();
            shape_factory.draw(curr_ctx, shape);
          }

          var curr_img_data = curr_ctx.getImageData(0, 0, canvas.width, canvas.height);
          var score = get_score(img_data, curr_img_data);

          if (accept_new_state_algorithms[genetic_input.algorithm](score, best_score, generations) !== genetic_input.invert) {
            best_score = score;
            ctx.putImageData(curr_img_data, 0, 0);
            evolutions++
          } else if (!overdraw) {
            shapes = old_shapes;
            if (genetic_input.show_tries) {
              ctx.putImageData(curr_img_data, 0, 0);
            }
          }
        }

        generation_tag.innerHTML = "Generations: " + generations + "<br>" +
                                   "Evolutions: " + evolutions + "<br>" +
                                   "Score: " + ((worst_possible_score - best_score) / worst_possible_score * 100).toFixed(3) + "%";

        requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    },
    clear: function() {
      hide_gui_element(gui, 'clear', true);
      hide_gui_element(gui, 'download_svg', true);

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    },
    stop: function() {
      generating = false;

      hide_gui_element(gui, 'generate', false);
      hide_gui_element(gui, 'clear', false);
      hide_gui_element(gui, 'stop', true);
    },
    download_svg: function() {
      var header = shape_factory.svg_header ? shape_factory.svg_header() : '';
      var svg_elements = [];
      for (var i = 0; i < shapes.length; i++) {
        svg_elements.push(shape_factory.svg(shapes[i]));
      }
      var data = [
        '<?xml version="1.0" encoding="UTF-8" ?>',
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" ' +
        'width="' + canvas.width + '" height="' + canvas.height + '" ' +
        'viewBox="0 0 ' + canvas.width + ' ' + canvas.height + '">'
      ].concat(header, svg_elements, '</svg>').join('\n');
      download(filename.replace(/\.[^.]+$/, '') + '.svg', 'data:image/svg+xml,' + encodeURIComponent(data));
    }
  };
  var gui = new dat.GUI();
  gui.add(genetic_input, 'load_image').name('Load image');
  gui.add(genetic_input, 'algorithm', ['Simulated annealing', 'Hill climbing']).name('Algorithm');
  gui.add(genetic_input, 'invert').name('Invert');
  gui.add(genetic_input, 'style', ['Polygons', 'Regular polygons', 'Textures']).name('Style').onChange(function(value) {
    hide_gui_folder(gui, 'Radius', value !== 'Regular polygons' && value !== 'Textures');
    hide_gui_folder(gui, 'Shape restriction', value !== 'Polygons');
    hide_gui_folder(gui, 'Sides', value === 'Textures');
    hide_gui_element(gui, 'load_texture', value !== 'Textures');
  });

  var sides_folder = gui.addFolder('Sides');
  sides_folder.add(genetic_input, 'min_sides', 2, 50, 1).name('Min sides').onChange(function(value) {
    genetic_input.max_sides = Math.max(genetic_input.min_sides, genetic_input.max_sides);
    update_gui(sides_folder);
  });
  sides_folder.add(genetic_input, 'max_sides', 2, 50, 1).name('Max sides').onChange(function(value) {
    genetic_input.min_sides = Math.min(genetic_input.min_sides, genetic_input.max_sides);
    update_gui(sides_folder);
  });

  var radius_folder = gui.addFolder('Radius');
  radius_folder.add(genetic_input, 'min_radius', 5, 100).name('Min radius').onChange(function(value) {
    genetic_input.max_radius = Math.max(genetic_input.min_radius, genetic_input.max_radius);
    update_gui(radius_folder);
  });
  radius_folder.add(genetic_input, 'max_radius', 5, 100).name('Max radius').onChange(function(value) {
    genetic_input.min_radius = Math.min(genetic_input.min_radius, genetic_input.max_radius);
    update_gui(radius_folder);
  });

  var shape_restriction_folder = gui.addFolder('Shape restriction');
  shape_restriction_folder.add(genetic_input.restriction, 'enable').name('Restrict').onChange(function(value) {
    hide_gui_element(shape_restriction_folder, 'sides', !value);
    hide_gui_element(shape_restriction_folder, 'angle', !value);
  });
  shape_restriction_folder.add(genetic_input.restriction, 'sides', 3, 50, 1).name('Sides');
  shape_restriction_folder.add(genetic_input.restriction, 'angle', 0, 2 * Math.PI).name('Angle');

  gui.add(genetic_input, 'load_texture').name('Load texture');

  gui.add(genetic_input, 'resize').name('Resize');
  gui.add(genetic_input, 'overdraw').name('Overdraw').onChange(function(value) {
    hide_gui_element(gui, 'show_tries', value);
    hide_gui_element(gui, 'shape_count', value);
  });
  gui.add(genetic_input, 'show_tries').name('Show tries');
  gui.add(genetic_input, 'shape_count', 50, 5000).name('Shape count');
  gui.add(genetic_input, 'speed', 1, 25, 1).name('Speed');
  gui.add(genetic_input, 'generate').name('Generate');
  gui.add(genetic_input, 'clear').name('Clear');
  gui.add(genetic_input, 'stop').name('Stop');
  gui.add(genetic_input, 'download_svg').name('Download SVG');

  hide_gui_element(gui, 'load_texture', true);
  hide_gui_element(gui, 'clear', true);
  hide_gui_element(gui, 'stop', true);
  hide_gui_element(gui, 'download_svg', true);

  hide_gui_element(shape_restriction_folder, 'sides', true);
  hide_gui_element(shape_restriction_folder, 'angle', true);

  hide_gui_folder(gui, 'Shape restriction', true);

  var image_upload = document.getElementById('image_upload');
  var texture_upload = document.getElementById('texture_upload');

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var texture_canvas = document.createElement('canvas');

  ctx.canvas.width  = window.innerWidth;
  ctx.canvas.height = window.innerHeight;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var generating = false;

  var filename = 'default';

  image_upload.addEventListener('change', function(e) {
    var reader = new FileReader();
    reader.onload = function(event) {
      var img = new Image();
      img.src = event.target.result;
      img.onload = function() {
        if (genetic_input.resize) {
          var ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
          canvas.width  = img.width  * ratio;
          canvas.height = img.height * ratio;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    }
    reader.readAsDataURL(e.target.files[0]);
    filename = e.target.files[0].name;
  }, false);

  texture_upload.addEventListener('change', function(e) {
    var reader = new FileReader();
    reader.onload = function(event) {
      var img = new Image();
      img.src = event.target.result;
      img.onload = function() {
        texture_canvas.width = img.width;
        texture_canvas.height = img.height;
        texture_canvas.getContext('2d').drawImage(img, 0, 0);
      }
    }
    reader.readAsDataURL(e.target.files[0]);
  }, false);
});
