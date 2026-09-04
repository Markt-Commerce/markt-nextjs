import 'server-only';
import { apiFetch } from './client';
import type { Product, ProductImage, ProductReviews, ProductSearchResult } from '@/lib/types/product';

export interface ProductListFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'newest' | 'popular' | 'price_asc' | 'price_desc';
  page?: number;
  perPage?: number;
}

/** General product list/search — no category filter (the real API handles that via listCategoryProducts instead). */
export async function listProducts(filters: ProductListFilters, cookie?: string): Promise<ProductSearchResult> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.minPrice !== undefined) params.set('min_price', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('max_price', String(filters.maxPrice));
  if (filters.inStock !== undefined) params.set('in_stock', String(filters.inStock));
  if (filters.sortBy) params.set('sort_by', filters.sortBy);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.perPage) params.set('per_page', String(filters.perPage));

  return apiFetch<ProductSearchResult>(`/products/?${params.toString()}`, { cookie, cache: 'no-store' });
}

export async function getProduct(id: string, cookie?: string): Promise<Product> {
  return apiFetch<Product>(`/products/${encodeURIComponent(id)}`, { cookie, cache: 'no-store' });
}

export async function getRecommendedProducts(opts: { perPage?: number } = {}, cookie?: string): Promise<Product[]> {
  const params = new URLSearchParams();
  if (opts.perPage) params.set('per_page', String(opts.perPage));
  return apiFetch<Product[]>(`/products/recommended?${params.toString()}`, { cookie, cache: 'no-store' });
}

// A seller's own catalogue — used to let them tag a product in a post. The
// endpoint's envelope isn't pinned in the spec, so accept array or {items}.
export async function listMyProducts(cookie: string | undefined): Promise<Product[]> {
  const res = await apiFetch<unknown>('/products/seller/my-products?per_page=50', { cookie, cache: 'no-store' });
  if (Array.isArray(res)) return res as Product[];
  if (res && typeof res === 'object' && Array.isArray((res as { items?: unknown }).items)) {
    return (res as { items: Product[] }).items;
  }
  return [];
}

export interface ProductWrite {
  name: string;
  price: number;
  stock?: number;
  sku?: string;
  description?: string;
  compare_at_price?: number;
  category_ids?: number[];
  media_ids?: number[];
  status?: string;
}

// Guard writes with a timeout so a stalled backend surfaces an error instead
// of leaving the UI spinning indefinitely.
const WRITE_TIMEOUT_MS = 20000;

/** Create a new product (seller). */
export async function createProduct(body: ProductWrite, cookie: string | undefined): Promise<Product> {
  return apiFetch<Product>('/products/', { method: 'POST', cookie, body, signal: AbortSignal.timeout(WRITE_TIMEOUT_MS) });
}

/** Update a product the seller owns. */
export async function updateProduct(id: string, body: Partial<ProductWrite>, cookie: string | undefined): Promise<Product> {
  return apiFetch<Product>(`/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    cookie,
    body,
    signal: AbortSignal.timeout(WRITE_TIMEOUT_MS),
  });
}

/** Delete a product the seller owns. */
export async function deleteProduct(id: string, cookie: string | undefined): Promise<void> {
  await apiFetch(`/products/${encodeURIComponent(id)}`, { method: 'DELETE', cookie });
}

/** Images attached to a product (each links a media_id to the product). */
export async function listProductImages(productId: string, cookie: string | undefined): Promise<ProductImage[]> {
  return apiFetch<ProductImage[]>(`/media/products/${encodeURIComponent(productId)}/images`, { cookie, cache: 'no-store' });
}

/**
 * Attach an existing library image to a product. The API's OpenAPI entry for
 * this POST has no documented body, but ProductImage links a product to a
 * `media_id`, so we send that. `is_featured`/`sort_order` are optional hints.
 */
export async function attachMediaToProduct(
  productId: string,
  mediaId: number,
  cookie: string | undefined
): Promise<void> {
  await apiFetch(`/media/products/${encodeURIComponent(productId)}/images`, {
    method: 'POST',
    cookie,
    body: { media_id: mediaId },
  });
}

/** Remove an image from a product (does not delete the underlying media). */
export async function detachProductImage(
  productId: string,
  imageId: number,
  cookie: string | undefined
): Promise<void> {
  await apiFetch(`/media/products/${encodeURIComponent(productId)}/images/${imageId}`, { method: 'DELETE', cookie });
}

export async function getProductReviews(
  id: string,
  opts: { page?: number; perPage?: number } = {},
  cookie?: string
): Promise<ProductReviews> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.perPage) params.set('per_page', String(opts.perPage));

  return apiFetch<ProductReviews>(`/products/${encodeURIComponent(id)}/reviews?${params.toString()}`, {
    cookie,
    cache: 'no-store',
  });
}
