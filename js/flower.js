// The "warmer" flower, after the Apple Watch Breathe animation.
// Closed and gently breathing while quiet; opens and brightens as the sound gets closer.
export class Flower {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.open = 0.2;
  }

  draw(now, dt, { active, closeness, hue, bloom }) {
    const dpr = devicePixelRatio || 1;
    const css = this.c.clientWidth || 96;
    if (this.c.width !== Math.round(css * dpr)) this.c.width = this.c.height = Math.round(css * dpr);
    const S = this.c.width;
    const breath = 0.5 + 0.5 * Math.sin((now * Math.PI * 2) / 4.5);
    const goal = bloom ? 1.05 : active ? 0.25 + 0.75 * closeness : 0.12 + 0.18 * breath;
    this.open += (goal - this.open) * Math.min(1, dt * 5);
    const o = this.open;

    const g = this.ctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, S, S);
    g.translate(S / 2, S / 2);
    g.rotate(now * 0.25 + o * 1.4);
    g.globalCompositeOperation = 'lighter';
    const R = S * 0.2;
    const dist = R * (0.1 + 0.95 * o);
    const r = R * (0.7 + 0.4 * o);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const x = Math.cos(a) * dist, y = Math.sin(a) * dist;
      const h = hue + i * 7;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `hsla(${h}, 90%, 78%, ${0.35 + 0.35 * o})`);
      grad.addColorStop(1, `hsla(${h}, 90%, 62%, ${0.12 + 0.12 * o})`);
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  }
}
