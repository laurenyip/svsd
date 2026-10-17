// The child's voice as a swarm of dots that lives on the page.
// - Quiet: faint dust roams the page in slow currents.
// - Loudness wakes dots up: the louder the voice, the more dots light up, and the swarm ripples outward.
// - Sharpness (where the hiss energy sits) sets character: "sss" → small, quick, twinkly coral sparks;
//   "shhh" → bigger, slower, violet drifts.
// - Closeness to the grown-up's target pulls the lit dots toward their spot in the picture; distance
//   lets them scatter back into the currents. A lit dot that rests on its spot while the sound is close
//   settles there for good.
import { lerp } from './audio.js';
import { glow } from './render.js';

const EXTRA = 170;              // free dots that never belong to the picture, so the page always feels alive
const CX = 500, CY = 300;       // middle of the picture (view space is 1000×600)

// Kept unwrapped (258 → 378) so colours ease smoothly from violet through pink to coral.
const hueFor = (sharp) => 258 + 120 * sharp;

export class Field {
  constructor(slots) {
    this.slots = slots;
    this.state = new Uint8Array(slots.length); // 0 open, 2 filled
    this.dots = [];
    this.filled = 0;
    this.level = 0;
    this.sharp = 0.5;
    this.fit = 0;

    const swarm = [];
    for (let i = 0; i < slots.length + EXTRA; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random());
      swarm.push({
        x: CX + Math.cos(a) * r * 540, y: CY + Math.sin(a) * r * 320, vx: 0, vy: 0,
        slot: -1, th: Math.random() ** 1.3, glow: 0, hue: 300, size: 4, sharp: 0.5, fit: 0,
        dwell: 0, seed: Math.random() * 1000, j: Math.random(), settled: false, homing: 0,
      });
    }
    // Give each spot in the picture the dot sitting in the matching place on the page,
    // so every dot travels a short path when the picture forms.
    const byX = (a, b) => a.x - b.x;
    const order = slots.map((s, i) => ({ x: s.x, i })).sort(byX);
    const pool = swarm.slice().sort(byX);
    const step = pool.length / order.length;
    order.forEach((o, k) => { pool[Math.floor(k * step + step / 2)].slot = o.i; });
    this.swarm = swarm;
  }

  get progress() { return this.filled / this.slots.length; }
  get particles() { return this.swarm; }

  // Voice for this frame. `fit` is how close this moment of sound was to the target.
  emit(dt, level, sharp, now, fit = 0) {
    this.level = level;
    this.sharp = sharp;
    this.fit = fit;
  }

  update(dt, c, now) {
    const L = this.level ** 0.7;
    const k = 9 * c * c;
    const far = 1 - c;
    const damp = 0.9 ** (dt * 60);
    for (const p of this.swarm) {
      if (p.settled) continue;

      // Wake up with the voice (fast), fall asleep slowly.
      const awake = p.homing > 0 || L > p.th;
      p.glow += ((awake ? 1 : 0) - p.glow) * Math.min(1, dt * (awake ? 9 : 1.1));
      if (awake && !p.homing) {
        const t = Math.min(1, dt * 8);
        p.sharp += (this.sharp - p.sharp) * t;
        p.hue += (hueFor(this.sharp) + (p.j - 0.5) * 22 - p.hue) * t;
        p.fit += (this.fit - p.fit) * t;
        p.size = lerp(7, 2.8, p.sharp) * (0.75 + p.j * 0.5);
      }
      const e = p.glow;
      // A dot being pulled home stops drifting so it can land.
      const free = 1 - 0.9 * (p.slot >= 0 ? (p.homing ? 1 : e * c * c) : 0);

      // Slow currents across the page.
      const n = Math.sin(p.x * 0.005 + now * 0.35 + p.seed) + Math.cos(p.y * 0.006 - now * 0.27 + p.seed * 0.5);
      const wander = (110 + e * lerp(200, 380, p.sharp) * (0.4 + far)) * free;
      let ax = Math.cos(n * Math.PI) * wander;
      let ay = Math.sin(n * Math.PI) * wander;
      // "sss" fizzes.
      if (e > 0.05 && p.sharp > 0.5) {
        const fizz = 1400 * e * (p.sharp - 0.5) * (0.3 + far) * free;
        ax += (Math.random() - 0.5) * fizz;
        ay += (Math.random() - 0.5) * fizz;
      }
      // Stay loosely gathered on the page.
      ax += (CX - p.x) * 0.06 * free;
      ay += (CY - p.y) * 0.12 * free;
      // The voice ripples outward through the swarm.
      const dx = p.x - CX, dy = p.y - CY, r = Math.hypot(dx, dy) + 1;
      const ripple = this.level * 260 * Math.sin(r * 0.022 - now * 7) * far;
      ax += (dx / r) * ripple;
      ay += (dy / r) * ripple;

      // Closeness pulls lit dots home.
      if (p.slot >= 0 && (e > 0.05 || p.homing)) {
        const s = this.slots[p.slot];
        const hx = s.x - p.x, hy = s.y - p.y, d = Math.hypot(hx, hy);
        const pull = p.homing ? 34 : k * e;
        ax += hx * pull;
        ay += hy * pull;
        const resting = d < 12 && (p.homing || (c > 0.5 && p.fit > 0.35 && e > 0.5));
        p.dwell = resting ? p.dwell + dt : 0;
        if (p.homing) p.homing += dt;
        if (p.dwell > 0.1 || p.homing > 1.6) { this.settle(p, s, now); continue; }
      }

      p.vx = (p.vx + ax * dt) * damp;
      p.vy = (p.vy + ay * dt) * damp;
      const sp = Math.hypot(p.vx, p.vy), max = lerp(240, 440, p.sharp) * (p.homing ? 1.6 : 1);
      if (sp > max) { p.vx *= max / sp; p.vy *= max / sp; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.level = 0;
  }

  settle(p, s, now) {
    p.settled = true;
    this.state[p.slot] = 2;
    this.filled++;
    this.dots.push({ x: s.x, y: s.y, r: Math.max(4.4, p.size * 0.85), h: p.hue, born: now });
  }

  // The rest of the picture streams home in the child's own colours.
  fillRest() {
    const hs = this.dots.map((d) => d.h);
    const avgR = this.dots.reduce((a, d) => a + d.r, 0) / (this.dots.length || 1) || 5;
    for (const p of this.swarm) {
      if (p.settled || p.slot < 0) continue;
      p.homing = 0.0001;
      p.hue = hs.length ? hs[(Math.random() * hs.length) | 0] : 318;
      p.size = avgR / 0.85;
    }
  }

  drawSlots(ctx, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#17161a';
    ctx.beginPath();
    for (let i = 0; i < this.slots.length; i++) {
      if (this.state[i]) continue;
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
    // Sleeping dust
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#17161a';
    ctx.beginPath();
    for (const p of this.swarm) {
      if (p.settled || p.glow > 0.9) continue;
      ctx.moveTo(p.x + 1.8, p.y);
      ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
    }
    ctx.fill();
    // Dots the voice has woken
    for (const p of this.swarm) {
      if (p.settled || p.glow < 0.02) continue;
      const twinkle = p.sharp > 0.55 && !p.homing ? 0.6 + 0.4 * Math.sin(now * 26 + p.seed) : 1;
      glow(ctx, p.x, p.y, lerp(1.8, p.size, p.glow), p.hue, p.glow * twinkle);
    }
  }
}
