// Character slots and the Keepers' storage. Each slot is one hero's save; the storage is shared by
// every hero (one Keeper's chest for all of them). The game was called Aibachu before Aria; slot 1
// keeps the old key so existing saves load into it.
const KEY = 'aibachu.save.v1';
const SLOT_KEY = 'aria.slot'; // the slot played last
const STORE_KEY = 'aria.storage';
export const SLOTS = 3;
const keyOf = (i) => (i ? `${KEY}.${i + 1}` : KEY);

// ---------- the native mirror (the APK only): every save is also kept in the app's own storage (Capacitor
// Preferences, Android's SharedPreferences), which Android's backup can carry to a reinstall or a new phone. The
// WebView's storage can be emptied under the hero's feet (the OS reclaiming space); on start, a save missing from it
// is put back from the mirror (restoreMirror). Writes are gathered and sent every 20 s, and at once when the app
// goes to the background
const MIRROR_EVERY = 20000;
const BACKED_KEY = 'aria.backedUp'; // when a save code was last made (backup nudges: main.js)
let prefs = null;
const native = () => !!globalThis.Capacitor?.isNativePlatform?.();
const Prefs = () => (prefs ||= import('@capacitor/preferences').then((m) => m.Preferences).catch(() => null));
const pending = new Map();
let flushT = null;
function flushMirror() {
  flushT = null;
  if (!pending.size) return;
  const items = [...pending]; pending.clear();
  Prefs().then((P) => { if (P) for (const [key, value] of items) (value === null ? P.remove({ key }) : P.set({ key, value })).catch(() => {}); });
}
function mirror(key, value, now = false) {
  if (!native()) return;
  pending.set(key, value);
  if (now) flushMirror();
  else flushT ||= setTimeout(flushMirror, MIRROR_EVERY);
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden) flushMirror(); });
// put back from the mirror every save the WebView no longer has: how many came back (the page then reloads once)
export async function restoreMirror() {
  if (!native()) return 0;
  const P = await Prefs();
  if (!P) return 0;
  let n = 0;
  for (const key of [SLOT_KEY, STORE_KEY, BACKED_KEY, ...Array.from({ length: SLOTS }, (_, i) => keyOf(i))]) {
    try {
      if (localStorage.getItem(key) !== null) continue;
      const { value } = await P.get({ key });
      if (value !== null && value !== undefined) { localStorage.setItem(key, value); n++; }
    } catch { /* the next */ }
  }
  return n;
}
// a save code was made: when (backup nudges read it)
export const backedUpAt = () => { try { return +localStorage.getItem(BACKED_KEY) || 0; } catch { return 0; } };

export function activeSlot() {
  try {
    const i = parseInt(localStorage.getItem(SLOT_KEY), 10);
    return i >= 0 && i < SLOTS ? i : 0;
  } catch {
    return 0;
  }
}
export function setActiveSlot(i) {
  try { localStorage.setItem(SLOT_KEY, String(i)); } catch { /* storage unavailable */ }
  mirror(SLOT_KEY, String(i));
}

// the shared storage, as [[id, n], ...]
export function loadStorage() {
  try {
    const arr = JSON.parse(localStorage.getItem(STORE_KEY));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
export function writeStorage(arr) {
  const text = JSON.stringify(arr);
  try { localStorage.setItem(STORE_KEY, text); } catch { /* storage unavailable */ }
  mirror(STORE_KEY, text);
}

// a save from before the shared storage kept its own chest: it moves into the storage, once.
// A save that can't be read (cut short, or broken by a bug) falls back to its backup copy (BAK)
const BAK = '.bak';
const readJSON = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const d = raw ? JSON.parse(raw) : null;
    return d && typeof d === 'object' && d.prog ? d : null;
  } catch {
    return null;
  }
};
export function loadSave(i = activeSlot()) {
  try {
    let data = readJSON(keyOf(i));
    if (!data && localStorage.getItem(keyOf(i)) !== null) data = readJSON(keyOf(i) + BAK); // the main copy is broken: the backup
    if (data?.inv?.chest?.length) {
      writeStorage([...loadStorage(), ...data.inv.chest]);
      data.inv.chest = [];
      localStorage.setItem(keyOf(i), JSON.stringify(data));
    }
    return data;
  } catch {
    return null;
  }
}

