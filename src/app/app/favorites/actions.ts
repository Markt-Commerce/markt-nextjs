'use server';

import { getProduct } from '@/lib/api/products';
import { getForwardedCookie } from '@/lib/api/session';
import type { Product } from '@/lib/types/product';

export async function getFavoriteProductsAction(ids: string[]): Promise<Product[]> {
  const cookie = await getForwardedCookie();
  const results = await Promise.all(ids.map((id) => getProduct(id, cookie).catch(() => null)));
  return results.filter((p): p is Product => p !== null);
}
