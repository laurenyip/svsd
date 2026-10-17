import { Ear, Sim, sharpnessOf, hueOf, closenessOf, clamp } from './audio.js';
import { PAGES, STORY, VIEW, getShape, drawGhost, drawDeco, drawSticker } from './shapes.js';
import { Field } from './particles.js';
import { Flower } from './flower.js';
import { drawDots } from './render.js';
import * as store from './store.js';

const $ = (id) => document.getElementById(id);
const canvas = $('stage');
const ctx = canvas.getContext('2d');
const flower = new Flower($('flower'));
const ear = new Ear();
const sim = new Sim($('page'));

const ease = (t) => 1 - (1 - clamp(t)) ** 3;
const COMPLETE_AT = 0.8; // share of the picture the child's voice fills before the rest streams home

let mic = false;
let started = false;
let screen = 'cover';
let storyIndex = 0;
let bookReturn = 'cover';

// Page state
let pageKey = null, shape = null, field = null;
let phase = 'idle'; // intro → capture → ready → done
let target = null;
let capture = [], captureT = 0, captureQuiet = 0;
let ghostIn = 0, doneT = 0, activeTime = 0, lastHeard = -9;
let closeness = 0, sharp = 0.5;
let rings = [];
let band = '';
let advanceTimer = null;
const todays = [];

let view = { sc: 1, ox: 0, oy: 0, dpr: 1 };

/* ---------------- audio ---------------- */

async function start() {
  if (started) return;
  started = true;
  keepAwake();
  try {
    await ear.start();
    mic = true;
    setMode('🎙 Mic on');
  } catch {
    mic = false;
    setMode('Demo mode · no mic');
  }
}

// Phones: keep the screen on during a session, and wake the mic back up after the app returns
// from the background (mobile browsers suspend audio while hidden).
let wakeLock = null;
async function keepAwake() {
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !started) return;
  if (!wakeLock || wakeLock.released) keepAwake();
  ear.ctx?.resume?.();
});

// A small buzz you can feel, for phones that support it.
const buzz = (pattern) => { try { navigator.vibrate?.(pattern); } catch {} };

function setMode(text) {
  const el = $('mode');
  el.textContent = text;
  el.hidden = false;
}

/* ---------------- navigation ---------------- */

function show(id) {
  const order = ['cover', 'page', 'end', 'book'];
  for (const s of document.querySelectorAll('.screen')) {
    s.classList.toggle('is-active', s.id === id);
    s.classList.toggle('is-left', order.indexOf(s.id) < order.indexOf(id));
  }
  screen = id;
  renderDots();
}

function renderDots() {
  const nav = $('dots');
  if (!nav.children.length) {
    STORY.forEach((key, i) => {
      const b = document.createElement('button');
      b.title = key === 'cover' ? 'Cover' : key === 'end' ? 'The end' : PAGES[key].title;
      b.onclick = () => { start(); goTo(i); };
      nav.append(b);
    });
  }
  [...nav.children].forEach((b, i) => b.classList.toggle('on', screen !== 'book' && i === storyIndex));
}

