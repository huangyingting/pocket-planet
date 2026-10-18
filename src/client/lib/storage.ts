// Versioned, namespaced localStorage with an in-memory fallback (private mode / tests).
const NS = 'pp.';
const mem = new Map<string, string>();

function ls(): Storage | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = ls()?.getItem(NS + key) ?? mem.get(NS + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch { return fallback; }
}

export function save<T>(key: string, value: T): void {
  const raw = JSON.stringify(value);
  mem.set(NS + key, raw);
  try { ls()?.setItem(NS + key, raw); } catch { /* quota or disabled */ }
  for (const fn of listeners) fn(key);
}

export function remove(key: string): void {
  mem.delete(NS + key);
  try { ls()?.removeItem(NS + key); } catch { /* ignore */ }
  for (const fn of listeners) fn(key);
}

const listeners = new Set<(key: string) => void>();
export function onChange(fn: (key: string) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
