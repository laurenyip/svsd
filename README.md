# Sparkbook

A picture book children draw with their voice. A prototype for speech practice with children
(roughly 4–8) who use hearing aids or cochlear implants and whose families have chosen spoken
language, with a parent or speech-language pathologist sitting beside them.

## Run

```bash
npm start
```

Then open http://localhost:5173 in Chrome, Edge or Safari and allow the microphone.
No mic? Hold **S** for "sss" or **H** for "shhh", or press and hold on the page
(left edge = shhh, right edge = sss, anything in between, which is the best way to demo "warmer").

## How a page works

1. **The page** is built around one target sound: *The snake says sss*, *The ship goes shhh*.
2. **The grown-up sets the target** by saying the sound once. Its spectral centroid becomes the
   target and a faint, breathing ghost of the picture appears.
3. **The child's voice wakes an orb.** Soft dots rest as a slowly turning 3D orb. Speaking lights them up,
   swells and ripples the orb, and lit dots glide out to roam. Where the hiss energy sits sets their character
   (`s` → smaller, quicker, shimmering aqua orbs; `sh` → bigger, slower lavender ones). Loudness sets how many wake.
4. **Warmer, not wrong.** Closeness to the target (distance in octaves) pulls the lit dots toward their
   spot in the ghost; distance lets them scatter back into the currents. There is no failure state, only
   closer or further. The flower in the corner (after Apple Watch Breathe) opens as the sound gets closer.
5. **The match completes the illustration.** Dots lit by a close sound settle into the picture.
   At 80% the rest of the orb streams into the picture in the child's own colours, the picture lifts off the page as a sticker, and the story turns the page.
6. **The book is the record.** Every finished page is saved (on this device only) under *My book*,
   with how many seconds of sound it took, so progress shows up over weeks.

## Scope

Only **s vs sh**: their acoustic difference (where the high-frequency energy sits) is clear and
robust. Pairs like **f vs th** are much harder to tell apart, even for software, and are future work.

## Code

- `js/audio.js`: mic analysis (fricative detection, spectral centroid, loudness) and demo input
- `js/particles.js`: particle field, slots in the picture, settling
- `js/shapes.js`: the pictures (snake, ship) and the story order
- `js/flower.js`: the breathing "warmer" flower
- `js/app.js`: page flow, rendering, the book
