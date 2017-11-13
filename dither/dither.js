'use strict';

document.addEventListener('DOMContentLoaded', function() {
  var per_pixel_dithering = function(callback) {
    return function() {
      var image_data = original_image_ctx.getImageData(0, 0, original_image.width, original_image.height);
      var output = ctx.createImageData(canvas.width, canvas.height);

      for (var y = 0, i = 0; y < canvas.height; y++) {
        for (var x = 0; x < canvas.width; x++, i += 4) {
          var color = (image_data.data[i    ] +
                       image_data.data[i + 1] +
                       image_data.data[i + 2]) / 3;
          var new_color = callback(color, x, y) ? 255 : 0;
          output.data[i    ] = new_color;
          output.data[i + 1] = new_color;
          output.data[i + 2] = new_color;
          output.data[i + 3] = 255;
        }
      }
      ctx.putImageData(output, 0, 0);
    };
  };

  var ordered_dithering = function(matrix, multiplier) {
    multiplier = multiplier === undefined ? 1 : multiplier;
    var matrix_width = matrix[0].length;
    var matrix_height = matrix.length;
    return per_pixel_dithering(function(color, x, y) {
      return color > (matrix[y % matrix_height][x % matrix_width] + 1) * (multiplier - 256 / (matrix_width * matrix_height + 1) / (matrix_width * matrix_height));
    });
  };

  var error_diffusion_dithering = function(error_matrix, multiplier) {
    multiplier = multiplier === undefined ? 1 : multiplier;

    var matrix_width = error_matrix[0].length;
    var matrix_height = error_matrix.length;

    return function() {
      var error = [];
      for (var i = 0; i < matrix_height; i++) {
        error.push(new Float64Array(canvas.width));
      }

      var image_data = original_image_ctx.getImageData(0, 0, original_image.width, original_image.height);
      var output = ctx.createImageData(canvas.width, canvas.height);

      for (var y = 0, i = 0; y < canvas.height; y++) {
        for (var x = 0; x < canvas.width; x++, i += 4) {
          var color = (image_data.data[i    ] +
                       image_data.data[i + 1] +
                       image_data.data[i + 2]) / 3 + error[0][x];

          var new_color = color > options.threshold ? 255 : 0;
          var pixel_error = color - new_color;

          for (var error_y = 0; error_y < matrix_height; error_y++) {
            for (var error_x = 0; error_x < matrix_width; error_x++) {
              error[error_y][x + error_x - Math.floor(matrix_width / 2)] += pixel_error * error_matrix[error_y][error_x] * multiplier;
            }
          }

          output.data[i    ] = new_color;
          output.data[i + 1] = new_color;
          output.data[i + 2] = new_color;
          output.data[i + 3] = 255;
        }

        error.shift();
        error.push(new Float64Array(canvas.width));
      }
      ctx.putImageData(output, 0, 0);
    };
  };

  var algorithms = {
    'Threshold': per_pixel_dithering(function(c) {return c > options.threshold}),
    'Random': per_pixel_dithering(function(c) {return c / 256 > Math.random()}),
    'Ordered 2x2': ordered_dithering([[0, 2],
                                      [3, 1]], 64),
    'Ordered 3x3': ordered_dithering([[0, 7, 3],
                                      [6, 5, 2],
                                      [4, 1, 8]], 256/9),
    'Ordered 4x4': ordered_dithering([[0,  8,  2,  10],
                                      [12, 4,  14, 6],
                                      [3,  11, 1,  9],
                                      [15, 7,  13, 5]], 16),
    'Ordered 8x8': ordered_dithering([[0,  48, 12, 60, 3,  51, 15, 63],
                                      [32, 16, 44, 28, 35, 19, 47, 31],
                                      [8,  56, 4,  52, 11, 59, 7,  55],
                                      [40, 24, 36, 20, 43, 27, 39, 23],
                                      [2,  50, 14, 62, 1,  49, 13, 61],
                                      [34, 18, 46, 30, 33, 17, 45, 29],
                                      [10, 58, 6,  54, 9,  57, 5,  53],
                                      [42, 26, 38, 22, 41, 25, 37, 21]], 4),
    'Halftone': ordered_dithering([[24, 10, 12, 26, 35, 47, 49, 37],
                                   [8,  0,  2,  14, 45, 59, 61, 51],
                                   [22, 6,  4,  16, 43, 57, 63, 53],
                                   [30, 20, 18, 28, 33, 41, 55, 39],
                                   [34, 46, 48, 36, 25, 11, 13, 27],
                                   [44, 58, 60, 50, 9,  1,  3,  15],
                                   [42, 56, 62, 52, 23, 7,  5,  17],
                                   [32, 40, 54, 38, 31, 21, 19, 29]], 4),
    'Cross': ordered_dithering([[4, 3, 0, 1, 2],
                                [0, 1, 2, 4, 3],
                                [2, 4, 3, 0, 1],
                                [3, 0, 1, 2, 4],
                                [1, 2, 4, 3, 0]], 256/5),
    'Void and cluster': ordered_dithering([[131, 187, 8,   78,  50,  18,  134, 89,  155, 102, 29,  95,  184, 73],
                                           [22,  86,  113, 171, 142, 105, 34,  166, 9,   60,  151, 128, 40,  110],
                                           [168, 137, 45,  28,  64,  188, 82,  54,  125, 189, 80,  13,  156, 56],
                                           [7,   61,  186, 121, 154, 6,   108, 177, 24,  100, 38,  176, 93,  123],
                                           [83,  148, 96,  17,  88,  133, 44,  145, 69,  161, 139, 72,  30,  181],
                                           [115, 27,  163, 47,  178, 65,  164, 14,  120, 48,  5,   127, 153, 52],
                                           [190, 58,  126, 81,  116, 21,  106, 77,  173, 92,  191, 63,  99,  12],
                                           [76,  144, 4,   185, 37,  149, 192, 39,  135, 23,  117, 31,  170, 132],
                                           [35,  172, 103, 66,  129, 79,  3,   97,  57,  159, 70,  141, 53,  94],
                                           [114, 20,  49,  158, 19,  146, 169, 122, 183, 11,  104, 180, 2,   165],
                                           [152, 87,  182, 118, 91,  42,  67,  25,  84,  147, 43,  85,  125, 68],
                                           [16,  136, 71,  10,  193, 112, 160, 138, 51,  111, 162, 26,  194, 46],
                                           [174, 107, 41,  143, 33,  74,  1,   101, 195, 15,  75,  140, 109, 90],
                                           [32,  62,  157, 98,  167, 119, 179, 59,  36,  130, 175, 55,  0,   150]], 256/196),
    'Basic error diffusion': error_diffusion_dithering([[0, 0, 1]]),
    'Floyd–Steinberg': error_diffusion_dithering([[0, 0, 7],
                                                  [3, 5, 1]], 1 / 16),
    'False Floyd–Steinberg': error_diffusion_dithering([[0, 0, 3],
                                                        [0, 3, 2]], 1 / 8),
    'Zhigang Fan': error_diffusion_dithering([[0, 0, 0, 7],
                                              [1, 3, 5, 0]], 1 / 16),
    'Shiau-Fan': error_diffusion_dithering([[0, 0, 0, 4],
                                            [1, 1, 2, 0]], 1 / 8),
    'Shiau-Fan 2': error_diffusion_dithering([[0, 0, 0, 0, 8, 0],
                                              [1, 1, 2, 4, 0, 0]], 1 / 16),
    'Jarvis, Judice & Ninke': error_diffusion_dithering([[0, 0, 0, 7, 5],
                                                         [3, 5, 7, 5, 3],
                                                         [1, 3, 5, 3, 1]], 1 / 48),
    'Stucki': error_diffusion_dithering([[0, 0, 0, 8, 4],
                                         [2, 4, 8, 4, 2],
                                         [1, 2, 4, 2, 1]], 1 / 42),
    'Burkes': error_diffusion_dithering([[0, 0, 0, 8, 4],
                                         [2, 4, 8, 4, 2]], 1 / 32),
    'Atkinson': error_diffusion_dithering([[0, 0, 1, 1],
                                           [1, 1, 1, 0],
                                           [0, 1, 0, 0]], 1 / 8),
    'Sierra': error_diffusion_dithering([[0, 0, 0, 5, 3],
                                         [2, 4, 5, 4, 2],
                                         [0, 2, 3, 2, 0]], 1 / 32),
    'Sierra2': error_diffusion_dithering([[0, 0, 0, 4, 3],
                                          [1, 2, 3, 2, 1]], 1 / 16),
    'Sierra Lite': error_diffusion_dithering([[0, 0, 2],
                                              [1, 1, 0]], 1 / 4)
  };

  var options = {
    load_image: function() {
      image_upload.click();
    },
    algorithm: 'Floyd–Steinberg',
    threshold: 127,
    dither: function() {
      hide_gui_element(gui, 'show_original', false);

      algorithms[options.algorithm]();
    },
    show_original: function() {
      ctx.drawImage(original_image, 0, 0);
    }
  };

  var gui = new dat.GUI();
  gui.add(options, 'load_image').name('Load image');
  gui.add(options, 'algorithm', Object.keys(algorithms)).name('Algorithm');
  gui.add(options, 'threshold', 0, 255);
  //var palette_folder = gui.addFolder('Palette');
  // TODO: add palette, and auto k-means palette selection, and some presets, such as 16, 256, etc
  //palette_folder.add(options, )

  gui.add(options, 'show_original').name('Show original');
  gui.add(options, 'dither').name('Dither');

  var hide_gui_element = function(gui, property, hide) {
    for (var i = 0; i < gui.__controllers.length; i++) {
      var controller = gui.__controllers[i];
      if (controller.property === property) {
        controller.domElement.parentElement.parentElement.hidden = hide;
        return;
      }
    }
  };

  hide_gui_element(gui, 'show_original', true);

  var image_upload = document.getElementById('image_upload');

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var texture_canvas = document.createElement('canvas');

  ctx.canvas.width  = window.innerWidth;
  ctx.canvas.height = window.innerHeight;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var original_image = document.createElement('canvas');
  var original_image_ctx = original_image.getContext('2d');

  image_upload.addEventListener('change', function(e) {
    var reader = new FileReader();
    reader.onload = function(event) {
      var img = new Image();
      img.src = event.target.result;
      img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        original_image.width = img.width;
        original_image.height = img.height;
        original_image_ctx.drawImage(img, 0, 0);
      }
    }
    reader.readAsDataURL(e.target.files[0]);
  }, false);
});
