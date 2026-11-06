# Aria: game audit, November 2026

A full audit of Aria as it stands on 6 November 2026 (build 1.0.258, `main` at the story cutscenes),
written from six seats: producer, critic, developer, designer, QA tester and marketer. It is meant
to be argued with. Where the earlier reviews (`docs/improvement-plan.md`, `docs/balance.md`) already
settled something, this audit builds on them instead of repeating them.

## Status: the P0 and P1 items (done 6 November 2026)

| Item | Done |
|---|---|
| QA-1 the public signing key | A store release is a second app (`com.marksmon.aria`) signed from the repository's secrets (`.github/workflows/release.yml`, `docs/release.md`, idle until the key is added); the everyday APK keeps its key (the owner's rule); a test keeps every other keystore out |
| QA-2, QA-3 the early fields and economy | `build-tools/field-bot.cjs` plays young heroes in Moss Field, Fen Shore and Birch Grove (results in the commit) |
| Real-phone measurement | Settings → Performance: fps, slowest frame, draw calls, textures, geometries, maps built, memory. The measuring itself needs the owner's phone |
| QA-4 cutscenes clear traps | Traps and the Voodoo's dolls wait, hidden, through a cutscene |
| QA-5 memory | Only the current and last five maps stay built (`MAP_BUDGET`); geometries fell from 279 to 40 over 13 maps in a test |
| QA-7 colour-only danger | Danger circles are dashed, striped and pulse |
| QA-8 saves | Mirrored to the app's own storage on Android and restored if the WebView lost them; backup reminders |
| Window text size | Settings → Window text size; also Screen shake |
| Story pacing | Four relay talks folded in (31 talk steps → 27); the Keepers' road from a quest's Quest View |
| Quest variety | 15 quests changed kind (6 defend, 7 search, 2 quiz) and a new kind, escort (Hakon's The Salt Road): kill and fetch from 80% to 67% |
| Endless dungeon | The Deep Halls (`src/delve.js`), built and tested; by the owner's call its door opens with the fifth city (the Ship Captain's destination from Base 90, Loki the Mischiefbringer at the gate: `docs/fifth-city.md`) |
| Also found | Two crashes when a hero frame is not painted yet (`player.js`), fixed |

## How this audit knows what it says

Every finding is tagged with how sure it is:

| Tag | Meaning |
|---|---|
| **[Confirmed]** | Read in the code or data, measured in this session, or shown by the test suite |
| **[Prior review]** | Found by hands-on play in the October or November 2026 reviews (`docs/improvement-plan.md`) |
| **[Observed]** | Seen in the browser in this session (screenshots, headless Chromium) |
| **[Hypothesis]** | Likely from the evidence, but needs a test (each one says which) |
| **[Assumption]** | Market or industry knowledge, not checked against data for this audit |

What this audit did **not** have, and what would change it most:

- **No real-phone measurements.** All performance numbers below come from headless Chromium on a
  software renderer (SwiftShader, no GPU). They show where the cost is relative to other maps, not
  how fast a phone runs it.
- **No players.** No retention, session length, churn or store data exists: the game is shared as
  an APK on GitHub. Every retention and market statement is reasoning, not measurement.
- **No full hand-played run in this session.** The October review played Base 1–18 by hand and
  then sampled the later game; this audit leans on that, the data and the simulators.
- **The sound was not heard.** Audio is judged from the code (`audio.js`, synthesized) only.

### The game in numbers [Confirmed]

| | |
|---|---|
| Maps | 39 (4 cities and Eldrun Camp, about 25 fields, 2 dungeons of 4 floors, 4 raid arenas, 2 wonders) |
| Monster types | 85, of which 7 MVPs and 15 mini-bosses and raid bosses |
| Jobs | 15: the Trainee, 4 first jobs, 10 second jobs |
| Skills | 111 |
| Items | 411 (233 equipment, 24 usables, 154 materials and cards), 115 recipes |
| People | 64 with lines, 121 quests, a 67-step main story in 12 chapters plus a Prologue |
| Code | 70 modules, about 28,500 lines of JavaScript (`main.js` 3,294), 40 automated tests, 4 simulators |
| Build | One offline HTML file of 8.8 MB (5.6 MB of it art), wrapped as an Android APK |
| History | The current `main` history starts 5 November 2026 (an earlier history was replaced) |

---

## Part 1: Game overview and identity

| Aspect | What Aria is |
|---|---|
| **Title and identity** | *Aria*, subtitled in game *The Last Fire-Ring*. A Norse-flavoured valley where the first settlers keep fire-giants asleep with a ring of fires. A strong, simple hook that the story pays off. |
| **Genre** | Single-player, offline 2.5D action RPG built as a "solo MMORPG": painted sprites in a 3D world, classes, cards, refining, MVP bosses, raids. |
| **Core concept and USP** | *The classic 2000s MMORPG loop (grind, jobs, cards, MVPs), alone, offline, on a phone, with no cash shop.* That is a real gap (Part 7). |
| **Target audience** | [Assumption] Adults of about 25–40 who played the old Korean MMORPGs in the 2000s (strong in South-East Asia and Brazil) and miss them without wanting a pay-to-win online game. Second: players of offline mobile RPGs who want depth. |
| **Intended experience** | Steady, cosy progression: watch the numbers climb, find a card, beat a boss that once beat you, try another job on another slot. |
| **Core loop** | Take a quest or story step → walk to a field → tap monsters (auto-attack plus hotbar skills) → loot and level → sell drops, craft and refine gear → take on a harder field, a mini-boss, a raid or an MVP. |
| **Goals** | Short: quest and story steps, the next Job Level. Medium: first job at Trainee Job 9, second job at Job 40. Long: Base 99, every MVP, card sets in the Monster Album, achievements and titles, the secret series and the two dungeons. |
| **Modes and content** | One open world; the story (12 chapters); side and series quests; job trials; 4 raids at 5 difficulties; 2 secret dungeons; weekly hunts; 3 hero slots sharing storage. |
| **Setting** | Eldrun Camp, the stone city of Steinborg, the rune city of Galdrheim, the hunters' village of Veidheim and the desert oasis of Rytingborg, with a Giant Sphinx and Yggdrasil as wonders. Coherent and readable. |
| **Narrative** | Three sagas: putting the Fire Giant back to sleep, the goblins' backward fire-ring, and Torvald the Runecarver's betrayal, ending in a 120-second stand under the Giant's Meteor Rain. Cutscenes now open every chapter. |
| **Art** | Pixel-art sprites (PixelLab, from one style reference) standing in a low-poly world painted in code. Cohesive at field level; the cities' blocky geometry and the code-painted kobolds and goblins are the weakest parts. |
| **Audio** | Everything synthesized in code, with music by place (towns, fields, desert, dungeons, wonders, boss fights). Not heard for this audit. |
| **Platform** | Android (Capacitor APK, landscape), playable in a desktop browser. No iOS build, no store listing. |
| **Business model** | None. The APK is free on GitHub; there are no ads and no purchases. |
| **Competitive position** | An offline, cash-shop-free alternative to the official mobile MMORPGs of the same lineage (Part 7). |

