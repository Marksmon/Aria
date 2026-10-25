# Improvement plan (from the October 2026 play review)

A hands-on review played Aria in the browser: Base 1 to 18 the normal way (prologue, Chapters 1–2,
the Blader trial). After that it skipped grind time with EXP and perz and played the later
content: the Giant Sprout at Base 26, 30 and 36, Chapters 3–5, kobolds, refining, the Sorcerer,
the BladeMaster and the Goblin King. This plan turns its findings into work, checked against the
code. Every item names the cause, the fix, its size and how to know it is done.

Sizes: **S** = under an hour, **M** = about half a day, **L** = several days.
Before every release: `npx vite build` passes, a Playwright run covers the items (the game
exposes `window.__aria`), then merge to `main` for the APK. Anything touching jobs, skills or job
quests follows `docs/job-rules.md`.

## Status (end of October 2026)

All of R1 to R4 is done, except 4.5 (PixelLab art for the kobolds and goblins, which needs the
PixelLab key). Along the way the owner also asked for: easier first-job trials with questions, a
big map on the minimap, plain names for the field maps, goblin lands north of Galdrheim and the
kobolds west of Salt Bay, wading in lake shallows, a look of their own for every person, and
plain "Spawned / Not spawned" boss status. The balance numbers are in `docs/balance.md`. Item 2.6
(Sorcerer and Blader kill speed within 25%) was only partly met: see there.

## Order of work

| Release | Theme | Why first |
|---|---|---|
| R1 | Bugs and phone layout, plus four tiny balance fixes | Cheap, and two of them block players on real phones |
| R2 | Fight simulator, then the balance pass | The main story's Chapter 3 wall is the biggest problem, and tuning without numbers is guesswork |
| R3 | Flow and convenience | Cuts repetition and walking without new content |
| R4+ | New content | The largest jobs: quest variety, story climax, art |

---

## R1: bugs and phone layout

| # | Problem (what the review saw) | Cause in code | Fix | Size |
|---|---|---|---|---|
| 1.1 | At 780×360 the Status window's **Confirm** sits under the hotbar and can't be tapped; Skills runs off screen | `#hotbar` has a higher z-index than `#windows` on purpose (drag targets), and `menus.place()` clamps windows to the full screen height | In `place()`, keep windows above the hotbar's top edge (measure `#hotbar`) and set `maxHeight` from that. The window body already scrolls | S |
| 1.2 | "BladeMaster Lv 55 · Job 35" wraps and pushes the Job EXP bar out of the HUD box | `#info .who` wraps inside a fixed 196 px box | `white-space: nowrap` on `.who`, with ellipsis or a smaller font on `.jobname` | S |
| 1.3 | Trial steps say "No reward for this step" and then list the reward | `menus.js` ~465 prints the whole trial's reward under that line | Reword to "Paid when the whole trial is done:" before the reward | S |
| 1.4 | The "Choose Your Path" hint still says "fight to gain Job Levels" after Job 10 / Basic Training 9 | Static `hint` on the `path` step (`story.js` ~75) | Make the hint a function: once ready, say "You're ready: Captain Ulfr (Steinborg) or Archmage Vigdis (Galdrheim)" | S |
| 1.5 | Story pages open under other windows; **Next** moves as page length changes | Windows open later stack on top; the story body has no fixed height | Keep the story window above every other window while open; give its text a min-height so the buttons stay put | S |
| 1.6 | Tapping an NPC's "!" bubble does nothing | `pick()` probes spots at 15% and 55% of `sp.h`; the bubble sits above `h` | Add a third probe at the bubble's height for spots that show a mark | S |
| 1.7 | Shop has only "Sell 1" and "Sell all": keeping 20 gel meant 75 taps | `menus.js` ~491 | Add "Sell 10" and a quantity stepper, and warn when a sale would drop below what an active quest needs ("Astrid needs 20") | M |
| 1.8 | The equip grid reshuffles after each equip, so it's easy to re-equip the wrong item | `inventory.equip()` removes the new piece and appends the old one at the end | Put the old piece into the slot the new one left | S |
| 1.9 | Five identical "Bought Red Potion" toasts stack up | `menus.message()` always adds a new toast | If the newest toast has the same text, show "×5" and refresh its timer | S |
| 1.10 | Willow canopies hide the hero completely | `world.updateOcclusion()` fades only within `t.w * 0.45` sideways | Widen to about `t.w * 0.7`, and also fade a tree that hides the current target | S |
| 1.11 | Steinborg and Ember Hill at night are hard to read on a phone | `daynight.js` night key: `hemi 0.75`, tint `#7a88c0` | Raise night `hemi` to about 1.05 and lighten the tint; compare screenshots at 00:00 | S |
| 1.12 | The README says Healing/Strong/White Potion; the game says Red/Orange/White | Docs drift | Update the README tables | S |

