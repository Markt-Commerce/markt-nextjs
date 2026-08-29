'use client';

import type { ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import { PanelLeftClose, PanelLeftOpen, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getSidebarServerSnapshot, getSidebarSnapshot, setSidebarCollapsed, subscribeSidebar } from '@/lib/sidebar-storage';
import styles from './layout.module.css';

export function SidebarShell({ role, children }: { role: string; children: ReactNode }) {
  const collapsed = useSyncExternalStore(subscribeSidebar, getSidebarSnapshot, getSidebarServerSnapshot);

  return (
    <aside className={cn(styles.sidebar, collapsed && styles.sidebarCollapsed)}>
      <div className={styles.sidebarTop}>
        <div className={styles.roleBadge}>
          <UserIcon size={16} /> {!collapsed && role}
        </div>
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={() => setSidebarCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>
      {children}
    </aside>
  );
}
