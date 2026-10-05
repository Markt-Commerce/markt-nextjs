import 'server-only';
import { apiFetch } from './client';
import type { Market, MarketList } from '@/lib/types/market';
import type { ProductSearchResult } from '@/lib/types/product';

export async function listMarkets(cookie: string | undefined): Promise<Market[]> {
  return apiFetch<MarketList>('/markets/', { cookie, next: { revalidate: 300 } })
    .then((r) => r.markets ?? [])
    .catch(() => []);
}

export async function getMarket(id: string, cookie: string | undefined): Promise<Market> {
  return apiFetch<Market>(`/markets/${encodeURIComponent(id)}`, { cookie, cache: 'no-store' });
}

export async function getMarketProducts(
  id: string,
  cookie: string | undefined,
  opts: { page?: number; perPage?: number; search?: string } = {}
): Promise<ProductSearchResult> {
  const params = new URLSearchParams();
  if (opts.search) params.set('search', opts.search);
  params.set('page', String(opts.page ?? 1));
  params.set('per_page', String(opts.perPage ?? 24));
  return apiFetch<ProductSearchResult>(`/markets/${encodeURIComponent(id)}/products?${params.toString()}`, {
    cookie,
    cache: 'no-store',
  });
}