Small balance fixes that ship with R1:

| # | Problem | Fix | Size |
|---|---|---|---|
| 1.13 | Resting refills HP in about 2.5 minutes early on (2 HP every 3 s) | `naturalRegen()`: while sitting, also heal at least 2% Max HP and 2% Max SP per tick. No change while walking | S |
| 1.14 | Fainting is a free full heal (wake at full HP for a 1% EXP loss) | `player.revive()` at 50% HP and SP; keep the 1% EXP cost | S |
| 1.15 | Lv 11 Wisps (high dodge) roam Moss Field (Lv 1–6) day and night and kill new players | `SPAWNS.grove` has 3 day and 3 night Wisps | Drop the day Wisps from `grove` and keep 2 at night; move Sigrun's Wisp quest from Base 10 to Base 14 | S |
| 1.16 | The element system punishes silently (Earth sword on Earth Sprouts = 25%) | `main.js` ~924 already colours weak hits grey | The first weak hit ever shows a one-time tip: "Earth barely hurts Earth (25%). Try a weapon of another element." Save the flag | S |

**Done when:** at 780×360 and 960×540, every window button is tappable (Playwright checks
`elementFromPoint` on Confirm, Hand in, Craft and Buy). The HUD shows all three bars for every
job name. A fresh hero at Base 5 can farm Moss Field at night without meeting a Wisp.

---

## R2: fight simulator and the balance pass

**2.0 Fight simulator (M, do first).** The `Balance 2nd job skills against the fight simulator`
commit refers to a simulator that is not in the repo. Add `build-tools/sim.mjs`. It should import
`rules.js`, `MOB_DEFS` and `SKILLS`, build a "reference hero" per Base Level (a sensible
POW/END or KNL/FNS build, shop or quest gear, a sensible skill rotation), and print, for each
monster and boss: time to kill, damage taken per minute, and potions needed. Every number below
is tuned against it and re-checked in the browser.

| # | Problem (review numbers) | Target | Levers | Size |
|---|---|---|---|---|
| 2.1 | **The Chapter 3 Giant Sprout (Lv 25) is a wall.** It's mandatory, and its hint says "Base 28 or so". The review lost at Base 26 (39 s, 15 potions) and Base 30 (2:49, 35 Orange Potions, boss at 19%), and won only at Base 36 (2 min, about 30 Orange Potions) | A Base 28 reference Blader *and* Sorcerer win in 2–3 min with 20 Orange Potions or fewer | `matron` HP 9000 to about 6500, ATK 80–108 to about 65–85, guard call at 60% to 40%. Show the hint in the Quest View and in Saeunn's lines, not only on the map | S, after 2.0 |
| 2.2 | The other mini-bosses may be just as far off their hints (King Crab, Giant Mushroom, Giant Beetle) | Each is beatable at its hinted level as above | Same levers, per boss | S |
| 2.3 | Regular monsters spike: a Lv 9 Crab nearly killed a Base 11 hero; a Lv 18 Red Sprout killed a Base 18 Blader in 16 s | A same-level reference hero wins with at least 40% HP left | Trim `crab` and `russet` ATK by about 15–20%; check every field's monsters against its README level range | S |
| 2.4 | Early grinding loses money: a crab fight costs about one 50-perz potion; loot is worth 12–30 perz | An average early kill pays at least half a Red Potion | Raise early `PRICES` (gel, seed, shell, leaf) 2–3×, or raise Berry and Crab Leg healing | S |
| 2.5 | SP runs dry about 30 s into every long fight ("Not enough SP") | The reference hero can use a skill on most swings for 60 s | Options: Battle Rhythm every 3rd hit; combat SP regen; cheaper Heavy Strike and Twin Fang. Pick one with the sim | M |
| 2.6 | A properly built Sorcerer far outpaces the Blader (one 1-second Ember Bolt killed a 1,350-HP kobold) | Kills per minute within ±25% across jobs at Base 20, 30 and 45, with and without element advantage | Spell multipliers, cast times, or Blader ATK. Also re-measure Flame Ring, which looked weak but the review couldn't confirm | M |
| 2.7 | Story rewards jump erratically (one Chapter 4 delivery: Base 39 to 44 and 20,000 perz) while the Chapter 3 boss needs levels the story hasn't given | Each chapter's rewards bring the hero to the next chapter's hinted level | Move some EXP from the Chapter 4 delivery to the Chapter 3 steps | S |
| 2.8 | No stat or skill reset, and RO formulas punish balanced and hybrid builds | One free reset, then a paid one | An NPC (e.g. Liv the Guide) offers one free stat reset and one free skill reset, then for perz. Skill reset only touches first-job trees and only before a second job is taken, so the Magic Knight and BladeMaster/Wizard gates in `docs/job-rules.md` stay intact. Add short build tips to Ulfr's and Vigdis's lines | M |

