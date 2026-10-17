// Soft pearly orbs for paper backgrounds: a shaded sphere with a highlight and a faint halo.
// Pre-rendered per hue so hundreds of them stay smooth.
const sprites = new Map();
const S = 96, C = S / 2, BODY = S / 4;

function sprite(hue, muted) {
  const h = Math.round(hue / 3) * 3;
  const key = `${h}${muted ? 'm' : ''}`;
  let c = sprites.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const sat = muted ? 28 : 85;

  // Halo
  const halo = g.createRadialGradient(C, C, BODY * 0.8, C, C, C);
  halo.addColorStop(0, `hsla(${h}, ${sat}%, 72%, ${muted ? 0.12 : 0.32})`);
  halo.addColorStop(1, `hsla(${h}, ${sat}%, 80%, 0)`);
  g.fillStyle = halo;
  g.fillRect(0, 0, S, S);

  // Body, lit from the top left
  const body = g.createRadialGradient(C - BODY * 0.35, C - BODY * 0.4, 0, C, C, BODY);
  body.addColorStop(0, `hsl(${h}, ${sat}%, 97%)`);
  body.addColorStop(0.4, `hsl(${h}, ${sat}%, ${muted ? 82 : 76}%)`);
  body.addColorStop(1, `hsl(${h}, ${sat - 10}%, ${muted ? 68 : 58}%)`);
  g.fillStyle = body;
  g.beginPath();
  g.arc(C, C, BODY, 0, Math.PI * 2);
  g.fill();

  sprites.set(key, c);
  return c;
}

// r is the orb's radius; its halo reaches twice as far.
export function glow(ctx, x, y, r, hue, alpha, muted = false) {
  if (alpha <= 0.01) return;
  ctx.globalAlpha = Math.min(1, alpha);
  const s = r * 4;
  ctx.drawImage(sprite(hue, muted), x - s / 2, y - s / 2, s, s);
}

// A finished page's drawing (used for the book's thumbnails).
export function drawDots(ctx, dots) {
  ctx.save();
  for (const [x, y, r10, h] of dots) glow(ctx, x, y, r10 / 10, h, 1);
  ctx.restore();
}
