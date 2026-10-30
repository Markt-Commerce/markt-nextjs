'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { rememberModeAction, switchModeAction } from './business/actions';
import type { AppMode } from '@/lib/business-mode';
import styles from './layout.module.css';

/** Business pages always read as business mode, whatever the cookie says. */
export function effectiveMode(mode: AppMode, pathname: string): AppMode {
  return pathname === '/app/business' || pathname.startsWith('/app/business/') ? 'business' : mode;
}

/**
 * Markt / Business toggle in the header. Only rendered when the backend has
 * business mode enabled (see app/layout.tsx).
 */
export function ModeSwitch({ mode }: { mode: AppMode }) {
  const pathname = usePathname();
  const current = effectiveMode(mode, pathname);

  useEffect(() => {
    if (current === 'business' && mode !== 'business') void rememberModeAction('business');
  }, [current, mode]);

  return (
    <div className={styles.modeSwitch} role="group" aria-label="Choose experience">
      <form action={switchModeAction.bind(null, 'consumer')}>
        <button type="submit" className={cn(styles.modeOption, current === 'consumer' && styles.modeOptionActive)} aria-pressed={current === 'consumer'}>
          Markt
        </button>
      </form>
      <form action={switchModeAction.bind(null, 'business')}>
        <button type="submit" className={cn(styles.modeOption, current === 'business' && styles.modeOptionActive)} aria-pressed={current === 'business'}>
          Business
        </button>
      </form>
    </div>
  );
}
