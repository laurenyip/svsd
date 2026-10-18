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

## The book

One adventure, **Sid's Big Adventure**, told in chapters. Progress is finishing chapters, and any chapter can be
picked again to practise one sound (Home filters by SSS, SHH or both).

| # | Chapter | Sound | Sticker |
|---|---|---|---|
| 1 | A Friend for Sid: Sid hisses to call a friend | SSS | mouse |
| 2 | The Stuck Ship: SHH makes the wind | SHH | ship |
| 3 | Which Way?: sail to Shell Beach or Sunflower Hill | both | shell / sunflower |
| 4 | Quiet on Shell Beach: tiptoe past sleeping crabs | SHH | starfish |
| 5 | The Fizzy Picnic: make the lemonade fizz | SSS | glass |
| 6 | Home by Starlight: light the stars, then a lullaby | both | stars |
| 7–8 | The Choo-Choo Train, Birthday Candles | CH, F | coming soon |

Grown-ups get a **Progress report** (profile button, the grown-up sheet, or the Grown-ups tab): sessions,
hold rate per sound with a trend, session history, target width, notes, and share as text.

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