// every save is written to its slot; a backup copy of it at most once a minute (BAK_EVERY), so a
// broken write never takes the hero with it. false when the phone refused the write (storage full)
const BAK_EVERY = 60000;
const bakAt = {};
export function writeSave(data, i = activeSlot(), now = Date.now()) {
  try {
    const text = JSON.stringify(data);
    mirror(keyOf(i), text); // (first: a full WebView storage still leaves the mirror a copy)
    localStorage.setItem(keyOf(i), text);
    if (!(now - (bakAt[i] || 0) < BAK_EVERY) || localStorage.getItem(keyOf(i) + BAK) === null) { localStorage.setItem(keyOf(i) + BAK, text); bakAt[i] = now; }
    return true;
  } catch {
    return false; /* storage unavailable (private mode / preview) or full - the game still runs */
  }
}

export function clearSave(i = activeSlot()) {
  try { localStorage.removeItem(keyOf(i)); localStorage.removeItem(keyOf(i) + BAK); } catch { /* ignore */ }
  mirror(keyOf(i), null, true);
}

// a backup as one line of text, to keep anywhere (notes, a chat) and paste back in. ARIA2 holds
// every slot and the storage; ARIA1 (from before the slots) holds one hero, chest and all.
const CODE = 'ARIA2:';
const pack = (s) => {
  const b = new TextEncoder().encode(s);
  let out = '';
  for (let i = 0; i < b.length; i += 0x8000) out += String.fromCharCode(...b.subarray(i, i + 0x8000)); // in pieces: three heroes are long
  return btoa(out);
};
// (anything not of the code is dropped: spaces and line breaks a chat or a note puts in, quotes,
// invisible characters a phone pastes)
const unpack = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/[^A-Za-z0-9+/=]/g, '')), (c) => c.charCodeAt(0)));
export function saveCode() {
  try {
    const slots = [];
    for (let i = 0; i < SLOTS; i++) slots.push(loadSave(i));
    if (!slots.some(Boolean)) return '';
    const code = CODE + pack(JSON.stringify({ slots, storage: loadStorage() }));
    try { localStorage.setItem(BACKED_KEY, String(Date.now())); } catch { /* ignore */ }
    mirror(BACKED_KEY, String(Date.now()));
    return code;
  } catch {
    return '';
  }
}
// restore a backup: an ARIA2 code puts back every hero and the storage; an older one goes in the
// chosen slot (its chest joins the storage when it loads). 'all', 'slot' or false if it was no good
export function loadCode(code, slot = activeSlot()) {
  try {
    // the code wherever it starts in what was pasted (a chat's quote or a note's title before it),
    // its ARIA tag in any case; text after it is tried without, line breaks put inside it are not
    const at = /ARIA\s*([12])\s*:/i.exec(code || '');
    if (!at) return false;
    const rest = code.slice(at.index + at[0].length).trim();
    const read = (ok) => {
      for (const part of [rest, rest.split(/\s{2,}|\n\s*\n/)[0], rest.split(/\s/)[0]]) {
        try { const d = JSON.parse(unpack(part)); if (ok(d)) return d; } catch { /* the next */ }
      }
      return null;
    };
    if (at[1] === '1') {
      const data = read((d) => d && typeof d === 'object' && d.prog);
      if (!data) return false;
      localStorage.removeItem(keyOf(slot) + BAK);
      localStorage.setItem(keyOf(slot), JSON.stringify(data));
      mirror(keyOf(slot), JSON.stringify(data), true);
      return 'slot';
    }
    const all = read((d) => Array.isArray(d?.slots) && d.slots.some((x) => x?.prog));
    if (!all) return false;
    for (let i = 0; i < SLOTS; i++) {
      const d = all.slots[i];
      localStorage.removeItem(keyOf(i) + BAK); // (the old backup is not this hero's)
      if (d?.prog) localStorage.setItem(keyOf(i), JSON.stringify(d));
      else localStorage.removeItem(keyOf(i));
      mirror(keyOf(i), d?.prog ? JSON.stringify(d) : null);
    }
    flushMirror();
    writeStorage(Array.isArray(all.storage) ? all.storage : []);
    return 'all';
  } catch {
    return false;
  }
}
