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

export async function initiatePaymentAction(
  orderId: string
): Promise<{ url?: string; paymentId?: string; error?: string }> {
  try {
    // Bring the buyer back to their order confirmation after paying.
    const callbackUrl = `${await appOrigin()}/app/checkout/confirmation/${orderId}?paid=1`;
    const res = await initializePayment(orderId, await getForwardedCookie(), callbackUrl);
    if (!res.authorization_url) return { error: 'Payment could not be started (no redirect URL returned).' };
    // Hand the payment id back so the client can stash it before redirecting;
    // on return the confirmation page verifies this exact payment directly
    // rather than scanning the (sometimes-500ing) payments list to find it.
    return { url: res.authorization_url, paymentId: res.payment_id };
  } catch (err) {
    // The raw API detail (e.g. "callback_url: Unknown field (422)") is already
    // logged server-side by client.ts — never show that plumbing to the buyer.
    // They get one calm, actionable line; a 4xx that isn't a server fault hints
    // it may be worth another try.
    if (err instanceof ApiError) {
      return {
        error:
          err.status >= 500
            ? 'Our payment service is having a moment. Please try again shortly.'
            : 'We couldn’t start your payment. Please try again.',
      };
    }
    return { error: 'We couldn’t start your payment. Please try again.' };
  }
}
