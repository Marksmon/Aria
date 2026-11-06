// The guided lessons (moved out of main.js): the Prologue's lessons (GUIDES), a first job's skills lesson, the
// crafters' lessons (NPC_GUIDES), the gold arrow to the goal, and the story's start. main.js calls installLessons
// once, where these lines were; menus, hotbar and cine are read through ctx (made or set later).
import * as THREE from 'three';
import { ENCHANT, iconURL } from './items.js';
import { Guide } from './guide.js';
import { INTRO } from './story.js';
import { JOBS, STAT_KEYS } from './progress.js';
import { NPCS } from './quests.js';
import { SKILLS, WEAPON_NAMES } from './skills.js';
export const STAT_TALK = {
  pow: '<b>POW, Power</b>: your blows up close (every point, and a big jump every 10) and how much you can carry. <b>The main stat of Bladers and Assassins.</b>',
  qkn: '<b>QKN, Quickness</b>: attack speed (more than any other stat) and Flee, your chance to dodge a blow. <b>Bladers, Archers and Assassins</b> all want it: an Assassin lives by dodging.',
  end: '<b>END, Endurance</b>: Max HP, defense against every blow, HP recovery and some magic defense. <b>Never wasted, on any path.</b>',
  knl: '<b>KNL, Knowledge</b>: magic attack, Max SP for your skills, SP recovery and magic defense. <b>The Sorcerer\'s main stat.</b>',
  fns: '<b>FNS, Finesse</b>: hit (how often your blows land), steadier damage, a little attack speed and faster spells. With a bow it is your attack: <b>the Archer\'s main stat.</b>',
  ftn: '<b>FTN, Fortune</b>: <b>critical hits and lucky dodges</b>, its main use, and a little attack. A critical hit never misses and goes through armor (skills never crit), so some build around it: a <b>crit Assassin</b> (POW, QKN, FTN) or a <b>crit Archer</b> (FNS, FTN, QKN).',
};

