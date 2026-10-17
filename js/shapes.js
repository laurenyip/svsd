// The pictures in the book. Everything is drawn in a 1000×600 "view" space.
// Each shape's `parts` are where particles may settle; `deco` appears once the page is finished.

export const VIEW = { w: 1000, h: 600 };

export const PAGES = {
  snake: {
    key: 'snake',
    title: 'The snake says sss',
    line: 'The snake says <span class="snd">sss</span>',
    sound: 'sss',
    defaultHz: 6800,
    done: 'You drew the snake with your voice!',
    build() {
      const body = new Path2D('M140 440 C 220 300, 330 300, 395 390 S 540 520, 625 410 S 735 250, 800 300');
      const head = new Path2D();
      head.ellipse(842, 296, 56, 41, -0.12, 0, Math.PI * 2);
      const tongue = new Path2D('M894 306 L 930 312 M 930 312 L 950 296 M 930 312 L 948 330');
      return {
        parts: [
          { path: body, mode: 'stroke', width: 54 },
          { path: head, mode: 'fill' },
        ],
        deco: [
          { path: tongue, mode: 'stroke', width: 6, color: '#ff8fb8' },
          { eye: [858, 282, 10] },
        ],
      };
    },
  },
  ship: {
    key: 'ship',
    title: 'The ship goes shhh',
    line: 'The ship goes <span class="snd">shhh</span>',
    sound: 'shhh',
    defaultHz: 3700,
    done: 'You sailed the ship with your voice!',
    build() {
      const hull = new Path2D('M290 385 L 730 385 Q 708 468 636 482 L 384 482 Q 312 468 290 385 Z');
      const mast = new Path2D('M508 385 L 508 140');
      const sailR = new Path2D('M524 160 Q 610 250 660 365 L 524 365 Z');
      const sailL = new Path2D('M492 195 L 492 365 L 372 365 Q 420 270 492 195 Z');
      const flag = new Path2D('M508 140 L 566 156 L 508 174 Z');
      const waves = new Path2D('M170 525 q 55 -28 110 0 t 110 0 t 110 0 t 110 0 t 110 0 t 110 0');
      const ports = new Path2D();
      for (const x of [420, 510, 600]) { ports.moveTo(x + 13, 432); ports.arc(x, 432, 13, 0, Math.PI * 2); }
      return {
        parts: [
          { path: hull, mode: 'fill' },
          { path: mast, mode: 'stroke', width: 12 },
          { path: sailR, mode: 'fill' },
          { path: sailL, mode: 'fill' },
          { path: flag, mode: 'fill' },
          { path: waves, mode: 'stroke', width: 16 },
        ],
        deco: [{ path: ports, mode: 'stroke', width: 5, color: '#fff3c4' }],
      };
    },
  },
};

export const STORY = ['cover', 'snake', 'ship', 'end'];

const cache = new Map();

// Builds a shape and scatters evenly-spaced "slots" inside it (a jittered grid),
// which are the spots where a child's particles can settle.
export function getShape(key) {
  if (cache.has(key)) return cache.get(key);
  const shape = PAGES[key].build();
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const inside = (x, y) => shape.parts.some((p) => {
    if (p.mode === 'fill') return ctx.isPointInPath(p.path, x, y);
    ctx.lineWidth = p.width;
    return ctx.isPointInStroke(p.path, x, y);
  });
  const step = 14;
  let seed = key.length * 9973;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const slots = [];
  for (let y = step / 2; y < VIEW.h; y += step) {
    for (let x = step / 2; x < VIEW.w; x += step) {
      const px = x + (rand() - 0.5) * step * 0.6;
      const py = y + (rand() - 0.5) * step * 0.6;
      if (inside(px, py)) slots.push({ x: px, y: py });
    }
  }
  shape.slots = slots;
  cache.set(key, shape);
  return shape;
}

export function drawGhost(ctx, shape, color, alpha, blur) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const p of shape.parts) {
    if (p.mode === 'fill') ctx.fill(p.path);
    else { ctx.lineWidth = p.width; ctx.stroke(p.path); }
  }
  ctx.restore();
}

export function drawDeco(ctx, shape, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const d of shape.deco) {
    if (d.eye) {
      const [x, y, r] = d.eye;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1d1f4a';
      ctx.beginPath(); ctx.arc(x + 2, y + 1, r * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x + 4, y - 2, r * 0.2, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = d.color;
      ctx.lineWidth = d.width;
      ctx.stroke(d.path);
    }
  }
  ctx.restore();
}
