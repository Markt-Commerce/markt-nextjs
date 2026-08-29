'use server';

import { ApiError } from '@/lib/api/client';
import { initializePayment } from '@/lib/api/payments';
import { getForwardedCookie } from '@/lib/api/session';

export async function initiatePaymentAction(orderId: string): Promise<{ url?: string; error?: string }> {
  try {
    const res = await initializePayment(orderId, await getForwardedCookie());
    if (!res.authorization_url) return { error: 'Payment could not be started (no redirect URL returned).' };
    return { url: res.authorization_url };
  } catch (err) {
    return { error: err instanceof ApiError ? `${err.message} (${err.status})` : 'Could not start payment.' };
  }
}
