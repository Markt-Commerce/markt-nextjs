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
    // `callback_url` tells Paystack where to send the buyer back after paying.
    // Mirrored into `metadata` (some Paystack setups read it there), along with
    // `platform: web` so the backend's own callback redirect targets the web
    // app rather than the mobile deep link.
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
