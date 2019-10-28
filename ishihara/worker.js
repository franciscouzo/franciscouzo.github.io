importScripts('shape_factories.js', '../js/kdTree.js', 'jspolygon.js');

onmessage = function(e) {
  var options = e.data;

  var shape_factory = {
    'Circle': CircleFactory,
    'Regular polygon': RegularPolygonFactory,
    'Cross': CrossFactory,
    'Star': StarFactory
  }[options.shape_factory];
  shape_factory = new shape_factory(options);

  svg_elements = []
  var tree = new kdTree([], function(a, b) {
    return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
  }, ['x', 'y']);

  var tries = 0;

  var check_nearest = Math.ceil(
    Math.max(options.min_radius, options.max_radius) /
    Math.min(options.min_radius, options.max_radius) * 5);

  outer:
  while (tries < options.stop_after) {
    tries++;
    var shapes = shape_factory.generate(options.circular);

    for (var i = 0; i < shapes.length; i++) {
      var shape = shapes[i];

      var nearest = tree.nearest(shape, check_nearest);
      for (var j = 0; j < nearest.length; j++) {
        var near_shape = nearest[j][0];
        if (shape_factory.intersects(shape, near_shape)) {
          continue outer;
        }
      }
    }

    var overlaps_image = false;
    for (var i = 0; i < shapes.length; i++) {
      var overlap = shape_factory.overlaps_image(options.img_data, shapes[i]);
      var total_points = overlap[0];
      var points_overlapping = overlap[1];

      overlaps_image = points_overlapping !== 0;

      if (options.edge_detection) {
        if (overlaps_image && points_overlapping !== total_points) {
          continue outer;
        }
      } else if (overlaps_image) {
        break;
      }
    }

    tries = 0;

    if (overlaps_image !== options.invert_colors) {
      var style = options['color_on' + Math.floor(Math.random() * options.n_colors_on)];
    } else {
      var style = options['color_off' + Math.floor(Math.random() * options.n_colors_off)];
    }

    for (var i = 0; i < shapes.length; i++) {
      postMessage({action: 'shape', shape: shapes[i], style: style});
      tree.insert(shapes[i]);
    }
  }

  postMessage({action: 'stop'});
};
