'use server';

import { headers } from 'next/headers';
import { ApiError } from '@/lib/api/client';
import { initializePayment } from '@/lib/api/payments';
import { getForwardedCookie } from '@/lib/api/session';

/** Absolute origin of this app, from the incoming request. */
async function appOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('host') ?? '';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function initiatePaymentAction(orderId: string): Promise<{ url?: string; error?: string }> {
  try {
    // Bring the buyer back to their order confirmation after paying.
    const callbackUrl = `${await appOrigin()}/app/checkout/confirmation/${orderId}?paid=1`;
    const res = await initializePayment(orderId, await getForwardedCookie(), callbackUrl);
    if (!res.authorization_url) return { error: 'Payment could not be started (no redirect URL returned).' };
    return { url: res.authorization_url };
  } catch (err) {
    return { error: err instanceof ApiError ? `${err.message} (${err.status})` : 'Could not start payment.' };
  }
}
