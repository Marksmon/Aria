// The card paintings: an anime illustration for a card (src/art/cards/<card id>.jpg), shown full
// screen from the card's details (Items window, the cards in a piece): the picture alone, in its gold
// frame (the owner's call: no text under it), a tap closes it. Each is loaded the first time it is
// opened, not at start-up. A card with no painting yet has no button.
const ART = import.meta.glob('./art/cards/*.jpg', { import: 'default' });
const loader = (id) => ART[`./art/cards/${id}.jpg`];

export const hasCardArt = (id) => !!loader(id);

let shown = null;
const close = () => { shown?.remove(); shown = null; removeEventListener('keydown', onKey, true); };
const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };

// name: the card's name (for screen readers)
export async function showCardArt(id, name) {
  const load = loader(id);
  if (!load) return;
  close();
  const el = document.createElement('div');
  el.className = 'cardart ui-click';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', `${name}: the card's painting`);
  el.innerHTML = '<div class="ca-frame"><img alt=""></div>';
  el.querySelector('img').alt = name;
  el.addEventListener('click', close);
  document.body.appendChild(el);
  shown = el;
  addEventListener('keydown', onKey, true);
  const url = await load();
  if (shown === el) el.querySelector('img').src = url;
}
