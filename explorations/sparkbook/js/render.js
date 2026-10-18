// Flat sticker dots: a solid colour disc with a white rim and a soft shadow.
// Pre-rendered per colour so hundreds of them stay smooth.
const sprites = new Map();
const S = 64, C = S / 2, BODY = 22, RIM = 26;
const MUTED = '#ddd6ea';

// A colour is an [r, g, b] array, or a hue number (older saved drawings).
const fill = (col) => (Array.isArray(col) ? `rgb(${col.map((v) => Math.round(v / 8) * 8)})` : `hsl(${Math.round(col / 3) * 3}, 85%, 66%)`);

function sprite(col, muted) {
  const key = muted ? 'muted' : fill(col);
  let c = sprites.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  // Shadow
  g.filter = 'blur(2px)';
  g.fillStyle = 'rgba(70, 50, 20, 0.16)';
  g.beginPath(); g.arc(C, C + 3, RIM, 0, Math.PI * 2); g.fill();
  g.filter = 'none';
  // White rim
  g.fillStyle = '#fff';
  g.beginPath(); g.arc(C, C, RIM, 0, Math.PI * 2); g.fill();
  // Flat colour
  g.fillStyle = muted ? MUTED : key;
  g.beginPath(); g.arc(C, C, BODY, 0, Math.PI * 2); g.fill();
  sprites.set(key, c);
  return c;
}

// r is the radius of the coloured disc; the white rim and shadow sit just outside it.
export function glow(ctx, x, y, r, col, alpha, muted = false) {
  if (alpha <= 0.01) return;
  ctx.globalAlpha = Math.min(1, alpha);
  const s = (r * S) / BODY;
  ctx.drawImage(sprite(col, muted), x - s / 2, y - s / 2, s, s);
}

// A finished page's drawing (used for the book's thumbnails).
export function drawDots(ctx, dots) {
  ctx.save();
  for (const [x, y, r10, col] of dots) glow(ctx, x, y, r10 / 10, col, 1);
  ctx.restore();
}