async function goTo(i) {
  clearTimeout(advanceTimer);
  i = clamp(i, 0, STORY.length - 1);
  storyIndex = i;
  const key = STORY[i];
  if (key === 'cover') return show('cover');
  if (key === 'end') { renderEnd(); return show('end'); }

  const pageEl = $('page');
  if (screen === 'page') {
    const out = pageEl.animate(
      [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-48px) scale(.97)' }],
      { duration: 320, easing: 'ease-in', fill: 'forwards' });
    await new Promise((res) => setTimeout(res, 320));
    setupPage(key);
    renderDots();
    pageEl.animate(
      [{ opacity: 0, transform: 'translateX(48px) scale(.97)' }, { opacity: 1, transform: 'none' }],
      { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
    out.cancel();
  } else {
    setupPage(key);
    show('page');
  }
}

function setupPage(key) {
  const def = PAGES[key];
  pageKey = key;
  shape = getShape(key);
  field = new Field(shape.slots);
  phase = 'intro';
  target = null;
  ghostIn = 0; activeTime = 0; closeness = 0; band = '';
  rings = [];
  $('pageNo').textContent = `Page ${['zero', 'one', 'two', 'three', 'four'][STORY.indexOf(key)]}`;
  $('line').innerHTML = def.line;
  const btn = $('setBtn');
  btn.hidden = false;
  btn.className = 'pill grown';
  $('setLabel').textContent = `Grown-up: say “${def.sound}” once`;
  const next = $('nextBtn');
  next.hidden = true;
  next.classList.remove('counting');
  setStatus(`Grown-up first — tap the button and say “${def.sound}”.`);
  resize();
}

/* ---------------- page flow ---------------- */

$('setBtn').onclick = () => {
  start();
  if (phase === 'capture' || phase === 'done') return;
  phase = 'capture';
  capture = []; captureT = 0; captureQuiet = 0;
  const btn = $('setBtn');
  btn.className = 'pill grown listening';
  $('setLabel').textContent = 'Listening…';
  setStatus(`Listening to the grown-up… “${PAGES[pageKey].sound}”`);
};

function finishCapture() {
  const def = PAGES[pageKey];
  if (capture.length >= 8) {
    capture.sort((a, b) => a - b);
    target = 2 ** capture[capture.length >> 1];
    setStatus(`Got it! Your turn — read the line and make the “${def.sound}”.`);
  } else {
    target = def.defaultHz;
    setStatus(`I didn’t quite catch that, so I’ll use a typical “${def.sound}”. Your turn!`);
  }
  phase = 'ready';
  band = 'intro';
  $('setBtn').className = 'pill grown quiet';
  $('setLabel').textContent = 'Set the sound again';
}

function complete(now) {
  const def = PAGES[pageKey];
  phase = 'done';
  doneT = now;
  field.fillRest(now);
  for (let i = 0; i < 48; i++) {
    const s = shape.slots[(Math.random() * shape.slots.length) | 0];
    const d = field.dots[(Math.random() * field.dots.length) | 0];
    rings.push({
      x: s.x, y: s.y, r: 4 + Math.random() * 13,
      vx: (Math.random() - 0.5) * 50, vy: -(40 + Math.random() * 90),
      life: 1, h: d.h, delay: 0.3 + Math.random() * 1.1, seed: Math.random() * 10,
    });
  }
  const entry = {
    page: pageKey,
    date: Date.now(),
    seconds: Math.round(activeTime * 10) / 10,
    target: Math.round(target),
    dots: field.dots.map((d) => [Math.round(d.x), Math.round(d.y), Math.round(d.r * 10), d.h.map((v) => Math.round(v))]),
  };
  store.add(entry);
  buzz([40, 60, 40, 60, 120]);
  todays.push(entry);
  setStatus(def.done);
  $('setBtn').hidden = true;
  const next = $('nextBtn');
  next.hidden = false;
  next.classList.remove('counting');
  void next.offsetWidth;
  next.classList.add('counting');
  advanceTimer = setTimeout(() => goTo(storyIndex + 1), 6000);
}

$('nextBtn').onclick = () => goTo(storyIndex + 1);

function setStatus(text) {
  const el = $('status');
  if (el.textContent === text) return;
  el.textContent = text;
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}

// Coaching is only ever "closer" or "further" — never wrong.
function coach(now, active) {
  const sound = PAGES[pageKey].sound;
  let b;
  if (phase !== 'ready') b = phase;
  else if (!active && now - lastHeard > 0.7) b = 'quiet';
  else if (!active) b = band;
  else b = closeness > 0.6 ? 'close' : closeness > 0.25 ? 'warmer' : 'warm';
  const label = {
    intro: 'listening', capture: 'hearing you', done: 'you did it!',
    quiet: 'listening', warm: 'warm', warmer: 'warmer', close: 'so warm!',
  }[b] || 'listening';
  $('warmth').textContent = label;
  if (b === band) return;
  band = b;
  if (phase !== 'ready') return;
  setStatus({
    quiet: `Your turn! Read the line and say “${sound}”.`,
    warm: 'Keep going — let’s find it together ✨',
    warmer: 'Getting warmer…',
    close: 'So close — hold it!',
  }[b]);
}

/* ---------------- frame loop ---------------- */

function step(r, dt, now) {
  if (r.active) {
    lastHeard = now;
    sharp += (sharpnessOf(r.centroid) - sharp) * Math.min(1, dt * 10);
  }

  if (phase === 'capture') {
    captureT += dt;
    if (r.active) { capture.push(Math.log2(r.centroid)); captureQuiet = 0; }
    else if (capture.length >= 10) captureQuiet += dt;
    if (captureQuiet > 0.4 || captureT > 4.5) finishCapture();
  }

  const scoring = (phase === 'ready' || phase === 'done') && target;
  const raw = scoring && r.active ? closenessOf(r.centroid, target) : 0;
  if (r.active) closeness += (raw - closeness) * Math.min(1, dt * 7);
  else closeness *= Math.exp(-dt * 0.8);

  if (phase === 'ready' && r.active) activeTime += dt;
  if (r.active) field.emit(dt, r.level, sharp, now, raw);
  field.update(dt, scoring ? closeness : 0, now);
  if (phase === 'ready' && field.progress >= COMPLETE_AT) complete(now);
  if (scoring) ghostIn = Math.min(1, ghostIn + dt / 1.4);

  for (let i = rings.length - 1; i >= 0; i--) {
    const g = rings[i];
    if ((g.delay -= dt) > 0) continue;
    g.x += (g.vx + Math.sin(now * 3 + g.seed) * 30) * dt;
    g.y += g.vy * dt;
    g.life -= dt / 2.2;
    if (g.life <= 0) rings.splice(i, 1);
  }

  $('line').style.setProperty('--c', (r.active ? closeness : 0).toFixed(3));
  coach(now, r.active);
  const hue = r.active || phase === 'done' ? hueOf(sharp) : target ? hueOf(sharpnessOf(target)) : 320;
  flower.draw(now, dt, { active: r.active && !!target, closeness, hue, bloom: phase === 'done' });
  draw(now);
}

function draw(now) {
  const { sc, ox, oy, dpr } = view;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * ox, dpr * oy);

  // The ghost: the grown-up's sound, breathing softly where the picture will be.
  if (ghostIn > 0) {
    const tHue = hueOf(sharpnessOf(target));
    const breath = 0.5 + 0.5 * Math.sin((now * Math.PI * 2) / 4.5);
    const fade = phase === 'done' ? clamp(1 - (now - doneT) / 1.5) : 1;
    const a = ease(ghostIn) * fade * (0.07 + 0.04 * breath + 0.08 * closeness);
    drawGhost(ctx, shape, `hsl(${tHue} 95% 74%)`, a, 30 * dpr * sc);
    if (phase === 'ready') field.drawSlots(ctx, ease(ghostIn) * (0.12 + 0.08 * breath + 0.12 * closeness));
  }

  // When the page is finished, the picture lifts off the paper as a sticker.
  const t = phase === 'done' ? now - doneT - 0.5 : -1;
  ctx.save();
  if (t > 0) {
    const lift = 1 + 0.035 * ease(t * 3) + 0.05 * Math.exp(-t * 5) * Math.sin(t * 16);
    ctx.translate(500, 330);
    ctx.rotate(-0.03 * ease(t * 2));
    ctx.scale(lift, lift);
    ctx.translate(-500, -330);
    drawSticker(ctx, shape, ease(t * 2.5));
  }
  const shimmer = phase === 'done' ? clamp((now - doneT - 0.8) / 0.4) * clamp(1 - (now - doneT - 2.5) / 2.5) : 0;
  field.drawDots(ctx, now, shimmer);
  ctx.globalAlpha = 1;
  if (phase === 'done') drawDeco(ctx, shape, ease((now - doneT - 0.9) / 0.8));
  ctx.restore();
  field.drawParticles(ctx, now);

  ctx.lineWidth = 1.6;
  for (const g of rings) {
    if (g.delay > 0) continue;
    const a = Math.min(1, g.life * 1.5) * 0.85;
    ctx.globalAlpha = a;
    ctx.strokeStyle = `rgb(${g.h})`;
    ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = a * 0.8;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(g.x - g.r * 0.35, g.y - g.r * 0.35, g.r * 0.18, 0, Math.PI * 2); ctx.fill();
  }

  ctx.globalAlpha = 1;
}

let lastS = performance.now() / 1000;
function frame(ms, manual) {
  const now = Math.max(ms / 1000, lastS); // never run backwards (the dev hook can run ahead of the real clock)
  const dt = Math.min(0.05, now - lastS);
  lastS = now;
  const s = sim.read(dt);
  const m = mic ? ear.read() : null;
  const r = sim.engaged || !m ? s : m;
  if (screen === 'page' && field) step(r, dt, now);
  if (!manual) requestAnimationFrame(frame);
}
// Dev hook: step the simulation by hand (e.g. when the tab is hidden and rAF is paused).
window.__sparkTick = (frames = 60) => {
  for (let i = 0; i < frames; i++) frame(lastS * 1000 + 1000 / 60, true);
  return { phase, progress: field && +field.progress.toFixed(2), closeness: +closeness.toFixed(2), sharp: +sharp.toFixed(2), colours: field?.dots.slice(0, 3).map((d) => d.h.map((v) => Math.round(v)).join()), particles: field?.particles.length };
};

function resize() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (!W || !H) return;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const top = $('pageTop').offsetHeight + 14;
  const bottomH = $('pageBottom').offsetHeight;
  const availH = Math.max(120, H - top - bottomH - 6);
  const sc = Math.min((W * 0.94) / VIEW.w, availH / VIEW.h);
  const ox = (W - VIEW.w * sc) / 2;
  const oy = top + (availH - VIEW.h * sc) / 2;
  view = { sc, ox, oy, dpr };
}
new ResizeObserver(resize).observe(canvas);

