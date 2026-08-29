'use client';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'markt_theme';

function systemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Private browsing / storage disabled — fall through to system.
  }
  return systemTheme();
}

// useSyncExternalStore trio, matching the pattern used for the sidebar and
// favourites: no set-state-in-effect, and a stable server snapshot so
// hydration doesn't mismatch.
type Listener = () => void;
const listeners = new Set<Listener>();
let snapshot: Theme = typeof window === 'undefined' ? 'light' : readTheme();

export function subscribeTheme(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getThemeSnapshot(): Theme {
  return snapshot;
}

export function getThemeServerSnapshot(): Theme {
  return 'light';
}

export function setTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore — the attribute below still applies for this session.
  }
  document.documentElement.setAttribute('data-theme', theme);
  snapshot = theme;
  listeners.forEach((l) => l());
}

export function toggleTheme(): void {
  setTheme(snapshot === 'dark' ? 'light' : 'dark');
}

/**
 * Runs before first paint (inlined into <head>) so the stored theme is
 * applied before React hydrates — otherwise a dark-mode user gets a white
 * flash on every page load.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;
