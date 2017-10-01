function CircleFactory(options) {
  this.options = options;
}

CircleFactory.prototype.generate = function(circular_area) {
  var min_radius = this.options.min_radius;
  var max_radius = this.options.max_radius;
  var radius = min_radius + Math.random() * (max_radius - min_radius);

  if (circular_area) {
    var angle = Math.random() * 2 * Math.PI;
    var distance_from_center = Math.random() * (Math.min(this.options.width, this.options.height) * 0.48 - radius);
    var x = this.options.width  * 0.5 + Math.cos(angle) * distance_from_center;
    var y = this.options.height * 0.5 + Math.sin(angle) * distance_from_center;
  } else {
    var x = radius + Math.random() * (this.options.width  - radius * 2);
    var y = radius + Math.random() * (this.options.height - radius * 2);
  }

  return [{x: x, y: y, radius: radius}];
};

CircleFactory.prototype.overlaps_image = function(img_data, circle) {
  var x = circle.x;
  var y = circle.y;
  var r = circle.radius;

  var points_x = [x, x, x, x-r, x+r, x-r*0.93, x-r*0.93, x+r*0.93, x+r*0.93];
  var points_y = [y, y-r, y+r, y, y, y+r*0.93, y-r*0.93, y+r*0.93, y-r*0.93];

  for (var i = 0; i < points_x.length; i++) {
    var x = points_x[i];
    var y = points_y[i];

    var index = (Math.floor(y) * img_data.width + Math.floor(x)) * 4;

    var r = img_data.data[index];
    var g = img_data.data[index + 1];
    var b = img_data.data[index + 2];
    var a = img_data.data[index + 3];

    if ((r + g + b) * (a / 255) < 127) {
      return true;
    }
  }
  return false;
};

CircleFactory.prototype.intersects = function(circle1, circle2) {
  return Math.pow(circle2.x - circle1.x, 2) +
         Math.pow(circle2.y - circle1.y, 2) <
         Math.pow(circle1.radius + circle2.radius, 2);
};

