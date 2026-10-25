// The game was called Aibachu before Aria; the key keeps the old name so existing saves load.
const KEY = 'aibachu.save.v1';

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeSave(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable (private mode / preview) - game still runs */
  }
}

// a backup of the save as one line of text, to keep anywhere (notes, a chat) and paste back in
const CODE = 'ARIA1:';
export function saveCode() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return '';
    return CODE + btoa(String.fromCharCode(...new TextEncoder().encode(raw)));
  } catch {
    return '';
  }
}
// restore a backup: true if it was a good one (it replaces the save in this game)
export function loadCode(code) {
  try {
    const s = code.trim();
    if (!s.startsWith(CODE)) return false;
    const raw = new TextDecoder().decode(Uint8Array.from(atob(s.slice(CODE.length).replace(/\s+/g, '')), (c) => c.charCodeAt(0)));
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || !data.prog) return false;
    localStorage.setItem(KEY, raw);
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
