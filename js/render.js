// Soft coloured dots for paper backgrounds, pre-rendered per hue so thousands of them stay smooth.
const sprites = new Map();

function sprite(hue) {
  const key = Math.round(hue / 4) * 4;
  let c = sprites.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `hsla(${key}, 95%, 66%, 1)`);
  grad.addColorStop(0.28, `hsla(${key}, 92%, 60%, 0.95)`);
  grad.addColorStop(0.34, `hsla(${key}, 95%, 72%, 0.3)`);
  grad.addColorStop(0.6, `hsla(${key}, 95%, 80%, 0.1)`);
  grad.addColorStop(1, `hsla(${key}, 95%, 85%, 0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  sprites.set(key, c);
  return c;
}

// r is the visible core radius; the halo extends ~3× further.
export function glow(ctx, x, y, r, hue, alpha) {
  if (alpha <= 0.01) return;
  ctx.globalAlpha = Math.min(1, alpha);
  const s = r * 6;
  ctx.drawImage(sprite(hue), x - s / 2, y - s / 2, s, s);
}

// A finished page's drawing (used for the book's thumbnails).
export function drawDots(ctx, dots) {
  ctx.save();
  for (const [x, y, r10, h] of dots) glow(ctx, x, y, r10 / 10, h, 0.95);
  ctx.restore();
}