CircleFactory.prototype.draw = function(ctx, circle) {
  ctx.beginPath();
  ctx.arc(circle.x, circle.y, circle.radius * this.options.draw_ratio, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();
};

CircleFactory.prototype.svg = function(circle, style) {
  return '<circle cx="' + circle.x + '" cy="' + circle.y + '" ' +
         'r="' + circle.radius * this.options.draw_ratio + '" fill="' + style + '" />';
};

function RegularPolygonFactory(options) {
  this.options = options;
}

RegularPolygonFactory.prototype.generate = function(circular_area) {
  var min_radius = this.options.min_radius;
  var max_radius = this.options.max_radius;
  var radius = min_radius + Math.random() * (max_radius - min_radius);

  if (circular_area) {
    var angle = Math.random() * 2 * Math.PI;
    var distance_from_center = Math.random() * (Math.min(this.options.width, this.options.height) * 0.48 - radius);
    var x = this.options.width  * 0.5 + Math.cos(angle) * distance_from_center;
    var y = this.options.height * 0.5 + Math.sin(angle) * distance_from_center;
  } else {
    var x = radius + Math.random() * (this.options.width  - radius * 2);
    var y = radius + Math.random() * (this.options.height - radius * 2);
  }

  var polygon = new Polygon(x, y);
  for (var i = 0; i < this.options.sides; i++) {
    polygon.addPoint({
      x: Math.cos(Math.PI * 2 * (i / this.options.sides)) * radius,
      y: Math.sin(Math.PI * 2 * (i / this.options.sides)) * radius,
    });
  }
  polygon.rotate(Math.random() * 2 * Math.PI);

  return [polygon];
};

RegularPolygonFactory.prototype.overlaps_image = function(img_data, polygon) {
  var points = polygon.points.concat({x: polygon.x, y: polygon.y});

  for (var i = 0; i < points.length; i++) {
    var x = points[i].x;
    var y = points[i].y;

    var index = (Math.floor(y) * img_data.width + Math.floor(x)) * 4;

    var r = img_data.data[index];
    var g = img_data.data[index + 1];
    var b = img_data.data[index + 2];
    var a = img_data.data[index + 3];

    if ((r + g + b) * (a / 255) < 127) {
      return true;
    }
  }
  return false;
};

RegularPolygonFactory.prototype.intersects = function(polygon1, polygon2) {
  return polygon1.intersectsWith(polygon2);
};

RegularPolygonFactory.prototype.draw = function(ctx, polygon) {
  ctx.beginPath();
  ctx.moveTo(
    polygon.x + polygon.points[0].x * this.options.draw_ratio,
    polygon.y + polygon.points[0].y * this.options.draw_ratio
  );
  for (var i = 1; i < polygon.points.length; i++) {
    ctx.lineTo(
      polygon.x + polygon.points[i].x * this.options.draw_ratio,
      polygon.y + polygon.points[i].y * this.options.draw_ratio
    );
  }
  ctx.closePath();
  ctx.fill();
};

RegularPolygonFactory.prototype.svg = function(polygon, style) {
  var points = [];
  for (var i = 0; i < polygon.points.length; i++) {
    points.push(
      (polygon.x + polygon.points[i].x * this.options.draw_ratio) + ',' +
      (polygon.y + polygon.points[i].y * this.options.draw_ratio));
  }
  return '<polygon points="' + points.join(' ') + '" fill="' + style + '" />';
};

function CrossFactory() {
  RegularPolygonFactory.apply(this, arguments);
}

CrossFactory.prototype = Object.create(RegularPolygonFactory.prototype);
CrossFactory.prototype.constructor = RegularPolygonFactory;

CrossFactory.prototype.generate = function(circular_area) {
  var min_radius = this.options.min_radius;
  var max_radius = this.options.max_radius;
  var radius = min_radius + Math.random() * (max_radius - min_radius);

  if (circular_area) {
    var angle = Math.random() * 2 * Math.PI;
    var distance_from_center = Math.random() * (Math.min(this.options.width, this.options.height) * 0.48 - radius);
    var x = this.options.width  * 0.5 + Math.cos(angle) * distance_from_center;
    var y = this.options.height * 0.5 + Math.sin(angle) * distance_from_center;
  } else {
    var x = radius + Math.random() * (this.options.width  - radius * 2);
    var y = radius + Math.random() * (this.options.height - radius * 2);
  }

  var polygon1 = new Polygon(x, y);
  var polygon2 = new Polygon(x, y);

  polygon1.addPoint({x: -radius, y: -(1 - this.options.pointiness) * radius})
  polygon1.addPoint({x:  radius, y: -(1 - this.options.pointiness) * radius})
  polygon1.addPoint({x:  radius, y:  (1 - this.options.pointiness) * radius})
  polygon1.addPoint({x: -radius, y:  (1 - this.options.pointiness) * radius})

  polygon2.addPoint({x: -radius, y: -(1 - this.options.pointiness) * radius})
  polygon2.addPoint({x:  radius, y: -(1 - this.options.pointiness) * radius})
  polygon2.addPoint({x:  radius, y:  (1 - this.options.pointiness) * radius})
  polygon2.addPoint({x: -radius, y:  (1 - this.options.pointiness) * radius})

  var rot = Math.random() * 2 * Math.PI;
  polygon1.rotate(rot);
  polygon2.rotate(rot + Math.PI / 2);

  return [polygon1, polygon2];
};

function StarFactory() {
  RegularPolygonFactory.apply(this, arguments);
}

StarFactory.prototype = Object.create(RegularPolygonFactory.prototype);
StarFactory.prototype.constructor = RegularPolygonFactory;

StarFactory.prototype.generate = function(circular_area) {
  var min_radius = this.options.min_radius;
  var max_radius = this.options.max_radius;
  var radius = min_radius + Math.random() * (max_radius - min_radius);

  if (circular_area) {
    var angle = Math.random() * 2 * Math.PI;
    var distance_from_center = Math.random() * (Math.min(this.options.width, this.options.height) * 0.48 - radius);
    var x = this.options.width  * 0.5 + Math.cos(angle) * distance_from_center;
    var y = this.options.height * 0.5 + Math.sin(angle) * distance_from_center;
  } else {
    var x = radius + Math.random() * (this.options.width  - radius * 2);
    var y = radius + Math.random() * (this.options.height - radius * 2);
  }

  var rot = Math.random() * 2 * Math.PI;
  var polygons = [];

  for (var i = 0; i < this.options.sides; i++) {
    var polygon = new Polygon(x, y);
    polygon.addPoint({x: -(1 - this.options.pointiness) * radius, y: 0});
    polygon.addPoint({x:  (1 - this.options.pointiness) * radius, y: 0});
    polygon.addPoint({x:  0,                                      y: radius});

    polygon.rotate((i / this.options.sides) * Math.PI * 2 + rot);
    polygons.push(polygon);
  }

  return polygons;
};
