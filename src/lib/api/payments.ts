import 'server-only';
import { apiFetch } from './client';
import type { PaymentList } from '@/lib/types/payment';

export async function listPayments(cookie: string | undefined): Promise<PaymentList> {
  return apiFetch<PaymentList>('/payments/', { cookie, cache: 'no-store' });
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

export async function initializePayment(orderId: string, cookie: string | undefined): Promise<PaymentInitializeResponse> {
  return apiFetch<PaymentInitializeResponse>('/payments/initialize', {
    method: 'POST',
    cookie,
    body: { order_id: orderId },
  });
}
