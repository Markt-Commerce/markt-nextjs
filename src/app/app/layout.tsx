import type { ReactNode } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { requireSession, getForwardedCookie } from '@/lib/api/session';
import { apiFetch } from '@/lib/api/client';
import { HeaderSearch } from './header-search';
import { UserMenu } from './user-menu';
import { SidebarShell } from './sidebar-shell';
import { SidebarNav, BottomNav } from './nav';
import styles from './layout.module.css';

async function getBadgeCounts(cookie: string | undefined) {
  if (!cookie) return { cart: 0, notifications: 0, messages: 0 };

  const [cart, notifications, messages] = await Promise.all([
    apiFetch<{ item_count: number }>('/cart/summary', { cookie, cache: 'no-store' })
      .then((r) => r.item_count)
      .catch(() => 0),
    apiFetch<{ count: number }>('/notifications/unread/count', { cookie, cache: 'no-store' })
      .then((r) => r.count)
      .catch(() => 0),
    apiFetch<{ rooms: { unread_count: number }[] }>('/chats/rooms', { cookie, cache: 'no-store' })
      .then((r) => r.rooms.reduce((sum, room) => sum + room.unread_count, 0))
      .catch(() => 0),
  ]);

  return { cart, notifications, messages };
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireSession();
  const isSeller = user.current_role === 'seller';
  const cookie = await getForwardedCookie();
  const { cart, notifications, messages } = await getBadgeCounts(cookie);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <Link href="/app/dashboard" className={styles.logo}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/markt-text-logo.png" alt="Markt" />
          </Link>

          <HeaderSearch />

          <div className={styles.actions}>
            <Link href="/app/notifications" className={styles.iconButton} aria-label="Notifications">
              <Bell size={20} />
              {notifications > 0 && <span className={styles.badge}>{notifications}</span>}
            </Link>

            <UserMenu displayName={user.username} role={user.current_role} avatarUrl={user.profile_picture_url} />
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <SidebarShell role={user.current_role}>
          <SidebarNav cartCount={cart} messageCount={messages} isSeller={isSeller} />
        </SidebarShell>

        <main className={styles.main}>{children}</main>
      </div>

      <BottomNav cartCount={cart} messageCount={messages} isSeller={isSeller} />
    </div>
  );
}
