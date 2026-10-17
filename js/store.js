// The book is the record: every finished page keeps the child's particle drawing.
// Stored on this device only.
const KEY = 'sparkbook.v1';

export function load() {
  try {
    const b = JSON.parse(localStorage.getItem(KEY));
    if (b && Array.isArray(b.entries)) return b;
  } catch {}
  return { entries: [] };
}

export function add(entry) {
  const b = load();
  b.entries.push(entry);
  try { localStorage.setItem(KEY, JSON.stringify(b)); } catch {}
}

export function clear() {
  try { localStorage.removeItem(KEY); } catch {}
}
