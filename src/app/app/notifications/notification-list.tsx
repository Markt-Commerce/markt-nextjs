'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Bell, Package, CreditCard, Star, Megaphone, Tag, Clipboard, MessageCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { notificationActionUrl, type Notification } from '@/lib/types/notification';
import { markReadAction } from './actions';
import styles from './page.module.css';

const ICON_BY_TYPE: Record<string, typeof Bell> = {
  order_update: Package,
  order_placed: Package,
  shipment_update: Package,
  payment_success: CreditCard,
  payment_failed: CreditCard,
  review_upvote: Star,
  product_review: Star,
  promotional: Megaphone,
  request_offer: Clipboard,
  offer_accepted: Tag,
  offer_rejected: Tag,
  offer_withdrawn: Tag,
};

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);

  const onOpen = (notification: Notification) => {
    if (!notification.is_read) startTransition(() => markReadAction([notification.id]));
    const url = notificationActionUrl(notification);
    if (url) router.push(url);
  };

  return (
    <div className={styles.page}>
      <div className={styles.headRow}>
        <h1 className={styles.title}>Notifications
        </h1>
        <button
          type="button"
          className={styles.markAllBtn}
          disabled={unreadIds.length === 0}
          onClick={() => startTransition(() => markReadAction(unreadIds))}
        >
          <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 4 }} />
          Mark all as read
        </button>
      </div>

      {notifications.length === 0 && <div className={styles.emptyState}>You&apos;re all caught up.</div>}

      {notifications.length > 0 && (
        <div className={styles.list}>
          {notifications.map((notification) => {
            const Icon = ICON_BY_TYPE[notification.type] ?? MessageCircle;
            return (
              <button
                key={notification.id}
                type="button"
                className={cn(styles.row, !notification.is_read && styles.rowUnread)}
                onClick={() => onOpen(notification)}
                style={{ width: '100%' }}
              >
                <div className={styles.iconWrap}>
                  <Icon size={16} />
                </div>
                <div className={styles.rowBody}>
                  {notification.title && <p className={styles.rowTitle}>{notification.title}</p>}
                  <p className={styles.rowMessage}>{notification.message}</p>
                  <p className={styles.rowTime}>{new Date(notification.created_at).toLocaleString()}</p>
                </div>
                {!notification.is_read && <span className={styles.unreadDot} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
