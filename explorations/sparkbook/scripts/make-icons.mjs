// Draws the app icon (a sticker flower with a face on sunshine yellow) as PNGs, with no dependencies.
// Run: node scripts/make-icons.mjs
import { deflateSync, crc32 } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const BG = hex('#ffe45c');
const PETALS = ['#ff7a59', '#8c7cff', '#4fd6a2', '#ff8fc4', '#6cc8ff', '#b9a4ff'].map(hex);
const WHITE = [255, 255, 255], INK = hex('#17161a');

// Circles in unit space, painted in order. Content stays inside the maskable safe zone (centre 80%).
function scene() {
  const out = [];
  const petal = (i) => {
    const a = (i * Math.PI) / 3 - Math.PI / 2;
    return [0.5 + Math.cos(a) * 0.17, 0.5 + Math.sin(a) * 0.17];
  };
  for (let i = 0; i < 6; i++) out.push({ c: petal(i), r: 0.15, col: WHITE });       // sticker rim
  for (let i = 0; i < 6; i++) out.push({ c: petal(i), r: 0.125, col: PETALS[i] });  // petals
  out.push({ c: [0.5, 0.5], r: 0.11, col: WHITE });                                 // face
  for (const s of [-1, 1]) {
    out.push({ c: [0.5 + s * 0.038, 0.5], r: 0.024, col: INK });
    out.push({ c: [0.5 + s * 0.038 + 0.008, 0.5 - 0.009], r: 0.008, col: WHITE });
  }
  return out;
}

function render(size) {
  const shapes = scene();
  const px = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let col = BG.slice();
      for (const s of shapes) {
        const d = Math.hypot(x + 0.5 - s.c[0] * size, y + 0.5 - s.c[1] * size);
        const a = Math.min(1, Math.max(0, s.r * size - d + 0.5)); // anti-aliased edge
        if (a > 0) col = col.map((v, i) => v + (s.col[i] - v) * a);
      }
      px.set(col.map(Math.round), (y * size + x) * 3);
    }
  }
  return png(size, px);
}

function png(size, rgb) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) rgb.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

const dir = new URL('../icons/', import.meta.url);
mkdirSync(dir, { recursive: true });
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  writeFileSync(new URL(name, dir), render(size));
  console.log('wrote icons/' + name);
}
