// The child's voice as a cluster of flat sticker dots that lives on the page.
// - Quiet: the dots rest in soft concentric rings, slowly turning and breathing.
// - Loudness wakes dots up: the louder the voice, the more of them light up in colour, and ripples run
//   outward through the rings.
// - Sharpness (where the hiss energy sits) sets character: "sss" → smaller, quicker dots in mint, sky and
//   sunshine; "shhh" → bigger, slower dots in violet, pink and lilac.
// - Lit dots glide out of the cluster and roam. Closeness to the grown-up's target moves them into their
//   spot in the picture; distance lets them float back. A dot that reaches its spot while the sound is
//   close settles there for good.
import { lerp, clamp } from './audio.js';
import { glow } from './render.js';

const EXTRA = 120;                  // dots that never belong to the picture, so the cluster never empties
const CX = 500, CY = 290;           // middle of the cluster, in view space (1000×600)
const RING = 30, GAP = 30;          // ring spacing and dot spacing along a ring
// Three colour families; each dot belongs to one and slides between its "shhh" and "sss" colour.
const SH = [[140, 124, 255], [255, 143, 196], [185, 164, 255]]; // violet, pink, lilac
const SS = [[79, 214, 162], [108, 200, 255], [255, 196, 64]];   // mint, sky, sunshine
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
// Colours commit to one family or the other; only sounds in between blend.
const family = (sharp) => smooth(clamp((sharp - 0.3) / 0.4));
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

    // Concentric rings, filled from the middle out until everyone has a place.
    const n = slots.length + EXTRA;
    const swarm = [];
    for (let k = 0; swarm.length < n; k++) {
      const count = k === 0 ? 1 : Math.round((2 * Math.PI * k * RING) / GAP);
      for (let i = 0; i < count && swarm.length < n; i++) {
        const ang = (i / count) * Math.PI * 2 + k * 0.5;
        const pal = swarm.length % 3;
        swarm.push({
          ring: k, ang, x: CX + Math.cos(ang) * k * RING, y: CY + Math.sin(ang) * k * RING,
          slot: -1, th: Math.random() ** 1.3, glow: 0, m: 0, pal, col: mix(SH[pal], SS[pal], 0.5), size: 7,
          sharp: 0.5, fit: 0, dwell: 0, seed: Math.random() * 100, j: Math.random(),
          settled: false, homing: false,
        });
      }
    }
    // Each spot in the picture takes the dot in the matching place, so paths stay short.
    const byX = (a, b) => a.x - b.x;
    const order = slots.map((s, i) => ({ x: s.x, i })).sort(byX);
    const pool = swarm.slice().sort(byX);
    const step = pool.length / order.length;
    order.forEach((o, k) => { pool[Math.floor(k * step + step / 2)].slot = o.i; });
    this.swarm = swarm;
    this.rings = swarm[swarm.length - 1].ring;
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
    const breath = 1 + 0.03 * Math.sin((now * Math.PI * 2) / 4.5);
    const pull = clamp((c - 0.2) / 0.6) ** 1.2;
    // The cluster scales so its outer ring stays a calm size whatever the picture's dot count.
    const unit = 250 / Math.max(1, this.rings);

    for (const p of this.swarm) {
      if (p.settled) continue;

      // Wake with the voice (quickly), drift back to sleep (slowly).
      const awake = p.homing || L > p.th;
      p.glow += ((awake ? 1 : 0) - p.glow) * Math.min(1, dt * (awake ? 6 : 0.9));
      if (awake && !p.homing) {
        const t = Math.min(1, dt * 5);
        p.sharp += (this.sharp - p.sharp) * t;
        p.col = mix(p.col, mix(SH[p.pal], SS[p.pal], family(this.sharp)), t);
        p.fit += (this.fit - p.fit) * t;
      }
      const e = p.glow;

      // Rest on its ring: rings turn slowly in alternating directions; the voice sends ripples outward.
      const ripple = this.swell * 0.35 * Math.max(0, Math.sin(p.ring * 0.9 - now * 6));
      const r = p.ring * unit * breath * (1 + this.swell * 0.22) + ripple * unit;
      const a = p.ang + now * 0.12 * (p.ring % 2 ? 1 : -1) / Math.max(1, p.ring * 0.4);
      let tx = CX + Math.cos(a) * r;
      let ty = CY + Math.sin(a) * r;

      // Lit dots glide out and roam the page in slow loops ("sss" loops faster).
      const roam = e * (0.35 + 0.65 * far) * (p.homing ? 0 : 1);
      if (roam > 0.001) {
        const f = lerp(0.35, 0.8, p.sharp);
        tx += (Math.sin(now * f + p.seed) * 230 + Math.sin(now * f * 0.37 + p.seed * 3) * 120) * roam;
        ty += (Math.cos(now * f * 0.8 + p.seed * 1.7) * 130 + Math.sin(now * f * 0.53 + p.seed) * 60) * roam;
      }

      // Closeness moves a lit dot out of the cluster into its spot in the picture.
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
      p.size = lerp(6.5, lerp(12, 8, p.sharp) * (0.85 + 0.3 * p.j), e);
    }
    this.level = 0;
  }

  settle(p, s, now) {
    p.settled = true;
    this.state[p.slot] = 2;
    this.filled++;
    this.dots.push({ x: s.x, y: s.y, r: 6.6, h: p.col, born: now });
  }

  // The rest of the picture streams out of the cluster in the child's own colours.
  fillRest() {
    const hs = this.dots.map((d) => d.h);
    for (const p of this.swarm) {
      if (p.settled || p.slot < 0) continue;
      p.homing = true;
      if (hs.length) p.col = hs[(Math.random() * hs.length) | 0];
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

  // Sleeping dots underneath, lit ones on top.
  drawParticles(ctx, now) {
    const list = this.swarm.filter((p) => !p.settled).sort((a, b) => a.glow - b.glow);
    for (const p of list) {
      const lit = p.glow > 0.35;
      const bob = p.sharp > 0.55 && lit && !p.homing ? 1 + 0.08 * Math.sin(now * 9 + p.seed) : 1;
      glow(ctx, p.x, p.y, p.size * bob, p.col, lit ? 1 : 0.9, !lit);
    }
  }
}
