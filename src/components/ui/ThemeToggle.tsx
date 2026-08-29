'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { getThemeServerSnapshot, getThemeSnapshot, subscribeTheme, toggleTheme } from '@/lib/theme-storage';

export function ThemeToggle({ className, size = 18 }: { className?: string; size?: number }) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={className}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={size} /> : <Moon size={size} />}
    </button>
  );
}
