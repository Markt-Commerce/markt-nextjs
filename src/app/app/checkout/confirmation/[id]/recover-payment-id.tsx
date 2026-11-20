'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Bridges the payment id across the Paystack round-trip when the gateway/backend
 * redirect didn't carry it. On return, if the URL has no `payment_id` but we
 * stashed one for this order before redirecting (see PayNowButton), we add it to
 * the query with a replace — which re-runs the server component, letting it
 * verify this exact payment via `GET /payments/{id}` instead of the payments
 * list (which has been seen to 500). No-op once the id is present, in private
 * mode, or if nothing was stashed.
 */
export function RecoverPaymentId({ orderId, hasPaymentId }: { orderId: string; hasPaymentId: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (hasPaymentId) return;
    let stashed: string | null = null;
    try {
      stashed = sessionStorage.getItem(`markt:pay:${orderId}`);
    } catch {
      return;
    }
    if (!stashed) return;

    const url = new URL(window.location.href);
    if (url.searchParams.get('payment_id')) return;
    url.searchParams.set('payment_id', stashed);
    router.replace(url.pathname + url.search);
  }, [orderId, hasPaymentId, router]);

  return null;
}
