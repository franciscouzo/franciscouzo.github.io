import { CircleFactory, RegularPolygonFactory, CrossFactory, StarFactory } from './shape_factories.js';

class SpatialHash {
  constructor(cellSize, width, height) {
    this.cellSize = cellSize;
    this.gridWidth  = Math.ceil(width  / cellSize);
    this.gridHeight = Math.ceil(height / cellSize);
    this.cells = new Array(this.gridWidth * this.gridHeight);
    this._nextId = 0;
  }

  insert(shape) {
    shape._spatialId = this._nextId++;
    const cs = this.cellSize;
    const minCx = Math.max(0, Math.floor((shape.x - shape.radius) / cs));
    const maxCx = Math.min(this.gridWidth  - 1, Math.floor((shape.x + shape.radius) / cs));
    const minCy = Math.max(0, Math.floor((shape.y - shape.radius) / cs));
    const maxCy = Math.min(this.gridHeight - 1, Math.floor((shape.y + shape.radius) / cs));
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const idx = cy * this.gridWidth + cx;
        if (!this.cells[idx]) this.cells[idx] = [];
        this.cells[idx].push(shape);
      }
    }
  }

  query(shape) {
    const cs = this.cellSize;
    const minCx = Math.max(0, Math.floor((shape.x - shape.radius) / cs) - 1);
    const maxCx = Math.min(this.gridWidth  - 1, Math.floor((shape.x + shape.radius) / cs) + 1);
    const minCy = Math.max(0, Math.floor((shape.y - shape.radius) / cs) - 1);
    const maxCy = Math.min(this.gridHeight - 1, Math.floor((shape.y + shape.radius) / cs) + 1);
    const seen = new Set();
    const result = [];
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.cells[cy * this.gridWidth + cx];
        if (cell) {
          for (const s of cell) {
            if (!seen.has(s._spatialId)) {
              seen.add(s._spatialId);
              result.push(s);
            }
          }
        }
      }
    }
    return result;
  }
}

self.onmessage = function(e) {
  const options = e.data;
  const { min_radius, max_radius, stop_after } = options;

  const FactoryClass = {
    'Circle': CircleFactory,
    'Regular polygon': RegularPolygonFactory,
    'Cross': CrossFactory,
    'Star': StarFactory
  }[options.shape_factory];

  let current_radius = max_radius;
  if (options.incremental_radius) {
    options.min_radius = current_radius;
    options.max_radius = current_radius;
  }

  const shape_factory = new FactoryClass(options);
  const hash = new SpatialHash(max_radius, options.width, options.height);

  let tries = 0;

  outer:
  while (true) {
    if (tries >= stop_after) {
      if (!options.incremental_radius || current_radius <= min_radius) break;
      current_radius = Math.max(min_radius, current_radius * 0.9);
      options.min_radius = current_radius;
      options.max_radius = current_radius;
      tries = 0;
    }

    tries++;
    const shapes = shape_factory.generate(options.circular);

    for (const shape of shapes) {
      for (const nearby of hash.query(shape)) {
        if (shape_factory.intersects(shape, nearby)) {
          continue outer;
        }
      }
    }

    let overlaps_image = false;
    for (const shape of shapes) {
      const [total_points, points_overlapping] = shape_factory.overlaps_image(options.img_data, shape);

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

    const style = overlaps_image !== options.invert_colors
      ? options[`color_on${Math.floor(Math.random() * options.n_colors_on)}`]
      : options[`color_off${Math.floor(Math.random() * options.n_colors_off)}`];

    for (const shape of shapes) {
      postMessage({ action: 'shape', shape, style });
      hash.insert(shape);
    }
  }

  postMessage({ action: 'stop' });
};
