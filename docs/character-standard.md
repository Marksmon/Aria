# Aria character standard

Every playable job, and in time every person in Aria, is made to one standard, the way Ragnarok
Online builds its characters: stacked layers that snap to each other.

## Layers

Back to front, in every frame:

1. **Body.** The job's outfit, generated bald, kept whole: neck, collar and shoulders exactly as
   drawn.
2. **Head.** One bald head with the standard face, shared by every job (`src/art/heads.png`, row
   `bald`), shrunk to the bodies' pixel size so one head pixel is one body pixel. The packer
   (`build-tools/pack-sprites.py`, option `bald`) places it over each frame's own head at a
   whole-pixel spot where it covers that head best, its chin no higher than the old jaw, and
   cleans away whatever of the old head would still show (filling from the clothes where that
   would open a hole). The game paints the head into each frame at that spot, so it sits on the
   body's pixel grid as if drawn with it.
3. **Hair.** The hairstyle, its own layer on the head (`heads.png`, one row per style), recoloured
   by a dye and painted into the frames with the head. Like Ragnarok, the hairstyle stays the same through job changes; Embla the Stylist
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
- `build-tools/pack-heads.py` shrinks them to the bodies' pixel size (keeping outlines whole) and
  writes `src/art/heads.png` and `heads.json`:
  - the bald head's geometry per direction: `chin` (the anchor), `crown`, `w` and `eyes`;
  - each hairstyle's layer: the pixels where it differs from the bald head.
- Dyes (`src/hair.js`, `DYES`) map the hair's shading onto a colour ramp, like a palette swap.

## Headgear

Two slots, like Ragnarok's: **Head** (hats, helmets, crowns) and **Face** (glasses, masks).

- `build-tools/pixellab-heads.py gear <id>` makes a piece as a **state** of the bald head: the
  same head wearing it. So it sits on the skull and the eyes exactly as drawn, in all 8
  directions, with no fitting.
- `build-tools/pack-heads.py` keeps only what the piece adds to the bald head, shrinks it like
  the heads, and writes `src/art/hg_<id>.png` (a row per frame for an animated piece, like the
  Flame Circlet) and `hg_<id>.json`.
- The game paints it into each body frame at the head's spot, after the hair: face piece, then
  head piece. A helmet or cap hides the hair above its brim, a crown the spikes above it; a wreath
  rests in the hair.
