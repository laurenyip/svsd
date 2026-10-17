// Listening. Turns the mic into three numbers per frame:
//   active   – is someone making a hissy (fricative) sound right now?
//   centroid – where the hiss energy sits, in Hz. "s" sits higher (~6–8 kHz) than "sh" (~3–4.5 kHz).
//   level    – loudness, 0..1 above the room's noise floor.

const LOW = [150, 1500];      // voiced / vowel energy
const HIGH = [2000, 11000];   // fricative energy

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;

// 0 = soft "shhh", 1 = bright "sss". Drives the particles' character.
export function sharpnessOf(hz) {
  return clamp((Math.log2(hz) - Math.log2(2800)) / (Math.log2(8000) - Math.log2(2800)));
}

// Lilac (shhh) → pink → peach → gold (sss).
export function hueOf(sharp) {
  return (lerp(285, 410, sharp) + 360) % 360;
}

// "Warmer, not wrong": 1 when on target, falling smoothly with distance in octaves.
export function closenessOf(hz, targetHz) {
  const d = Math.log2(hz) - Math.log2(targetHz);
  return Math.exp(-((d / 0.36) ** 2));
}

export class Ear {
  async start() {
    const stream = await navigator.mediaDevices.getUserMedia({
      // Browser speech processing smears or removes hiss — turn it all off.
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    const src = this.ctx.createMediaStreamSource(stream);
    this.an = this.ctx.createAnalyser();
    this.an.fftSize = 2048;
    this.an.smoothingTimeConstant = 0.4;
    src.connect(this.an);
    this.freq = new Float32Array(this.an.frequencyBinCount);
    this.time = new Float32Array(this.an.fftSize);
    this.floorSamples = [];
    this.floor = 0;
  }

  get ready() { return this.floor > 0; }

  read() {
    const out = { active: false, centroid: 0, level: 0 };
    if (!this.an) return out;

    this.an.getFloatTimeDomainData(this.time);
    let sum = 0;
    for (let i = 0; i < this.time.length; i++) sum += this.time[i] * this.time[i];
    const rms = Math.sqrt(sum / this.time.length) + 1e-9;

    // Learn the room's noise floor for the first ~0.7s, then let it adapt slowly while quiet.
    if (!this.floor) {
      this.floorSamples.push(rms);
      if (this.floorSamples.length >= 40) {
        const s = [...this.floorSamples].sort((a, b) => a - b);
        this.floor = Math.max(0.0008, s[s.length >> 1]);
      }
      return out;
    }
    if (rms < this.floor * 1.6) this.floor = Math.max(0.0008, this.floor * 0.995 + rms * 0.005);

    this.an.getFloatFrequencyData(this.freq);
    const binHz = this.ctx.sampleRate / this.an.fftSize;
    let low = 0, high = 0, num = 0;
    for (let i = 1; i < this.freq.length; i++) {
      const f = i * binHz;
      if (f > HIGH[1]) break;
      const p = 10 ** (this.freq[i] / 10);
      if (f >= LOW[0] && f < LOW[1]) low += p;
      else if (f >= HIGH[0]) { high += p; num += f * p; }
    }
    const db = 20 * Math.log10(rms);
    const floorDb = 20 * Math.log10(this.floor);
    out.level = clamp((db - floorDb - 6) / 30);
    out.centroid = high > 0 ? num / high : 0;
    const hissy = high / (low + high + 1e-12);
    out.active = hissy > 0.6 && db > floorDb + 8 && out.centroid > 0;
    return out;
  }
}

// Demo input for rooms without a mic (or for presenting):
//   hold S → "sss", hold H → "shhh",
//   press-and-hold on the page → left edge is "shhh", right edge is "sss", anything in between.
export class Sim {
  constructor(surface) {
    this.keys = new Set();
    this.pointer = null;
    this.level = 0;
    this.cent = 5000;
    addEventListener('keydown', (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 's' || k === 'h') this.keys.add(k);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    addEventListener('blur', () => { this.keys.clear(); this.pointer = null; });
    const at = (e) => {
      const r = surface.getBoundingClientRect();
      return clamp((e.clientX - r.left) / r.width);
    };
    surface.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      this.pointer = at(e);
      surface.setPointerCapture?.(e.pointerId);
    });
    surface.addEventListener('pointermove', (e) => { if (this.pointer != null) this.pointer = at(e); });
    for (const t of ['pointerup', 'pointercancel']) surface.addEventListener(t, () => { this.pointer = null; });
  }

  get engaged() { return this.keys.size > 0 || this.pointer != null || this.level > 0.05; }

  read(dt) {
    let hz = null;
    if (this.keys.has('s')) hz = 7000;
    else if (this.keys.has('h')) hz = 3600;
    if (this.pointer != null) hz = 2800 * (8500 / 2800) ** this.pointer;
    const on = hz != null;
    this.level += ((on ? 0.75 : 0) - this.level) * Math.min(1, dt * 8);
    if (on) this.cent = hz * (1 + (Math.random() - 0.5) * 0.05);
    return { active: on && this.level > 0.15, centroid: this.cent, level: this.level };
  }
}
