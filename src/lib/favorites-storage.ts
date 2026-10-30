'use client';

// The real API has no favorites/wishlist endpoint at all (checked against
// the full 203-endpoint spec) — this stays purely client-side.
const STORAGE_KEY = 'markt_favorites';

function readFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/** One-shot read — fine wherever live reactivity to storage changes isn't needed. */
export function getFavoriteIds(): string[] {
  return readFromStorage();
}

// useSyncExternalStore trio, for components (FavoriteButton) that need to
// stay in sync with storage changes without the set-state-in-effect
// anti-pattern, and without an SSR/client hydration mismatch.
type Listener = () => void;
const listeners = new Set<Listener>();
let snapshot: string[] = readFromStorage();

// A single stable reference for the server/hydration snapshot. Returning a
// fresh `[]` each call makes useSyncExternalStore think the store changed on
// every render ("getServerSnapshot should be cached to avoid an infinite loop").
const EMPTY: string[] = [];

export function subscribeFavorites(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFavoritesSnapshot(): string[] {
  return snapshot;
}

export function getFavoritesServerSnapshot(): string[] {
  return EMPTY;
}

export function toggleFavorite(productId: string): void {
  const ids = readFromStorage();
  const next = ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore — private browsing / storage disabled.
  }
  snapshot = next;
  listeners.forEach((l) => l());
}
