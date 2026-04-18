'use strict';

import { CircleFactory, RegularPolygonFactory, CrossFactory, StarFactory, HeartFactory } from './shape_factories.js';

const PIXEL_RATIO = window.devicePixelRatio || 1;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const max_width  = window.innerWidth  * PIXEL_RATIO;
const max_height = window.innerHeight * PIXEL_RATIO;

ctx.canvas.style.width  = `${window.innerWidth}px`;
ctx.canvas.style.height = `${window.innerHeight}px`;
ctx.canvas.width  = max_width;
ctx.canvas.height = max_height;

ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);

const img_canvas = document.createElement('canvas');
const img_ctx = img_canvas.getContext('2d');

img_ctx.canvas.width  = max_width;
img_ctx.canvas.height = max_height;
img_ctx.fillStyle = 'white';
img_ctx.fillRect(0, 0, canvas.width, canvas.height);

let svg_elements = [];
let worker;

const ishihara_input = {
  load_image() {
    document.getElementById('image_upload').click();
  },
  text: '',
  circular: true,
  resize: true,
  color_scheme: 'General 1',
  min_radius: (canvas.width + canvas.height) / 800,
  max_radius: (canvas.width + canvas.height) / 100,
  stop_after: 10000,
  incremental_radius: true,
  shape_factory: 'Circle',
  sides: 4,
  pointiness: 0.75,
  generate() {
    hide_gui_element(gui, 'generate', true);
    hide_gui_element(gui, 'clear', true);
    hide_gui_element(gui, 'stop', false);

    generating = true;

    if (ishihara_input.text) renderText();
    const img_data = img_ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const FactoryClass = {
      'Circle': CircleFactory,
      'Regular polygon': RegularPolygonFactory,
      'Cross': CrossFactory,
      'Star': StarFactory,
      'Heart': HeartFactory
    }[ishihara_input.shape_factory];
    const shape_factory = new FactoryClass(JSON.parse(JSON.stringify(ishihara_input)));

    svg_elements = [];

    const options = Object.fromEntries(
      Object.entries(ishihara_input).filter(([, v]) => typeof v !== 'function')
    );
    options.img_data = img_data;
    options.width = canvas.width;
    options.height = canvas.height;

    worker = new Worker('./worker.js', { type: 'module' });
    worker.postMessage(options);

    worker.addEventListener('message', e => {
      if (e.data.action === 'shape') {
        ctx.fillStyle = e.data.style;
        shape_factory.draw(ctx, e.data.shape);
        svg_elements.push(shape_factory.svg(e.data.shape, e.data.style));
      } else if (e.data.action === 'stop') {
        ishihara_input.stop();
      }
    });
  },
  clear() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    img_ctx.fillStyle = 'white';
    img_ctx.fillRect(0, 0, canvas.width, canvas.height);
  },
  stop() {
    if (worker) {
      worker.terminate();
    }
    generating = false;

    hide_gui_element(gui, 'generate', false);
    hide_gui_element(gui, 'clear', false);
    hide_gui_element(gui, 'stop', true);
  },
  download_png() {
    download('ishihara.png', canvas.toDataURL('image/png'));
  },
  download_svg() {
    const data = [
      '<?xml version="1.0" encoding="UTF-8" ?>',
      `<svg width="${canvas.width}" height="${canvas.height}" ` +
      `viewBox="0 0 ${canvas.width} ${canvas.height}" ` +
      'xmlns="http://www.w3.org/2000/svg" version="1.1">',
      ...svg_elements,
      '</svg>'
    ].join('\n');
    download('ishihara.svg', `data:image/svg+xml,${encodeURIComponent(data)}`);
  }
};

function renderText() {
  img_ctx.fillStyle = 'white';
  img_ctx.fillRect(0, 0, img_canvas.width, img_canvas.height);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const text = ishihara_input.text;
  if (!text) return;

  const cw = img_canvas.width;
  const ch = img_canvas.height;
  const maxLineWidth = ishihara_input.circular
    ? Math.min(cw, ch) * 0.75
    : cw * 0.95;

  const wrapText = (fontSize) => {
    img_ctx.font = `bold ${fontSize}px sans-serif`;
    const lines = [];
    for (const paragraph of text.split('\n')) {
      let currentLine = '';
      for (const word of paragraph.split(' ')) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (currentLine && img_ctx.measureText(testLine).width > maxLineWidth) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine);
    }
    return lines;
  };

  let lo = 1, hi = 4000;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    const lines = wrapText(mid);
    const totalHeight = lines.length * mid * 1.2;
    const maxW = Math.max(...lines.map(l => img_ctx.measureText(l).width));
    const fits = ishihara_input.circular
      ? Math.hypot(maxW, totalHeight) <= Math.min(cw, ch) * 0.9
      : maxW <= cw * 0.95 && totalHeight <= ch * 0.9;
    if (fits) lo = mid; else hi = mid;
  }

  const lines = wrapText(lo);
  const lineHeight = lo * 1.2;
  const firstLineY = ch / 2 - (lines.length - 1) * lineHeight / 2;

  img_ctx.font = `bold ${lo}px sans-serif`;
  img_ctx.fillStyle = 'black';
  img_ctx.textAlign = 'center';
  img_ctx.textBaseline = 'middle';
  for (let i = 0; i < lines.length; i++) {
    img_ctx.fillText(lines[i], cw / 2, firstLineY + i * lineHeight);
  }

  ctx.drawImage(img_canvas, 0, 0, canvas.width, canvas.height);
}

const gui = new dat.GUI();

