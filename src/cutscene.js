// A cutscene: shots one after another, each a moment of the world seen through the game's own
// camera, under letterbox bars with a line of text (or a title card). The game moves the camera and
// the world for each shot (apply); this file only runs the sequence and draws the overlay.
// shots: [{ text, secs, card?: { title, sub } , ...the game's own fields }]. Skip ends it at once.
export function playCutscene(shots, apply, done) {
  const el = document.createElement('div');
  el.id = 'cine';
  el.innerHTML = `<div class="cine-bar top"></div><div class="cine-bar bot"><p class="cine-cap"></p></div>
    <div class="cine-card"><h1></h1><p></p></div><div class="cine-fade on"></div>
    <button class="cine-skip" type="button">Skip ▸▸</button>`;
  document.body.appendChild(el);
  const cap = el.querySelector('.cine-cap'), fade = el.querySelector('.cine-fade'), card = el.querySelector('.cine-card');
  let i = -1, over = false;
  const timers = [];
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  const finish = () => {
    if (over) return;
    over = true;
    timers.forEach(clearTimeout);
    fade.classList.add('on');
    setTimeout(() => { el.remove(); done(); }, 650);
  };
  const next = () => {
    if (over) return;
    i++;
    if (i >= shots.length) { finish(); return; }
    const s = shots[i];
    fade.classList.add('on'); // a fade through black between shots
    cap.classList.remove('show');
    later(650, () => {
      apply(s);
      card.classList.toggle('show', !!s.card);
      card.querySelector('h1').textContent = s.card?.title || '';
      card.querySelector('p').textContent = s.card?.sub || '';
      cap.textContent = s.text || '';
      fade.classList.remove('on');
      later(500, () => cap.classList.add('show'));
      later((s.secs || 5.5) * 1000, next);
    });
  };
  el.querySelector('.cine-skip').addEventListener('click', finish);
  next();
}
