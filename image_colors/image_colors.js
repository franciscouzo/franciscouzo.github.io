document.addEventListener('DOMContentLoaded', function() {
  var image;

  image_upload.addEventListener('change', function(e) {
    var reader = new FileReader();
    reader.onload = function(event) {
      var img = new Image();
      img.src = event.target.result;
      img.onload = function() {
        image = img;
      };
    };
    reader.readAsDataURL(e.target.files[0]);
  }, false);

  var color_spaces = {};

  for (color_space in convert) {
    if (convert[color_space].channels === 3) {
      (function(color_space) {
        color_spaces[color_space] = function(rgb) {
          return convert.rgb[color_space](rgb);
        };
      })(color_space)
    }
  }

  color_spaces.rgb = function(rgb) {
    return rgb;
  }

  var options = {
    load_image: function() {
      var image_upload = document.getElementById('image_upload');
      image_upload.click();
    },
    points: 5000,
    dot_size_ratio: 0.01,
    background_color: '#FFFFFF',
    color_space: 'rgb',
    generate: function() {
      if (!image) {
        return;
      }

      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');

      ctx.imageSmoothingQuality = 'high';

      var ratio = 1;

      while (image.width * ratio * image.height * ratio > options.points) {
        ratio *= 0.99;
      }

      canvas.width = image.width * ratio;
      canvas.height = image.height * ratio;
      ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);
      var image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);

      var data = new vis.DataSet();

      for (var i = 0; i < image_data.width * image_data.height * 4; i += 4) {
        var r = image_data.data[i];
        var g = image_data.data[i + 1];
        var b = image_data.data[i + 2];

        var xyz = color_spaces[options.color_space]([r, g, b]);

        var style = 'rgb(' + [r, g, b].join() + ')';

        data.add({x: xyz[0], y: xyz[1], z: xyz[2], style: style});
      }

      var graph_options = {
        width: window.innerWidth + 'px',
        height: window.innerHeight + 'px',
        style: 'dot-color',
        showPerspective: true,
        showGrid: true,
        showLegend: false,
        keepAspectRatio: true,
        verticalRatio: 1.0,
        backgroundColor: options.background_color,
        dotSizeRatio: options.dot_size_ratio,
        cameraPosition: {
          horizontal: -0.35,
          vertical: 0.22,
          distance: 5
        }
      };

      // create our graph
      var container = document.getElementById('graph');
      var graph = new vis.Graph3d(container, data, graph_options);
    }
  };

  var gui = new dat.GUI();
  gui.add(options, 'load_image').name('Load image');
  gui.add(options, 'points', 1000, 25000, 100).name('Points');
  gui.add(options, 'dot_size_ratio', 0.001, 0.05, 0.001).name('Dot size ratio');
  gui.add(options, 'color_space', Object.keys(color_spaces)).name('Color space');
  gui.addColor(options, 'background_color').name('Background color');
  gui.add(options, 'generate').name('Generate');
});
