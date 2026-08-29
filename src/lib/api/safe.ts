import 'server-only';

/**
 * Wraps a real-API call so a failure degrades to a fallback value instead
 * of crashing the page. Mainly for user-scoped reads (cart/orders/payments/
 * notifications/etc.) on pages that should still render — with an empty
 * state — when there's no real backend session (see the mock-session note
 * in lib/api/session.ts) or the backend has a hiccup.
 */
export async function safeFetch<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}
