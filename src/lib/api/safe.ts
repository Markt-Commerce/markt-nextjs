import 'server-only';
import { redirect } from 'next/navigation';
import { SessionExpiredError } from './client';

/** Next signals redirect()/notFound() by throwing — never swallow those. */
function isNextControlFlow(err: unknown): boolean {
  if (!err || typeof err !== 'object' || !('digest' in err)) return false;
  const digest = (err as { digest?: unknown }).digest;
  return (
    typeof digest === 'string' &&
    (digest.startsWith('NEXT_REDIRECT') || digest === 'NEXT_NOT_FOUND' || digest.startsWith('NEXT_HTTP_ERROR_FALLBACK'))
  );
}

/**
 * Wraps a real-API call so a failure degrades to a fallback value instead
 * of crashing the page. Mainly for user-scoped reads (cart/orders/payments/
 * notifications/etc.) on pages that should still render — with an empty
 * state — when the backend has a hiccup.
 *
 * Two things it deliberately does NOT swallow:
 *  - an **expired session** (`SessionExpiredError`) — that would masquerade as
 *    "no data"; instead we send the user to sign in again.
 *  - Next's own redirect()/notFound() control-flow errors.
 */
export async function safeFetch<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isNextControlFlow(err)) throw err;
    if (err instanceof SessionExpiredError) {
      redirect('/auth/login?expired=1');
    }
    return fallback;
  }
}
