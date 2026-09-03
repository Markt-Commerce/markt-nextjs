'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './page.module.css';

export interface SettingsTab {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * Horizontal tabbed settings, matching the reference layout. Each tab's content
 * is server-rendered and passed in; this only toggles which panel is visible.
 */
export function SettingsTabs({ tabs, initialTab }: { tabs: SettingsTab[]; initialTab?: string }) {
  const validInitial = tabs.some((t) => t.id === initialTab) ? initialTab : undefined;
  const [active, setActive] = useState(validInitial ?? tabs[0]?.id);

  return (
    <>
      <div className={styles.tabBar} role="tablist" aria-label="Settings sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            className={cn(styles.tab, active === tab.id && styles.tabActive)}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" hidden={active !== tab.id} className={styles.tabPanel}>
          {tab.content}
        </div>
      ))}
    </>
  );
}
