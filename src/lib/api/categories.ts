import 'server-only';
import { apiFetch } from './client';
import type { CategoryProducts, CategoryTreeNode } from '@/lib/types/category';

/** Public, rarely-changing data — safe to cache for a few minutes. */
export async function listCategoryTree(): Promise<CategoryTreeNode[]> {
  return apiFetch<CategoryTreeNode[]>('/categories/', { next: { revalidate: 300 } });
}

/**
 * The real API filters by category through this endpoint, not through a
 * category_ids param on /products/ — so browsing "by category" and general
 * search/price filtering are two different requests, not one combined query.
 */
export async function listCategoryProducts(
  categoryId: number,
  opts: { search?: string; sort?: string; page?: number; perPage?: number } = {},
  cookie?: string
): Promise<CategoryProducts> {
  const params = new URLSearchParams();
  if (opts.search) params.set('search', opts.search);
  if (opts.sort) params.set('sort', opts.sort);
  if (opts.page) params.set('page', String(opts.page));
  if (opts.perPage) params.set('per_page', String(opts.perPage));

  return apiFetch<CategoryProducts>(`/categories/${categoryId}/products?${params.toString()}`, {
    cookie,
    cache: 'no-store',
  });
}
