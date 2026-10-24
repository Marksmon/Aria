# Jobs, skill points and second jobs: the rules

These are design rules agreed with the game's owner. Keep them when adding jobs, skills or
quests. Code: `src/progress.js` (jobs, levels, points), `src/skills.js` (trees, `learnBlock`,
`secondJobOpen`, weapon needs), `src/quests.js` (trials, `Quests.status`), `src/menus.js`
(trainer and Keeper dialogue).

## Jobs

| Tier | Jobs | Job Level |
|---|---|---|
| 0 | Trainee (`novice`) | 1–10 |
| 1 | Blader (`swordman`), Sorcerer (`mage`) | 1–50, one level shared by both |
| 2 | BladeMaster (`blademaster`, from Blader), Wizard (`wizard`, from Sorcerer), Magic Knight (`magicknight`, from both) | 1–50, starts again at 1 |

## First jobs: walking both paths

- A Trainee takes one first job through its trial: Trainee Job 10 and Basic Training 9.
- A first-job hero may also take the **other** first job's trial (a Blader the Sorcerer's, a
  Sorcerer the Blader's). They then hold both.
- Both first jobs share **one Job Level and one pool of skill points**. Example: at Job 40 there
  are 39 first-job points (plus the Trainee's 9), which may be split, e.g. 20 as a Blader and 19
  as a Sorcerer.
- Switching between the two first jobs is done at a **Keeper** (the Keepers' ledger must be
  signed). Trainers do not switch jobs.

## Skill points

- Points can only be put into the **active job's** trees: the current job and the jobs before it.
  For example, a Blader's points go to the Blader and Trainee trees; a Magic Knight's go to the
  Magic Knight, Blader, Sorcerer and Trainee trees. To train the other first job, switch to it at
  a Keeper first.
- Skill points earned: 9 from the Trainee, plus (first-job level − 1), plus (second-job level − 1)
  once in a second job. Every point spent in any tree counts against that pool.
- Everything learnt in any earned tree stays usable whatever the current job:
  - **passives** always apply;
  - **actives** need the right weapon in hand (`weapon` on the skill in `skills.js`).

### Skills that need a weapon

| Needs a sword (any weapon but a staff) | Needs a staff |
|---|---|
| Cleave, Heavy Strike, Ground Slash (Blader) | Ember Bolt, Frost Shard, Arc Lightning, Flame Ring (Sorcerer) |
| Twin Fang, Piercing Edge, Final Blade (BladeMaster) | Stone Spike, Earthquake, Meteor Storm, Storm Gust, Thunderstorm (Wizard) |
| Flame Edge, Frost Edge, Thunder Edge (Magic Knight) | |

No weapon needed: Mend, Thrust, Guard, Rest, War Cry, Stand Firm, Rune Ward, Blink, Stone Aegis.

- Gear follows every job earned, so a Blader who passed the Sorcerer's trial may hold a staff.

## Second jobs: who may take which trial

- A second-job trial opens from **Job Level 40** of the first job (first jobs go to 50).
- **Magic Knight:** both first jobs earned, and **at least 20 skill points spent in each**
  first-job tree (Blader and Sorcerer).
- **BladeMaster / Wizard:** for a hero who earned only one first job, the matching second job.
  For a hero who earned both, only the second job of the first job with the **most points spent**.
  A tie opens both.
- The 20/20 rule opens only the Magic Knight. It does not open both BladeMaster and Wizard.
- The current job does not matter; only the points do.
- **Only one second job can be taken.** Once a step of one second-job trial is accepted, the other
  trials close.
- **Quitting a trial** (Quit quest in the Quest View) before it is finished starts that trial over
  from its first step and lifts the choice. The hero may then pick any second-job trial they
  qualify for, again, by going to its quest giver.

### Examples (Job 50, points spent as Blader / as Sorcerer)

| Points | Trials open |
|---|---|
| 35 / 15 | BladeMaster |
| 30 / 20 | BladeMaster, Magic Knight |
| 25 / 25 | BladeMaster, Wizard, Magic Knight |
| 20 / 5 | BladeMaster |
| 5 / 20 | Wizard |
| any, below Job 40 | none |

## Trials

- Each trial is a **three-step series**. Each step accepts itself as soon as the step before is
  handed in. Job quests show in **green**.
- **No reward for the steps on the way:** only completing the whole series pays, and the last step
  pays the total of all its steps (`rewardOf` in `quests.js`).
- First-job trials are for a Trainee of Base ~10. Second-job trials are harder: Base 40–50
  monsters and a mini-boss.
- Trainers:
  - Captain Ulfr (Blader, BladeMaster), Steinborg.
  - Archmage Vigdis (Sorcerer, Wizard), Galdrheim.
  - Sir Eirik the Runeblade (Magic Knight), Steinborg.
- Taking a second job:
  - Job Level goes back to 1, and the first-job level is kept for its points (`firstLv`).
  - The look: second jobs wear the first job's outfit recoloured, with an aura. The Magic Knight
    has its own sprite.