export function installLessons(ctx) {
  const { audio, camera, inv, persist, prog, refreshQuests, story, storyLive, ui, world } = ctx;
  // ---------- the guided lessons: the Prologue's stats, equipment and hotbar steps, and the chase ----------
  // Each runs once, when its story step comes up (skipped or finished: flags.guide_<step>), and stops
  // when the step is done. guide.js rings what to tap and says what it is.
  const guide = new Guide();
  const $ = (sel, root = document) => root?.querySelector(sel) || null;
  const win = (id) => (ctx.menus.isOpen(id) ? ctx.menus.wins[id] : null);
  const hudBtn = (id) => $(`[data-btn="${id}"]`);
  const inSkills = () => ctx.menus.isOpen('skills');
  const inItems = (tab) => () => ctx.menus.isOpen('items') && (!tab || ctx.menus.tab === tab);
  const GUIDES = {
    stats: () => [
      { at: () => hudBtn('status'), text: 'Your stats decide what kind of fighter you are. Tap <b>Status</b>.', done: () => ctx.menus.isOpen('status') },
      { at: () => $('.stsub', win('status')), need: () => ctx.menus.isOpen('status'), text: 'These are your <b>Status Points</b>, and each Base Level brings more. A stat costs more the higher it goes, and taking points back needs a <b>costly reset</b>: so first, what each stat does.' },
      ...STAT_KEYS.map((k, i) => ({ at: () => win('status')?.querySelectorAll('table.stats tr')[i] || null, need: () => ctx.menus.isOpen('status'), text: STAT_TALK[k] })),
      { at: () => $('table.stats', win('status')), need: () => ctx.menus.isOpen('status'), text: 'Not sure which path you will take? <b>END is never wasted.</b> If you know: a Blader wants POW, QKN and END; a Sorcerer KNL, FNS and END; an Archer FNS and QKN; an Assassin POW and QKN, with a little END and FNS (quick daggers, and dodging instead of taking blows). For crits, an Assassin or an Archer adds FTN.' },
      { at: () => $('table.stats', win('status')), need: () => ctx.menus.isOpen('status'), text: 'Tap <b>▲</b> beside a stat to place a point. Nothing is final yet: <b>Reset</b> takes back points you have not confirmed.', done: () => ctx.menus.pendCount() > 0 || story.step?.id !== 'stats' },
      { at: () => $('[data-act="statconfirm"]', win('status')), need: () => ctx.menus.isOpen('status'), text: 'Happy with them? <b>Confirm</b> locks your points in. (Place more first if you like.)', done: () => story.step?.id !== 'stats' },
    ],
    equip: () => [
      { at: () => hudBtn('items'), text: 'Elder Halvard\'s cloak is in your bag. Tap <b>Items</b>.', done: inItems() },
      { at: () => $('[data-act="tab"][data-id="equip"]', win('items')), need: inItems(), text: 'Gear is under <b>Equips</b>.', done: inItems('equip') },
      { at: () => $('.rslot[data-id="travel_cloak"]', win('items')), need: inItems('equip'), back: 1, text: 'Tap the <b>Traveler\'s Cloak</b> to see what it gives.', done: () => ctx.menus.selected === 'travel_cloak' || story.step?.id !== 'equip' },
      { at: () => $('[data-act="equip"]', win('items')), need: inItems('equip'), back: 1, text: 'Here is what it gives: DEF, and which jobs can wear it. Tap <b>Equip</b> to put it on.', done: () => story.step?.id !== 'equip' },
    ],
    thief: () => [
      { at: () => null, text: 'The <b>golden bloop</b> is the Gel Thief. Follow the <b>gold arrow</b> to it, and tap it to give chase. It runs from you, but it is fat with the ember: after a few seconds of running, or once you corner it against the trees, it turns to fight.' },
    ],
    training: () => [
      { at: () => hudBtn('skills'), text: 'Every Job Level brings a <b>skill point</b>, and skills are learnt with them. Tap <b>Skills</b>.', done: inSkills },
      { at: () => $('.rfoot', win('skills')), need: inSkills, text: 'These are your <b>Skill Points</b>. Spend them with care: taking them back needs a trainer\'s <b>costly reset</b>.' },
      { at: () => $('.sktree', win('skills')), need: inSkills, text: 'Each job has its own <b>tree</b> (a tab for each). A line joins a skill to the ones it opens: raise it far enough and the next unlocks. A Trainee has one skill: <b>Basic Training</b>.' },
      { at: () => $('.sknode[data-id="basics"]', win('skills')), need: inSkills, back: 1, text: 'Tap <b>Basic Training</b> to see what it does.', done: () => ctx.menus.skSel === 'basics' || story.step?.id !== 'training' },
      { at: () => $('.skdetail', win('skills')), need: inSkills, back: 1, text: 'What it does now and at the next level, what it costs and what it needs. <b>Active</b> skills go on the hotbar and are used with a tap; <b>passive</b> ones, like this, work by themselves. Raised to 9, it opens your <b>first job</b>.' },
      { at: () => $('[data-act="learn"][data-id="basics"]', win('skills')), need: inSkills, back: 1, text: 'Tap <b>Raise ▲</b> to spend a point on it.', done: () => story.step?.id !== 'training' },
    ],
    hotbar: () => [
      { at: () => hudBtn('items'), text: 'The hotbar along the bottom holds potions and skills, one tap away. Tap <b>Items</b>.', done: inItems() },
      { at: () => $('[data-act="tab"][data-id="use"]', win('items')), need: inItems(), text: 'Potions are under <b>Usables</b>.', done: inItems('use') },
      { at: () => $('.rslot[data-id="potion"]', win('items')), need: inItems('use'), back: 1,
        drag: [() => $('.rslot[data-id="potion"]', win('items')), () => ctx.hotbar.nextFree, iconURL('potion')],
        text: '<b>Press and hold</b> the Red Potion, <b>drag</b> it down onto an empty hotbar slot, and let go. (Or tap it, then <b>Add to hotbar</b>.)', done: () => ctx.hotbar.has('item', 'potion') },
    ],
  };
  // The first job's skills: once the hero wears a first job, how its tree, an active skill and the
  // hotbar work (once: flags.guide_jobskills). It never spends a point for them (the owner's call: a
  // point is the hero's build, and costly to take back): it shows, they choose.
  function jobSkillsGuide() {
    const job = prog.job;
    if (JOBS[job]?.tier !== 1 || story.flags.guide_jobskills) return null;
    const ids = Object.keys(SKILLS).filter((id) => SKILLS[id].job === job && SKILLS[id].kind === 'active');
    if (ids.some((id) => ctx.hotbar.has('skill', id))) { story.flags.guide_jobskills = true; return null; } // (they know how)
    const id = ids.find((k) => !SKILLS[k].free && !SKILLS[k].granted && !SKILLS[k].needs) || ids[0];
    if (!id) return null;
    const sk = SKILLS[id], name = JOBS[job].name, node = () => $(`.sknode[data-id="${id}"]`, win('skills'));
    const onTab = () => inSkills() && ctx.menus.skTab === job;
    return [
      { at: () => hudBtn('skills'), text: `You are a <b>${name}</b> now, and your job's skills are waiting. Tap <b>Skills</b>.`, done: inSkills },
      { at: () => $(`[data-act="sktab"][data-id="${job}"]`, win('skills')) || $('[data-act="skfirst"]', win('skills')), need: inSkills, text: `The <b>${name}</b> tab holds your job's tree.`, done: onTab },
      { at: () => $('.sktree', win('skills')), need: onTab, back: 1, text: `Each icon is a skill: <b>active</b> ones are used in a fight, <b>passive</b> ones (the round icons) work by themselves. A line joins a skill to what it opens. Every Job Level brings a <b>skill point</b>, and they go into any tree you have earned.` },
      { at: node, need: onTab, back: 1, text: `<b>${sk.name}</b> is an <b>active</b> skill. Tap it to read it.`, done: () => ctx.menus.skSel === id },
      { at: () => $('.skdetail', win('skills')), need: onTab, back: 1, text: `What it does now and at the next level, its SP cost${sk.weapon ? ` and the weapon it needs (<b>${WEAPON_NAMES[sk.weapon]}</b>)` : ''}. <b>Raise ▲</b> spends a point on it. Choose with your build in mind: points come back only with a trainer's <b>costly reset</b>. Nothing has to be raised now.` },
      { at: () => ctx.hotbar.nextFree, need: inSkills, back: 0, text: 'Once an active skill is learnt, <b>press and hold</b> it in the tree and <b>drag</b> it onto the hotbar (or tap <b>Add to hotbar</b>). Then tap it there to use it on the monster you are fighting. Each use costs <b>SP</b>, the blue bar, and some skills have a cooldown.' },
    ];
  }
  // The craftsmen's lessons: the first time the hero talks to someone who crafts (any crafter, a raid
  // guide's trades too), refines (Holger) or opens card slots (Seyla), how it works, once each
  // (flags.guide_craft / guide_refine / guide_enchant). Walking off before opening their window leaves
  // it for the next talk.
  const NPC_GUIDES = {
    craft: {
      btn: '[data-act="craftwin"]', open: () => ctx.menus.isOpen('craft'),
      steps: () => {
        const inCraft = () => ctx.menus.isOpen('craft'), name = NPCS[ctx.menus.npc]?.name || 'They';
        return [
          { at: () => $('[data-act="craftwin"]', win('talk')), text: `<b>${name.split(' ')[0]}</b> makes things from what you bring. Tap <b>${$('[data-act="craftwin"]', win('talk'))?.textContent || 'Craft'}</b> to see what.`, done: inCraft },
          { at: () => $('.rw-craft .rlist .ritem', document), need: inCraft, back: 1, text: 'Each row is a <b>recipe</b>: what it makes and what it does, then what it costs. A <b>bright</b> count means you have enough; a dim one, not yet. Some recipes need a <b>Base Level</b> first.' },
          { at: () => $('.rw-craft .rnote', document), need: inCraft, back: 1, text: 'Materials <b>drop from monsters</b>, and come from quests and raids. What is in your <b>Keeper\'s storage</b> counts too: no need to carry it.' },
          { at: () => $('.rw-craft [data-act="craft"]:not([disabled])', document) || $('.rw-craft [data-act="craft"]', document), need: inCraft, back: 1, text: 'Once every cost is bright, <b>Craft</b> makes it, straight into your bag. Every town has its own crafters, each with their own trade.' },
        ];
      },
    },
    refine: {
      btn: '[data-act="smithwin"][data-id="refine"]', open: () => ctx.menus.isOpen('smith') && ctx.menus.smithMode === 'refine',
      steps: () => {
        const on = NPC_GUIDES.refine.open;
        return [
          { at: () => $('[data-act="smithwin"][data-id="refine"]', win('talk')), text: '<b>Holger</b> refines gear: every <b>+1</b> makes a weapon hit harder, or armor guard better, up to <b>+10</b>. Tap <b>Refine gear</b>.', done: on },
          { at: () => $('.smithrow [data-act="smithpick"]', win('smith')), need: on, back: 1, text: 'Here is every piece you can refine, <b>worn or in your bag</b>. Tap <b>Pick</b> on one.', done: () => !!ctx.menus.smithSel || !$('.smithrow', win('smith')) },
          { at: () => $('.smithdetail', win('smith')), need: on, back: 1, text: 'Each try costs <b>one ore and some perz</b>: Iron Ore for Lv 1 weapons, Steel Ore for Lv 2, Hard Ore for Lv 3 and 4, Armor Ore for armor. Ores drop from monsters almost anywhere, and Holger sells Iron and Steel Ore.' },
          { at: () => $('.smithdetail b', win('smith')), need: on, back: 1, text: 'Up to the <b>safe level</b> (+4 to +7, by the piece) a try always works. Past it, the chance falls, and <b>a failure breaks the piece</b>: it is gone (a card in it comes back). So the button asks twice. Refine past safe only what you can lose.' },
        ];
      },
    },
    enchant: {
      btn: '[data-act="smithwin"][data-id="enchant"]', open: () => ctx.menus.isOpen('smith') && ctx.menus.smithMode === 'enchant',
      steps: () => {
        const on = NPC_GUIDES.enchant.open;
        return [
          { at: () => $('[data-act="smithwin"][data-id="enchant"]', win('talk')), text: '<b>Seyla</b> opens <b>card slots</b>. A card pressed into a slot adds its stats, and a boss\'s card its own power. Tap <b>Add a card slot</b>.', done: on },
          { at: () => $('.rw-smith .rnote', document), need: on, back: 1, text: `She works only on <b>Lv 4 weapons</b>, up to two slots: the first takes ${ENCHANT.chance[0]}% of the time, the second ${ENCHANT.chance[1]}%. <b>A failure breaks the weapon</b>, so try it on one you can lose.` },
          { at: () => $('.smithdetail .costs', win('smith')) || $('.rw-smith .rlist', document), need: on, back: 1, text: 'Each try costs Hard Ore, Dark Crystals, a <b>boss material</b> (a mini-boss or MVP drop) and perz; the second slot costs twice as much. Gear can also drop, be crafted or won with a slot already in it.' },
          { at: () => hudBtn('items'), need: on, back: 1, text: 'Cards <b>drop from monsters</b>, one card for each kind. To press one in: <b>Items</b>, tap the card, then <b>Insert</b>, and pick the piece. Seyla can also draw cards out again, whole (<b>Remove a card</b>).' },
        ];
      },
    },
  };
  function npcGuide() {
    if (!ctx.menus.isOpen('talk')) return null;
    const k = Object.keys(NPC_GUIDES).find((g) => !story.flags[`guide_${g}`] && $(NPC_GUIDES[g].btn, win('talk')));
    return k ? [k, NPC_GUIDES[k].steps()] : null;
  }
  let guideFor = null; // the story step the running lesson is for ('jobskills': the first job's; craft, refine, enchant)
  let guideDrop = false; // stopped without counting it as seen (walked off before opening the window)
  function tickGuide(dt) {
    const s = story.step;
    const npcG = NPC_GUIDES[guideFor];
    if (guide.running && npcG && !ctx.menus.isOpen('talk') && !npcG.open()) { guideDrop = guide.i === 0; guide.stop(); guideDrop = false; }
    if (guide.running && !npcG && guideFor !== 'jobskills' && (guideFor !== s?.id || !storyLive())) guide.stop(true);
    if (!guide.running && !ctx.menus.isOpen('story') && !ctx.cine) {
      const g = npcGuide();
      if (g) {
        const [k, steps] = g;
        guideFor = k;
        guide.start(steps, { onEnd: () => { if (!guideDrop) { story.flags[`guide_${k}`] = true; persist(); } } });
      } else if (!ctx.menus.isOpen('talk')) {
        const steps = jobSkillsGuide();
        if (steps) { guideFor = 'jobskills'; guide.start(steps, { onEnd: () => { story.flags.guide_jobskills = true; persist(); } }); }
      }
    }
    if (!guide.running && storyLive() && s && GUIDES[s.id] && !story.flags[`guide_${s.id}`] && !ctx.menus.isOpen('story') && !ctx.cine
      && (s.id !== 'thief' || world.id === s.map)) { // (the chase's, once in Moss Field)
      guideFor = s.id;
      guide.start(GUIDES[s.id](), { onEnd: () => { story.flags[`guide_${guideFor}`] = true; } });
    }
    guide.update(dt);
  }

  // the story's goal on this map, during the Prologue (and for a story monster): a gold arrow at the
  // screen's edge pointing to it while it is off the screen, or over it (a monster) while on it
  const goalArrow = document.createElement('div');
  goalArrow.id = 'goalarrow';
  goalArrow.hidden = true;
  goalArrow.innerHTML = '<i></i><span></span>';
  document.getElementById('hud').appendChild(goalArrow);
  const goalTri = goalArrow.querySelector('i');
  const goalV = new THREE.Vector3();
  function tickGoalArrow() {
    const s = story.step, g = ui.goal;
    const on = storyLive() && s && g && story.map() === world.id && (s.ch === 'Prologue' || s.spawn) && !ctx.cine;
    goalArrow.hidden = !on;
    if (!on) return;
    goalV.set(g.x, world.heightAt(g.x, g.z) + 1.6, g.z).project(camera);
    const W = innerWidth, H = innerHeight, behind = goalV.z > 1;
    let x = (goalV.x + 1) / 2 * W, y = (1 - goalV.y) / 2 * H;
    if (behind) { x = W - x; y = H - y; }
    const m = 40, inside = !behind && x > m && x < W - m && y > m && y < H - m;
    goalArrow.querySelector('span').textContent = inside ? '' : g.label || ''; // (on the screen a monster wears its own name)
    if (inside) {
      if (!g.mob) { goalArrow.hidden = true; return; } // (a spot or a person on the screen: the minimap's ring is enough)
      goalArrow.style.transform = `translate(${x - 30}px, ${y - 52}px)`;
      goalArrow.style.flexDirection = 'column-reverse'; // (its name over the arrow pointing down at it)
      goalTri.style.transform = 'rotate(180deg)';
      return;
    }
    // to the screen's edge, along the line from its middle
    const cx = W / 2, cy = H / 2, dx = x - cx, dy = y - cy, k = Math.min((W / 2 - m) / Math.abs(dx || 1e-6), (H / 2 - m) / Math.abs(dy || 1e-6));
    const ex = cx + dx * k, ey = cy + dy * k, ang = Math.atan2(dy, dx) + Math.PI / 2;
    goalArrow.style.transform = `translate(${ex - 30}px, ${ey - 20}px)`;
    goalArrow.style.flexDirection = Math.cos(ang) < -0.3 ? 'column-reverse' : 'column'; // (the name behind the arrow: over one pointing down)
    goalTri.style.transform = `rotate(${ang}rad)`; // (only the arrow turns: the name stays upright)
  }

  function startStory() {
    if (story.flags.intro) return;
    ctx.menus.story(INTRO, 'Prologue · The Last Fire-Ring', () => {
      story.flag('intro');
      refreshQuests();
      persist();
    });
  }

  let bagFullNote = 0;
  function collect(p) {
    const got = inv.add(p.item, p.count);
    if (got) { ctx.menus.toast(p.item, got); audio.play('pickup'); }
    if (got < p.count) {
      p.count -= got;
      if (performance.now() - bagFullNote > 4000) { bagFullNote = performance.now(); ctx.menus.message(prog.job === 'novice' ? 'Bag is full. Sell what you can spare to a trader (the Keepers\' storage opens with a first job).' : 'Bag is full. Put things in a Keeper\'s storage.'); }
      return false;
    }
    return true;
  }
  return { guide, win, GUIDES, tickGuide, tickGoalArrow, startStory, collect };
}