gui.add(ishihara_input, 'load_image').name('Load image');
gui.add(ishihara_input, 'color_scheme', ['General 1', 'General 2', 'General 3', 'Protanopia', 'Protanomaly', 'Viewable by all', 'Colorblind only']).name('Color scheme');

gui.add(ishihara_input, 'text').name('Text').onChange(() => renderText());
gui.add(ishihara_input, 'circular').name('Circular');
gui.add(ishihara_input, 'resize').name('Resize');
gui.add(ishihara_input, 'shape_factory', ['Circle', 'Regular polygon', 'Cross', 'Star', 'Heart']).onChange(value => {
  hide_gui_element(gui, 'sides', value !== 'Regular polygon' && value !== 'Star');
  hide_gui_element(gui, 'pointiness', value !== 'Cross' && value !== 'Star');
  update_gui(gui);
}).name('Shape');
gui.add(ishihara_input, 'sides', 3, 12, 1).name('Sides');
gui.add(ishihara_input, 'pointiness', 0.01, 0.99).name('Pointiness');

gui.add(ishihara_input, 'min_radius', 2, 50).name('Min radius').onChange(() => {
  ishihara_input.max_radius = Math.max(ishihara_input.min_radius, ishihara_input.max_radius);
  update_gui(gui);
});
gui.add(ishihara_input, 'max_radius', 2, 50).name('Max radius').onChange(() => {
  ishihara_input.min_radius = Math.min(ishihara_input.min_radius, ishihara_input.max_radius);
  update_gui(gui);
});
gui.add(ishihara_input, 'stop_after', 1000, 100000, 1).name('Stop after');
gui.add(ishihara_input, 'incremental_radius').name('Incremental radius');
gui.add(ishihara_input, 'generate').name('Generate');
gui.add(ishihara_input, 'clear').name('Clear');
gui.add(ishihara_input, 'stop').name('Stop');
gui.add(ishihara_input, 'download_png').name('Download PNG');
gui.add(ishihara_input, 'download_svg').name('Download SVG');

hide_gui_element(gui, 'sides', true);
hide_gui_element(gui, 'pointiness', true);
hide_gui_element(gui, 'stop', true);

let painting = false;
let generating = false;
let x, y;

const hand_draw = (ctx, style, x1, y1, x2, y2) => {
  if (x2 !== undefined && y2 !== undefined) {
    ctx.beginPath();
    ctx.strokeStyle = style;
    ctx.moveTo(x1, y1);
    ctx.lineWidth = 15;
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.fillStyle = style;
  ctx.arc(x1, y1, 7.5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();
};

const mousedown = (mx, my, style) => {
  painting = true;
  x = mx;
  y = my;
  if (generating) return;
  hand_draw(ctx, style, x, y);
  hand_draw(img_ctx, style, x, y);
};
canvas.addEventListener('mousedown', e => {
  if (e.button === 0) {
    mousedown(e.offsetX * PIXEL_RATIO, e.offsetY * PIXEL_RATIO, e.ctrlKey ? '#FFF' : '#000');
  }
});
canvas.addEventListener('touchstart', e => {
  const rect = canvas.getBoundingClientRect();
  mousedown(
    (e.touches[0].clientX - rect.left) * PIXEL_RATIO,
    (e.touches[0].clientY - rect.top)  * PIXEL_RATIO,
    '#000'
  );
});

const mouseup = (mx, my, style) => {
  painting = false;
  x = mx;
  y = my;
  if (generating) return;
  hand_draw(ctx, style, x, y);
  hand_draw(img_ctx, style, x, y);
};
canvas.addEventListener('mouseup', e => {
  if (e.button === 0) {
    mouseup(e.offsetX * PIXEL_RATIO, e.offsetY * PIXEL_RATIO, e.ctrlKey ? '#FFF' : '#000');
  }
});
canvas.addEventListener('touchend', e => {
  const rect = canvas.getBoundingClientRect();
  mouseup(
    (e.touches[0].clientX - rect.left) * PIXEL_RATIO,
    (e.touches[0].clientY - rect.top)  * PIXEL_RATIO,
    '#000'
  );
});

const mousemove = (curr_x, curr_y, style) => {
  if (!painting || generating) return;
  hand_draw(ctx, style, curr_x, curr_y, x, y);
  hand_draw(img_ctx, style, curr_x, curr_y, x, y);
  x = curr_x;
  y = curr_y;
};
canvas.addEventListener('mousemove', e => {
  mousemove(e.offsetX * PIXEL_RATIO, e.offsetY * PIXEL_RATIO, e.ctrlKey ? '#FFF' : '#000');
});
canvas.addEventListener('touchmove', e => {
  const rect = canvas.getBoundingClientRect();
  mousemove(
    (e.touches[0].clientX - rect.left) * PIXEL_RATIO,
    (e.touches[0].clientY - rect.top)  * PIXEL_RATIO,
    '#000'
  );
});

document.getElementById('image_upload').addEventListener('change', e => {
  ishihara_input.stop();

  const reader = new FileReader();
  reader.onload = event => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      if (ishihara_input.resize) {
        const ratio = Math.min(max_width / img.width, max_height / img.height);
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
      } else {
        canvas.width  = img.width;
        canvas.height = img.height;
      }

      canvas.style.width  = `${canvas.width  / PIXEL_RATIO}px`;
      canvas.style.height = `${canvas.height / PIXEL_RATIO}px`;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      img_canvas.width  = canvas.width;
      img_canvas.height = canvas.height;
      img_ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  };
  reader.readAsDataURL(e.target.files[0]);
}, false);