/* ---------------- the book ---------------- */

function thumb(entry, title) {
  const el = document.createElement('div');
  el.className = 'thumb';
  const c = document.createElement('canvas');
  c.width = 500; c.height = 300;
  const g = c.getContext('2d');
  const sh = getShape(entry.page);
  g.translate(25, 15);
  g.scale(0.45, 0.45);
  drawSticker(g, sh, 1, 34);
  drawDots(g, entry.dots);
  drawDeco(g, sh, 1);
  const d = new Date(entry.date);
  const day = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const when = day + ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.innerHTML = `<b></b><span></span>`;
  meta.querySelector('b').textContent = title || day;
  meta.querySelector('span').textContent = `${entry.seconds} seconds of sound`;
  meta.title = `${entry.seconds}s of sound to finish · ${when}`;
  el.append(c, meta);
  return el;
}

function renderBook() {
  const { entries } = store.load();
  const wrap = $('shelves');
  wrap.innerHTML = '';
  for (const def of Object.values(PAGES)) {
    const list = entries.filter((e) => e.page === def.key);
    const shelf = document.createElement('div');
    shelf.className = 'shelf';
    const h = document.createElement('h3');
    h.textContent = def.title;
    const trend = document.createElement('p');
    trend.className = 'trend';
    if (list.length >= 2) {
      const a = list[0], b = list[list.length - 1];
      trend.textContent = `Drawn ${list.length} times · first took ${a.seconds}s of “${def.sound}”, latest took ${b.seconds}s`;
    } else if (list.length === 1) {
      trend.textContent = 'Drawn once — come back another day to add the next page.';
    } else {
      trend.textContent = 'Not drawn yet.';
    }
    shelf.append(h, trend);
    if (list.length) {
      const strip = document.createElement('div');
      strip.className = 'strip';
      list.forEach((e, i) => {
        const t = thumb(e);
        t.style.animationDelay = `${i * 60}ms`;
        strip.append(t);
      });
      shelf.append(strip);
      requestAnimationFrame(() => { strip.scrollLeft = strip.scrollWidth; });
    } else {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = `Read “${def.title}” to draw this page.`;
      shelf.append(empty);
    }
    wrap.append(shelf);
  }
}

