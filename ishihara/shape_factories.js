class Polygon {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.points = [];
  }

  addPoint(p) {
    this.points.push(p);
  }

  rotate(rads) {
    const cos = Math.cos(rads);
    const sin = Math.sin(rads);
    for (const p of this.points) {
      const { x, y } = p;
      p.x = cos * x - sin * y;
      p.y = sin * x + cos * y;
    }
  }
}

function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1x = bx - ax, d1y = by - ay;
  const d2x = dx - cx, d2y = dy - cy;
  const denom = d1x * d2y - d1y * d2x;
  if (denom === 0) return false;
  const t = ((cx - ax) * d2y - (cy - ay) * d2x) / denom;
  const u = ((cx - ax) * d1y - (cy - ay) * d1x) / denom;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

function pointInPolygon(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    if ((pts[i].y > py !== pts[j].y > py) &&
        px < (pts[j].x - pts[i].x) * (py - pts[i].y) / (pts[j].y - pts[i].y) + pts[i].x) {
      inside = !inside;
    }
  }
  return inside;
}

function polygonsIntersect(p1, p2) {
  const pts1 = p1.points.map(p => ({ x: p.x + p1.x, y: p.y + p1.y }));
  const pts2 = p2.points.map(p => ({ x: p.x + p2.x, y: p.y + p2.y }));
  const n1 = pts1.length, n2 = pts2.length;

  for (let i = 0; i < n1; i++) {
    const a = pts1[i], b = pts1[(i + 1) % n1];
    for (let j = 0; j < n2; j++) {
      const c = pts2[j], d = pts2[(j + 1) % n2];
      if (segmentsIntersect(a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y)) return true;
    }
  }

  if (pointInPolygon(pts1[0].x, pts1[0].y, pts2)) return true;
  if (pointInPolygon(pts2[0].x, pts2[0].y, pts1)) return true;

  return false;
}

export class CircleFactory {
  constructor(options) {
    this.options = options;
  }

  generate(circular_area) {
    const { min_radius, max_radius, width, height } = this.options;
    const radius = min_radius + Math.random() * (max_radius - min_radius);
    let x, y;

    if (circular_area) {
      const angle = Math.random() * 2 * Math.PI;
      const distance_from_center = Math.sqrt(Math.random()) * (Math.min(width, height) * 0.48 - radius);
      x = width  * 0.5 + Math.cos(angle) * distance_from_center;
      y = height * 0.5 + Math.sin(angle) * distance_from_center;
    } else {
      x = radius + Math.random() * (width  - radius * 2);
      y = radius + Math.random() * (height - radius * 2);
    }

    return [{ x, y, radius }];
  }

  overlaps_image(img_data, circle) {
    let total_points = 0;
    let points_overlapping = 0;

    for (let i = 0; i <= Math.PI * 2; i += 0.05) {
      for (let radius = 0; radius <= circle.radius; radius++) {
        total_points++;

        const x = circle.x + Math.cos(i * Math.PI * 2) * radius;
        const y = circle.y + Math.sin(i * Math.PI * 2) * radius;

        const index = (Math.floor(y) * img_data.width + Math.floor(x)) * 4;
        const r = img_data.data[index];
        const g = img_data.data[index + 1];
        const b = img_data.data[index + 2];
        const a = img_data.data[index + 3];

        if ((r + g + b) * (a / 255) < 127) {
          points_overlapping++;
        }
      }
    }

    return [total_points, points_overlapping];
  }

  intersects(circle1, circle2) {
    return (circle2.x - circle1.x) ** 2 + (circle2.y - circle1.y) ** 2 <
           (circle1.radius + circle2.radius) ** 2;
  }

  draw(ctx, circle) {
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  }

  svg(circle, style) {
    return `<circle cx="${circle.x}" cy="${circle.y}" r="${circle.radius}" fill="${style}" />`;
  }
}

export class RegularPolygonFactory {
  constructor(options) {
    this.options = options;
  }

