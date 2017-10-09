function minHeap(compare) {
  var heap = {},
      array = [],
      size = 0;

  heap.empty = function() {
    return !size;
  };

  heap.push = function(value) {
    up(array[size] = value, size++);
    return size;
  };

  heap.pop = function() {
    if (size <= 0) return;
    var removed = array[0], value;
    if (--size > 0) value = array[size], down(array[0] = value, 0);
    return removed;
  };

  function up(value, i) {
    while (i > 0) {
      var j = ((i + 1) >> 1) - 1,
          parent = array[j];
      if (compare(value, parent) >= 0) break;
      array[i] = parent;
      array[i = j] = value;
    }
  }

  function down(value, i) {
    while (true) {
      var r = (i + 1) << 1,
          l = r - 1,
          j = i,
          child = array[j];
      if (l < size && compare(array[l], child) < 0) child = array[j = l];
      if (r < size && compare(array[r], child) < 0) child = array[j = r];
      if (j === i) break;
      array[i] = child;
      array[i = j] = value;
    }
  }

  return heap;
}