function renderEnd() {
  $('endDate').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const box = $('endThumbs');
  box.innerHTML = '';
  const latest = {};
  for (const e of todays) latest[e.page] = e;
  const list = Object.values(latest);
  $('endSub').textContent = list.length
    ? `Your voice drew ${list.length === 1 ? 'this picture' : 'these pictures'} today.`
    : 'Read the story to fill your book with pictures.';
  list.forEach((e, i) => {
    const t = thumb(e, PAGES[e.page].title);
    t.style.animationDelay = `${150 + i * 120}ms`;
    box.append(t);
  });
}

$('bookBtn').onclick = () => {
  if (screen === 'book') return;
  clearTimeout(advanceTimer);
  bookReturn = screen;
  renderBook();
  show('book');
};
$('closeBookBtn').onclick = () => {
  if (bookReturn === 'page' && field) show('page');
  else goTo(storyIndex);
};
$('clearBtn').onclick = () => {
  if (confirm('Clear every drawing from the book? This can’t be undone.')) { store.clear(); renderBook(); }
};
$('openBookBtn').onclick = () => { bookReturn = 'end'; renderBook(); show('book'); };
$('againBtn').onclick = () => goTo(1);
$('startBtn').onclick = () => { start(); goTo(1); };

addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === 'ArrowRight') && screen === 'page' && phase === 'done') goTo(storyIndex + 1);
});

renderDots();
requestAnimationFrame(frame);

// Installable as an app (and works offline once loaded).
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
