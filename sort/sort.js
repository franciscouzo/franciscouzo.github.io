'use strict';

function color(x, width) {
  return "hsla(" + (x / width * 360) + ", 100%, 50%, 1.0)";
  //return "RGB(" + (x / width * 255) + ", 0, 0)";
}

function shuffle(array, start, end) {
  var m = end - start;
  while (m) {
    var i = Math.floor(random() * m--);
    var tmp = array[start + m];
    array[start + m] = array[start + i];
    array[start + i] = tmp;
  }
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
    var ret = beta_distribution(options.distribution.alpha, options.distribution.beta);
  } while (ret >= 1);
  return ret;
}

function SortingVisualization(data, ctx) {
  this.original_data = [];
  this.swaps = [];
  for (var i = 0; i < data.length; i++) {
    this.original_data.push(data[i].slice());
    this.swaps.push([]);
  }

  this.data = data;
  this.ctx = ctx;
}

SortingVisualization.prototype.cmp = function(x, y) {
  return x < y;
};

SortingVisualization.prototype.swap = function(y, x1, x2) {
  var temp = this.data[y][x1];
  this.data[y][x1] = this.data[y][x2];
  this.data[y][x2] = temp;

  this.swaps[y].push([x1, x2]);
};

SortingVisualization.prototype.sort_end = function() {
  for (var y = 0; y < this.swaps.length; y++) {
    this.swaps[y].reverse();
  }

  this.data = this.original_data;
};

SortingVisualization.prototype.step = function() {
  var swapped = false;

  for (var y = 0; y < this.swaps.length; y++) {
    if (this.swaps[y].length) {
      swapped = true;

      var step = this.swaps[y].pop();
      var x1 = step[0], x2 = step[1];

      var temp = this.original_data[y][x1];
      this.original_data[y][x1] = this.original_data[y][x2];
      this.original_data[y][x2] = temp;

      this.ctx.fillStyle = color(this.original_data[y][x1], this.original_data[y].length);
      this.ctx.fillRect(x1, y, 1, 1);

      this.ctx.fillStyle = color(this.original_data[y][x2], this.original_data[y].length);
      this.ctx.fillRect(x2, y, 1, 1);
    }
  }

  return !swapped;
};

SortingVisualization.prototype.pivot = function(y, left, right) {
  if (options.pivot === 'Start') {
    return left;
  } else if (options.middle === 'Middle') {
    return left + Math.floor((right - left) / 2);
  } else if (options.pivot === 'End') {
    return right;
  } else if (options.pivot === 'Random') {
    return left + Math.floor(random() * (right - left));
  }
}


function BubbleSort() {
  SortingVisualization.apply(this, arguments);
}

BubbleSort.prototype = Object.create(SortingVisualization.prototype);
BubbleSort.prototype.constructor = SortingVisualization;

BubbleSort.prototype.sort = function(y, left, right) {
  for (; left <= right; left++) {
    for (var x = left; x <= right; x++) {
      if (this.cmp(this.data[y][x], this.data[y][left])) {
        this.swap(y, left, x);
      }
    }
  }
};


function InsertionSort() {
  SortingVisualization.apply(this, arguments);
}

InsertionSort.prototype = Object.create(SortingVisualization.prototype);
InsertionSort.prototype.constructor = SortingVisualization;

InsertionSort.prototype.sort = function(y, left, right) {
  for (; left <= right; left++) {
    var j = left;
    while (j > 0 && this.cmp(this.data[y][j], this.data[y][j - 1])) {
      this.swap(y, j, j - 1);
      j--;
    }
  }
};


function SelectionSort() {
  SortingVisualization.apply(this, arguments);
}

SelectionSort.prototype = Object.create(SortingVisualization.prototype);
SelectionSort.prototype.constructor = SortingVisualization;

SelectionSort.prototype.sort = function(y, left, right) {
  for (; left <= right; left++) {
    var min_i = left;
    for (var i = left + 1; i <= right; i++) {
      if (this.cmp(this.data[y][i], this.data[y][min_i])) {
        min_i = i;
      }
    }
    this.swap(y, left, min_i);
  }
};


function CocktailSort() {
  SortingVisualization.apply(this, arguments);
}

CocktailSort.prototype = Object.create(SortingVisualization.prototype);
CocktailSort.prototype.constructor = SortingVisualization;

