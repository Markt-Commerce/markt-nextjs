'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch, ApiError } from '@/lib/api/client';
import { getForwardedCookie } from '@/lib/api/session';

export interface ReviewActionState {
  error?: string;
  success?: boolean;
}

export async function submitReviewAction(
  productId: string,
  _prev: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  const rating = Number(formData.get('rating') ?? 5);
  const content = String(formData.get('content') ?? '').trim();

  if (!content) return { error: 'Please write a review before submitting.' };

  try {
    await apiFetch(`/products/${encodeURIComponent(productId)}/reviews`, {
      method: 'POST',
      cookie: await getForwardedCookie(),
      body: { rating, content },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? `${err.message} (${err.status})` : 'Could not post review.' };
  }

  revalidatePath(`/app/marketplace/product/${productId}`);
  return { success: true };
}

// Records the share event server-side. The real API's Share response
// carries no shareable URL (unlike the old mock's `share_url`) — sharing a
// link to the product page is something this app can always construct
// itself, so that part happens client-side (see share-button.tsx).
export async function recordShareAction(productId: string): Promise<void> {
  try {
    await apiFetch(`/products/${encodeURIComponent(productId)}/share`, {
      method: 'POST',
      cookie: await getForwardedCookie(),
      body: {},
    });
  } catch {
    // Best-effort analytics ping — a failure here shouldn't block sharing.
  }
}