  generate(circular_area) {
    const { min_radius, max_radius, width, height, sides } = this.options;
    const radius = min_radius + Math.random() * (max_radius - min_radius);
    let x, y;

    if (circular_area) {
      const angle = Math.random() * 2 * Math.PI;
      const distance_from_center = Math.sqrt(Math.random()) * (Math.min(width, height) * 0.48 - radius);
      x = width  * 0.5 + Math.cos(angle) * distance_from_center;
      y = height * 0.5 + Math.sin(angle) * distance_from_center;
    } else {
      x = radius + Math.random() * (width  - radius * 2);
      y = radius + Math.random() * (height - radius * 2);
    }

    const polygon = new Polygon(x, y);
    for (let i = 0; i < sides; i++) {
      polygon.addPoint({
        x: Math.cos(Math.PI * 2 * (i / sides)) * radius,
        y: Math.sin(Math.PI * 2 * (i / sides)) * radius,
      });
    }
    polygon.rotate(Math.random() * 2 * Math.PI);
    polygon.radius = radius;

    return [polygon];
  }

  overlaps_image(img_data, polygon) {
    const points = [{ x: polygon.x, y: polygon.y }];
    for (const p of polygon.points) {
      points.push({ x: polygon.x + p.x, y: polygon.y + p.y });
    }
    let points_overlapping = 0;

    for (const { x, y } of points) {
      const index = (Math.floor(y) * img_data.width + Math.floor(x)) * 4;
      const r = img_data.data[index];
      const g = img_data.data[index + 1];
      const b = img_data.data[index + 2];
      const a = img_data.data[index + 3];

      if ((r + g + b) * (a / 255) < 127) {
        points_overlapping++;
      }
    }

    return [points.length, points_overlapping];
  }

  intersects(polygon1, polygon2) {
    return polygonsIntersect(polygon1, polygon2);
  }

  draw(ctx, polygon) {
    ctx.beginPath();
    ctx.moveTo(polygon.x + polygon.points[0].x, polygon.y + polygon.points[0].y);
    for (let i = 1; i < polygon.points.length; i++) {
      ctx.lineTo(polygon.x + polygon.points[i].x, polygon.y + polygon.points[i].y);
    }
    ctx.closePath();
    ctx.fill();
  }

  svg(polygon, style) {
    const points = polygon.points.map(p =>
      `${polygon.x + p.x},${polygon.y + p.y}`
    );
    return `<polygon points="${points.join(" ")}" fill="${style}" />`;
  }
}

export class CrossFactory extends RegularPolygonFactory {
  generate(circular_area) {
    const { min_radius, max_radius, width, height, pointiness } = this.options;
    const radius = min_radius + Math.random() * (max_radius - min_radius);
    let x, y;

    if (circular_area) {
      const angle = Math.random() * 2 * Math.PI;
      const distance_from_center = Math.sqrt(Math.random()) * (Math.min(width, height) * 0.48 - radius);
      x = width  * 0.5 + Math.cos(angle) * distance_from_center;
      y = height * 0.5 + Math.sin(angle) * distance_from_center;
    } else {
      x = radius + Math.random() * (width  - radius * 2);
      y = radius + Math.random() * (height - radius * 2);
    }

    const arm = (1 - pointiness) * radius;
    const polygon1 = new Polygon(x, y);
    polygon1.addPoint({ x: -radius, y: -arm });
    polygon1.addPoint({ x:  radius, y: -arm });
    polygon1.addPoint({ x:  radius, y:  arm });
    polygon1.addPoint({ x: -radius, y:  arm });

    const polygon2 = new Polygon(x, y);
    polygon2.addPoint({ x: -radius, y: -arm });
    polygon2.addPoint({ x:  radius, y: -arm });
    polygon2.addPoint({ x:  radius, y:  arm });
    polygon2.addPoint({ x: -radius, y:  arm });

    const rot = Math.random() * 2 * Math.PI;
    polygon1.rotate(rot);
    polygon2.rotate(rot + Math.PI / 2);
    polygon1.radius = radius;
    polygon2.radius = radius;

    return [polygon1, polygon2];
  }
}

function cubicBezier1D(t, p0, p1, p2, p3) {
  const mt = 1 - t;
  return mt*mt*mt*p0 + 3*mt*mt*t*p1 + 3*mt*t*t*p2 + t*t*t*p3;
}

export class HeartFactory extends RegularPolygonFactory {
  static _segments(r) {
    return [
      [0, r,       -r*0.75, r*0.5,  -r,      0,       -r,  -r*0.25],
      [-r, -r*0.25, -r,    -r*0.75, -r*0.5, -r,        0,  -r*0.5 ],
      [0,  -r*0.5,   r*0.5, -r,      r,     -r*0.75,   r,  -r*0.25],
      [r,  -r*0.25,  r,     0,       r*0.75, r*0.5,    0,   r     ],
    ];
  }

