// The child's voice as particles.
// - Sharpness (where the hiss energy sits) sets character: "sss" → small, quick, twinkly sparks;
//   "shhh" → bigger, slower, softer drifts.
// - Loudness sets how many appear.
// - Closeness to the grown-up's target pulls them toward the ghost picture; distance scatters them.
//   A particle that reaches its spot while the sound is close settles there for good.
import { lerp, hueOf } from './audio.js';
import { glow } from './render.js';

const MAX = 1400;
const FREE = 0, RESERVED = 1, FILLED = 2;
export const ORIGIN = { x: 500, y: 650 };

export class Field {
  constructor(slots) {
    this.slots = slots;
    this.state = new Uint8Array(slots.length);
    this.order = slots.map((_, i) => i).sort(() => Math.random() - 0.5);
    this.cursor = 0;
    this.particles = [];
    this.dots = [];
    this.filled = 0;
    this.acc = 0;
  }

  get progress() { return this.filled / this.slots.length; }

  takeSlot() {
    const n = this.slots.length;
    for (let k = 0; k < n; k++) {
      const i = this.order[(this.cursor + k) % n];
      if (this.state[i] === FREE) {
        this.cursor = (this.cursor + k + 1) % n;
        this.state[i] = RESERVED;
        return i;
      }
    }
    return -1;
  }

  // `fit` is how close this moment of sound was; only close sounds can become part of the picture.
  emit(dt, level, sharp, now, fit = 0) {
    this.acc += dt * level ** 0.8 * 180;
    while (this.acc >= 1) {
      this.acc -= 1;
      if (this.particles.length < MAX) this.particles.push(this.make(sharp, fit));
    }
  }

  make(sh, fit) {
    const slot = this.takeSlot();
    const t = slot >= 0 ? this.slots[slot] : this.slots[(Math.random() * this.slots.length) | 0];
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
    const speed = lerp(240, 560, sh) * (0.7 + Math.random() * 0.6);
    return {
      x: ORIGIN.x + (Math.random() - 0.5) * 160,
      y: ORIGIN.y + Math.random() * 20,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      slot, tx: t.x, ty: t.y,
      life: 1,
      maxLife: lerp(3.6, 2.4, sh) * (0.8 + Math.random() * 0.4),
      size: lerp(7, 2.4, sh) * (0.75 + Math.random() * 0.5),
      hue: hueOf(sh) + (Math.random() - 0.5) * 22,
      sharp: sh, fit,
      seed: Math.random() * 1000,
      wob: lerp(1.1, 6.5, sh),
      drag: lerp(0.955, 0.905, sh),
    };
  }

  update(dt, c, now) {
    const k = 24 * c * c;   // pull toward the picture
    const far = 1 - c;      // scatter
    const ps = this.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      const dx = p.tx - p.x, dy = p.ty - p.y;
      const d = Math.hypot(dx, dy);
      const sw = far * lerp(650, 1100, p.sharp);
      let ax = dx * k + Math.sin(p.seed + now * p.wob + p.y * 0.012) * sw + (p.x - 500) * far * 0.9;
      let ay = dy * k + Math.cos(p.seed * 1.7 + now * p.wob * 0.9 + p.x * 0.012) * sw - far * 140;
      const damp = p.drag ** (dt * 60);
      p.vx = (p.vx + ax * dt) * damp;
      p.vy = (p.vy + ay * dt) * damp;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt / p.maxLife;

      const settles = p.slot >= 0 && this.state[p.slot] === RESERVED && d < 10 && c > 0.5 && p.fit > 0.35;
      if (settles) {
        this.state[p.slot] = FILLED;
        this.filled++;
        this.dots.push({ x: p.tx, y: p.ty, r: Math.max(3.2, p.size * 0.8), h: p.hue, born: now });
      } else if (p.life > 0) continue;
      else if (p.slot >= 0 && this.state[p.slot] === RESERVED) this.state[p.slot] = FREE;
      ps[i] = ps[ps.length - 1];
      ps.pop();
    }
  }

  // The last few spots fill in with the average of the child's own colours.
  fillRest(now) {
    const n = this.dots.length || 1;
    const avgR = this.dots.reduce((s, d) => s + d.r, 0) / n || 4;
    const hs = this.dots.map((d) => d.h);
    for (let i = 0; i < this.slots.length; i++) {
      if (this.state[i] === FILLED) continue;
      this.state[i] = FILLED;
      const s = this.slots[i];
      const h = hs.length ? hs[(Math.random() * hs.length) | 0] : 330;
      this.dots.push({ x: s.x, y: s.y, r: avgR, h, born: now + 0.2 + Math.random() * 0.9 });
    }
    this.filled = this.slots.length;
  }

  drawSlots(ctx, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    for (let i = 0; i < this.slots.length; i++) {
      if (this.state[i] === FILLED) continue;
      const s = this.slots[i];
      ctx.moveTo(s.x + 1.6, s.y);
      ctx.arc(s.x, s.y, 1.6, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }

  drawDots(ctx, now, shimmer) {
    for (const d of this.dots) {
      const age = now - d.born;
      if (age < 0) continue;
      const pop = 1 + 1.4 * Math.exp(-age * 5);
      const wave = shimmer ? shimmer * Math.max(0, Math.sin(now * 3.2 - d.x * 0.011)) ** 6 : 0;
      glow(ctx, d.x, d.y, d.r * (pop + wave * 0.6), d.h, Math.min(1, age * 6) * (0.9 + wave));
    }
  }

  drawParticles(ctx, now) {
    for (const p of this.particles) {
      const twinkle = p.sharp > 0.55 ? 0.55 + 0.45 * Math.sin(now * 28 + p.seed) : 0.8;
      glow(ctx, p.x, p.y, p.size, p.hue, Math.min(1, p.life * 2.5) * twinkle);
    }
  }
}
