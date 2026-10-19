# Soundbook: video draft

The draft cut is `demo/video/soundbook-draft.mp4`: 1920×1080, 4:10 long, with subtitles burned in. Its subtitle file is
`demo/video/soundbook-draft.srt`; load it in your editor if you'd rather have captions you can turn on and off.
The striped **Placeholder** boxes are where your filmed shots go. Everything else is final-ish app footage and cards.

The timings assume you speak at about 2.6 words a second. When you record the voiceover, slide each scene to match your
delivery, then nudge the subtitles. Every line in the .srt matches the script below word for word.

## Before filming
- **Five on-camera shots** (marked 🎥 below). Shot 4 is you holding the phone and hissing at it, filmed so it can sit beside the app clip.
- **Research card:** this is a placeholder built from Stelmachowicz et al. (2004). Swap in your screenshot, or keep the card
  if that's the source you're using.
- **"Each family of sounds is linked to a story":** in the prototype, the sounds are chapters of one book (*Sid's Big
  Adventure*). If you want to be exact, say "each sound has its own chapters in Sid's story".
- **Edits to your outline:** I kept your words and only fixed typos ("how to", "it took", "can't") and split some long sentences so the subtitles read well.

## Rebuild
Change a line in `demo/video/build.mjs`, run `node demo/video/build.mjs`, then open `demo/video/draft.html` in Chrome
(with `npm start` running) to preview it. The subtitles and the .srt regenerate from the same script.

## Scenes
| Time | Section | On screen | Riya says |
|---|---|---|---|
| 0:00 | Context | 🎥 **Film:** Riya on camera, talking to the viewer | When I was one month old, I lost about 90 to 95% of my hearing. I’ve worn hearing aids ever since. They made accessibility a lot easier, but they don’t solve every problem. |
| 0:14 | Context | Card: the sounds s, f, th, sh, ch, k, p, h pop in | One problem is that you can’t hear some frequencies of sound, like consonants. That makes it hard to tell these sounds apart: s, f, th, sh, ch, k, p and h. |
| 0:27 | Context | Card: chair vs shair | So when you’re a kid and you can’t hear them, it’s hard to learn how to pronounce words. For the longest time, I said “chair” as “shair”, because I couldn’t hear the difference. |
| 0:41 | Context | 🎥 **Film:** Riya on camera | It took a lot of speech therapy. Trying to say what you literally can’t hear was frustrating and time-consuming for the child, the parent and the therapist. |
| 0:53 | Context | 🎥 **Film:** Riya on camera, lighter tone | It’s like doing maths with your dad at the dinner table, but ten times worse. I wouldn’t wish it on my worst enemy. I’m traumatised to this day, and I’m not the only one. |
| 1:07 | The problem | Card: research and the problem (swap in your research screenshot) | Research shows that children with hearing loss are slowest to learn sounds like S and SH, because hearing aids can’t fully carry them. They’re asked to say sounds they can’t hear, with no way to check themselves. |
| 1:22 | The idea | App clip: v1-loading.mp4 | So I came up with a way to visualise your voice. Soundbook is a gamified storytelling app for deaf and hard of hearing children, where they can see what their voice looks like. |
| 1:36 | The app | App clip: v2-setup.mp4 | The parent or therapist picks the family of sounds they want their child to practise. Each family of sounds is linked to a story. |
| 1:47 | The app | App clip: v3-story.mp4 | They pick a story and read it aloud with their child. Throughout the story, the child is asked to make letter sounds, like this. |
| 1:57 | The app | 🎥 **Film:** Riya holding her phone, hissing into it, beside app clip v4-hiss.mp4 | Sssssss… I need practice, y’all. I can’t do it at my grown age. |
| 2:07 | The app | Image: 07-slider-states.png | The slider shows the child how soft or sharp their voice is, which is very different from quiet and loud. They can see the difference between two sounds, and get better with practice. |
| 2:20 | The app | App clip: v5-choice.mp4 | The child’s voice moves the plot forward. Here, Sid and his friend need to pick where to go. The child can make either sound to choose. I choose Shell Beach, so I say “Shhh”… and there I go. |
| 2:36 | Why it matters | 🎥 **Film:** Riya on camera | Soundbook doesn’t replace speech therapy or human support. It’s a tool within speech therapy that makes learning faster, and more fun, for children with hearing loss. |
| 2:47 | How we used AI | Images: lights-star.jpg, early-star-meter.jpg, early-star-page.jpg, orb-states.jpg, glass-phones.jpg, dark.jpg | AI served as an accelerator for research and for exploring different directions, but human judgement was always needed. It showed us many directions, and we judged which ones actually worked in practice. |
| 3:01 | How we used AI | Images: lights-star.jpg, early-star-meter.jpg, glass-phones.jpg, dark.jpg | Claude generated a lot of options quickly: particle stars, glowing orbs, glass sliders, dark and light themes. We asked whether each one would actually work for a five-year-old with a cochlear implant. |
| 3:14 | How we used AI | Before → after: early-star-page.jpg → 07-slider-states.png | The particle star was beautiful, but children couldn’t tell which way to change their sound. So we moved to a simple slider between the two sounds. |
| 3:26 | How we used AI | Before → after: glass-phones.jpg → 07a-slider-idle.png | The glass knob looked nice but was hard to see, so we made it a plain, high-contrast ring. |
| 3:34 | How we used AI | Before → after: dark.jpg → light1.jpg | Dark mode looked polished, but a bright storybook felt friendlier for young children. |
| 3:40 | Our own ideas | Images: 04-instruction-chip.png, 11a-choice-slider.png, 05-silhouette-hint.png | We didn’t just take the suggestions as they were. We added our own ideas, like one-direction pages, a dotted target zone, and a silhouette of who’s about to appear. |
| 3:52 | Our own ideas | Before → after: styles.jpg → 01-characters.png | And we redrew the characters ourselves. AI gave us breadth; our judgement gave us the right answer, and pushed the quality higher. |
| 4:02 | End | End card: logo | Thank you for watching, and thank you for hosting the SVSD design competition. |
