import 'server-only';
import { apiFetch } from './client';
import type { NotificationPagination } from '@/lib/types/notification';

export async function listNotifications(cookie: string | undefined): Promise<NotificationPagination> {
  return apiFetch<NotificationPagination>('/notifications/?per_page=50', { cookie, cache: 'no-store' });
}

export async function markNotificationsRead(ids: number[], cookie: string | undefined): Promise<void> {
  await apiFetch('/notifications/mark-read', { method: 'POST', cookie, body: { notification_ids: ids } });
}

export async function getUnreadCount(cookie: string | undefined): Promise<number> {
  const res = await apiFetch<{ count: number }>('/notifications/unread/count', { cookie, cache: 'no-store' });
  return res.count;
}