  generate(circular_area) {
    const { min_radius, max_radius, width, height } = this.options;
    const radius = min_radius + Math.random() * (max_radius - min_radius);
    let x, y;

    if (circular_area) {
      const angle = Math.random() * 2 * Math.PI;
      const distance_from_center = Math.sqrt(Math.random()) * (Math.min(width, height) * 0.48 - radius);
      x = width  * 0.5 + Math.cos(angle) * distance_from_center;
      y = height * 0.5 + Math.sin(angle) * distance_from_center;
    } else {
      x = radius + Math.random() * (width  - radius * 2);
      y = radius + Math.random() * (height - radius * 2);
    }

    const rot = Math.random() * 2 * Math.PI;
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const segs = HeartFactory._segments(radius);
    const perSeg = 8;
    const polygon = new Polygon(x, y);

    for (const [x0,y0, x1,y1, x2,y2, x3,y3] of segs) {
      for (let i = 0; i < perSeg; i++) {
        const t = i / perSeg;
        const hx = cubicBezier1D(t, x0, x1, x2, x3);
        const hy = cubicBezier1D(t, y0, y1, y2, y3);
        polygon.addPoint({ x: cos*hx - sin*hy, y: sin*hx + cos*hy });
      }
    }
    polygon.rotation = rot;
    polygon.radius = radius;

    return [polygon];
  }

  draw(ctx, polygon) {
    const r = polygon.radius;
    ctx.save();
    ctx.translate(polygon.x, polygon.y);
    ctx.rotate(polygon.rotation);
    ctx.beginPath();
    ctx.moveTo(0, r);
    ctx.bezierCurveTo(-r*0.75,  r*0.5,  -r,      0,      -r, -r*0.25);
    ctx.bezierCurveTo(-r,      -r*0.75, -r*0.5,  -r,       0, -r*0.5 );
    ctx.bezierCurveTo( r*0.5,  -r,       r,      -r*0.75,  r, -r*0.25);
    ctx.bezierCurveTo( r,       0,       r*0.75,  r*0.5,   0,  r     );
    ctx.fill();
    ctx.restore();
  }

  svg(polygon, style) {
    const r = polygon.radius;
    const deg = polygon.rotation * 180 / Math.PI;
    const d = [
      `M0,${r}`,
      `C${-r*0.75},${r*0.5} ${-r},0 ${-r},${-r*0.25}`,
      `C${-r},${-r*0.75} ${-r*0.5},${-r} 0,${-r*0.5}`,
      `C${r*0.5},${-r} ${r},${-r*0.75} ${r},${-r*0.25}`,
      `C${r},0 ${r*0.75},${r*0.5} 0,${r}Z`,
    ].join(" ");
    return `<path d="${d}" transform="translate(${polygon.x},${polygon.y}) rotate(${deg})" fill="${style}" />`;
  }
}

export class StarFactory extends RegularPolygonFactory {
  generate(circular_area) {
    const { min_radius, max_radius, width, height, sides, pointiness } = this.options;
    const radius = min_radius + Math.random() * (max_radius - min_radius);
    let x, y;

    if (circular_area) {
      const angle = Math.random() * 2 * Math.PI;
      const distance_from_center = Math.sqrt(Math.random()) * (Math.min(width, height) * 0.48 - radius);
      x = width  * 0.5 + Math.cos(angle) * distance_from_center;
      y = height * 0.5 + Math.sin(angle) * distance_from_center;
    } else {
      x = radius + Math.random() * (width  - radius * 2);
      y = radius + Math.random() * (height - radius * 2);
    }

    const rot = Math.random() * 2 * Math.PI;
    const arm = (1 - pointiness) * radius;

    return Array.from({ length: sides }, (_, i) => {
      const polygon = new Polygon(x, y);
      polygon.addPoint({ x: -arm, y: 0 });
      polygon.addPoint({ x:  arm, y: 0 });
      polygon.addPoint({ x: 0,    y: radius });
      polygon.rotate((i / sides) * Math.PI * 2 + rot);
      polygon.radius = radius;
      return polygon;
    });
  }
}
