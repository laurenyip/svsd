# Soundbook

Storybooks children move forward with their voice. A prototype for speech practice with children
(roughly 4–8) who use hearing aids or cochlear implants, in families that have chosen spoken language,
with a parent or speech-language pathologist sitting beside them.

## Run

```bash
npm start
```

Then open http://localhost:5173 (it opens Soundbook) in Chrome or Safari and allow the microphone.
No mic? Tap the round button for a demo voice, use **Play demo** in the grown-up tools, or drag the
lights onto the star.

## How a page works

1. **The grown-up reads the line.** Each page needs one held sound: SSS (snake) or SHH (wind).
   The grown-up can say it once to set the target, so it fits this child, this mic and this room.
2. **The child makes the sound.** The scene reacts: Sid's friend peeks out, the sail fills with wind.
3. **The sound star shows how close it is.** A slowly turning globe of lights lives around the target
   star. The voice makes it swell and ripple; it leans left when the sound is too soft and right when
   it's too sharp. As the sound gets accurate, the lights fold onto the star's outline and glow, and
   holding the sound fills the star. There is no failure state, only closer or further.
4. **The story moves on.** A held sound completes the page with a burst of stars, and the last page
   lets the child steer the ship with either sound.
5. **Stickers keep the record.** Every sound earns a die-cut sticker in the sticker book, with the date,
   saved on this device. Grown-ups see holds and tries per sound at the end.

## Scope

Only **SSS vs SHH**: their difference (where the high-frequency energy sits) can be detected honestly.
Pairs like **F vs TH** are much harder to tell apart, even for software, and are future work.

## Layout

- `soundbook/index.html`: the app (single file).
  `original.html` and `original-v2.html` are the earlier design versions it was built from.
- `soundbook/rewards.html`: three reward directions compared (sticker book, growing world, trophy shelf).
- `presentation/SCRIPT.md`: the presentation screenplay.
- `explorations/sparkbook/`: the first prototype (a picture book drawn with the voice), kept for reference.
- `serve.mjs`: a tiny zero-dependency static server (the mic needs `localhost` or HTTPS).