CocktailSort.prototype.sort = function(y, left, right) {
  var swapped = true;
  while (swapped) {
    swapped = false;
    for (var i = left; i < right - 1; i++) {
      if (this.cmp(this.data[y][i + 1], this.data[y][i])) {
        this.swap(y, i, i + 1);
        swapped = true;
      }
    }
    if (!swapped) {
      break;
    }
    swapped = false;
    for (var i = right - 1; i >= 0; i--) {
      if (this.cmp(this.data[y][i + 1], this.data[y][i])) {
        this.swap(y, i, i + 1);
        swapped = true;
      }
    }
  }
};


function OddEvenSort() {
  SortingVisualization.apply(this, arguments);
}

OddEvenSort.prototype = Object.create(SortingVisualization.prototype);
OddEvenSort.prototype.constructor = SortingVisualization;

OddEvenSort.prototype.sort = function(y, left, right) {
  var sorted = false;
  while (!sorted) {
    sorted = true;
    for (var i = left + 1; i < right - 1; i += 2) {
      if (this.cmp(this.data[y][i + 1], this.data[y][i])) {
        this.swap(y, i, i + 1);
        sorted = false;
      }
    }

    for (var i = left; i < right - 1; i += 2) {
      if (this.cmp(this.data[y][i + 1], this.data[y][i])) {
        this.swap(y, i, i + 1);
        sorted = false;
      }
    }
  }
};


function ShellSort() {
  SortingVisualization.apply(this, arguments);
}

ShellSort.prototype = Object.create(SortingVisualization.prototype);
ShellSort.prototype.constructor = SortingVisualization;

ShellSort.prototype.sort = function(y, left, right) {
  var gaps = [701, 301, 132, 57, 23, 10, 4, 1];

  for (var k = 0; k < gaps.length; k++) {
    var gap = gaps[k];
    for (var i = gap; i <= right; i++) {
      var temp = this.data[y][i];
      for (var j = i; j >= gap && this.cmp(temp, this.data[y][j - gap]); j -= gap) {
        this.swap(y, j, j - gap);
      }
      //this.data[y][j] = temp;
    }
  }
};


function QuickSort() {
  SortingVisualization.apply(this, arguments);
}

QuickSort.prototype = Object.create(SortingVisualization.prototype);
QuickSort.prototype.constructor = SortingVisualization;

QuickSort.prototype.partition = function(y, pivot, left, right) {
  var store_index = left,
      pivot_value = this.data[y][pivot];

  this.swap(y, pivot, right);

  for (var v = left; v < right; v++) {
    if (this.cmp(this.data[y][v], pivot_value)) {
      this.swap(y, v, store_index++);
    }
  }

  this.swap(y, right, store_index);

  return store_index;
};

QuickSort.prototype.sort = function(y, left, right) {
  if (left > right) {
    return;
  }

  var pivot = this.pivot(y, left, right);
  var new_pivot = this.partition(y, pivot, left, right);

  this.sort(y, left, new_pivot - 1);
  this.sort(y, new_pivot + 1, right);
};


function MergeSort() {
  SortingVisualization.apply(this, arguments);
}

MergeSort.prototype = Object.create(SortingVisualization.prototype);
MergeSort.prototype.constructor = SortingVisualization;

MergeSort.prototype.merge = function(y, left, right) {
}

MergeSort.prototype.sort = function(y, left, right) {
  if (left > right) {
    return;
  }

};


function HeapSort() {
  SortingVisualization.apply(this, arguments);
}

HeapSort.prototype = Object.create(SortingVisualization.prototype);
HeapSort.prototype.constructor = SortingVisualization;

HeapSort.prototype.max_heapify = function(y, i, length) {
  while (true) {
    var left = i * 2 + 1;
    var right = i * 2 + 2;
    var largest = i;

    if (left < length && this.cmp(this.data[y][largest], this.data[y][left])) {
      largest = left;
    }

    if (right < length && this.cmp(this.data[y][largest], this.data[y][right])) {
      largest = right;
    }

    if (i === largest) {
      break;
    }

    this.swap(y, i, largest);
    i = largest;
  }
};

HeapSort.prototype.heapify = function(y, length) {
  for (var i = Math.floor(length / 2); i >= 0; i--) {
    this.max_heapify(y, i, length);
  }
};

