// Character slots and the Keepers' storage. Each slot is one hero's save; the storage is shared by
// every hero (one Keeper's chest for all of them). The game was called Aibachu before Aria; slot 1
// keeps the old key so existing saves load into it.
const KEY = 'aibachu.save.v1';
const SLOT_KEY = 'aria.slot'; // the slot played last
const STORE_KEY = 'aria.storage';
export const SLOTS = 3;
const keyOf = (i) => (i ? `${KEY}.${i + 1}` : KEY);

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
  try { localStorage.setItem(STORE_KEY, JSON.stringify(arr)); } catch { /* storage unavailable */ }
}

// a save from before the shared storage kept its own chest: it moves into the storage, once
export function loadSave(i = activeSlot()) {
  try {
    const raw = localStorage.getItem(keyOf(i));
    const data = raw ? JSON.parse(raw) : null;
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

export function writeSave(data, i = activeSlot()) {
  try {
    localStorage.setItem(keyOf(i), JSON.stringify(data));
  } catch {
    /* storage unavailable (private mode / preview) - game still runs */
  }
}

export function clearSave(i = activeSlot()) {
  try { localStorage.removeItem(keyOf(i)); } catch { /* ignore */ }
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
    return CODE + pack(JSON.stringify({ slots, storage: loadStorage() }));
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
      localStorage.setItem(keyOf(slot), JSON.stringify(data));
      return 'slot';
    }
    const all = read((d) => Array.isArray(d?.slots) && d.slots.some((x) => x?.prog));
    if (!all) return false;
    for (let i = 0; i < SLOTS; i++) {
      const d = all.slots[i];
      if (d?.prog) localStorage.setItem(keyOf(i), JSON.stringify(d));
      else localStorage.removeItem(keyOf(i));
    }
    writeStorage(Array.isArray(all.storage) ? all.storage : []);
    return 'all';
  } catch {
    return false;
  }
}
