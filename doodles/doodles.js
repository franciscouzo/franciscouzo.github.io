'use strict';

function sort_points(points, center) {
  points.sort(function(p1, p2) {
    return Math.atan2(p1.y - center.y, p1.x - center.x) -
           Math.atan2(p2.y - center.y, p2.x - center.x);
  });
}

function process_edges(halfedges, center) {
  var points = [];
  var seen = {};
  for (var i = 0; i < halfedges.length; i++) {
    var str_p1 = halfedges[i].edge.va.x + ',' + halfedges[i].edge.va.y;
    var str_p2 = halfedges[i].edge.vb.x + ',' + halfedges[i].edge.vb.y;
    if (!seen[str_p1]) {
      seen[str_p1] = true;
      points.push({x: halfedges[i].edge.va.x, y: halfedges[i].edge.va.y})
    }
    if (!seen[str_p2]) {
      seen[str_p2] = true;
      points.push({x: halfedges[i].edge.vb.x, y: halfedges[i].edge.vb.y})
    }
    
  }
  sort_points(points, center);
  return points;
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  ctx.canvas.width  = window.innerWidth;
  ctx.canvas.height = window.innerHeight;

  var voronoi = new Voronoi();
  var bbox = {xl: 0, xr: canvas.width, yt: 0, yb: canvas.height};

  var voronoi_points = [];
  for (var x = 0; x < canvas.width; x += 150) {
    for (var y = 0; y < canvas.height; y += 150) {
      voronoi_points.push({
        x: x + 150 * Math.random(),
        y: y + 150 * Math.random(),
        a: Math.random() * 2 * Math.PI})
    }
  }

  var advance = 12;
  var steps = 500;
  var lines_per_frame = 5;

  var diagram = voronoi.compute(voronoi_points, bbox);
  var cell_i = 0;
  var step_i = 0;
  var points = [];
  var direction = true;

  /*var draw = function() {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < voronoi_points.length; i++) {
      var p = voronoi_points[i];
      p.x += Math.sin(p.a) * 10;
      p.y += Math.cos(p.a) * 10;
      p.a += 0.05
    }

    voronoi.recycle(diagram);
    diagram = voronoi.compute(voronoi_points, bbox);

    for (var cell_i = 0; cell_i < diagram.cells.length; cell_i++) {
      var cell = diagram.cells[cell_i];
      var points = process_edges(cell.halfedges, cell.site);
      if (!points.length) continue;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (var i = 0; i <= points.length; i++) {
        var point = points[i % points.length];
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();

      var step_i = 0;
      for (var i = 0; i < steps; i++) {
        var point1, point2;
        if (direction) {
          point1 = points[step_i % points.length];
          point2 = points[(step_i + 1) % points.length];
          step_i++;
        } else {
          point1 = points[mod(step_i,     points.length)];
          point2 = points[mod(step_i - 1, points.length)];
          step_i--;
        }

        ctx.beginPath();
        ctx.moveTo(point1.x, point1.y);
        ctx.lineTo(point2.x, point2.y);
        ctx.stroke();

        var angle = Math.atan2(point2.y - point1.y, point2.x - point1.x);
        var distance = Math.hypot(point2.x - point1.x, point2.y - point1.y);

        if (distance >= advance) {
          points[mod(step_i, points.length)] = {
            x: point2.x - advance * Math.cos(angle),
            y: point2.y - advance * Math.sin(angle)
          };
        }
      }
    }
    requestAnimationFrame(draw);
  }

  draw();*/

  var step = function() {
    var cell = diagram.cells[cell_i];
    while (Math.abs(step_i) >= steps || !points.length) {
      cell = diagram.cells[cell_i++];
      points = [];
      if (!cell) return;

      points = process_edges(cell.halfedges, cell.site);
      if (!points.length) continue;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (var i = 0; i <= points.length; i++) {
        var point = points[i % points.length];
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();

      direction = Math.random() < 0.5;
      step_i = 0;
    }
    if (!points.length) return;

    for (var i = 0; i < lines_per_frame; i++) {
      var point1, point2;
      if (direction) {
        point1 = points[step_i % points.length];
        point2 = points[(step_i + 1) % points.length];
        step_i++;
      } else {
        point1 = points[mod(step_i,     points.length)];
        point2 = points[mod(step_i - 1, points.length)];
        step_i--;
      }

      ctx.beginPath();
      ctx.moveTo(point1.x, point1.y);
      ctx.lineTo(point2.x, point2.y);
      ctx.stroke();

      var angle = Math.atan2(point2.y - point1.y, point2.x - point1.x);
      var distance = Math.hypot(point2.x - point1.x, point2.y - point1.y);

      if (distance >= advance) {
        points[mod(step_i, points.length)] = {
          x: point2.x - advance * Math.cos(angle),
          y: point2.y - advance * Math.sin(angle)
        };
      } else {
        i--;
        if (Math.abs(step_i) >= steps) break;
      }
    }

    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
});
