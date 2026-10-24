# Aria character standard

Every playable job, and in time every person in Aria, is made to one standard, the way Ragnarok
Online builds its characters: stacked layers that snap to each other.

## Layers

Back to front, in every frame:

1. **Body.** The job's outfit, with no head. The packer (`build-tools/pack-sprites.py`, option
   `strip`) cuts the head off every frame and keeps its anchor: the neck point, plus the head's
   size in that frame.
2. **Head.** One bald head with the standard face, shared by every job (`src/art/heads.png`, row
   `bald`), the same size on every standard body. Its chin sits on the body's seat: the top of the
   collar under the old head, recorded per frame. The packer finds a bald body's head as its
   biggest patch of skin, so a staff, sword or spell beside the head isn't mistaken for it.
3. **Hair.** The hairstyle, its own layer on the head (`heads.png`, one row per style), recoloured
   by a dye. Like Ragnarok, the hairstyle stays the same through job changes; Embla the Stylist
   in Steinborg changes it.
4. **Headgear.** Face (glasses, masks: on the eyes) and Head (hats: on the crown), each snapped
   to the head layer's own measured points: crown, width and eye centres in all 8 directions.

## The face

Two large dark eyes with white highlights and small thin brows. No mouth, no nose. Every head has
it.

## Bodies

| | |
|---|---|
| Tool | PixelLab Pro (`build-tools/pixellab.py`, `pro()`) |
| Canvas | 64 × 96, low top-down view, 8 directions |
| Build | Chibi, about three heads tall, feet at the bottom centre. The same base build and pose for every job; only the outfit changes |
| Head | Generated bald, with the standard face (the packer replaces it anyway). No hood, hat or helmet is ever part of a body: those are headgear |
| Animations | Standing (8 rotations), walk (8-frame template, `skeleton-v3`), attack or cast (7 frames). No dodge |
| Style | The `STYLE` text in `pixellab.py`, with the Trainee's south view as the style reference |

## Outfits grow with the job

- **Trainee:** patched and practical. Light leather armour over linen, one small emblem.
- **First jobs (Blader, Sorcerer):** a modest uniform with one clear emblem, cooler than the
  Trainee but kept plain.
- **Second jobs (later):** armour, capes, glowing trims and larger emblems, as Ragnarok's Novice →
  Swordman → Knight grow grander.

## Heads and hair

- `build-tools/pixellab-heads.py base` makes the bald head: an 8-direction object, 48 × 48.
- `build-tools/pixellab-heads.py hair <style>` makes a hairstyle as a **state** of the bald head
  (the same head with hair), so the face never changes.
- `build-tools/pack-heads.py` writes `src/art/heads.png` and `heads.json`:
  - the bald head's geometry per direction: `chin` (the anchor), `crown`, `w` and `eyes`;
  - each hairstyle's layer: the pixels where it differs from the bald head.
- Dyes (`src/hair.js`, `DYES`) map the hair's shading onto a colour ramp, like a palette swap.

## Headgear

Made with `build-tools/pixellab-headgear.py`, packed by `pack-headgear.py`, fitted in
`src/headgear.js`:
- hats size their brim to the head layer's width and sit on its crown line (`FIT`, `TUNE`);
- face pieces put their lenses on the head layer's eye points;
- a hat hides the hair above its line, never the face.
