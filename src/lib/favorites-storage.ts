'use client';

// Favorites have two backings:
//  - LOGGED OUT (public marketplace, no session): localStorage. The `local`
//    mode below.
//  - SIGNED IN: the real wishlist endpoint (`GET/POST /socials/saved`,
//    `DELETE /socials/saved/product/{id}`). The app layout seeds this store
//    from the backend via `initRemoteFavorites()` and registers save/unsave
//    handlers via `setRemoteHandlers()`, so a signed-in user's saves persist
//    server-side and follow them across devices. This module stays free of any
//    server import — the handlers are injected by <FavoritesInit>.
const STORAGE_KEY = 'markt_favorites';

// 'local' = persist to localStorage (logged out). 'remote' = persist to the
// backend through the injected handlers (signed in).
let mode: 'local' | 'remote' = 'local';
let remoteSave: (productId: string) => void = () => {};
let remoteUnsave: (productId: string) => void = () => {};

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

/** Wire up backend-backed favorites for a signed-in user, seeding from the server. */
export function setRemoteHandlers(save: (id: string) => void, unsave: (id: string) => void): void {
  remoteSave = save;
  remoteUnsave = unsave;
}

/** Switch to remote (backend) mode and seed the store with the user's saved ids. */
export function initRemoteFavorites(ids: string[]): void {
  mode = 'remote';
  snapshot = ids;
  listeners.forEach((l) => l());
}

export function toggleFavorite(productId: string): void {
  const wasSaved = snapshot.includes(productId);
  const next = wasSaved ? snapshot.filter((id) => id !== productId) : [...snapshot, productId];
  snapshot = next;

  if (mode === 'remote') {
    // Optimistic: flip immediately, persist to the backend in the background.
    if (wasSaved) remoteUnsave(productId);
    else remoteSave(productId);
  } else {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore — private browsing / storage disabled.
    }
  }

  listeners.forEach((l) => l());
}
