'use strict';

document.addEventListener('DOMContentLoaded', function() {
  var image;

  image_upload.addEventListener('change', function(e) {
    var reader = new FileReader();
    reader.onload = function(event) {
      var img = new Image();
      img.src = event.target.result;
      img.onload = function() {
        image = img;
        generate();
      };
    };
    reader.readAsDataURL(e.target.files[0]);
  }, false);

  var color_spaces = {};

  for (var color_space in convert) {
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

  delete color_spaces.lch;
  delete color_spaces.apple;

  var layout;

  var generate = function() {
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

    var x = [];
    var y = [];
    var z = [];
    var colors = [];

    for (var i = 0; i < image_data.width * image_data.height * 4; i += 4) {
      var r = image_data.data[i];
      var g = image_data.data[i + 1];
      var b = image_data.data[i + 2];

      var xyz = color_spaces[options.color_space]([r, g, b]);

      x.push(xyz[0]);
      y.push(xyz[1]);
      z.push(xyz[2]);
      colors.push('rgb(' + [r, g, b].join() + ')');
    }

    var trace = {
      x: x,
      y: y,
      z: z,
      mode: 'markers',
      type: 'scatter3d',
      name: 'Colors',
      marker: {
        size: options.dot_size,
        color: colors
      }
    };

    var data = [trace];

    layout = {
      width: window.innerWidth,
      height: window.innerHeight,
      scene: {
        camera: {
          eye: layout ? layout.scene.camera.eye : {x: 0, y: -2, z: 1},
          center: {x: 0, y: 0, z: 0}
        }
      },
      margin: {
        l: 0,
        r: 0,
        t: 0,
        b: 0,
        pad: 0
      }
    };

    if (options.color_space === 'rgb') {
        layout.scene.xaxis = {title: 'R', range: [0, 255]};
        layout.scene.yaxis = {title: 'G', range: [0, 255]};
        layout.scene.zaxis = {title: 'B', range: [0, 255]};
    } else if (options.color_space === 'hsl') {
        layout.scene.xaxis = {title: 'H', range: [0, 360]};
        layout.scene.yaxis = {title: 'S', range: [0, 100]};
        layout.scene.zaxis = {title: 'L', range: [0, 100]};
    } else if (options.color_space === 'hsv') {
        layout.scene.xaxis = {title: 'H', range: [0, 360]};
        layout.scene.yaxis = {title: 'S', range: [0, 100]};
        layout.scene.zaxis = {title: 'V', range: [0, 100]};
    } else if (options.color_space === 'hwb') {
        layout.scene.xaxis = {title: 'H', range: [0, 360]};
        layout.scene.yaxis = {title: 'W', range: [0, 100]};
        layout.scene.zaxis = {title: 'B', range: [0, 100]};
    } else if (options.color_space === 'xyz') {
        layout.scene.xaxis = {title: 'X', range: [0, 100]};
        layout.scene.yaxis = {title: 'Y', range: [0, 100]};
        layout.scene.zaxis = {title: 'Z', range: [0, 100]};
    } else if (options.color_space === 'lab') {
        layout.scene.xaxis = {title: 'L*', range: [0, 100]};
        layout.scene.yaxis = {title: 'a*', range: [-86.185, 98.254]};
        layout.scene.zaxis = {title: 'b*', range: [-107.863, 94.482]};
    } else if (options.color_space === 'hcg') {
        layout.scene.xaxis = {title: 'H', range: [-180, 180]};
        layout.scene.yaxis = {title: 'C', range: [0, 100]};
        layout.scene.zaxis = {title: 'G', range: [0, 100]};
    }

    Plotly.purge('graph');
    Plotly.newPlot('graph', data, layout, {
        displayModeBar: false
    });
  };

  window.addEventListener('resize', generate);

  var options = {
    load_image: function() {
      var image_upload = document.getElementById('image_upload');
      image_upload.click();
    },
    points: 5000,
    dot_size: 5,
    color_space: 'rgb'
  };

  var gui = new dat.GUI();
  gui.add(options, 'load_image').name('Load image');
  gui.add(options, 'points', 1000, 25000, 100).name('Points').onChange(generate);
  gui.add(options, 'color_space', Object.keys(color_spaces)).name('Color space').onChange(generate);
  gui.add(options, 'dot_size', 1, 20, 1).name('Dot size').onChange(generate);
});