**Verdict on identity.** Aria knows what it is. "The old MMORPG, alone and offline, with no cash
shop" is clear and the gameplay delivers it. The risk is the opposite of a muddled identity: the
identity leans so closely on one existing game (Ragnarok Online) that the design notes in this
repository use its formulas, its walk times and its card art as the reference. That is fine for a
hobby project. It becomes the main business risk if Aria is ever sold (Part 4, Threats).

---

## Part 2: Every aspect

Priority: **P0** do now, **P1** next, **P2** later, **P3** nice to have. N/A where the aspect does
not fit a single-player offline game.

### A. Gameplay and mechanics

| Aspect | Current | Strengths | Weaknesses and problems | Recommendation | Priority |
|---|---|---|---|---|---|
| Core loop | Tap to fight, loot, sell, craft, level [Confirmed] | Proven, compulsive, readable on a phone | Battles are low in moment-to-moment input: one tap starts an auto-attack | Keep. Put the depth in boss fights and builds, which Aria already does | — |
| Controls | Tap to walk or hold to steer, tap to target, hotbar of 8 with 3 pages, camera drag and pinch [Confirmed] | No virtual stick: it fits one-handed play and the genre | Small targets on a phone; the October review found taps that missed ("!" bubbles), since fixed | Test every hit area on a 5.5" phone (Phase 2) | P2 |
| Movement | Ragnarok walk times, doubled for Aria's small maps; no lasting haste (owner's rule) [Confirmed] | Consistent; speed keeps its value as a reward | Long walks between story people (below) | Keep the rule; cut the walking, not the speed | — |
| Combat | Elements, crit, flee, status, skills with weapon rules, boss AI with predictions, Tremor against standing still [Confirmed] | Deep for a phone game; bosses that punish stand-and-trade is a real design choice | Field fights are solved by stats; little to do except watch HP | Give field monsters the occasional tell (a wind-up the hero can step out of), like the bosses already have | P2 |
| Skills | 111 skills, 3–4 actives per second job, passives on top [Confirmed] | The owner's 3–4-actives rule keeps the hotbar readable | Several first-job skills are reskins of each other (the 2026 icon review found 17 shared icons, since repainted) | Keep the cap | — |
| Objectives | 121 quests: 65 kill, 32 fetch, 11 quiz, 7 search, 3 defend, 2 visit, 1 deliver [Confirmed] | Kinds beyond kill and fetch exist and work | 80% of quests are kill or fetch; the planned escort quest never came (`improvement-plan.md` 4.1) | Turn 15–20 of the kill and fetch quests into kinds that already exist (search, defend, survive, quiz); add escort | P1 |
| Difficulty | Tuned with simulators and test bands; MVPs by tier [Confirmed] | Numbers back the targets; `npm test` fails when a band drifts | The tuning target moves often (today: quests pay 40% of their perz, 10 more monsters a map) | Freeze the economy for a release and play Base 1–20 by hand before the next change | P0 |
| Freedom and agency | Open maps, any order after the story's gates, 3 slots, 15 jobs, stat builds, resets at the trainers [Confirmed] | Strong: builds are the player's (the owner's rule: lessons never spend a point) | Story choices change nothing but the first job | Fine for the genre | — |
| Variety | Fields, mazes, raids, MVP mechanics, stands, searches, secret series | Each MVP has its own mechanic: rare in this genre | Fields look and play alike (open squares of trees and rocks) | One landmark or hazard per field (Part 2D) | P2 |
| Replayability | 3 slots, 15 jobs, card sets, achievements | Trying a second build is the genre's best replay hook | The story replays the same way | A "New hero, skip the Prologue" option for a second slot | P2 |
| Risk and reward | Fainting costs 1% EXP; MVP pity; raids pay nothing on a loss | Fair, no harsh punishment | Low tension in the fields | Fine for a cosy target audience | — |
| Skill floor and ceiling | Low floor (guided lessons), ceiling in builds and bosses | Good spread | The ceiling is in menus more than in hands | Fine for the audience | — |

### B. Systems and features

| Aspect | Current | Assessment | Recommendation | Priority |
|---|---|---|---|---|
| Characters and classes | 15 jobs, each second job with its own mechanic and trait (`JOB_TRAITS`) [Confirmed] | The strongest system. The cross jobs (Shadowblade, Hunter, Voodoo, Beastmaster, Moon Ranger, Magic Knight) each play differently | Retain; no new jobs before the fifth city | — |
| Equipment and inventory | Slots incl. Head, Face, Wings, Arrows, dual daggers; 300-slot shared storage | Rich; wings and headgear are a strong cosmetic layer | Inventory UX is dense on a phone (prior review) | P2 |
| Crafting and upgrading | 115 recipes, refining with breaks, card slots | Classic and working; refining gives a real gamble | Fine | — |
| Progression | Base 1–99, Job Levels, 3 sagas | Long, with clear gates | Base 75–99 is steep (left open in the November review); nothing after 99 | Part 6: an endless dungeon | P1 |
| Economy | Perz from drops; quests now pay 40% and the story 50% of their old perz (merged today) | Selling drops as the main income fits the genre | [Hypothesis] Early heroes may lose money: the October review found a Crab fight cost a Red Potion. Test: perz per hour against potion spend at Base 5–15 after today's change | P0 |
| Trading | NPC shops only | N/A for offline | — | — |
| Achievements and collectibles | 18 achievements with titles; Monster Album with 8 set bonuses; card paintings | Good long goals for completionists | — | — |
| Customization | Body, 4 hairstyles (2 per body), hair colour, headgear, face pieces, wings | Wings and headgear are the right cosmetic layer | Only 2 hairstyles per body | More hairstyles are cheap and loved by this audience | P2 |
| Social, multiplayer, matchmaking, ranking | None | N/A by design (offline). A gap for retention (Part 6: asynchronous ideas need no server) | — | — |

### C. Balance

| Area | State | Finding | Priority |
|---|---|---|---|
| Classes | Sim bands enforced by tests (`second-sim`, `mvp-sim --check`) [Confirmed] | A real strength: every balance claim in `CLAUDE.md` has a number behind it | — |
| Blader vs Sorcerer early | Only partly met (2.6 in the plan) [Prior review] | The Sorcerer against Water monsters early was left for the owner | P2 |
| Bosses | Tiered (Base 75/85/95), 3–6 minutes on 100 White Potions [Confirmed] | Well defined. 100 potions per fight is a lot of shopping on a phone | Consider a potion "quiver" (one slot holds 100) | P3 |
| Field density | +10 monsters a map by day, half return in 25 s anywhere (merged today) [Confirmed] | Fen Shore (a Trainee's field) now has 14 Blue Bloops and 12 Crabs by day, up from 9 and 7. The October review saw a Lv 9 Crab nearly kill a Base 11 hero | P0 test: a fresh Base 8–12 hero in Fen Shore for 10 minutes; count deaths and potions |
| Power creep | MVP gear spread over every MVP; ultra rares with all stats +3 | Contained by tiers | — |
| Dominant strategies | [Hypothesis] Ranged kiting in fields; boss AI and Tremor already answer it at bosses | Watch in the sims | P3 |
| Pay-to-win | None (no monetization) | Keep it so (Part 2J) | — |

### D. Level and world design

| Aspect | Finding | Recommendation | Priority |
|---|---|---|---|
| Maps | 64×64 squares joined by edge portals; fields decorated from a seed [Confirmed] | Even and readable, but samey: a field is known by its monsters, not its shape | One set piece per field (a ruined tower, a collapsed bridge, a camp), reusing the city and monument builders | P2 |
| Landmarks | The Giant Sphinx and Yggdrasil are excellent [Observed] | They are the most memorable places in the game: secrets that look the part | Retain; make each city as recognisable from the air | — |
| Navigation | Quest tracker with directions, minimap rings, big map that walks you there, Keepers' teleports, carters [Confirmed] | Very good for a phone | — | — |
| Backtracking | 31 of 67 story steps are talks; Archmage Vigdis is visited about 8 times [Confirmed] | The story sends the hero back and forth between cities | Merge consecutive talks; let a story talk step offer the Keeper's road to that person | P1 |
| Encounters | Fixed spawn lists; bosses roam their whole map; support monsters; boss A* pathing | Good systems. Fields are uniform carpets of monsters | Packs and camps (a leader plus followers) in a few fields | P2 |
| Dungeons | Mazes from a seed with dither-cut walls; great halls alone [Confirmed] | Good tech that is under-used (8 floors in all) | Reuse it for an endless dungeon (Part 6) | P1 |
| World consistency | Each region has a set, music, palette | Strong | — | — |

### E. Narrative and lore

| Aspect | Finding | Priority |
|---|---|---|
| Main story | Three sagas with a clear arc and a payoff; Torvald's twist is planted (he sends the hero after the goblins' runes himself) [Confirmed] | — |
| Pacing | Mostly talk, visit and kill steps; 6 stands and 4 searches give it set pieces. Much of the story is read, not played | P1 (see 2D backtracking) |
| Characters | Halvard, Vigdis, Saeunn and Torvald carry the story; most others say a quest's worth of lines and some lore | Give 3–4 people a small arc that runs across chapters (Hakon the Carter, Dag the Miner) | P2 |
| Dialogue | Plain, warm, consistent tone; the owner's rule keeps names plain | Fits the audience | — |
| Lore consistency | Nine jotnar, the Watchers, three wells, the Wolf's Eye: threads are planted and picked up [Confirmed] | — |
| Player choice | The Seeress's reading and the first-job pick; nothing else branches | Acceptable for the genre | — |
| Integration | The climax uses a real boss move (Meteor Rain) in a story stand; secrets are found by walking the world | Good | — |

### F. Visual and audio design

| Aspect | Finding | Priority |
|---|---|---|
| Characters | PixelLab cast share one look; second jobs have their own sheets [Confirmed] | — |
| Monsters | The dungeon monsters each have a design of their own (owner's call); the kobolds and goblins are still code-painted and don't match the PixelLab cast (plan 4.5, open) | P2 |
| Environments | Fields and wonders read well. Cities' houses are plain boxes with a roof; in cutscenes they fill the camera [Observed] | P2 |
| UI visual identity | A consistent parchment-and-gold window style | — |
| Animation | 4 directions, walk and attack; wings animate at rest | Fine for the style |
| Effects and lighting | Day and night, fog, dungeon torchlight, telegraph circles | Good |
| Readability | Telegraphs and Tremor are red circles: they rely on colour alone (Part 2K) | P1 |
| Sound and music | Synthesized; music by place; no recorded music [Confirmed, not heard] | A short original soundtrack would lift the whole game more than any single feature (Part 5A) | P2 |
| Voice | N/A (none; not expected) | — |

### G. UI and UX

| Aspect | Finding | Priority |
|---|---|---|
| Title and slots | Three slots, a turning hero, backup and restore codes [Confirmed] | — |
| HUD | Folding hero panel, quest list that steps back in a fight, buff bar, beasts' bars, interface size setting | Good, but busy on a 5.5" landscape screen [Hypothesis: test with a new player] | P2 |
| Windows | Status, Equip, Items, Skills, Quests, Raids, Settings, Album, Goals, shops, crafters, storage | Rich; the window count is the price of the genre | — |
| Tutorial and onboarding | Guided Prologue lessons with rings, bubbles and a drag hand; a lesson per first job and per crafter [Confirmed] | One of the best parts of the game | — |
| Information clarity | Long tooltips and quest text; the README's own control table runs to 25 rows | Players will not read all of it. Add a one-screen "What can I do now?" in the Quests window (next story step, a quest near your level, a field for your level) | P2 |
| Quality of life | Big-map walking, Keepers, carters, shared storage, Sell 10, toast stacking, quest-aware selling warnings | Strong | — |
| Controller | N/A on a phone; keyboard works on desktop | — |

### H. Technical performance

| Aspect | Finding | Priority |
|---|---|---|
| Frame rate | In software rendering, fields ran at 26–29 fps and cities at 14–17 fps. Steinborg made 173 draw calls against 45–69 in the fields [Observed]. Relative only: a phone GPU will differ | P0: measure on a low-end phone |
| Memory | Textures rose from 33 to 250 and geometries from 5 to 281 over 8 maps; JS heap from 44 to 77 MB [Observed]. Built maps are kept for good | P1: evict the least recently used maps past a budget [Hypothesis: a long session on a 2–3 GB phone may be killed in the background] |
| Loading | First boot 1.8–3.1 s on a desktop; 8.8 MB single HTML with the art inside it as base64 [Confirmed] | P2: the APK can ship the art as files (Capacitor serves them locally); keep the single file for the web |
| Stability | 40 tests and a smoke test on every push; the smoke test walks all 39 maps with no page error [Confirmed] | — |
| Saves | `localStorage` with a backup copy a minute old, and manual save codes [Confirmed] | P1: the OS or "Clear data" wipes WebView storage. Also write to Capacitor's file storage, and remind the player to back up after milestones |
| Architecture | `main.js` split into `install<Name>(ctx)` modules (bossmoves, stands, questworld, raids, lessons); data in their own files | Good direction; keep going until `main.js` is wiring only | P2 |
| Network, servers, latency, anti-cheat | N/A (offline, single player) | — |
| Security | **The APK signing keystore is committed to a public repository** (`build-tools/debug.keystore`; the repository is public) [Confirmed] | **P0**: see QA-1 |

### I. Engagement and retention

| Aspect | Finding | Priority |
|---|---|---|
| First hour | Opening cutscene, hero making, guided Prologue, first job at Trainee Job 9: short by design [Confirmed] | — |
| Learning curve | Gentle start, then a cliff of systems (cards, refining, elements, raids) arriving in a few hours | A "systems unlock" pacing pass: one new system per chapter, each with its lesson | P2 |
| Weekly | Three weekly hunts, paid at once [Confirmed] | Good, light-touch | — |
| Daily | None | Deliberately none is fine; a gentle daily (Part 6) could help | P3 |
| Long term | Base 99, every MVP, album sets, achievements, the dungeons | Large, but nothing repeatable scales past 99 | P1 (endless dungeon) |
| Social | None | Asynchronous sharing (Part 6) | P2 |
| Burnout | 3-hour raid cooldown and 100-potion boss fights limit binging | Healthy | — |
| Churn risks | [Hypothesis] The jump from Trainee fields to the Chapter 3–5 fights; long walks between story talks; saves lost to cleared app data | See P0–P1 items | — |

### J. Monetization

There is none, and that is currently a feature: "no cash shop" is half of the pitch. If the owner
ever charges:

| Option | Fit | Risk |
|---|---|---|
| Premium price, one time | Best fit with the "no cash shop" promise | Small paying audience for an unknown title |
| Free with a one-time "Supporter" unlock (cosmetic wings and headgear, extra hero slots) | Good: Aria already has a strong cosmetic layer (wings, headgear) | Must stay cosmetic |
| Ads | Poor fit | Breaks the cosy tone |
| Gacha, card packs, stat boosts | **Do not**: a 0.1% card rate sold for money is exactly what the audience fled from | Destroys trust |

Before any money changes hands, get legal advice on the closeness to Ragnarok Online (Part 4).

### K. Accessibility and inclusivity

| Aspect | Finding | Priority |
|---|---|---|
| Difficulty options | None; difficulty lives in levels and raid tiers | P3 |
| Remapping | N/A for touch; keyboard fixed | — |
| Colour-blind support | None. Meteor Rain, Tremor and boss telegraphs are red circles; element weakness is shown by grey numbers [Confirmed] | **P1**: give danger circles a pattern or pulse, not only a colour |
| Text size | Interface size scales the HUD, not the windows (by design) [Confirmed] | **P1**: a separate window text size |
| Motion | Camera shake in stands, boss moves and cutscenes; no setting [Confirmed] | P2: a "Screen shake" toggle |
| Subtitles | All story text is on screen | — |
| Language | English only; text lives inline in the data files | P2: pull strings into one table before a translation is wanted |
| Representation | Male and female bodies, varied cast | Fine |

### L. Marketing and market position

| Aspect | Finding |
|---|---|
| Audience | [Assumption] Nostalgic old-school MMORPG players; offline mobile RPG players |
| Demand | [Assumption] The official mobile MMORPGs of the same lineage still run, which shows the nostalgia market exists; their monetization is what many players complain about |
| USP | Offline, no cash shop, deep classic systems, playable on the bus |
| Brand | A good name and a good subtitle; no logo, icon set, trailer or store page yet |
| Content creators | Strong raw material: MVP mechanics, card paintings, wings, secret series, cutscenes that already film the real maps |
| Launch | Nothing in place: no store listing, no community, no press kit |

---

## Part 3: Six perspectives

### 1. Producer

**Direction.** Clear and owner-led: `CLAUDE.md` holds about 40 recorded decisions, and the roadmap
says the first half ends with the fifth early city. That clarity is the project's best production
asset.

**Scope.** This is the main concern. In about two weeks of recorded history the game gained the Monster Album,
Goals, battle oils, stat foods, support monsters, Tremor, MVP tiers, a third saga, cutscenes and an
economy change. Each is good. Together they mean the target keeps moving and nothing gets a hand-played
balance pass before the next system lands. The fifth city, the stated milestone, has not been started.

**Priorities.** (1) Protect players: the signing key and saves. (2) Finish the first half: the fifth city
and its story chapter. (3) Freeze systems until then; only fixes, tuning and content.

**Risks.** A single maintainer working through AI sessions with no player data; balance changes landing
without play; legal exposure if commercialized.

**Commercial potential.** Low today (no distribution), real later in a niche, if the legal question is
answered first.

### 2. Critic

Aria is better than its "hobby clone" surface suggests. Its secrets are the best thing in it: walking
four deserts unlocks a series that ends with a giant stone face opening its chest; planting a seed in
an old forest grows a path to a tree that fills the sky. Its MVPs each ask a question (a riddle in
three circles, a race to tear the dragon from the roots) where most of the genre asks only for a
bigger number.

Where it falls short: the fields feel like the same square with different monsters on it; the story
is mostly read rather than played (31 of 67 steps are conversations); the cities look like blocks; the
music is synthesized, so the moments that should swell don't. Moment to moment, combat is tap and
watch. It is a game you settle into, not one that grabs you.

Honest score: a good, generous, heartfelt game for its audience (6.5 of 10, Part 8), held back by
presentation more than by design.

### 3. Developer

**Healthy.** Module split with `install<Name>(ctx)`; data separated from logic; 40 tests covering rules,
data integrity, saves and balance bands; simulators wired into the tests; a smoke test of the built game
in CI; lazy building of maps, sprites and animation frames.

**Risks and fixes.**

| Issue | Evidence | Fix |
|---|---|---|
| Signing key in a public repo | `build-tools/debug.keystore` is tracked; the repository is public | QA-1 |
| Memory grows with every map visited | Textures 33 → 250 over 8 maps | Keep the current map and its neighbours; dispose the rest (materials, textures, geometries) and rebuild on return. `fieldAt` already restores monsters, so only the scene graph is lost |
| City draw calls | 173 in Steinborg | Merge each city's static meshes by material (`BufferGeometryUtils.mergeGeometries`) or instance the repeated houses |
| 8.8 MB single file | Art inlined as base64 | For the APK, ship assets as files; keep single-file for the web build |
| Saves in WebView storage | `save.js` uses `localStorage` | Mirror to Capacitor Filesystem; read the newer of the two |
| `main.js` still 3,294 lines | Line count | Continue the split: input and targeting, the HUD, the hotbar wiring, the cutscene and camera code |
| Strings inline in data | Story and quest text inside `story.js` and `quests.js` | Only matters before a translation; plan it, don't do it yet |

### 4. Designer

**Works.** The job tree and cross jobs; MVP mechanics with matchups and tiers; guided onboarding; the
rule that lessons never spend a point; map persistence (monsters, drops and bosses as you left them);
secrets gated by walking, not by levels.

**Proposed changes.**

1. **Quest kinds.** Turn 15–20 kill or fetch quests into the kinds the engine already has. Example:
   Sigrun's Wisp quest becomes a night-only search; a fetch for Crab Legs becomes a defend at the
   salt carts.
2. **Story travel.** When the next story step is a talk in another city, offer "Go to Vigdis" through the
   Keeper network for its fare. The walking stays optional.
3. **Field identity.** One set piece per field: a fallen watchtower in Moss Field, a sunk ship in Salt
   Bay, a burning farmhouse in Ash Heath. Each can host an existing quest kind.
4. **Field tells.** Give 1 in 5 field monster types a wind-up move the hero can step out of. It teaches
   what the bosses demand, before the bosses.
5. **After Base 99.** An endless seeded dungeon (Part 6).

### 5. QA tester

Findings, worst first. Each has a way to check it.

| # | Finding | Type | Evidence | Repro or test |
|---|---|---|---|---|
| QA-1 | **The signing key is public.** Anyone can sign an APK that Android accepts as an update to Aria, which would then read the players' saves and run with Aria's permissions | Security | [Confirmed] tracked file, public repo | `git ls-files build-tools/debug.keystore`; repository visibility "public". Mitigation in Part 9 |
| QA-2 | Fen Shore and Moss Field are much fuller by day since today's merge (Fen: Blue Bloops 9 → 14, Crabs 7 → 12; Moss Field: Bloops 12 → 17, Sprouts 9 → 14), and half come back in 25 s anywhere | Balance | [Confirmed] `spawns.js` diff | A fresh hero, Base 8 to 12, 10 minutes in Fen Shore by day: count deaths, potions used, perz earned. Pass: no deaths with sensible play, perz positive |
| QA-3 | Quests now pay 40% of their perz, the story 50%: early potion money may run short | Economy | [Confirmed] `QUEST_PERZ`, `STORY_PERZ` | Base 1 to 20 by hand: perz in hand at each chapter start against the price of 20 Red or Orange Potions |
| QA-4 | A story cutscene clears a Hunter's set traps and a Voodoo's Substitute doll, if its shots go to another map | Functional (new code) | [Confirmed] `playScene` → `cineShot` → `enterMap` → `clearTraps(); doll = null` | As a Hunter, set a trap in a field, finish a story step that opens a chapter, watch the cutscene: the trap is gone afterwards. Fix: keep traps and the doll across `playScene` |
| QA-5 | Memory rises with each map entered and is never released | Performance | [Observed] textures 33 → 250 | On a 2–3 GB Android phone, walk 20 maps in one session; watch for the app being killed in the background or a WebView crash |
| QA-6 | Cities render at about half the frame rate of fields | Performance | [Observed] 14–17 vs 26–29 fps, 173 draw calls | On a low-end phone with Graphics: Fast, stand in Steinborg's square at night; record fps |
| QA-7 | Danger circles rely on red alone | Accessibility | [Confirmed] | View the Last Fire-Ring stand through a deuteranopia filter (Chrome DevTools: Rendering → Emulate vision deficiencies) |
| QA-8 | Saves can be lost to "Clear data" or an OS cleanup | Data | [Confirmed] `localStorage` only | Clear the app's storage in Android settings: every hero is gone unless a code was copied |
| QA-9 | Long boss fights need up to 100 White Potions: a lot of shop taps | Frustration | [Confirmed] tier target | Time the shopping for one MVP attempt |
| QA-10 | Kobolds and goblins don't match the PixelLab cast | Visual | [Prior review] plan 4.5 | Side-by-side screenshot |

Edge cases worth a scripted test (the cutscenes are new): close the app mid-cutscene and reopen (the game
saves just before a scene, so the hero should load where they stood); faint just as a step finishes (the
scene should wait); ▶ Watch during a night-only rare hunt; ▶ Watch inside a dungeon floor.

### 6. Marketer

**Would make players download.** "Old-school MMORPG, offline, no cash shop" in one line; a 30-second
trailer of MVP mechanics, the Sphinx opening and wings; card paintings as share-worthy images.

**Would make players recommend it.** The secrets (they spread by word of mouth: "walk all four deserts
and…"); the builds; the cosy pace.

**Would make players leave.** Losing a save; a slow phone in the cities; nothing to do after 99; a
store page that looks like a clone of a game they already know.

**Positioning.** Not "Ragnarok offline", which is legally and commercially weak, but *a Norse fairy-tale
MMORPG you play alone*: fire-giants, rune-cities, a World Tree. Aria's own world is distinctive enough
to stand on.

**Gaps.** No store presence, icon, trailer, press kit, community channel, or iOS.

---

## Part 4: SWOT

### Strengths

| Strength | Why it matters | Impact | How to maximize |
|---|---|---|---|
| Deep classic systems (15 jobs, cards, refining, elements, MVP mechanics) | Depth is what the audience misses | High | Show it in a trailer; keep the "unique mechanic per second job" rule |
| Offline, no cash shop | A trust promise competitors can't make | High | Make it the tagline; never sell power |
| Secrets and wonders (Sphinx, Yggdrasil) | Word-of-mouth content | Medium–high | One secret per new city |
| Rules recorded and tested (`CLAUDE.md` plus 40 tests and sims) | Changes don't silently break balance | High (internal) | Keep "a new rule gets a test" |
| Guided onboarding | First-hour retention | High | Extend the same lessons to every new system |
| Persistent world (maps as you left them) | Feels alive | Medium | Retain |

### Weaknesses

| Weakness | Why it matters | Impact | How to mitigate |
|---|---|---|---|
| Public signing key | Player safety | Critical | Part 9, Phase 1 |
| Presentation: blocky cities, synthesized audio, samey fields | First impressions and trailers | High | Set pieces, a city art pass, a soundtrack |
| Read-heavy story with back-and-forth walking | Pacing | Medium | Merge talks, Keeper links, more stands |
| No endgame loop after 99 | Long-term retention | Medium | Endless dungeon |
| Balance changes without hand play | Hidden early-game regressions | Medium | A release checklist with a Base 1–20 run |
| Performance unknown on real phones | Ratings | High (unknown) | Measure first |
| Accessibility minimal | Excludes players; store-review friction | Medium | Colour-independent telegraphs, text size, shake toggle |

### Opportunities

| Opportunity | Why | How |
|---|---|---|
| Players tired of cash-shop MMORPGs | [Assumption] A long-standing complaint about the genre's mobile titles | Position on fairness |
| Offline and premium mobile games are accepted | [Assumption] Premium offline RPGs sell on mobile (Part 7) | A one-time price or supporter pack |
| Content creators | MVP fights and secrets make good videos | A press kit and seeds of the secrets for creators |
| Asynchronous social without servers | Save codes already exist | Share a hero as a code; fight beside a friend's "shade" (Part 6) |
| The second half (five late-game cities) | A natural "expansion" | Price or launch it as an expansion |

### Threats

| Threat | Why | How to mitigate |
|---|---|---|
| **Legal: closeness to Ragnarok Online** | [Hypothesis, not legal advice] Game mechanics are generally not protected, but names, art and look can be. The public design notes cite Ragnarok's formulas, walk times and card art ("after the Ragnarok card art"), and the PixelLab style reference was a Ragnarok image | Before any commercial release, a lawyer's review; keep the README rule; consider a distinct card frame and style reference; keep "MVP" generic or rename |
| A malicious APK signed with the public key | QA-1 | Phase 1 |
| Store rejection | [Assumption] Stores ask for a release key, a target API level, privacy disclosures | Prepare a Play-ready build pipeline |
| Platform churn (WebView, Android versions) | Capacitor and WebView updates | Keep the smoke test; add a device test |
| Burnout of a single maintainer | Scope sprawl | Freeze systems until the fifth city |

### Strategies

- **SO (strengths × opportunities):** Lead the launch with "no cash shop, all the depth" and the secrets;
  give creators the trailer footage the cutscene engine can already film from the real maps.
- **WO (fix weaknesses to seize opportunities):** A presentation pass (city art, a soundtrack, field set
  pieces) before any store page, because the opportunity is decided by screenshots.
- **ST (strengths against threats):** Lean on Aria's own world (fire-giants, rune cities, Yggdrasil) and
  its own card art so the identity stands apart from its inspiration.
- **WT (shrink weaknesses and threats):** Retire the public key, protect saves, measure on real phones,
  and get legal advice before money.

---

## Part 5: Feature audit

### A. What to include

| Feature | Purpose | Player benefit | Business benefit | Implementation | Priority |
|---|---|---|---|---|---|
| A new signing key for any public release, kept in CI secrets, with save-code migration | Close QA-1 | Safe updates | Store-ready | New application id and key for the store app; the old APK keeps its key (the owner's rule) and players move with Back up / Restore save | P0 |
| Save mirrored to app files plus backup reminders | Protect progress | No lost heroes | Fewer 1-star reviews | Capacitor Filesystem; a nudge after each chapter | P1 |
| Colour-independent danger circles, window text size, screen-shake toggle | Accessibility | Playable for more people | Wider reach | Settings plus pattern rings | P1 |
| Endless seeded dungeon ("the Deep Halls") | A post-99 loop | Infinite goals | Retention | `dungeon.js` mazes with a rising seed and scaling monsters; a floor record in Goals | P1 |
| Map memory budget | Stability | No crashes | Ratings | Dispose least-recently-used maps | P1 |
| Escort quests, more search, defend and survive quests | Variety | Less kill-and-fetch | Retention | Engine already has the kinds; escort is new | P1 |
| An original soundtrack (5–8 tracks) | Presentation | Emotion | Trailer quality | Commission or license; `audio.js` can play files | P2 |
| Field set pieces | World identity | Memorable places | Screenshots | Reuse city and monument builders | P2 |
| "What can I do now?" panel | Clarity | Less confusion | Retention | Quests window: next story step, a quest and a field fit for the level | P2 |

### B. What to remove

| Remove | Why | Negative impact today | Replace with |
|---|---|---|---|
| The tracked keystore from the public repository (for future keys) | QA-1 | Anyone can sign updates | A key in CI secrets (the existing key is already public: removing the file alone does not fix it) |
| The base64-inlined art in the APK build | 33% larger, slower first boot | 8.8 MB parse on start | Asset files in the APK; single file only for the web |
| Back-to-back story talks with the same person in the same place | Padding | Taps without play | One richer talk |

Nothing else is recommended for removal: the systems are dense but each has a purpose.

### C. What to retain

| Retain | Why it works | How to protect it |
|---|---|---|
| The job tree and the "one mechanic per second job" rule | Builds are the genre's heart | Keep `JOB_TRAITS` and the sims |
| MVP mechanics, matchups and tiers | Fights that ask questions | Every new MVP gets a mechanic and a tier (already a rule) |
| Secrets gated by walking | Discovery and word of mouth | One per new city |
| Guided lessons that never spend points | Respect for the player's build | Every new system gets a lesson |
| Owner's rules in `CLAUDE.md` checked by tests | Consistency across many sessions | "A new rule gets a test" |
| Map persistence | The world feels real | Keep it in the map defaults |
| No cash shop | Trust | Never sell power |

### D. What to rework

| Feature | Problem | Root cause | Redesign | Expected gain | Difficulty |
|---|---|---|---|---|---|
| Story pacing | Read more than played; back-and-forth walking | Talk steps as glue between set pieces | Merge talks; Keeper link to the next speaker; a stand or search in every chapter | Faster chapters, fewer taps | Low–medium |
| Fields | Look and play alike | Seeded decoration on square maps | Set pieces, packs with leaders, a hazard per region | Memorable places | Medium |
| Cities' look | Blocky in close-ups | Box houses painted in code | A city art pass (eaves, timber, signs) plus merged geometry for speed | Better screenshots and frame rate | Medium |
| Early economy | Moves often | Changes land without hand play | A frozen release, then a Base 1–20 playtest | Stable first hours | Low |
| Boss potion logistics | 100 potions per attempt | Tier target | A potion pouch or auto-buy at the Keeper | Less shopping | Low |

---

## Part 6: Innovation

**1. Essential improvements**
- Safe distribution (QA-1), save protection, real-phone performance, colour-independent danger.

**2. High-value additions**
- **The Deep Halls:** an endless dungeon from the maze generator, a floor every few minutes, a weekly
  seed so everyone faces the same floors, a record in Goals.
- **Hero codes and shades (asynchronous co-op, no server):** a friend's hero shared as a code joins you
  as an AI ally for one raid, using the Phantom's illusion code (`allies.js` `shade`). Social play
  without servers, true to "offline".
- **Rune-carving:** the story is about runes cut forwards and backwards; let the player carve a rune
  into a piece of gear at Torvald's old bench (a small pattern puzzle that sets a minor bonus). The lore
  becomes a system.

**3. Experimental**
- **The Seeress's reading:** once a day Saeunn casts the runes for a small, themed boon (a calling-
  flavoured buff for an hour). A gentle daily habit with no penalty for missing it.
- **Field events:** a herald of the Fire Giant crosses a field at night, leaving burning ground: a
  short world event that uses existing boss moves.

**4. Long-term**
- The five late-game cities with their own main story (the owner's plan).
- An optional one-time supporter pack of cosmetic wings, headgear and a fourth hero slot.
- iOS, once the Android build is stable.

None of these change the genre or add a cash shop.

---

## Part 7: Competitors

[Assumption] The comparisons below are from general knowledge of these games, not measured for this
audit.

| Game | What it is | Does better than Aria | Aria does better | Learn (not copy) |
|---|---|---|---|---|
| Ragnarok mobile MMORPGs (e.g. *Ragnarok M: Eternal Love*, *Ragnarok Origin*) | Official online mobile MMORPGs of the lineage, free-to-play with shops | Production values, music, multiplayer, live events | No cash shop, offline, no auto-play dependency | Seasonal events give reasons to return |
| *Toram Online* | Online mobile MMORPG known for build freedom | Community, co-op bosses | Offline, a story with a payoff | Build-sharing culture: let players share builds as codes |
| *Old School RuneScape* (mobile) | Classic MMORPG with a subscription | Huge content, an engaged community | Phone-first controls, no subscription | Players love clear goal lists ("quest cape"): Aria's achievements can lean into it |
| *Exiled Kingdoms* | Premium offline mobile RPG by a small team | Proven that offline premium RPGs sell on phones | Visual identity, boss mechanics | A fair premium model can work |
| *Stardew Valley* (mobile) | Premium, offline, cosy | Presentation, music, polish | Combat depth | Cosiness sells when presentation carries it |

**Verdict.** Aria cannot outspend the official games and should not try. It wins on fairness, offline
play and secrets. It loses on presentation, and presentation is what a store page sells.

---

## Part 8: Scores

| Category | Score | Why |
|---|---|---|
| Gameplay | 7 | A proven loop, well implemented; low input during field fights |
| Mechanics | 8 | Unusual depth for a phone game; every second job and MVP has its own mechanic |
| Balance | 6 | Sim-backed bands are a real strength; frequent large changes without hand play, and the open items (75–99 climb, early Sorcerer) |
| Content | 8 | 39 maps, 85 monsters, 411 items, 121 quests, 2 dungeons, 4 raids |
| Progression | 6 | Long and well gated; steep late climb; nothing repeatable after 99 |
| Level design | 6 | Excellent wonders and dungeons; samey fields; story backtracking |
| Narrative | 6 | Coherent, with a planted twist and a payoff; read more than played |
| Visuals | 7 | Cohesive sprites and lighting; blocky cities; mismatched kobolds and goblins |
| Audio | 5 (unverified) | Functional synthesized sound and music by place, judged from code only |
| UI/UX | 6 | Superb onboarding and navigation aids; dense windows and HUD on a small screen |
| Technical | 6 | Tests, CI and modules are good; a public signing key, memory growth, heavy cities, saves in WebView storage |
| Accessibility | 3 | Interface size and sound only; danger by colour alone |
| Replayability | 6 | Slots, jobs and builds; the story replays the same |
| Player retention | 5 (estimate) | Weekly hunts and achievements; no post-99 loop, no social. No data |
| Monetization | N/A | No model exists |
| Marketing potential | 5 | A clear niche and good raw material; no presence, and a legal question over the identity |
| Overall execution | 7 | Remarkably complete for its team size and age |

**Weighting.** For a single-player offline RPG the experience comes first, so the product score weighs
Gameplay 15, Mechanics 10, Content 10, Progression 10, UI/UX 10, Balance 8, Visuals 8, Technical 8,
Level design 6, Narrative 6, Audio 4, Accessibility 3 and Replayability 2 (100 in all). Retention,
monetization and marketing are left out of it: there is no business yet to measure. They are judged
separately as commercial readiness.

**Product score: 6.5 / 10** (650 / 100 weighted points).
**Commercial readiness: 2 / 10.** No store presence, a public signing key, no monetization and an open
legal question. This is a statement about launch, not about quality.

---

## Part 9: Roadmap

### Phase 1: Critical fixes (now)

| Task | Priority | Impact | Complexity | Dependencies | Risks | Success metric | Test |
|---|---|---|---|---|---|---|---|
| Plan the key: the old APK keeps its key (the owner's rule); any store release gets a new app id and a key in CI secrets; players move by save code | Critical | Player safety | Low–medium | Owner decision | Two apps side by side for a while | No keystore tracked for the release app | CI check that the release key is not in the tree |
| Fix QA-4 (cutscenes clear traps and the doll) | High | Correctness | Low | — | — | Traps survive a cutscene | A Playwright scene with a set trap |
| Hand-play Base 1–20 after today's merge (QA-2, QA-3) | High | First hours | Low | — | Retuning churn | No deaths in Fen Shore at Base 10 with sensible play; perz positive per hour | A scripted bot run plus one hand run |
| Measure on a low-end Android phone | High | Know the truth | Low | A phone | — | fps per map type, memory after 20 maps | Chrome remote debugging; a fixed route |

### Phase 2: Core improvements

| Task | Priority | Impact | Complexity | Dependencies | Risks | Success metric | Test |
|---|---|---|---|---|---|---|---|
| Map memory budget | High | Stability | Medium | Phase 1 measurement | Rebuild stutter on return | Textures bounded after 30 maps | Extend `perf` script |
| City geometry merge | High | Frame rate | Medium | — | Occlusion fade per house must keep working | Steinborg draw calls under 80 | Draw-call count in smoke test |
| Saves to app files plus backup nudges | High | Data safety | Low–medium | — | Two copies disagreeing | Restore after "Clear cache" | Device test |
| Accessibility settings | High | Reach | Low–medium | — | — | Danger readable under colour-blind emulation | DevTools emulation |
| Story pacing pass (merge talks, Keeper link) | Medium | Pacing | Low | — | Story text rework | Fewer than 25 talk steps; less walking per chapter | Count steps; time a chapter |
| Assets as files in the APK | Medium | Boot time | Medium | — | Capacitor paths | APK first boot faster | Device timing |

### Phase 3: Feature expansion

| Task | Priority | Impact | Complexity | Dependencies | Risks | Success metric | Test |
|---|---|---|---|---|---|---|---|
| **The fifth early city and its chapter** (the owner's milestone) | High | Completes the first half | High | Systems freeze | Scope creep | City, maps, chapter, cutscene and secret done | Existing data tests plus smoke |
| Quest kinds pass (escort, more search, defend, survive) | Medium | Variety | Medium | — | Bugs in new kinds | Kill and fetch under 60% of quests | Data test counting kinds |
| Field set pieces | Medium | Identity | Medium | City art builders | Performance | Each field recognisable in a screenshot | Visual review |
| A soundtrack | Medium | Presentation | Medium (money) | Budget | License terms | Tracks per region | Listening test |

### Phase 4: Innovation

| Task | Priority | Impact | Complexity | Dependencies | Risks | Success metric | Test |
|---|---|---|---|---|---|---|---|
| The Deep Halls (endless dungeon) | Medium | Endgame | Medium | Maze generator | Balance at depth | Players past 99 keep playing | Sim floors 1–100 |
| Hero codes and shades | Medium | Social | Medium | Save codes, `allies.js` | Code size, cheating (harmless offline) | Shares between friends | Round-trip test of a code |
| Rune-carving | Low | Lore as system | Medium | — | One more system | Used by most heroes past Chapter 11 | Playtest |

### Phase 5: Long-term

| Task | Priority | Impact | Complexity | Dependencies | Risks | Success metric | Test |
|---|---|---|---|---|---|---|---|
| Legal review before any sale | Critical (before money) | Survival | Low (cost) | — | Rework of names or art | Written advice | — |
| Store launch (Play first) | Medium | Reach | Medium | Phases 1–2, legal | Reviews | Rating 4.3+ | Closed test track |
| Five late-game cities with a new story | High (long) | The second half | Very high | First half done | Burnout | Milestones per city | Same tests |
| Optional cosmetic supporter pack | Low | Revenue | Medium | Store, legal | Trust | No power for money | Review against the "no cash shop" promise |

---

## Part 10: Executive verdict

1. **Is it fundamentally good?** Yes. The design is sound, deep and consistent, and backed by tests.
2. **Strongest aspect:** the systems: 15 jobs that each play their own way, and MVPs with real mechanics.
3. **Biggest weakness:** presentation (cities, fields, sound) and a story that is read more than played.
4. **What holds it back:** distribution and trust (a public signing key, saves in WebView storage, no store),
   and a moving target: new systems keep landing before the last ones were played.
5. **Greatest opportunity:** players who want the old MMORPG without a cash shop.
6. **Prioritize:** player safety and saves, a real-phone measurement, then the fifth city.
7. **Stop:** adding systems before the fifth city; changing the economy without a hand-played run.
8. **Continue:** recording every rule in `CLAUDE.md` with a test; one unique mechanic per job and per MVP;
   secrets in every region; guided lessons.
9. **What would make it significantly better:** a presentation pass (city art, field set pieces, a real
   soundtrack) and an endgame loop after 99.
10. **Long-term potential:** yes, as a niche title with a loyal audience, if the second half is reached.
11. **Commercially viable?** Not today. Possibly later, at a modest premium price, after a legal review of
    its closeness to Ragnarok Online.
12. **Recommendation:** worth playing today for its audience; worth developing; not yet an investment.

**Overall score:** 6.5 / 10 product, 2 / 10 commercial readiness.

**SWOT summary:** deep, fair, offline systems and great secrets; weak presentation and a public signing
key; an audience tired of cash shops; a legal shadow over the identity.

**Top 10 improvements**
1. Retire the public signing key for any public release; protect players' updates.
2. Mirror saves to app files and nudge backups.
3. Measure on a real low-end phone, then budget map memory.
4. Merge city geometry (draw calls).
5. Hand-play Base 1–20 after today's density and perz change; retune if needed.
6. Colour-independent danger circles, window text size, screen-shake toggle.
7. Story pacing: merge talks, Keeper links to the next speaker.
8. Quest variety from the kinds the engine already has, plus escort.
9. The fifth city, completing the first half.
10. The Deep Halls, an endless dungeon after 99.

**Top 5 to retain:** the job tree and cross jobs; MVP mechanics and tiers; walking-gated secrets; guided
lessons that never spend points; the rules-with-tests discipline.

**Top 5 to remove or redesign:** the tracked signing key; base64 art in the APK; back-to-back story talks;
samey fields; blocky cities.

**Top 5 new features:** the Deep Halls; hero codes and shades; rune-carving; field set pieces; an original
soundtrack.

**Immediate priorities:** Phase 1 (key plan, QA-4 fix, Base 1–20 hand run, phone measurement).

**Long-term direction:** finish the first half (five cities) on a frozen system set, polish presentation,
then decide on a store launch with legal advice; the late-game cities as the second half.

**Final verdict.** Aria is a good, generous game made with unusual care for its rules. It is held back
less by design than by presentation, distribution and a habit of adding before polishing. Freeze the
systems, protect the players, finish the fifth city and make it look and sound as good as it plays.
