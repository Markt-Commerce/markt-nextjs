import 'server-only';
import { apiFetch } from './client';

// GET /users/shops/trending's response schema isn't documented in the
// OpenAPI spec at all (200 OK, no content schema) — this is a best-effort
// defensive shape, not a confirmed contract.
export interface ShopBasic {
  id?: number;
  user_id?: string;
  shop_name?: string;
  description?: string;
  profile_picture_url?: string;
}

export async function listTrendingShops(cookie: string | undefined): Promise<ShopBasic[]> {
  const res = await apiFetch<unknown>('/users/shops/trending', { cookie, cache: 'no-store' });
  if (Array.isArray(res)) return res as ShopBasic[];
  if (res && typeof res === 'object' && Array.isArray((res as { shops?: unknown }).shops)) {
    return (res as { shops: ShopBasic[] }).shops;
  }
  return [];
}
