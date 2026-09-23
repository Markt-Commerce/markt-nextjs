'use server';

import { revalidatePath } from 'next/cache';
import { getForwardedCookie } from '@/lib/api/session';
import { listSavedProducts, saveProduct, unsaveProduct, type SavedItem } from '@/lib/api/saved';

/** The signed-in user's wishlist, straight from the backend (cross-device). */
export async function listSavedProductsAction(): Promise<SavedItem[]> {
  return listSavedProducts(await getForwardedCookie());
}

/** Wishlist a product. Fire-and-forget from the heart button (optimistic UI). */
export async function saveFavoriteAction(productId: string): Promise<void> {
  try {
    await saveProduct(productId, await getForwardedCookie());
  } catch {
    // Optimistic UI already flipped; a failed save just won't persist.
  }
  revalidatePath('/app/favorites');
}

/** Remove a product from the wishlist. */
export async function unsaveFavoriteAction(productId: string): Promise<void> {
  try {
    await unsaveProduct(productId, await getForwardedCookie());
  } catch {
    // Idempotent on the backend; ignore.
  }
  revalidatePath('/app/favorites');
}
