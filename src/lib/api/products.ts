import 'server-only';
import { apiFetch } from './client';
import type { Product, ProductReviews, ProductSearchResult } from '@/lib/types/product';

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