HeapSort.prototype.sort = function(y, left, right) {
  this.heapify(y, right);

  for (var i = right; i > 0; i--) {
    this.swap(y, i, 0);
    this.max_heapify(y, 0, i - 1);
  }
};


var options;

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var processing = false;

  var data, sort_visualization;

  var algorithms = {
    "Bubble sort": BubbleSort,
    "Insertion sort": InsertionSort,
    "Selection sort": SelectionSort,
    "Cocktail sort": CocktailSort,
    "Odd-even sort": OddEvenSort,
    "Shell sort": ShellSort,
    "Quick sort": QuickSort,
    "Heap sort": HeapSort
  }

  options = {
    width: 300,
    height: 100,
    speed: 1,
    algorithm: 'Bubble sort',
    pivot: 'Start',
    generate: 'Increasing',
    shuffle: function() {
      for (var y = 0; y < data.length; y++) {
        shuffle(data[y], 0, data[y].length);
      }
      draw();
    },
    start: function() {
      hide_gui_element('shuffle', true);
      hide_gui_element('start', true);
      hide_gui_element('stop', false);

      processing = true;

      var algorithm = algorithms[options.algorithm];
      sort_visualization = new algorithm(data, ctx);

      for (var y = 0; y < options.height; y++) {
        sort_visualization.sort(y, 0, options.width - 1);
      }
      sort_visualization.sort_end();

      function step() {
        if (!processing) {
          return;
        }
        for (var i = 0; i < options.speed; i++) {
          if (sort_visualization.step()) {
            options.stop();
            return;
          }
        }
        requestAnimationFrame(step);
      }

      step();
    },
    stop: function() {
      hide_gui_element('shuffle', false);
      hide_gui_element('start', false);
      hide_gui_element('stop', true);

      data = sort_visualization.data;

      processing = false;
    },
    distribution: {
      alpha: 1,
      beta: 1
    }
  };

  function draw() {
    for (var y = 0; y < canvas.height; y++) {
      for (var x = 0; x < canvas.width; x++) {
        ctx.fillStyle = color(data[y][x], canvas.width);
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  function resize() {
    if (processing) {
      return;
    }

    canvas.style.width  = options.width  + 'px';
    canvas.style.height = options.height + 'px';

    canvas.width  = options.width;
    canvas.height = options.height;

    data = [];
    for (var y = 0; y < canvas.height; y++) {
      data.push([]);
      if (options.generate === 'Increasing') {
        for (var x = 0; x < canvas.width; x++) {
          data[y].push(x);
        }
      } else if (options.generate === 'Decreasing') {
        for (var x = canvas.width - 1; x >= 0; x--) {
          data[y].push(x);
        }
      }
    }

    draw();
  }

  resize();

  var gui = new dat.GUI();
  gui.add(options, 'width', 1, window.innerWidth, 1).name('Width').onChange(resize);
  gui.add(options, 'height', 1, window.innerHeight, 1).name('Height').onChange(resize);
  gui.add(options, 'speed', 1, 25, 1).name('Speed');
  gui.add(options, 'algorithm', Object.keys(algorithms)).name('Algorithm').onChange(function() {
    hide_gui_element('pivot', options.algorithm !== 'Quick sort');
  });
  gui.add(options, 'pivot', ['Start', 'Middle', 'End', 'Random']).name('Pivot');
  gui.add(options, 'generate', ['Increasing', 'Decreasing']).name('Generate').onChange(resize);
  gui.add(options, 'shuffle').name('Shuffle');
  gui.add(options, 'start').name('Start');
  gui.add(options, 'stop').name('Stop');

  var distribution_folder = gui.addFolder('Beta distribution');
  distribution_folder.add(options.distribution, 'alpha', 0.01).name('Alpha');
  distribution_folder.add(options.distribution, 'beta', 0.01).name('Beta');

  var hide_gui_element = function(property, hide) {
    for (var i = 0; i < gui.__controllers.length; i++) {
      var controller = gui.__controllers[i];
      if (controller.property === property) {
        controller.domElement.parentElement.parentElement.hidden = hide;
        return;
      }
    }
  };

  hide_gui_element('stop', true);
  hide_gui_element('pivot', true);
});
