import 'server-only';
import { apiFetch } from './client';

/** One saved/wishlisted item as the backend returns it — enough to render a card. */
export interface SavedItem {
  content_id: string;
  content_type: 'product' | 'post';
  title?: string;
  price?: number;
  image_url?: string;
  saved_at?: string;
}

interface SavedItemsList {
  items: SavedItem[];
  pagination?: Record<string, unknown>;
}

/** The signed-in user's wishlisted products (content_type=product). */
export async function listSavedProducts(cookie: string | undefined): Promise<SavedItem[]> {
  if (!cookie) return [];
  return apiFetch<SavedItemsList>('/socials/saved?content_type=product&per_page=100', { cookie, cache: 'no-store' })
    .then((r) => r.items ?? [])
    .catch(() => []);
}

/** Just the product ids — used to seed the favorites store so hearts render filled. */
export async function listSavedProductIds(cookie: string | undefined): Promise<string[]> {
  const items = await listSavedProducts(cookie);
  return items.map((i) => i.content_id);
}

/** Save (wishlist) a product. Saving twice is a no-op on the backend. */
export async function saveProduct(productId: string, cookie: string | undefined): Promise<void> {
  await apiFetch('/socials/saved', {
    method: 'POST',
    cookie,
    body: { content_id: productId, content_type: 'product' },
  });
}

/** Remove a product from the wishlist. Idempotent — unsaving a non-saved item is fine. */
export async function unsaveProduct(productId: string, cookie: string | undefined): Promise<void> {
  await apiFetch(`/socials/saved/product/${encodeURIComponent(productId)}`, { method: 'DELETE', cookie });
}
