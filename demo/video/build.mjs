// Builds the draft video's timeline (scenes + subtitle cues) and the .srt from one script.
// Run: node demo/video/build.mjs   → writes timeline.json and soundbook-draft.srt next to this file.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const here = (f) => fileURLToPath(new URL(f, import.meta.url));

// Each scene: what's on screen (v) and what Riya says (say). Durations come from the words (about 2.6 words a second).
const scenes = [
  { part: 'Context', v: { type: 'cam', note: 'Riya on camera, talking to the viewer' },
    say: 'When I was one month old, I lost about 90 to 95% of my hearing. I’ve worn hearing aids ever since. They made accessibility a lot easier, but they don’t solve every problem.' },
  { part: 'Context', v: { type: 'letters' },
    say: 'One problem is that you can’t hear some frequencies of sound, like consonants. That makes it hard to tell these sounds apart: s, f, th, sh, ch, k, p and h.' },
  { part: 'Context', v: { type: 'chair' },
    say: 'So when you’re a kid and you can’t hear them, it’s hard to learn how to pronounce words. For the longest time, I said “chair” as “shair”, because I couldn’t hear the difference.' },
  { part: 'Context', v: { type: 'cam', note: 'Riya on camera' },
    say: 'It took a lot of speech therapy. Trying to say what you literally can’t hear was frustrating and time-consuming for the child, the parent and the therapist.' },
  { part: 'Context', v: { type: 'cam', note: 'Riya on camera, lighter tone' },
    say: 'It’s like doing maths with your dad at the dinner table, but ten times worse. I wouldn’t wish it on my worst enemy. I’m traumatised to this day, and I’m not the only one.' },
  { part: 'The problem', v: { type: 'research' },
    say: 'Research shows that children with hearing loss are slowest to learn sounds like S and SH, because hearing aids can’t fully carry them. They’re asked to say sounds they can’t hear, with no way to check themselves.' },
  { part: 'The idea', v: { type: 'phone', src: 'clips/v1-loading.mp4', side: 'Soundbook', sideSub: 'See what your voice looks like' },
    say: 'So I came up with a way to visualise your voice. Soundbook is a gamified storytelling app for deaf and hard of hearing children, where they can see what their voice looks like.' },
  { part: 'The app', v: { type: 'phone', src: 'clips/v2-setup.mp4', side: 'Pick the sounds', sideSub: 'The grown-up sets up once' },
    say: 'The parent or therapist picks the family of sounds they want their child to practise. Each family of sounds is linked to a story.' },
  { part: 'The app', v: { type: 'phone', src: 'clips/v3-story.mp4', side: 'Read it together', sideSub: 'Tap “Turn the page” to flip it' },
    say: 'They pick a story and read it aloud with their child. Throughout the story, the child is asked to make letter sounds, like this.' },
  { part: 'The app', v: { type: 'split', src: 'clips/v4-hiss.mp4', note: 'Riya holding her phone, hissing into it' },
    say: 'Sssssss… I need practice, y’all. I can’t do it at my grown age.', min: 9.5 },
  { part: 'The app', v: { type: 'image', src: '../zooms/07-slider-states.png', side: 'Soft ↔ sharp', sideSub: 'Not quiet ↔ loud' },
    say: 'The slider shows the child how soft or sharp their voice is, which is very different from quiet and loud. They can see the difference between two sounds, and get better with practice.' },
  { part: 'The app', v: { type: 'phone', src: 'clips/v5-choice.mp4', side: 'Your voice steers', sideSub: 'SHH → Shell Beach · SSS → Sunflower Hill' },
    say: 'The child’s voice moves the plot forward. Here, Sid and his friend need to pick where to go. The child can make either sound to choose. I choose Shell Beach, so I say “Shhh”… and there I go.' },
  { part: 'Why it matters', v: { type: 'cam', note: 'Riya on camera' },
    say: 'Soundbook doesn’t replace speech therapy or human support. It’s a tool within speech therapy that makes learning faster, and more fun, for children with hearing loss.' },
  { part: 'How we used AI', v: { type: 'grid', srcs: ['../process/lights-star.jpg', '../process/early-star-meter.jpg', '../process/early-star-page.jpg', '../process/orb-states.jpg', '../process/glass-phones.jpg', '../process/dark.jpg'] },
    say: 'AI served as an accelerator for research and for exploring different directions, but human judgement was always needed. It showed us many directions, and we judged which ones actually worked in practice.' },
  { part: 'How we used AI', v: { type: 'grid', srcs: ['../process/lights-star.jpg', '../process/early-star-meter.jpg', '../process/glass-phones.jpg', '../process/dark.jpg'], labels: ['Particle stars', 'Glowing star orb', 'Glass sliders', 'Dark theme'] },
    say: 'Claude generated a lot of options quickly: particle stars, glowing orbs, glass sliders, dark and light themes. We asked whether each one would actually work for a five-year-old with a cochlear implant.' },
  { part: 'How we used AI', v: { type: 'compare', a: '../process/early-star-page.jpg', b: '../zooms/07-slider-states.png', la: 'Before: star target over the slider', lb: 'After: a slider between two sounds' },
    say: 'The particle star was beautiful, but children couldn’t tell which way to change their sound. So we moved to a simple slider between the two sounds.' },
  { part: 'How we used AI', v: { type: 'compare', a: '../process/glass-phones.jpg', b: '../zooms/07a-slider-idle.png', la: 'Before: glass knob', lb: 'After: high-contrast ring' },
    say: 'The glass knob looked nice but was hard to see, so we made it a plain, high-contrast ring.' },
  { part: 'How we used AI', v: { type: 'compare', a: '../process/dark.jpg', b: '../process/light1.jpg', la: 'Before: dark mode', lb: 'After: a bright storybook' },
    say: 'Dark mode looked polished, but a bright storybook felt friendlier for young children.' },
  { part: 'Our own ideas', v: { type: 'grid', srcs: ['../zooms/04-instruction-chip.png', '../zooms/11a-choice-slider.png', '../zooms/05-silhouette-hint.png'], labels: ['One-direction pages', 'Dotted target zone', 'Who’s about to appear'] },
    say: 'We didn’t just take the suggestions as they were. We added our own ideas, like one-direction pages, a dotted target zone, and a silhouette of who’s about to appear.' },
  { part: 'Our own ideas', v: { type: 'compare', a: '../process/styles.jpg', b: '../zooms/01-characters.png', la: 'Before: first-draft characters', lb: 'After: redrawn by us' },
    say: 'And we redrew the characters ourselves. AI gave us breadth; our judgement gave us the right answer, and pushed the quality higher.' },
  { part: '', v: { type: 'end' },
    say: 'Thank you for watching, and thank you for hosting the SVSD design competition.', min: 6 },
];

