import { getForwardedCookie } from '@/lib/api/session';
import { listNotifications } from '@/lib/api/notifications';
import { safeFetch } from '@/lib/api/safe';
import { NotificationList } from './notification-list';

export default async function NotificationsPage() {
  const cookie = await getForwardedCookie();
  const data = await safeFetch(() => listNotifications(cookie), {
    items: [],
    pagination: { page: 1, per_page: 50, total_items: 0, total_pages: 0 },
  });

  return <NotificationList notifications={data.items} />;
}
