'use client';

// Shared client-only store for the sidebar collapsed state, read by both
// the shell (aside width/toggle button) and the nav links (icon-only vs
// icon+label) without prop drilling across the server/client boundary.
// useSyncExternalStore (not useState+effect) so there's no hydration
// mismatch between the server's default-expanded render and a client that
// remembers "collapsed" from a previous visit.
const STORAGE_KEY = 'markt_sidebar_collapsed';

function readFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();
let snapshot = readFromStorage();

export function subscribeSidebar(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSidebarSnapshot(): boolean {
  return snapshot;
}

export function getSidebarServerSnapshot(): boolean {
  return false;
}

export function setSidebarCollapsed(collapsed: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  } catch {
    // Ignore — private browsing / storage disabled.
  }
  snapshot = collapsed;
  listeners.forEach((l) => l());
}