// split a scene's line into subtitle cues of at most ~84 characters (two lines), at sentence and then word boundaries
function cues(text) {
  const sentences = text.match(/[^.!?…]+[.!?…]+[”"’]?\s*|[^.!?…]+$/g).map((x) => x.trim()).filter(Boolean);
  const out = [];
  for (const s of sentences) {
    if (s.length <= 84) { out.push(s); continue; }
    const words = s.split(' '); let cur = '';
    const n = Math.ceil(s.length / 80), target = s.length / n;
    for (const w of words) { if (cur && (cur + ' ' + w).length > target + 8) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }
    if (cur) out.push(cur);
  }
  return out;
}
// break a cue into at most two balanced lines
function lines(c) {
  if (c.length <= 42) return [c];
  const w = c.split(' '); let best = [c], bd = 1e9;
  for (let i = 1; i < w.length; i++) { const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '), d = Math.abs(a.length - b.length); if (d < bd) { bd = d; best = [a, b]; } }
  return best;
}

let t = 0.6; // a beat before the first line
const timeline = scenes.map((s) => {
  const words = s.say.split(/\s+/).length, dur = Math.max(s.min || 0, words / 2.6 + 1.2);
  const cs = cues(s.say), total = cs.reduce((a, c) => a + c.length, 0), speak = dur - 0.8;
  let ct = t + 0.3;
  const sub = cs.map((c) => { const d = speak * c.length / total, cue = { start: +ct.toFixed(2), end: +(ct + d - 0.08).toFixed(2), lines: lines(c) }; ct += d; return cue; });
  const scene = { ...s, start: +t.toFixed(2), dur: +dur.toFixed(2), sub }; t += dur; return scene;
});
const end = +(t + 0.8).toFixed(2);
writeFileSync(here('./timeline.json'), JSON.stringify({ end, scenes: timeline }, null, 1));

const ts = (x) => { const ms = Math.round(x * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
let n = 0;
const srt = timeline.flatMap((s) => s.sub).map((c) => `${++n}\n${ts(c.start)} --> ${ts(c.end)}\n${c.lines.join('\n')}\n`).join('\n');
writeFileSync(here('./soundbook-draft.srt'), srt);
console.log(`${timeline.length} scenes, ${n} cues, ${Math.floor(end / 60)}:${String(Math.round(end % 60)).padStart(2, '0')} long`);
