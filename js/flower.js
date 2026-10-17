// The "warmer" flower, after the Apple Watch Breathe animation — with a face.
// Closed and gently breathing while quiet; opens and brightens as the sound gets closer.
// Its eyes blink, and squint happily when the sound is very close.
export class Flower {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.open = 0.2;
    this.blinkAt = 2;
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

    // Petals
    g.save();
    g.rotate(now * 0.25 + o * 1.4);
    g.globalCompositeOperation = 'multiply';
    const R = S * 0.19;
    const dist = R * (0.1 + 0.95 * o);
    const r = R * (0.72 + 0.4 * o);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const x = Math.cos(a) * dist, y = Math.sin(a) * dist;
      g.fillStyle = `hsla(${hue + i * 8}, 92%, ${74 - o * 8}%, ${0.55 + 0.3 * o})`;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();

    // Face
    if (now > this.blinkAt + 0.14) this.blinkAt = now + 2.5 + Math.random() * 3;
    const blinking = now > this.blinkAt;
    const happy = bloom || (active && closeness > 0.6);
    const e = S * 0.07, ex = S * 0.075;
    g.lineCap = 'round';
    for (const sx of [-1, 1]) {
      const x = sx * ex;
      if (happy || blinking) {
        g.strokeStyle = '#17161a';
        g.lineWidth = S * 0.028;
        g.beginPath();
        if (happy) g.arc(x, e * 0.3, e * 0.7, Math.PI * 1.15, Math.PI * 1.85);
        else { g.moveTo(x - e * 0.7, 0); g.lineTo(x + e * 0.7, 0); }
        g.stroke();
      } else {
        g.fillStyle = '#fff';
        g.beginPath(); g.arc(x, 0, e, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#17161a';
        g.beginPath(); g.arc(x + e * 0.15, e * 0.15, e * 0.55, 0, Math.PI * 2); g.fill();
      }
    }
  }
}
