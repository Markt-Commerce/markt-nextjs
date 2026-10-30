'use server';

import { revalidatePath } from 'next/cache';
import { ApiError } from '@/lib/api/client';
import { acceptOffer, createOffer, rejectOffer, upvoteRequest } from '@/lib/api/requests';
import { getForwardedCookie } from '@/lib/api/session';

export interface OfferFormState {
  error?: string;
  success?: boolean;
}

export async function upvoteRequestAction(requestId: string): Promise<void> {
  try {
    await upvoteRequest(requestId, await getForwardedCookie());
  } catch {
    // Best-effort.
  }
  revalidatePath(`/app/requests/${requestId}`);
}

export async function createOfferAction(requestId: string, _prev: OfferFormState, formData: FormData): Promise<OfferFormState> {
  const price = Number(formData.get('price') ?? 0);
  const message = String(formData.get('message') ?? '').trim();

  // Only procurement requests show this field; empty means "not stated".
  const quantityRaw = String(formData.get('proposed_quantity') ?? '').trim();
  const proposedQuantity = quantityRaw ? Number(quantityRaw) : undefined;

  if (!message) return { error: 'Please add a message for the buyer.' };
  if (!Number.isFinite(price) || price <= 0) return { error: 'Enter a valid price.' };
  if (proposedQuantity !== undefined && (!Number.isFinite(proposedQuantity) || proposedQuantity < 0)) {
    return { error: 'Enter a valid quantity.' };
  }

  try {
    await createOffer(
      requestId,
      { price, message, ...(proposedQuantity !== undefined ? { proposed_quantity: proposedQuantity } : {}) },
      await getForwardedCookie()
    );
  } catch (err) {
    return { error: err instanceof ApiError ? `${err.message} (${err.status})` : 'Could not send offer.' };
  }

  revalidatePath(`/app/requests/${requestId}`);
  return { success: true };
}

export async function acceptOfferAction(requestId: string, offerId: number): Promise<void> {
  try {
    await acceptOffer(offerId, await getForwardedCookie());
  } catch {
    // Surfaced implicitly — the offer's status just won't change.
  }
  revalidatePath(`/app/requests/${requestId}`);
}

export async function rejectOfferAction(requestId: string, offerId: number): Promise<void> {
  try {
    await rejectOffer(offerId, await getForwardedCookie());
  } catch {
    // Surfaced implicitly — the offer's status just won't change.
  }
  revalidatePath(`/app/requests/${requestId}`);
}
