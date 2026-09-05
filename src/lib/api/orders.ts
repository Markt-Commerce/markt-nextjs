import 'server-only';
import { apiFetch } from './client';
import type { BuyerOrder, Order, Tracking } from '@/lib/types/order';

export async function listOrders(cookie: string | undefined): Promise<BuyerOrder[]> {
  return apiFetch<BuyerOrder[]>('/orders/', { cookie, cache: 'no-store' });
}

/** One product line a buyer ordered from the current seller — the unit a seller fulfils. */
export interface SellerOrderItem {
  id: number;
  order_id: string;
  quantity: number;
  price: number;
  status?: string;
  created_at?: string;
  product?: {
    id?: string;
    name?: string;
    images?: { media?: { thumbnail_url?: string; original_url?: string } }[];
  };
  order?: {
    id?: string;
    order_number?: string;
    recipient_name?: string;
    status?: string;
    buyer?: { username?: string };
  };
}

/** Orders (as line-items) the current seller needs to fulfil. */
export async function listSellerOrders(cookie: string | undefined): Promise<SellerOrderItem[]> {
  const res = await apiFetch<unknown>('/orders/seller?per_page=50', { cookie, cache: 'no-store' });
  if (Array.isArray(res)) return res as SellerOrderItem[];
  if (res && typeof res === 'object' && Array.isArray((res as { items?: unknown }).items)) {
    return (res as { items: SellerOrderItem[] }).items;
  }
  return [];
}

/** Update the fulfilment status of one order item (seller). */
export async function updateSellerOrderItem(itemId: number, status: string, cookie: string | undefined): Promise<void> {
  await apiFetch(`/orders/seller/items/${itemId}`, { method: 'PATCH', cookie, body: { status } });
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
