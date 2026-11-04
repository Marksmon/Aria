// The card paintings: an anime illustration for a card (src/art/cards/<card id>.jpg), shown full
// screen from the card's details (Items window, the cards in a piece). Each is loaded the first time
// it is opened, not at start-up. A card with no painting yet has no button.
const ART = import.meta.glob('./art/cards/*.jpg', { import: 'default' });
const loader = (id) => ART[`./art/cards/${id}.jpg`];

export const hasCardArt = (id) => !!loader(id);

let shown = null;
const close = () => { shown?.remove(); shown = null; removeEventListener('keydown', onKey, true); };
const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };

// name: the card's name; line: what it does (cardLine)
export async function showCardArt(id, name, line) {
  const load = loader(id);
  if (!load) return;
  close();
  const el = document.createElement('div');
  el.className = 'cardart ui-click';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', `${name}: the card's painting`);
  el.innerHTML = '<figure><div class="ca-frame"><img alt=""></div><figcaption><b></b><small></small><i>Tap anywhere to close</i></figcaption></figure>';
  el.querySelector('img').alt = name;
  el.querySelector('b').textContent = name;
  el.querySelector('small').textContent = line || '';
  el.addEventListener('click', close);
  document.body.appendChild(el);
  shown = el;
  addEventListener('keydown', onKey, true);
  const url = await load();
  if (shown === el) el.querySelector('img').src = url;
}
