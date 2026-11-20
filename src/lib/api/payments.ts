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

// The /payments/initialize response. The OpenAPI spec leaves it as an
// untyped 200, but the mobile client's `InitializeResponse` documents the
// real shape — crucially it includes our own `payment_id`, which lets the
// confirmation page verify THIS payment directly (`GET /payments/{id}`)
// instead of listing every payment to find it by order. That matters: the
// `GET /payments/` list has been observed returning 500, so depending on it
// to locate the payment on return is fragile.
export interface PaymentInitializeResponse {
  authorization_url?: string;
  access_code?: string;
  payment_id?: string;
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
    // The body (`PaymentCreate`) has no top-level `callback_url` and the backend
    // now REJECTS unknown top-level fields with a 422 ("callback_url: Unknown
    // field"), so it must live only inside `metadata`, which is free-form. The
    // backend owns the Paystack redirect via `GET /payments/callback/{payment_id}`
    // ("redirects to the mobile app or web app"), reading:
    //   - `platform: 'web'` — pick the WEB target, not the mobile deep link
    //     (the off-app 404 we previously hit);
    //   - `callback_url` — the exact confirmation URL to return to.
    body: {
      order_id: orderId,
      metadata: { platform: 'web', ...(callbackUrl ? { callback_url: callbackUrl } : {}) },
    },
  });
}

/** Verify a payment's status with Paystack (used on return from checkout). */
export async function verifyPayment(paymentId: string, cookie: string | undefined): Promise<{ status?: string; [k: string]: unknown }> {
  return apiFetch(`/payments/${encodeURIComponent(paymentId)}/verify`, { cookie, cache: 'no-store' });
}
