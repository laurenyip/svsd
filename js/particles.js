// The child's voice as an orb of soft dots that lives on the page.
// - Quiet: the dots rest as a slowly turning 3D orb, breathing.
// - Loudness wakes dots up: the louder the voice, the more of them light up, and the orb swells and ripples.
// - Sharpness (where the hiss energy sits) sets character: "sss" → smaller, brighter aqua dots that move
//   quickly and shimmer; "shhh" → bigger, slower lavender dots.
// - Lit dots glide out of the orb and roam. Closeness to the grown-up's target morphs them out of the
//   orb into their spot in the picture; distance lets them float back. A dot that reaches its spot while
//   the sound is close settles there for good.
import { lerp, clamp, hueOf } from './audio.js';
import { glow } from './render.js';

const EXTRA = 120;                 // dots that never belong to the picture, so the orb never fully empties
const CX = 500, CY = 285, R = 175; // the orb, in view space (1000×600)
const TILT = 0.35;
const smooth = (t) => t * t * (3 - 2 * t);

export class Field {
  constructor(slots) {
    this.slots = slots;
    this.state = new Uint8Array(slots.length); // 0 open, 2 filled
    this.dots = [];
    this.filled = 0;
    this.level = 0;
    this.sharp = 0.5;
    this.fit = 0;
    this.swell = 0;

    // Even points on a sphere (Fibonacci lattice).
    const n = slots.length + EXTRA;
    const swarm = [];
    for (let i = 0; i < n; i++) {
      const uy = 1 - (2 * (i + 0.5)) / n;
      const rr = Math.sqrt(1 - uy * uy);
      const phi = i * 2.399963;
      swarm.push({
        ux: Math.cos(phi) * rr, uy, uz: Math.sin(phi) * rr,
        x: CX + Math.cos(phi) * rr * R, y: CY + uy * R, depth: 0.5,
        slot: -1, th: Math.random() ** 1.3, glow: 0, m: 0, hue: hueOf(0.5), size: 6,
        sharp: 0.5, fit: 0, dwell: 0, seed: Math.random() * 100, j: Math.random(),
        settled: false, homing: false,
      });
    }
    // Each spot in the picture takes the dot in the matching place, so morph paths stay short.
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
    this.swell += (this.level - this.swell) * Math.min(1, dt * (this.level > this.swell ? 6 : 2));
    const far = 1 - c;
    const a = now * 0.3;
    const ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(TILT), st = Math.sin(TILT);
    const breath = 1 + 0.025 * Math.sin((now * Math.PI * 2) / 4.5);
    const pull = clamp((c - 0.2) / 0.6) ** 1.2;

    for (const p of this.swarm) {
      if (p.settled) continue;

      // Wake with the voice (quickly), drift back to sleep (slowly).
      const awake = p.homing || L > p.th;
      p.glow += ((awake ? 1 : 0) - p.glow) * Math.min(1, dt * (awake ? 6 : 0.9));
      if (awake && !p.homing) {
        const t = Math.min(1, dt * 5);
        p.sharp += (this.sharp - p.sharp) * t;
        p.hue += (hueOf(this.sharp) + (p.j - 0.5) * 16 - p.hue) * t;
        p.fit += (this.fit - p.fit) * t;
      }
      const e = p.glow;

      // Place on the turning orb.
      const X = p.ux * ca + p.uz * sa;
      const Z = -p.ux * sa + p.uz * ca;
      const Y = p.uy * ct - Z * st;
      const Z2 = p.uy * st + Z * ct;
      const ripple = this.swell * 0.12 * Math.sin(Math.asin(p.uy) * 5 + Math.atan2(p.uz, p.ux) * 2 - now * 5);
      const rad = R * breath * (1 + this.swell * 0.28 + ripple);
      const persp = 1 + Z2 * 0.12;
      let tx = CX + X * rad * persp;
      let ty = CY + Y * rad * persp;
      p.depth = (Z2 + 1) / 2;

      // Lit dots glide away from the orb and roam the page in slow loops ("sss" loops faster).
      const roam = e * (0.35 + 0.65 * far) * (p.homing ? 0 : 1);
      if (roam > 0.001) {
        const f = lerp(0.35, 0.8, p.sharp);
        tx += (Math.sin(now * f + p.seed) * 230 + Math.sin(now * f * 0.37 + p.seed * 3) * 120) * roam;
        ty += (Math.cos(now * f * 0.8 + p.seed * 1.7) * 130 + Math.sin(now * f * 0.53 + p.seed) * 60) * roam;
      }

      // Closeness morphs a lit dot from the orb into its spot in the picture.
      if (p.slot >= 0) {
        const goal = p.homing ? 1 : pull * e;
        const rate = p.homing ? 3 : 0.6 + 1.2 * p.j;
        p.m += (goal - p.m) * Math.min(1, dt * rate);
        const s = this.slots[p.slot];
        const k = smooth(clamp(p.m));
        tx = lerp(tx, s.x, k);
        ty = lerp(ty, s.y, k);
        const landing = p.homing ? p.m > 0.97 : p.m > 0.9 && c > 0.5 && p.fit > 0.35 && e > 0.6;
        p.dwell = landing ? p.dwell + dt : 0;
        if (p.dwell > 0.12) { this.settle(p, s, now); continue; }
      }

      // Follow the target smoothly — no jitter.
      const follow = Math.min(1, dt * lerp(3.5, 7, p.sharp));
      p.x += (tx - p.x) * follow;
      p.y += (ty - p.y) * follow;
      p.size = lerp(lerp(3.2, 6.5, p.depth), lerp(8.5, 5.5, p.sharp) * (0.85 + 0.3 * p.j), e);
    }
    this.level = 0;
  }

  settle(p, s, now) {
    p.settled = true;
    this.state[p.slot] = 2;
    this.filled++;
    this.dots.push({ x: s.x, y: s.y, r: 6.4, h: p.hue, born: now });
  }

  // The rest of the picture streams out of the orb in the child's own colours.
  fillRest() {
    const hs = this.dots.map((d) => d.h);
    for (const p of this.swarm) {
      if (p.settled || p.slot < 0) continue;
      p.homing = true;
      p.hue = hs.length ? hs[(Math.random() * hs.length) | 0] : hueOf(0.5);
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
      const pop = 1 + 0.6 * Math.exp(-age * 6) * Math.cos(age * 18);
      const wave = shimmer ? shimmer * Math.max(0, Math.sin(now * 3.2 - d.x * 0.011)) ** 6 : 0;
      glow(ctx, d.x, d.y, d.r * (pop + wave * 0.35), d.h, Math.min(1, age * 6));
    }
  }

  // Back of the orb first, so nearer dots sit on top.
  drawParticles(ctx, now) {
    const list = this.swarm.filter((p) => !p.settled).sort((a, b) => a.depth + a.glow - (b.depth + b.glow));
    for (const p of list) {
      const shimmer = p.sharp > 0.55 && p.glow > 0.3 && !p.homing ? 0.85 + 0.15 * Math.sin(now * 9 + p.seed) : 1;
      const alpha = lerp(0.3 + 0.45 * p.depth, 1, p.glow) * shimmer;
      glow(ctx, p.x, p.y, p.size, p.glow > 0.05 ? p.hue : 262, alpha, p.glow < 0.5);
    }
  }
}
