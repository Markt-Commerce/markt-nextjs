'use client';

import type { ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import { Building2, PanelLeftClose, PanelLeftOpen, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getSidebarServerSnapshot, getSidebarSnapshot, setSidebarCollapsed, subscribeSidebar } from '@/lib/sidebar-storage';
import { useInBusinessMode, type BusinessNavOptions } from './nav';
import styles from './layout.module.css';

export function SidebarShell({ role, business, children }: { role: string; business: BusinessNavOptions; children: ReactNode }) {
  const collapsed = useSyncExternalStore(subscribeSidebar, getSidebarSnapshot, getSidebarServerSnapshot);
  // The badge says which experience you're in, so business mode reads as
  // business rather than as whichever buyer/seller role is current.
  const inBusiness = useInBusinessMode(business);
  const BadgeIcon = inBusiness ? Building2 : UserIcon;

  return (
    <aside className={cn(styles.sidebar, collapsed && styles.sidebarCollapsed)}>
      <div className={cn(styles.sidebarTop, collapsed && styles.sidebarTopCollapsed)}>
        {/* The role badge only earns its space when expanded; collapsed, the
            column is just icons + a centered toggle. */}
        {!collapsed && (
          <div className={styles.roleBadge}>
            <BadgeIcon size={16} /> {inBusiness ? 'Business' : role}
          </div>
        )}
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={() => setSidebarCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
      {children}
    </aside>
  );
}