**Done when:** the simulator table is committed (`docs/balance.md`). The Giant Sprout falls to a
hand-played Base 28 hero with 20 Orange Potions or fewer. No field monster beats a same-level
reference hero.

---

## R3: flow and convenience

| # | Problem | Fix | Size |
|---|---|---|---|
| 3.1 | The Keeper network (teleport, save, storage) is only taught in Chapter 5, after hours of walking | Move the `ledger` step from Chapter 5 to Chapter 1, after `captain`. Story progress is saved by step id, so old saves are safe; players past Chapter 1 just skip it | S |
| 3.2 | Job trials send you back and forth (city, field, city, field) for trivial steps | Steps 1 and 2 of a series complete where you stand and start the next step; only the last step is handed in to the trainer. Trial pay still comes only with the last step, per `docs/job-rules.md` | S |
| 3.3 | Trial targets thin out (7 Slimes in 5 minutes on a 60 s respawn) | While a kill quest for a monster is active on its map, respawn it twice as fast | S |
| 3.4 | NPCs never react to progress (Ulfr greets a Base 55 BladeMaster with his Base 12 line) | Give the main NPCs (Elder, Ulfr, Saeunn, Vigdis, Gunnar, Hild) a greeting that depends on chapter and job, with 2–3 variants each | M |

---

## R4+: content

| # | Problem | Fix | Size |
|---|---|---|---|
| 4.1 | Every side quest is "kill N" or "bring N" (16 kill, 11 fetch) | New quest kinds, one at a time: **defend** (hold Eldrun's fire against night waves, reusing spawns and summons), **escort** (Hakon's salt cart on the Salt Road), **search** (find a lost carter with minimap pings), **timed hunt** (a night-only rare spawn). Each needs a `kind` in `quests.js`, handling in `main.js` and a progress line | L |
| 4.2 | Saga 1 builds up the Fire Giant, then ends with carrying a song home | Add a scripted Chapter 4 beat: the Giant half-wakes, and the hero must **survive** 60–90 s of his heralds while Vigdis sings (a survive goal, not a kill). The Fire Giant stays an optional MVP | L |
| 4.3 | The mini-bosses are their monster's sprite scaled and tinted | Give each mini-boss one code-painted overlay (Giant Sprout: glowing root crown; King Crab: barnacle crown; Giant Mushroom: dripping cap; Giant Beetle: ember horns), drawn like headgear | M |
| 4.4 | All 17 second-job skills reuse first-job icons (Twin Fang = Cleave, Piercing Edge = Thrust...) | Paint 17 new icons in `items.js` next to the existing `skill_*` painters | M |
| 4.5 | The code-painted kobolds and goblins don't match the PixelLab cast | Generate them with PixelLab when the key is at hand (`build-tools/pixellab.py`); they already have their own art ids | L (external) |

---

## Checked and dropped

- **"Head east to Birch Grove" while in Birch Grove:** not a bug. The tracker refreshes every
  0.5 s; the screenshot was taken the moment the hero arrived.
- **Flower Crown not visible on the hero:** unconfirmed. Check during R1 QA and fix only if it
  reproduces.
- **Frame rate:** the review ran on software WebGL with no GPU. Measure on a real phone before
  planning any performance work.
