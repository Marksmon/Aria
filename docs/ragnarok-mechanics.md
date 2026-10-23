# Ragnarok Online mechanics (classic / pre-renewal)

Reference for Aria's Ragnarok-style systems. Everything here is taken from
[rAthena](https://github.com/rathena/rathena), the open-source Ragnarok Online server emulator,
using its pre-renewal (classic) code and databases: `src/map/status.cpp`, `src/map/battle.cpp`,
`src/map/pc.cpp`, `src/map/skills/swordman/*`, `db/pre-re/*.yml` and `conf/battle/*.conf`.
Aria uses these rules with its own monsters, items and places.

## Stats and stat points

Six stats, each starting at 1 (max 99): STR, AGI, VIT, INT, DEX, LUK.

| | Rule |
|---|---|
| Points at Base Lv 1 | 48 |
| Points per level up | `floor(lv / 5) + 3` when going from lv to lv+1 (3 at first, 8 by Lv 25) |
| Cost to raise a stat from x to x+1 | `1 + floor((x + 9) / 10)`: 2 for 1–10, 3 for 11–20, … 11 for 91–98 |

Jobs also add hidden bonus stats at certain job levels (Swordman: STR at Job 2, VIT at 6, DEX at 10, …).

## Derived stats

| Stat | Formula |
|---|---|
| Base ATK (status ATK) | `STR + floor(STR/10)² + floor(DEX/5) + floor(LUK/5)` |
| MATK | min `INT + floor(INT/7)²`, max `INT + floor(INT/5)²` |
| HIT | `BaseLv + DEX` |
| FLEE | `BaseLv + AGI` |
| Perfect dodge | `(LUK + 10) / 10` % (ignores HIT) |
| Critical chance | `(10 + floor(LUK·10/3)) / 10` %; crits always hit and deal max damage |
| Soft DEF (VIT DEF) | players: `floor(VIT·0.3) + rnd(0, floor(VIT²/150) − floor(VIT·0.3) − 1) + floor(VIT·0.5)`; monsters: `VIT + rnd(0, floor(VIT/20)² − 1)` |
| Soft MDEF | `INT + floor(VIT/2)` |
| Max weight | `2000 + 30·STR` (Swordman base 2800) |

### Max HP and SP

```
BaseHP = 35 + floor(BaseLv · HpIncrease/100) + Σ(i = 2..BaseLv) round(HpFactor/100 · i)
MaxHP  = BaseHP · (100 + VIT) / 100
BaseSP = 10 + floor(BaseLv · SpIncrease/100)
MaxSP  = BaseSP · (100 + INT) / 100
```

| Job | HpIncrease | HpFactor | SpIncrease |
|---|---|---|---|
| Novice | 500 (+5/lv) | 0 | 100 (+1/lv) |
| Swordman | 500 | 70 | 200 (+2/lv) |

### Attack speed

```
delay  = BaseASPD[job][weapon] · (1 − (4·AGI + DEX) / 1000)   (ms ÷ 10 units)
ASPD   = 200 − delay / 10
attack every 2 · delay ms
```

| Weapon | Novice | Swordman |
|---|---|---|
| Bare hands | 500 | 400 |
| Dagger | 650 | 500 |
| One-handed sword | 700 | 550 |

A shield adds delay.

## Combat

```
hit chance   = 80 + attacker HIT − target FLEE, limited to 5–100 %
weapon dmg   = rnd(min, max) with max = weapon ATK, min = DEX · (80 + 20·weapon level)/100 (≤ max)
             × size modifier (dagger 100/75/50 %, one-handed sword 75/100/75 % vs small/medium/large)
damage       = (status ATK + weapon dmg + refine/mastery) × skill % × (100 − hard DEF)/100 − soft DEF
```

Hard DEF comes from equipment (capped at 100); monsters have their own DEF and VIT. A monster's
attack is `rnd(ATK1, ATK2)` reduced by the player's DEF the same way.

## Levels and EXP

* Base Level 1–99 and Job Level (Novice 1–10, first jobs like Swordman 1–50) level separately.
  Each kill gives Base EXP and Job EXP.
* Base EXP to next level (Novice / first jobs): 9, 16, 25, 36, 77, 112, 153, 200, 253, 320, 385,
  490, … (the full table is in `src/ro-tables.js`).
* Novice Job EXP: 10, 18, 28, 40, 91, 151, 205, 268, 340 (Job 10 is the cap).
* First job Job EXP: 30, 43, 58, 76, 116, 180, 220, 272, 336, 520, 604, 699, …
* Job change: Novice at Job Lv 10 with Basic Skill Lv 9 can become a Swordman.
* One skill point per job level.
* Death: lose 1% of the EXP needed for the current Base and Job level (not below 0).

## Regeneration

| | Amount | Every |
|---|---|---|
| HP | `floor(VIT/5) + max(1, floor(MaxHP/200))` | 6 s (twice as often sitting) |
| SP | `1 + floor(INT/6) + floor(MaxSP/100)` (+ extra from INT 120) | 8 s (twice as often sitting) |
| Increase HP Recovery | `5·lv + floor(lv · MaxHP / 500)` | 10 s, standing still |

## Skills

| Skill | Max | Cost | Effect |
|---|---|---|---|
| Basic Skill (Novice) | 9 | passive | Needed (Lv 9) for a job change |
| First Aid (Novice, quest) | 1 | 3 SP | Heals 5 HP |
| Sword Mastery | 10 | passive | +4 ATK per level with daggers and one-handed swords, ignores DEF |
| Increase HP Recovery | 10 | passive | Extra HP every 10 s, see above |
| Bash | 10 | 8 SP (15 from Lv 6) | Hit for `100 + 30·lv` %, hit chance ×`(1 + 5·lv/100)` |
| Provoke | 10 | `3 + lv` SP | Target's DEF −`(5 + 5·lv)`%, ATK +`(2 + 3·lv)`%, it attacks you; 30 s |
| Magnum Break | 10 | 30 SP + `20 − floor((lv−1)/2)` HP | Fire burst around you: `100 + 20·lv` % in 3×3, `100 + 10·lv` % in 5×5, knockback 2 cells, hit ×`(1 + 10·lv/100)`; then +20% fire damage for 10 s; 2 s after-cast delay |
| Endure | 10 | 10 SP | No flinching for `10 + 3·lv` s or 7 hits, +lv MDEF; 10 s cooldown |

Skill tree: Magnum Break needs Bash 5; Endure needs Provoke 5.

## Items

* Drop rates are per 10 000 (`9000` = 90 %). Typical: common loot 30–90 %, potions/herbs 3–10 %,
  equipment 0.15–1.5 %, cards 0.01 %.
* Consumables (heal, weight): Red Potion 45–65 HP (7), Orange 105–145 (10), Yellow 175–235 (13),
  White 325–405 (15), Blue Potion 40–60 SP (15), Apple 16–22 (2), Meat 70–100 (15).
  Fly Wing: teleport to a random spot on the map. Butterfly Wing: return to your save point.
* Equipment slots: upper / middle / lower headgear, armor, weapon, shield, garment, shoes, two
  accessories. Weapons have a level (1–4) and card slots; armor gives hard DEF.
* Starter gear: Knife (dagger, ATK 17), Sword (one-handed, ATK 25, Lv 2+), Guard (shield, DEF 3),
  Cotton Shirt (DEF 1), Sandals (DEF 1), Hood (garment, DEF 1), Hat (DEF 2).
* Everything has a weight; over 50% of max weight stops natural regeneration, over 90% stops
  attacking.

## Monster reference (early game)

| Monster | Lv | HP | ATK | DEF | Base / Job EXP | Notes |
|---|---|---|---|---|---|---|
| Poring | 1 | 50 | 7–10 | 0 | 2 / 1 | Water, slow |
| Fabre | 2 | 63 | 8–11 | 0 | 3 / 2 | Earth |
| Lunatic | 3 | 60 | 9–12 | 0 | 6 / 2 | Neutral, LUK 60 |
| Drops | 3 | 55 | 10–13 | 0 | 4 / 3 | Fire |
| Chonchon | 4 | 67 | 10–13 | 10 | 5 / 4 | Wind, fast |
| Roda Frog | 5 | 133 | 11–14 | 0 | 6 / 5 | Water |
| Thief Bug | 6 | 126 | 18–24 | 5 | 17 / 5 | Fast |
| Hornet | 8 | 169 | 22–27 | 5 | 19 / 15 | Wind, fast |
| Rocker | 9 | 198 | 24–29 | 5 | 20 / 16 | Earth, VIT 18 |
| Mandragora | 12 | 405 | 26–35 | 0 | 45 / 32 | Doesn't move |
| Poporing | 14 | 344 | 59–72 | 0 | 81 / 44 | Poison |
| Spore | 16 | 510 | 24–48 | 0 | 66 / 108 | Water |
| Andre | 17 | 688 | 60–71 | 10 | 109 / 71 | Earth |
| Vadon | 19 | 1017 | 74–85 | 20 | 135 / 85 | Crab, water |
