'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * While a payment is still settling (webhook lag), re-run the server component
 * a few times so "confirming…" resolves to "confirmed" on its own — no manual
 * refresh. Bounded so it can never spin forever if settlement stalls.
 */
export function AutoRefresh({ intervalMs = 3000, maxTries = 4 }: { intervalMs?: number; maxTries?: number }) {
  const router = useRouter();

  useEffect(() => {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      router.refresh();
      if (tries >= maxTries) clearInterval(timer);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs, maxTries]);

  return null;
}
