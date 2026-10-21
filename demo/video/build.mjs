// Builds the draft video's timeline (scenes + subtitle cues) and the .srt from one script.
// Run: node demo/video/build.mjs   → writes timeline.json and soundbook-draft.srt next to this file.
// Riya's scenes are timed from their words (about 2.6 words a second) until she records them.
// The design section is timed to the real voiceover (VO below): each scene lasts exactly as long as its part of the recording.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const here = (f) => fileURLToPath(new URL(f, import.meta.url));

// the design-section voiceover, and where each scene's line sits in it (seconds)
const VO = { src: '../../presentation/audio/vo-design.m4a', length: 66.05 };

const scenes = [
  // ---------- Riya ----------
  { part: 'Context', v: { type: 'cam', note: 'Riya on camera, talking to the viewer' },
    say: 'When I was one month old, I lost about 90 to 95% of my hearing. I’ve worn hearing aids ever since. They made accessibility a lot easier, but they don’t solve every problem.' },
  { part: 'Context', v: { type: 'letters' },
    say: 'One problem is that you can’t hear some frequencies of sound, like consonants. That makes it hard to tell these sounds apart: s, f, th, sh, ch, k, p and h.' },
  { part: 'Context', v: { type: 'chair' },
    say: 'So when you’re a kid and you can’t hear them, it’s hard to learn how to pronounce words. For the longest time, I said “chair” as “shair”, because I couldn’t hear the difference.' },
  { part: 'Context', v: { type: 'cam', note: 'Riya on camera' },
    say: 'It took a lot of speech therapy. Trying to say what you literally can’t hear is frustrating and time-consuming for the child, the parent and the therapist.' },
  { part: 'Context', v: { type: 'camstat', note: 'Riya on camera, lighter tone', stat: 'about 34 million', statSub: 'children worldwide live with deafness or disabling hearing loss', source: 'World Health Organization' },
    say: 'It’s like doing maths with your dad at the dinner table, but ten times worse. I wouldn’t wish it on my worst enemy. I’m traumatised to this day, and I’m not the only one.' },
  { part: 'The problem', v: { type: 'research' },
    say: 'Here’s the problem we’re solving. Research shows that children with hearing loss are slowest to learn sounds like S and SH, because hearing aids can’t fully carry them. They’re asked to say sounds they can’t hear, with no way to check themselves.' },
  { part: 'The idea', v: { type: 'phone', src: 'clips2/r1-loading.mp4', side: 'SoundBook', sideSub: 'See what your voice looks like' },
    say: 'So we came up with a way to visualise your voice. Soundbook is a gamified storytelling app for deaf and hard of hearing children, where they can see what their voice sounds like.' },
  { part: 'The app', v: { type: 'phone', src: 'clips2/r2-shelf.mp4', side: 'Pick the sounds', sideSub: 'Each story practises different sounds' },
    say: 'The parent or therapist picks the family of sounds they want their child to practise. Each family of sounds is linked to a story.' },
  { part: 'The app', v: { type: 'phone', src: 'clips2/r3-story-flip.mp4', side: 'Read it together', sideSub: '“Tap to continue” turns the page' },
    say: 'They pick a story and read it aloud with their child. Throughout the story, the child is asked to make letter sounds, like this.' },
  { part: 'The app', v: { type: 'split', src: 'clips2/r4-hiss.mp4', note: 'Riya holding her phone, hissing into it' },
    say: 'Sssssss… I need practice, y’all. I can’t do it at my grown age.', min: 9 },
  { part: 'The app', v: { type: 'phone', src: 'clips2/r5-slider.mp4', side: 'Soft ↔ sharp', sideSub: 'Not quiet ↔ loud' },
    say: 'The slider shows the child how soft or sharp their voice is, which is very different from quiet and loud. They can see the difference between two sounds, and get better with practice.' },
  { part: 'The app', v: { type: 'phone', src: 'clips2/r6-choice.mp4', side: 'Your voice steers', sideSub: 'SHH → Shell Beach · SSS → Sunflower Hill' },
    say: 'The child’s voice moves the plot forward. Here, Sid and his friend need to pick where to go. The child can make either sound to choose. I choose Shell Beach, so I say “Shhh”… and there I go.' },
  // ---------- a closer look ----------
  { part: 'A closer look', v: { type: 'phone', src: 'clips2/r4-hiss.mp4', side: 'It’s listening', sideSub: 'Like the mic on a video call' },
    say: 'The mic button shows the app is listening, like on a video call. It fills green as the child makes a sound, so they know they are being heard.' },
  { part: 'A closer look', v: { type: 'phone', src: 'clips2/o1-coach.mp4', side: 'Warmer, not wrong', sideSub: '“Sharper, like a tiny whistle”' },
    say: 'There is no red X anywhere. If the sound is off, the coach says which way to go: sharper, like a tiny whistle, or softer, like quiet waves. The dotted zone fills as they hold it.' },
  { part: 'A closer look', v: { type: 'phone', src: 'clips2/r4-hiss.mp4', side: 'Who’s about to appear', sideSub: 'The reward is the story' },
    say: 'A faint silhouette hints at who is about to appear. Holding the sound brings them into the story, so the reward is the story itself, not a score.' },
  { part: 'A closer look', v: { type: 'phone', src: 'clips2/r2-shelf.mp4', side: 'A story per sound', sideSub: 'SSS, SHH, CH, F, V' },
    say: 'The story comes in chapters, and each one practises a sound. A grown-up can filter to just SSS or SHH for that day.' },
  { part: 'A closer look', v: { type: 'phone', src: 'clips2/r7-badges.mp4', side: 'Badges', sideSub: 'Every sound earns one, with the date' },
    say: 'Every sound earns a badge with the date, so children can see their practice add up.' },
  // ---------- grown-ups ----------
  { part: 'For grown-ups', v: { type: 'phone', src: 'clips2/o2-grownup.mp4', side: 'Grown-up tools', sideSub: 'Set the target, make it easier, skip' },
    say: 'Everything for adults sits behind one button. A parent or therapist can say the sound once to set the target for this child, make the target easier, skip a page, or play a demo voice.' },
  { part: 'For grown-ups', v: { type: 'phone', src: 'clips2/o3-lab.mp4', side: 'Sound lab', sideSub: 'Calibrate SHH and SSS for one child' },
    say: 'For therapists, the sound lab shows where the voice sits between SHH and SSS, and lets them calibrate both sounds for one child and one microphone.' },
  { part: 'For grown-ups', v: { type: 'phone', src: 'clips2/r8-progress.mp4', side: 'Progress', sideSub: 'Share with the speech therapist' },
    say: 'The progress report shows sessions, how often each sound was held, and the trend over time. Therapists can add notes and share it, so home practice and therapy stay connected.' },
  // ---------- product thinking ----------
  { part: 'Product thinking', v: { type: 'trio', items: [['The child', 'A story, no settings'], ['The parent', 'A simple guide beside them'], ['The therapist', 'Targets and the data']] },
    say: 'We designed for three people at once. The child gets a story with no settings. The parent gets a simple guide beside them. The therapist gets the targets and the data.' },
  { part: 'Product thinking', v: { type: 'scale' },
    say: 'We started with S and SH on purpose, because the app can tell them apart reliably. Pairs like F and TH are hard to detect, even for software, so they come next instead of being faked.' },
  { part: 'Product thinking', v: { type: 'steps', items: ['Test with speech therapists and families', 'Tune targets for hearing-aid and cochlear-implant voices', 'Add the next sounds: CH, F and V'] },
    say: 'Next, we would test with speech therapists and families, tune the targets for hearing-aid and cochlear-implant voices, and add the next sounds, like CH and F.' },
  { part: 'Why it matters', v: { type: 'cam', note: 'Riya on camera, personal and warm' },
    say: 'Speech therapy changed my life. Now my friends understand me the first time, and I don’t think twice before raising my hand in class. But that took years. Soundbook doesn’t replace speech therapy or human support. It makes the practice in between easier and more fun, so the next kid can get there faster.' },
  // ---------- design voiceover (timed to the recording; wording transcribed from it) ----------
  { part: 'How we used AI', vo: [0, 7.0], v: { type: 'grid', srcs: ['../process/lights-star.jpg', '../process/early-star-meter.jpg', '../process/early-star-page.jpg', '../process/orb-states.jpg', '../process/glass-phones.jpg', '../process/dark.jpg'] },
    say: 'AI accelerated our research and our exploring of different design directions, but we always used our own judgement to see what works.' },
  { part: 'How we used AI', vo: [7.0, 17.4], v: { type: 'grid', srcs: ['../process/lights-star.jpg', '../process/early-star-meter.jpg', '../process/glass-phones.jpg', '../process/dark.jpg'], labels: ['Particle stars', 'Glowing star orb', 'Glass sliders', 'Dark theme'] },
    say: 'Claude generated a lot of options quickly, like particle stars, glowing orbs, glass sliders, and dark and light themes. We asked ourselves whether each would actually work for a five-year-old with a cochlear implant.' },
  { part: 'How we used AI', vo: [17.4, 30.1], v: { type: 'compare', a: '../process/early-star-page.jpg', b: '../zooms/07-slider-states.png', la: 'Before: star target over the slider', lb: 'After: a slider between two sounds' },
    say: 'The particle star was beautiful, but children couldn’t tell which way to change their sound. Telling the two sounds apart was the core problem, so we moved to a simple slider between the two sounds.' },
  { part: 'How we used AI', vo: [30.1, 39.9], v: { type: 'compare', a: '../process/glass-phones.jpg', b: '../zooms/07a-slider-idle.png', la: 'Before: glass knob', lb: 'After: high-contrast ring' },
    say: 'The glass knob looked really nice, but a high-contrast ring works better to show children where their sound sits between the two sides.' },
  { part: 'How we used AI', vo: [39.9, 45.4], v: { type: 'compare', a: '../process/dark.jpg', b: '../process/light1.jpg', la: 'Before: dark mode', lb: 'After: a bright storybook' },
    say: 'Dark mode looked polished, but light mode felt more familiar, more like a storybook for children.' },
  { part: 'Our own ideas', vo: [45.4, 55.4], v: { type: 'grid', srcs: ['../zooms/04-instruction-chip.png', '../zooms/11a-choice-slider.png', '../zooms/05-silhouette-hint.png'], labels: ['One-direction pages', 'Dotted target zone', 'Who’s about to appear'] },
    say: 'We also added some of our own ideas, like one-direction pages that flip, a dotted target zone, and a silhouette of who’s about to appear.' },
  { part: 'Our own ideas', vo: [55.4, 62.6], v: { type: 'compare', a: '../process/styles.jpg', b: '../zooms/01-characters.png', la: 'Before: first-draft characters', lb: 'After: redesigned by us' },
    say: 'We also redesigned the characters. AI gave us breadth, but our judgement made the final call, and pushed the bar for quality higher.' },
  { part: '', vo: [62.6, 66.05], tail: 3, v: { type: 'end' },
    say: 'Thank you so much for hosting, and for watching.' },
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
// spread a line's cues over [from, to] by length
function spread(text, from, to) {
  const cs = cues(text), total = cs.reduce((a, c) => a + c.length, 0); let ct = from;
  return cs.map((c) => { const d = (to - from) * c.length / total, cue = { start: +ct.toFixed(2), end: +(ct + d - 0.08).toFixed(2), lines: lines(c) }; ct += d; return cue; });
}

let t = 0.6, voAt = null; // a beat before the first line
const timeline = scenes.map((s) => {
  let dur, sub;
  if (s.vo) {
    if (voAt === null) voAt = t; // the recording starts with the first voiceover scene
    t = voAt + s.vo[0]; dur = s.vo[1] - s.vo[0] + (s.tail || 0);
    sub = spread(s.say, t + 0.1, voAt + s.vo[1] - 0.15);
  } else {
    const words = s.say.split(/\s+/).length; dur = Math.max(s.min || 0, words / 2.6 + 1.2);
    sub = spread(s.say, t + 0.3, t + dur - 0.5);
  }
  const scene = { ...s, start: +t.toFixed(2), dur: +dur.toFixed(2), sub }; t += dur; return scene;
});
const end = +(t + 0.4).toFixed(2);
writeFileSync(here('./timeline.json'), JSON.stringify({ end, audio: { ...VO, at: +voAt.toFixed(2) }, scenes: timeline }, null, 1));

const ts = (x) => { const ms = Math.round(x * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
let n = 0;
const srt = timeline.flatMap((s) => s.sub).map((c) => `${++n}\n${ts(c.start)} --> ${ts(c.end)}\n${c.lines.join('\n')}\n`).join('\n');
writeFileSync(here('./soundbook-draft.srt'), srt);
console.log(`${timeline.length} scenes, ${n} cues, ${Math.floor(end / 60)}:${String(Math.round(end % 60)).padStart(2, '0')} long, voiceover at ${Math.floor(voAt / 60)}:${String(Math.round(voAt % 60)).padStart(2, '0')}`);
