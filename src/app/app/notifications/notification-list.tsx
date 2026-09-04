'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  CheckCheck,
  Clipboard,
  CreditCard,
  Heart,
  Megaphone,
  MessageCircle,
  Package,
  Search,
  Star,
  Tag,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { notificationActionUrl, type Notification } from '@/lib/types/notification';
import { markReadAction } from './actions';
import styles from './page.module.css';

type Tab = 'unread' | 'read';
type Sort = 'newest' | 'oldest';

interface Category {
  label: string;
  icon: LucideIcon;
  tone: string;
}

// Group a notification into a scannable, colour-coded category from its type
// and reference. Keeps the list readable at a glance.
function categoryFor(n: Notification, s: typeof styles): Category {
  const key = `${n.type} ${n.reference_type ?? ''}`.toLowerCase();
  if (/(order|shipment)/.test(key)) return { label: 'Order', icon: Package, tone: s.toneSky };
  if (/pay/.test(key)) return { label: 'Payment', icon: CreditCard, tone: s.toneMint };
  if (/review/.test(key)) return { label: 'Review', icon: Star, tone: s.toneButter };
  if (/offer/.test(key)) return { label: 'Offer', icon: Tag, tone: s.toneLilac };
  if (/request/.test(key)) return { label: 'Request', icon: Clipboard, tone: s.toneClay };
  if (/(like|comment|reaction|post|social)/.test(key)) return { label: 'Community', icon: Heart, tone: s.toneBlush };
  if (/follow/.test(key)) return { label: 'Community', icon: UserPlus, tone: s.toneBlush };
  if (/(chat|message)/.test(key)) return { label: 'Message', icon: MessageCircle, tone: s.toneSky };
  if (/promo/.test(key)) return { label: 'Update', icon: Megaphone, tone: s.toneButter };
  return { label: 'Notice', icon: Bell, tone: s.toneGray };
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>('unread');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('newest');

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notifications
      .filter((n) => (tab === 'unread' ? !n.is_read : n.is_read))
      .filter((n) => !q || `${n.title ?? ''} ${n.message}`.toLowerCase().includes(q))
      .sort((a, b) => {
        const da = new Date(a.created_at).getTime();
        const db = new Date(b.created_at).getTime();
        return sort === 'newest' ? db - da : da - db;
      });
  }, [notifications, tab, query, sort]);

  const markRead = (ids: number[]) => {
    if (ids.length) startTransition(() => markReadAction(ids));
  };

  const onOpen = (n: Notification) => {
    if (!n.is_read) markRead([n.id]);
    const url = notificationActionUrl(n);
    if (url) router.push(url);
  };

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>Notifications</h1>
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'unread'}
            className={cn(styles.tab, tab === 'unread' && styles.tabActive)}
            onClick={() => setTab('unread')}
          >
            Unread {unreadCount > 0 && <span className={styles.tabBadge}>{unreadCount}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'read'}
            className={cn(styles.tab, tab === 'read' && styles.tabActive)}
            onClick={() => setTab('read')}
          >
            Read
          </button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search notifications"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className={styles.toolbarRight}>
          <select className={styles.sort} value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <button type="button" className={styles.markAllBtn} disabled={unreadIds.length === 0} onClick={() => markRead(unreadIds)}>
            <CheckCheck size={15} /> Mark all as read
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className={styles.emptyState}>
          {tab === 'unread' ? "You're all caught up." : 'No read notifications yet.'}
        </div>
      ) : (
        <ul className={styles.list}>
          {rows.map((n) => {
            const cat = categoryFor(n, styles);
            const clickable = !!notificationActionUrl(n);
            return (
              <li key={n.id} className={cn(styles.row, !n.is_read && styles.rowUnread)}>
                <span className={cn(styles.dot, n.is_read && styles.dotHidden)} aria-hidden />
                <span className={cn(styles.iconChip, cat.tone)}>
                  <cat.icon size={16} />
                </span>

                <button
                  type="button"
                  className={styles.rowMain}
                  onClick={() => onOpen(n)}
                  aria-label={clickable ? 'Open notification' : undefined}
                >
                  <span className={styles.rowTitle}>{n.title || cat.label}</span>
                  <span className={styles.rowMessage}>{n.message}</span>
                </button>

                <span className={cn(styles.badge, cat.tone)}>{cat.label}</span>
                <span className={styles.time}>{relativeTime(n.created_at)}</span>

                {!n.is_read ? (
                  <button
                    type="button"
                    className={styles.markOne}
                    onClick={() => markRead([n.id])}
                    aria-label="Mark as read"
                    title="Mark as read"
                  >
                    <Check size={15} />
                  </button>
                ) : (
                  <span className={styles.markOnePlaceholder} aria-hidden />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
