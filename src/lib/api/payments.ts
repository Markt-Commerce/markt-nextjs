import 'server-only';
import { apiFetch } from './client';
import type { Payment, PaymentList } from '@/lib/types/payment';

export async function listPayments(cookie: string | undefined): Promise<PaymentList> {
  return apiFetch<PaymentList>('/payments/', { cookie, cache: 'no-store' });
}

/** One payment record (canonical status after a verify). */
export async function getPayment(paymentId: string, cookie: string | undefined): Promise<Payment> {
  return apiFetch<Payment>(`/payments/${encodeURIComponent(paymentId)}`, { cookie, cache: 'no-store' });
}

/**
 * The most recent payment recorded for an order. We match by order_id (which we
 * always have from the route) rather than by the Paystack reference, so the
 * confirmation page doesn't depend on how Paystack/the backend name callback
 * params. Returns null if none exists yet.
 */
export async function findPaymentForOrder(orderId: string, cookie: string | undefined): Promise<Payment | null> {
  const list = await listPayments(cookie).catch(() => null);
  const matches = (list?.payments ?? []).filter((p) => p.order_id === orderId);
  if (matches.length === 0) return null;
  return matches.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
}

// The real /payments/initialize response schema isn't documented in the
// OpenAPI spec (200 OK, no content schema) — this is a best-effort shape
// based on Paystack's own convention (an authorization_url to redirect to).
// Unverified end-to-end: no test Paystack credentials available while
// building this.
export interface PaymentInitializeResponse {
  authorization_url?: string;
  reference?: string;
  [key: string]: unknown;
}

export async function initializePayment(
  orderId: string,
  cookie: string | undefined,
  callbackUrl?: string
): Promise<PaymentInitializeResponse> {
  return apiFetch<PaymentInitializeResponse>('/payments/initialize', {
    method: 'POST',
    cookie,
    // The documented body (`PaymentCreate`) has no top-level `callback_url`
    // field — the backend owns the Paystack redirect via
    // `GET /payments/callback/{payment_id}`, which "redirects to the mobile app
    // or web app". `metadata` is free-form, so that's our supported channel:
    //   - `platform: 'web'` tells that callback to pick the WEB target, not the
    //     mobile deep link (the off-app 404 we previously hit);
    //   - `callback_url` hands it the exact confirmation URL to return to.
    // We still mirror `callback_url` top-level as a harmless belt-and-suspenders
    // in case a Paystack-native flow reads it (extra fields are ignored).
    body: {
      order_id: orderId,
      metadata: { platform: 'web', ...(callbackUrl ? { callback_url: callbackUrl } : {}) },
      ...(callbackUrl ? { callback_url: callbackUrl } : {}),
    },
  });
}

/** Verify a payment's status with Paystack (used on return from checkout). */
export async function verifyPayment(paymentId: string, cookie: string | undefined): Promise<{ status?: string; [k: string]: unknown }> {
  return apiFetch(`/payments/${encodeURIComponent(paymentId)}/verify`, { cookie, cache: 'no-store' });
}
