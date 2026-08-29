import 'server-only';
import { apiFetch } from './client';
import type { BuyerOrder, Order, Tracking } from '@/lib/types/order';

export async function listOrders(cookie: string | undefined): Promise<BuyerOrder[]> {
  return apiFetch<BuyerOrder[]>('/orders/', { cookie, cache: 'no-store' });
}

export async function getOrder(id: string, cookie: string | undefined): Promise<Order> {
  return apiFetch<Order>(`/orders/${encodeURIComponent(id)}`, { cookie, cache: 'no-store' });
}

export async function trackOrder(id: string, cookie: string | undefined): Promise<Tracking> {
  return apiFetch<Tracking>(`/orders/${encodeURIComponent(id)}/track`, { cookie, cache: 'no-store' });
}

export async function cancelOrder(id: string, reason: string | undefined, cookie: string | undefined): Promise<void> {
  await apiFetch(`/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST', cookie, body: { reason } });
}
